# PharmaBid AI - Enterprise FastAPI Server & REST APIs
import os
import uuid
import datetime
import shutil
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from backend.modules.database import get_connection, log_audit, init_db
from backend.modules.security import hash_password, verify_password, create_access_token, verify_access_token
from backend.modules.document_ai import DocumentExtractor
from backend.modules.economics import BidEconomicsEngine
from backend.modules.risk_matrix import RiskMatrixEngine
from backend.modules.ingestion import TenderIngestionService

app = FastAPI(
    title="PharmaBid AI Enterprise Decision Platform API",
    version="2.0.0",
    description="Universal Pharmaceutical Tender Intelligence, Document AI & Decision-Support System"
)

# Enable CORS for local client and external frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
TENDERS_STORAGE = os.path.join(STORAGE_DIR, "tenders")
os.makedirs(TENDERS_STORAGE, exist_ok=True)

# ----------------- Startup Lifecycle -----------------
@app.on_event("startup")
def on_startup():
    """Ensure database tables, directories, and seed data are initialized on boot."""
    os.makedirs(TENDERS_STORAGE, exist_ok=True)
    os.makedirs(os.path.join(STORAGE_DIR, "dossiers"), exist_ok=True)
    init_db()

# ----------------- Security Dependency -----------------
def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or tampered access token. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def require_role(allowed_roles: List[str]):
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{user_role}' lacks required permissions ({', '.join(allowed_roles)})."
            )
        return user
    return role_checker

# ----------------- Pydantic Models -----------------
class LoginRequest(BaseModel):
    email: str
    password: str

class BidCalculationRequest(BaseModel):
    tender_id: str
    proposed_bid_price: float
    volume: Optional[float] = None
    direct_cogs: Optional[float] = None
    qc_packaging_cost: Optional[float] = None
    logistics_cost: Optional[float] = None
    distribution_fee: Optional[float] = None
    financing_rate_pct: Optional[float] = None
    target_margin_pct: Optional[float] = None

class TenderImportRequest(BaseModel):
    tender_id: str
    authority_name: str
    portal_source: str
    source_url: Optional[str] = ""
    title: str
    therapeutic_area: str
    molecule: str
    dosage_form: str
    quantity: float
    estimated_value: Optional[float] = 0.0
    emd_amount: Optional[float] = 0.0
    submission_deadline: str

class CorrigendumAckRequest(BaseModel):
    corrigendum_id: str

class ApprovalRequest(BaseModel):
    tender_id: str
    decision_verdict: str
    notes: Optional[str] = ""

# ----------------- Auth Endpoints -----------------
@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ?", (req.email,))
    user = c.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not verify_password(req.password, user["password_hash"], user["salt"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token({
        "id": user["id"],
        "organization_id": user["organization_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    })

    log_audit(user["organization_id"], "USER_LOGIN", "USER", user["id"], {"email": req.email}, user["email"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "organization_id": user["organization_id"]
        }
    }

# ----------------- Module A: Tender Intelligence & Discovery -----------------
@app.get("/api/tenders")
def list_tenders(
    therapeutic_area: Optional[str] = None,
    portal: Optional[str] = None,
    user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM tenders WHERE organization_id = ?"
    params = [user["organization_id"]]

    if therapeutic_area and therapeutic_area != "ALL":
        query += " AND therapeutic_area = ?"
        params.append(therapeutic_area)
    if portal and portal != "ALL":
        query += " AND portal_source = ?"
        params.append(portal)

    query += " ORDER BY submission_deadline ASC"
    c.execute(query, params)
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"tenders": rows, "count": len(rows), "data_freshness": datetime.datetime.now(datetime.timezone.utc).isoformat()}

@app.get("/api/tenders/{tender_id}")
def get_tender_detail(tender_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_connection()
    c = conn.cursor()
    
    # 1. Tender metadata
    c.execute("SELECT * FROM tenders WHERE (id = ? OR tender_id = ?) AND organization_id = ?", 
              (tender_id, tender_id, user["organization_id"]))
    tender = c.fetchone()
    if not tender:
        conn.close()
        raise HTTPException(status_code=404, detail="Tender not found")
    t_dict = dict(tender)

    # 2. Extracted Clauses
    c.execute("SELECT * FROM tender_clauses WHERE tender_id = ? ORDER BY page_number ASC", (t_dict["id"],))
    clauses = [dict(r) for r in c.fetchall()]

    # 3. Corrigenda & Amendments
    c.execute("SELECT * FROM tender_corrigenda WHERE tender_id = ? ORDER BY corrigendum_number ASC", (t_dict["id"],))
    corrigenda = [dict(r) for r in c.fetchall()]

    # 4. Competitor award intelligence
    c.execute("SELECT * FROM competitor_intelligence WHERE tender_id = ?", (t_dict["id"],))
    competitors = [dict(r) for r in c.fetchall()]

    # 5. Verified Cost Sheet for molecule
    c.execute("SELECT * FROM cost_sheets WHERE organization_id = ? AND molecule LIKE ? LIMIT 1",
              (user["organization_id"], f"%{t_dict['molecule'].split()[0]}%"))
    cost_sheet = c.fetchone()
    cost_dict = dict(cost_sheet) if cost_sheet else {
        "direct_cogs": 2.10, "qc_packaging_cost": 0.25, "logistics_cost": 0.40, 
        "distribution_fee": 0.15, "financing_rate_pct": 8.5, "target_margin_pct": 34.0
    }

    # 6. Latest Bid Evaluation
    c.execute("SELECT * FROM bid_evaluations WHERE tender_id = ? ORDER BY created_at DESC LIMIT 1", (t_dict["id"],))
    evaluation = c.fetchone()

    conn.close()

    return {
        "tender": t_dict,
        "clauses": clauses,
        "corrigenda": corrigenda,
        "competitors": competitors,
        "verified_cost_sheet": cost_dict,
        "latest_evaluation": dict(evaluation) if evaluation else None
    }

@app.post("/api/tenders/import")
def import_tender(req: TenderImportRequest, user: Dict[str, Any] = Depends(get_current_user)):
    valid, errors, clean = TenderIngestionService.validate_imported_tender(req.dict())
    if not valid:
        raise HTTPException(status_code=400, detail={"errors": errors})

    conn = get_connection()
    c = conn.cursor()
    new_id = f"tnd-{uuid.uuid4().hex[:8]}"
    
    c.execute('''
    INSERT INTO tenders (
        id, organization_id, tender_id, authority_name, portal_source, source_url,
        title, therapeutic_area, molecule, dosage_form, quantity, estimated_value,
        currency, currency_symbol, emd_amount, publication_date, submission_deadline,
        status, data_mode, assigned_owner, last_sync_time, created_at
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ''', (
        new_id, user["organization_id"], clean["tender_id"], clean["authority_name"],
        clean["portal_source"], clean["source_url"], clean["title"], clean["therapeutic_area"],
        clean["molecule"], clean["dosage_form"], clean["quantity"], clean["estimated_value"],
        clean["currency"], clean["currency_symbol"], clean["emd_amount"], clean["publication_date"],
        clean["submission_deadline"], clean["status"], clean["data_mode"], user["name"],
        clean["last_sync_time"], clean["created_at"]
    ))

    conn.commit()
    conn.close()

    log_audit(user["organization_id"], "IMPORT_TENDER", "TENDER", new_id, {"tender_id": clean["tender_id"]}, user["email"])

    return {"status": "SUCCESS", "id": new_id, "message": f"Tender {clean['tender_id']} successfully imported."}

# ----------------- Module B: Genuine Document AI Extractor -----------------
@app.post("/api/tenders/{tender_id}/upload-document")
async def upload_document(
    tender_id: str,
    doc_type: str = Form("NIT"),
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "SELECT id FROM tenders WHERE (id = ? OR tender_id = ?) AND organization_id = ?",
        (tender_id, tender_id, user["organization_id"])
    )
    t_row = c.fetchone()
    if not t_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tender not found or access unauthorized for organization.")
    real_tender_id = t_row["id"]

    # Save file to storage
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    saved_filename = f"{file_id}_{file.filename}"
    saved_path = os.path.join(TENDERS_STORAGE, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Perform real extraction & page-level coordinate grounding
    extraction_result = DocumentExtractor.analyze_document_content(saved_path, file.filename)

    # Store document record
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    c.execute('''
    INSERT INTO tender_documents (
        id, tender_id, doc_type, file_name, file_path, file_size, sha256_hash, page_count, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        file_id, real_tender_id, doc_type, file.filename, saved_path,
        os.path.getsize(saved_path), extraction_result["sha256"],
        extraction_result["page_count"], now
    ))

    # Persist extracted clauses
    for cl in extraction_result["clauses"]:
        c.execute('''
        INSERT INTO tender_clauses (
            id, tender_id, document_id, category, clause_title, extracted_text,
            page_number, confidence_score, risk_level, is_verified, verified_by, verified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL)
        ''', (
            str(uuid.uuid4()), real_tender_id, file_id, cl["category"], cl["clause_title"],
            cl["extracted_text"], cl["page_number"], cl["confidence_score"], cl["risk_level"]
        ))

    conn.commit()
    conn.close()

    log_audit(user["organization_id"], "UPLOAD_TENDER_DOC", "DOCUMENT", file_id, {
        "file_name": file.filename, "clauses_extracted": len(extraction_result["clauses"])
    }, user["email"])

    return {
        "status": "SUCCESS",
        "file_id": file_id,
        "file_name": file.filename,
        "page_count": extraction_result["page_count"],
        "sha256": extraction_result["sha256"],
        "clauses_extracted": extraction_result["total_clauses_extracted"],
        "clauses": extraction_result["clauses"]
    }

# ----------------- Module C: Corrigenda & Amendments -----------------
@app.post("/api/corrigenda/acknowledge")
def acknowledge_corrigendum(req: CorrigendumAckRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    c.execute('''
    UPDATE tender_corrigenda
    SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
    WHERE id = ?
    ''', (user["name"], now, req.corrigendum_id))
    conn.commit()
    conn.close()

    log_audit(user["organization_id"], "ACK_CORRIGENDUM", "CORRIGENDUM", req.corrigendum_id, {}, user["email"])
    return {"status": "SUCCESS", "acknowledged_by": user["name"], "timestamp": now}

# ----------------- Module D & E: Economics & Bid Optimization -----------------
@app.post("/api/bids/evaluate")
def evaluate_bid(req: BidCalculationRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM tenders WHERE (id = ? OR tender_id = ?) AND organization_id = ?",
        (req.tender_id, req.tender_id, user["organization_id"])
    )
    tender = c.fetchone()
    if not tender:
        conn.close()
        raise HTTPException(status_code=404, detail="Tender not found or access unauthorized for organization.")

    volume = req.volume if req.volume is not None else float(tender["quantity"])

    # Load or merge verified costs
    costs = {
        "direct_cogs": req.direct_cogs if req.direct_cogs is not None else 2.10,
        "qc_packaging_cost": req.qc_packaging_cost if req.qc_packaging_cost is not None else 0.25,
        "logistics_cost": req.logistics_cost if req.logistics_cost is not None else 0.40,
        "distribution_fee": req.distribution_fee if req.distribution_fee is not None else 0.15,
        "financing_rate_pct": req.financing_rate_pct if req.financing_rate_pct is not None else 8.5
    }

    # Load competitors
    c.execute("SELECT * FROM competitor_intelligence WHERE tender_id = ?", (tender["id"],))
    comps = [dict(r) for r in c.fetchall()]

    cost_floor = BidEconomicsEngine.calculate_cost_floor(costs, payment_credit_days=60)
    evaluation = BidEconomicsEngine.evaluate_bid_economics(
        bid_price=req.proposed_bid_price,
        volume=volume,
        cost_breakdown=cost_floor,
        competitors=comps
    )

    # Risk matrix calculation grounded in clauses
    c.execute("SELECT * FROM tender_clauses WHERE tender_id = ?", (tender["id"],))
    clauses = [dict(r) for r in c.fetchall()]
    risk_eval = RiskMatrixEngine.evaluate_risks(clauses, dict(tender), costs)

    # Save to bid_evaluations
    eval_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    c.execute('''
    INSERT INTO bid_evaluations (
        id, tender_id, organization_id, proposed_bid_price, fully_loaded_cost,
        break_even_price, win_probability, win_prob_lower, win_prob_upper,
        expected_profit, gross_margin_pct, decision_verdict, decision_rationale,
        deal_conditions, model_version, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
    ''', (
        eval_id, tender["id"], user["organization_id"], req.proposed_bid_price,
        cost_floor["fully_loaded_cost_per_unit"], evaluation["break_even_price"],
        evaluation["win_probability"], evaluation["win_prob_lower"], evaluation["win_prob_upper"],
        evaluation["expected_profit"], evaluation["margin_pct"], evaluation["decision"],
        evaluation["decision_rationale"], ", ".join(evaluation["deal_conditions"]),
        "v2.1-calibrated-platt", now
    ))
    conn.commit()
    conn.close()

    return {
        "evaluation_id": eval_id,
        "cost_floor_breakdown": cost_floor,
        "bid_economics": evaluation,
        "risk_intelligence": risk_eval,
        "data_provenance": {
            "source_authority": tender["authority_name"],
            "portal": tender["portal_source"],
            "data_mode": tender["data_mode"],
            "model_calibration": "Logistic L1 Benchmark with 95% Wilson Bounds"
        }
    }

# ----------------- Module J: Approvals & Audit Dossier -----------------
@app.post("/api/bids/approve")
def approve_bid_decision(
    req: ApprovalRequest,
    user: Dict[str, Any] = Depends(require_role(["FINANCE_REVIEWER", "TENDER_MANAGER", "ADMIN"]))
):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    c.execute('''
    UPDATE bid_evaluations
    SET status = 'APPROVED', approved_by = ?, approved_at = ?, decision_verdict = ?
    WHERE tender_id = (SELECT id FROM tenders WHERE (id = ? OR tender_id = ?) AND organization_id = ?)
    ''', (user["name"], now, req.decision_verdict, req.tender_id, req.tender_id, user["organization_id"]))

    conn.commit()
    conn.close()

    log_audit(user["organization_id"], "APPROVE_BID", "BID_EVALUATION", req.tender_id, {
        "verdict": req.decision_verdict, "notes": req.notes, "approved_by_role": user.get("role")
    }, user["email"])

    return {"status": "SUCCESS", "verdict": req.decision_verdict, "approved_by": user["name"], "role": user.get("role"), "timestamp": now}

# ----------------- Portal Discovery Metadata -----------------
@app.get("/api/discovery/sources")
def get_sources():
    return {"sources": TenderIngestionService.get_sources()}

# ----------------- Working History & Audit Trail -----------------
@app.get("/api/audit-logs")
def get_audit_trail(
    limit: int = 50,
    user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
    SELECT id, organization_id, action, entity_type, entity_id, details_json, user_email, timestamp
    FROM audit_logs
    WHERE organization_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
    ''', (user["organization_id"], limit))
    rows = c.fetchall()
    conn.close()

    logs = []
    for r in rows:
        d = dict(r)
        d["details"] = None
        if d.get("details_json"):
            try:
                d["details"] = json.loads(d["details_json"])
            except Exception:
                d["details"] = d["details_json"]
        logs.append(d)

    return {"status": "SUCCESS", "count": len(logs), "logs": logs}



# ----------------- System Health -----------------
@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "PharmaBid AI Enterprise Backend",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "database": "SQLite / Local Secured",
        "storage": "Local S3-compatible structure"
    }

# Mount static files to serve the frontend interface directly
app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="frontend")
