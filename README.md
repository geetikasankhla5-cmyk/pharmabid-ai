# PharmaBid AI: Enterprise Pharmaceutical Tender Intelligence & Decision Platform

PharmaBid AI is a data-backed, company-agnostic decision-support web application for pharmaceutical tender intelligence, bid economics optimization, and commercial risk governance.

Initially focused on the Indian public healthcare procurement ecosystem (CPPP, GeM, TNMSC, RMSCL), the platform provides:
- **Tender Intelligence & Ingestion**: Automated validation, pipeline tracking, and corrigenda/amendment alerts.
- **Document AI Extractor**: Real PDF and DOCX parsing, section classification, and page-level provenance.
- **Defensible Bid Economics Engine**: Working-capital adjusted cost-floor calculations, calibrated win-probability ranges, and sensitivity frontiers.
- **8-Vector Risk Matrix**: Governance framework linking extracted legal clauses directly to mitigation actions.
- **Multi-Tenant Security & Audit Trail**: Role-based access control, PBKDF2-HMAC security, and tamper-evident audit logging.

---

## 1. Quick Startup Instructions

### Prerequisites
- Python 3.10+ (Tested on Python 3.14.3)
- Modern Web Browser (Chrome, Firefox, Edge, Safari)

### Run the Application
From the project directory:

```bash
# 1. (Optional) Initialize and seed database if not already present
python -c "from backend.modules.database import init_db; init_db()"

# 2. Start the FastAPI enterprise server
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000
```

Once started:
- **Frontend Dashboard**: [http://localhost:8000](http://localhost:8000) or [http://localhost:8000/index.html](http://localhost:8000/index.html)
- **Interactive OpenAPI Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 2. Automated Test Suite

Run the full verification test suite:

```bash
python -m unittest backend/tests/test_core.py
```

Tests validate:
1. PBKDF2-HMAC password hashing and salt verification.
2. Tamper-evident JWT token generation and validation.
3. Cost floor calculations including working capital carrying costs.
4. Mandatory below-cost-floor `NO_GO` decision safeguards.
5. Economically viable `GO` decisions with statistical uncertainty bounds.
6. 8-vector risk scoring triggered by contractual price-fall and penalty terms.
7. Indian tender import validation and mandatory field enforcement.

---

## 3. Directory Structure

```
pharmabid-ai/
├── backend/
│   ├── modules/
│   │   ├── database.py       # Multi-tenant schema, relations & seed data
│   │   ├── document_ai.py    # PDF/DOCX extractor with coordinate provenance
│   │   ├── economics.py      # Loaded cost floor, P(win) bounds & scenarios
│   │   ├── ingestion.py      # CPPP, GeM, and State RMSC import service
│   │   ├── risk_matrix.py    # 8-vector risk framework linked to clauses
│   │   └── security.py       # PBKDF2, JWT tokens & RBAC
│   ├── server.py             # FastAPI REST endpoints & static server
│   ├── tests/
│   │   └── test_core.py      # Automated unit & integration tests
│   └── data/
│       └── pharmabid.db      # SQLite relational database
├── storage/
│   ├── tenders/              # Uploaded tender documents
│   └── dossiers/             # Exported decision dossiers
├── index.html                # Enterprise high-contrast frontend console
├── app.js                    # Reactive orchestrator & API consumer
├── engine.js                 # Pure mathematical client utilities
├── demo-data.js              # Multi-country labeled preset scenarios
├── package.json              # Project metadata & npm scripts
├── .env.example              # Environment configuration template
└── README.md                 # Complete system guide
```

---

## 4. Default Credentials (Seeded Demo Mode)
- **Tender Director**: `manager@sunguardpharma.in` / `PharmaBid2026!`
- **Commercial Pricing Reviewer**: `finance@sunguardpharma.in` / `PharmaBid2026!`
