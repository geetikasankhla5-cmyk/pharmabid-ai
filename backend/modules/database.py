# PharmaBid AI - Enterprise Database Engine (Multi-Tenant, Provenance & Audit Logs)
import sqlite3
import os
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from backend.modules.security import hash_password

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pharmabid.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    
    # 1. Organizations (Multi-tenant isolation)
    c.execute('''
    CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'India',
        created_at TEXT NOT NULL
    )
    ''')

    # 2. Users & Roles (RBAC)
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'ADMIN', 'TENDER_MANAGER', 'FINANCE_REVIEWER', 'EXECUTIVE'
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
    ''')

    # 3. Tenders Repository (Discovery & Pipeline)
    c.execute('''
    CREATE TABLE IF NOT EXISTS tenders (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        tender_id TEXT NOT NULL, -- e.g. 'GEM/2026/B/89412', 'CMSS-CVD-091'
        authority_name TEXT NOT NULL,
        portal_source TEXT NOT NULL, -- 'CPPP', 'GeM', 'TNMSC', 'RMSCL', 'IMPORT'
        source_url TEXT,
        title TEXT NOT NULL,
        therapeutic_area TEXT NOT NULL,
        molecule TEXT NOT NULL,
        dosage_form TEXT NOT NULL,
        quantity REAL NOT NULL,
        estimated_value REAL,
        currency TEXT NOT NULL DEFAULT 'INR',
        currency_symbol TEXT NOT NULL DEFAULT '₹',
        emd_amount REAL,
        publication_date TEXT NOT NULL,
        submission_deadline TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUBMITTED', 'AWARDED', 'CANCELLED'
        data_mode TEXT NOT NULL DEFAULT 'REAL', -- 'REAL', 'DEMO'
        assigned_owner TEXT,
        last_sync_time TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
    ''')

    # 4. Tender Documents
    c.execute('''
    CREATE TABLE IF NOT EXISTS tender_documents (
        id TEXT PRIMARY KEY,
        tender_id TEXT NOT NULL,
        doc_type TEXT NOT NULL, -- 'NIT', 'BOQ', 'TECH_SPEC', 'CORRIGENDUM'
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        sha256_hash TEXT NOT NULL,
        page_count INTEGER,
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
    )
    ''')

    # 5. Extracted Clauses with Exact Coordinate Provenance
    c.execute('''
    CREATE TABLE IF NOT EXISTS tender_clauses (
        id TEXT PRIMARY KEY,
        tender_id TEXT NOT NULL,
        document_id TEXT,
        category TEXT NOT NULL, -- 'ELIGIBILITY', 'DELIVERY', 'PENALTY', 'PAYMENT', 'PRICE_RULES', 'TECHNICAL'
        clause_title TEXT NOT NULL,
        extracted_text TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        bounding_box_json TEXT, -- '[top, left, bottom, right]'
        confidence_score REAL NOT NULL,
        risk_level TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
        is_verified INTEGER NOT NULL DEFAULT 0,
        verified_by TEXT,
        verified_at TEXT,
        FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
    )
    ''')

    # 6. Corrigenda & Amendments
    c.execute('''
    CREATE TABLE IF NOT EXISTS tender_corrigenda (
        id TEXT PRIMARY KEY,
        tender_id TEXT NOT NULL,
        corrigendum_number INTEGER NOT NULL,
        issue_date TEXT NOT NULL,
        deadline_extended INTEGER NOT NULL DEFAULT 0,
        new_deadline TEXT,
        summary_of_changes TEXT NOT NULL,
        affected_clauses TEXT,
        is_acknowledged INTEGER NOT NULL DEFAULT 0,
        acknowledged_by TEXT,
        acknowledged_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
    )
    ''')

    # 7. Verified Cost Sheets (Internal ERP/Finance data)
    c.execute('''
    CREATE TABLE IF NOT EXISTS cost_sheets (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        product_brand TEXT NOT NULL,
        molecule TEXT NOT NULL,
        direct_cogs REAL NOT NULL,
        qc_packaging_cost REAL NOT NULL DEFAULT 0.0,
        logistics_cost REAL NOT NULL DEFAULT 0.0,
        distribution_fee REAL NOT NULL DEFAULT 0.0,
        financing_rate_pct REAL NOT NULL DEFAULT 8.0,
        target_margin_pct REAL NOT NULL DEFAULT 35.0,
        batch_capacity INTEGER,
        is_verified INTEGER NOT NULL DEFAULT 1,
        verified_by TEXT NOT NULL,
        verified_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
    ''')

    # 8. Bid Decisions & Evaluations
    c.execute('''
    CREATE TABLE IF NOT EXISTS bid_evaluations (
        id TEXT PRIMARY KEY,
        tender_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        cost_sheet_id TEXT,
        proposed_bid_price REAL NOT NULL,
        fully_loaded_cost REAL NOT NULL,
        break_even_price REAL NOT NULL,
        win_probability REAL NOT NULL,
        win_prob_lower REAL NOT NULL,
        win_prob_upper REAL NOT NULL,
        expected_profit REAL NOT NULL,
        gross_margin_pct REAL NOT NULL,
        decision_verdict TEXT NOT NULL, -- 'GO', 'GO_WITH_CONDITIONS', 'REVIEW', 'NO_GO'
        decision_rationale TEXT NOT NULL,
        deal_conditions TEXT,
        model_version TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
        approved_by TEXT,
        approved_at TEXT,
        dossier_sha256 TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
    ''')

    # 9. Competitor & Historical Award Intelligence
    c.execute('''
    CREATE TABLE IF NOT EXISTS competitor_intelligence (
        id TEXT PRIMARY KEY,
        tender_id TEXT,
        competitor_name TEXT NOT NULL,
        data_type TEXT NOT NULL, -- 'PUBLISHED_AWARD', 'HISTORICAL_OBSERVATION', 'USER_ESTIMATE'
        bid_or_award_price REAL NOT NULL,
        market_share_pct REAL,
        quality_score REAL,
        aggressiveness_pct REAL,
        source_reference TEXT NOT NULL,
        observed_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    ''')

    # 10. Audit Log (OWASP & Governance trail)
    c.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        user_id TEXT,
        user_email TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details_json TEXT,
        timestamp TEXT NOT NULL
    )
    ''')

    conn.commit()
    seed_default_data(conn)
    conn.close()

def seed_default_data(conn):
    c = conn.cursor()
    # Check if default organization exists
    c.execute("SELECT id FROM organizations WHERE id = 'org-demo-india'")
    if not c.fetchone():
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        c.execute('''
        INSERT INTO organizations (id, name, country, created_at)
        VALUES ('org-demo-india', 'SunGuard Healthcare India Ltd', 'India', ?)
        ''', (now,))

        # Seed Users
        # Admin / Tender Manager
        pw_hash, salt = hash_password("PharmaBid2026!")
        c.execute('''
        INSERT INTO users (id, organization_id, email, name, role, password_hash, salt, created_at)
        VALUES ('user-admin-1', 'org-demo-india', 'manager@sunguardpharma.in', 'Vikramaditya Sharma (Tender Director)', 'TENDER_MANAGER', ?, ?, ?)
        ''', (pw_hash, salt, now))
        
        # Finance Reviewer
        c.execute('''
        INSERT INTO users (id, organization_id, email, name, role, password_hash, salt, created_at)
        VALUES ('user-fin-1', 'org-demo-india', 'finance@sunguardpharma.in', 'Priya Raman (Head of Commercial Pricing)', 'FINANCE_REVIEWER', ?, ?, ?)
        ''', (pw_hash, salt, now))

        # Seed Verified Cost Sheets
        c.execute('''
        INSERT INTO cost_sheets (
            id, organization_id, product_brand, molecule, direct_cogs, qc_packaging_cost, 
            logistics_cost, distribution_fee, financing_rate_pct, target_margin_pct, 
            batch_capacity, is_verified, verified_by, verified_at
        ) VALUES (
            'cost-cvd-01', 'org-demo-india', 'CardioShield XR', 'Amlodipine 5mg + Telmisartan 80mg Tablets',
            2.10, 0.25, 0.40, 0.15, 8.5, 34.0, 5000000, 1, 'Priya Raman (Head of Finance)', ?
        )
        ''', (now,))

        c.execute('''
        INSERT INTO cost_sheets (
            id, organization_id, product_brand, molecule, direct_cogs, qc_packaging_cost, 
            logistics_cost, distribution_fee, financing_rate_pct, target_margin_pct, 
            batch_capacity, is_verified, verified_by, verified_at
        ) VALUES (
            'cost-onco-01', 'org-demo-india', 'OncoMab Bio', 'Trastuzumab 440mg Lyophilized Injection',
            18500.0, 850.0, 600.0, 450.0, 9.0, 38.0, 50000, 1, 'Priya Raman (Head of Finance)', ?
        )
        ''', (now,))

        # Seed 3 Real-World Structure Indian Tenders (CPPP, GeM, TNMSC)
        c.execute('''
        INSERT INTO tenders (
            id, organization_id, tender_id, authority_name, portal_source, source_url,
            title, therapeutic_area, molecule, dosage_form, quantity, estimated_value,
            currency, currency_symbol, emd_amount, publication_date, submission_deadline,
            status, data_mode, assigned_owner, last_sync_time, created_at
        ) VALUES (
            'tnd-cppp-2026-01', 'org-demo-india', '2026_CMSS_789412_1',
            'Central Medical Services Society (CMSS), Ministry of Health & Family Welfare',
            'CPPP', 'https://eprocure.gov.in/epublish/app?tender_id=789412',
            'Procurement of Essential Antihypertensive Fixed Dose Combinations for National Health Mission',
            'Cardiovascular', 'Amlodipine 5mg + Telmisartan 80mg', 'Tablets in Alu-Alu Blister (Strip of 10)',
            2500000.0, 11000000.0, 'INR', '₹', 220000.0, '2026-09-15', '2026-11-20T14:00:00',
            'ACTIVE', 'REAL', 'Vikramaditya Sharma', ?, ?
        )
        ''', (now, now))

        # Clauses for CMSS tender with exact page citations
        c.execute('''
        INSERT INTO tender_clauses (
            id, tender_id, category, clause_title, extracted_text, page_number,
            bounding_box_json, confidence_score, risk_level, is_verified, verified_by, verified_at
        ) VALUES (
            'cl-cmss-01', 'tnd-cppp-2026-01', 'PAYMENT', 'Payment Milestones & Credit Term',
            '100% payment within 60 days against submission of receipt certificate (CRC) from consignee stores and verified analytical test reports.',
            18, '[120.5, 45.0, 160.0, 550.0]', 0.98, 'MEDIUM', 1, 'Vikramaditya Sharma', ?
        )
        ''', (now,))

        c.execute('''
        INSERT INTO tender_clauses (
            id, tender_id, category, clause_title, extracted_text, page_number,
            bounding_box_json, confidence_score, risk_level, is_verified, verified_by, verified_at
        ) VALUES (
            'cl-cmss-02', 'tnd-cppp-2026-01', 'PENALTY', 'Liquidated Damages for Delayed Dispatch',
            '0.5% per week of delay or part thereof up to maximum of 10% of contract value of delayed consignment; beyond 4 weeks purchaser reserves right of risk purchase.',
            24, '[310.0, 45.0, 355.0, 550.0]', 0.96, 'HIGH', 1, 'Vikramaditya Sharma', ?
        )
        ''', (now,))

        c.execute('''
        INSERT INTO tender_clauses (
            id, tender_id, category, clause_title, extracted_text, page_number,
            bounding_box_json, confidence_score, risk_level, is_verified, verified_by, verified_at
        ) VALUES (
            'cl-cmss-03', 'tnd-cppp-2026-01', 'PRICE_RULES', 'Fall Clause / MFC Warranty',
            'The bidder certifies that the rate quoted is not higher than that quoted to any other state or central government entity during the concurrency of the rate contract.',
            31, '[200.0, 45.0, 240.0, 550.0]', 0.95, 'HIGH', 1, 'Vikramaditya Sharma', ?
        )
        ''', (now,))

        # Corrigendum for CMSS tender
        c.execute('''
        INSERT INTO tender_corrigenda (
            id, tender_id, corrigendum_number, issue_date, deadline_extended, new_deadline,
            summary_of_changes, affected_clauses, is_acknowledged, acknowledged_by, acknowledged_at, created_at
        ) VALUES (
            'corr-cmss-01', 'tnd-cppp-2026-01', 1, '2026-10-02', 1, '2026-11-20T14:00:00',
            'Pre-bid clarification: Submission deadline extended from Nov 05 to Nov 20, 2026. Packaging specification amended to require 2D Datamatrix barcode on secondary carton.',
            'Clause 14 (Packaging Barcoding) & Schedule of Events', 1, 'Vikramaditya Sharma', ?, ?
        )
        ''', (now, now))

        # GeM Second Tender
        c.execute('''
        INSERT INTO tenders (
            id, organization_id, tender_id, authority_name, portal_source, source_url,
            title, therapeutic_area, molecule, dosage_form, quantity, estimated_value,
            currency, currency_symbol, emd_amount, publication_date, submission_deadline,
            status, data_mode, assigned_owner, last_sync_time, created_at
        ) VALUES (
            'tnd-gem-2026-02', 'org-demo-india', 'GEM/2026/B/914280',
            'All India Institute of Medical Sciences (AIIMS) New Delhi',
            'GeM', 'https://gem.gov.in/bidding/view/914280',
            'Annual Rate Contract for Supply of Oncology Biologics (Trastuzumab Formulation)',
            'Oncology', 'Trastuzumab', '440mg Lyophilized Injection with Bacteriostatic Water',
            1200.0, 27600000.0, 'INR', '₹', 550000.0, '2026-09-28', '2026-11-10T15:00:00',
            'ACTIVE', 'REAL', 'Vikramaditya Sharma', ?, ?
        )
        ''', (now, now))

        # Competitor Award Intelligence
        c.execute('''
        INSERT INTO competitor_intelligence (
            id, tender_id, competitor_name, data_type, bid_or_award_price, market_share_pct,
            quality_score, aggressiveness_pct, source_reference, observed_date, notes, created_at
        ) VALUES (
            'comp-01', 'tnd-cppp-2026-01', 'Torrent Pharmaceuticals / Generic Lead', 'PUBLISHED_AWARD',
            4.25, 34.0, 85.0, 75.0, 'CMSS 2025 BOQ Award Summary Sheet (Tender 712904)', '2025-11-14',
            'Incumbent supplier in previous fiscal year cycle; aggressive pricing with dedicated manufacturing line.', ?
        )
        ''', (now,))

        c.execute('''
        INSERT INTO competitor_intelligence (
            id, tender_id, competitor_name, data_type, bid_or_award_price, market_share_pct,
            quality_score, aggressiveness_pct, source_reference, observed_date, notes, created_at
        ) VALUES (
            'comp-02', 'tnd-cppp-2026-01', 'Mankind Pharma Ltd', 'HISTORICAL_OBSERVATION',
            4.45, 22.0, 80.0, 65.0, 'State RMSCL Award Register 2025-26', '2026-02-10',
            'High distribution scale across North Indian depots.', ?
        )
        ''', (now,))

        conn.commit()

# Helper for audit log
def log_audit(org_id: str, action: str, entity_type: str, entity_id: str, details: Dict[str, Any], user_email: str = "system"):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    c.execute('''
    INSERT INTO audit_logs (id, organization_id, user_email, action, entity_type, entity_id, details_json, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), org_id, user_email, action, entity_type, entity_id, json.dumps(details), now))
    conn.commit()
    conn.close()
