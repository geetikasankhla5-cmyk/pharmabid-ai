# PharmaBid AI - Indian Public Procurement Ingestion & Importer Module
import datetime
from typing import Dict, Any, List

class TenderIngestionService:
    """
    Manages discovery and structured import of Indian public pharmaceutical tenders
    (CPPP, GeM, State RMSCs).
    Integrates live discovery feeds and authorized CSV/JSON bulk import without scraping violations.
    """

    SOURCES_METADATA = [
        {
            "code": "CPPP",
            "name": "Central Public Procurement Portal (eProcure)",
            "url": "https://eprocure.gov.in/epublish/app",
            "coverage": "CMSS, AIIMS, ESIC, AFMS Central Drug Tenders",
            "status": "CONNECTED (Batch XML/Import Mode)",
            "notes": "Official portal publishes NIT & Corrigenda. Automated scraping restricted; authorized batch import active."
        },
        {
            "code": "GeM",
            "name": "Government e-Marketplace",
            "url": "https://gem.gov.in",
            "coverage": "State Hospitals & Autonomous Medical Institutions",
            "status": "CONNECTED (API / JSON Feed)",
            "notes": "Direct catalog rate contracts and custom bid notices."
        },
        {
            "code": "TNMSC",
            "name": "Tamil Nadu Medical Services Corporation",
            "url": "https://tnmsc.tn.gov.in",
            "coverage": "State-wide Essential Drug Procurement",
            "status": "IMPORT READY",
            "notes": "Benchmark state procurement agency with annual RC schedule."
        },
        {
            "code": "RMSCL",
            "name": "Rajasthan Medical Services Corporation Limited",
            "url": "https://medicalhealth.rajasthan.gov.in",
            "coverage": "Mukhyamantri Nishulk Dawa Yojana",
            "status": "IMPORT READY",
            "notes": "Large volume procurement for free medicine schemes."
        }
    ]

    @classmethod
    def get_sources(cls) -> List[Dict[str, Any]]:
        return cls.SOURCES_METADATA

    @classmethod
    def validate_imported_tender(cls, raw: Dict[str, Any]) -> tuple[bool, List[str], Dict[str, Any]]:
        """
        Validates required procurement fields before landing into database.
        """
        errors = []
        required_fields = ["tender_id", "authority_name", "title", "molecule", "quantity", "submission_deadline"]
        for f in required_fields:
            if not raw.get(f):
                errors.append(f"Missing mandatory tender field: '{f}'")

        if errors:
            return False, errors, {}

        # Normalized structure
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        clean = {
            "tender_id": str(raw["tender_id"]).strip(),
            "authority_name": str(raw["authority_name"]).strip(),
            "portal_source": str(raw.get("portal_source", "CPPP")).strip(),
            "source_url": str(raw.get("source_url", "")).strip(),
            "title": str(raw["title"]).strip(),
            "therapeutic_area": str(raw.get("therapeutic_area", "General Medicine")).strip(),
            "molecule": str(raw["molecule"]).strip(),
            "dosage_form": str(raw.get("dosage_form", "Tablets")).strip(),
            "quantity": float(raw["quantity"]),
            "estimated_value": float(raw.get("estimated_value", 0.0)),
            "currency": str(raw.get("currency", "INR")).strip(),
            "currency_symbol": str(raw.get("currency_symbol", "₹")).strip(),
            "emd_amount": float(raw.get("emd_amount", 0.0)),
            "publication_date": str(raw.get("publication_date", datetime.date.today().isoformat())),
            "submission_deadline": str(raw["submission_deadline"]).strip(),
            "status": "ACTIVE",
            "data_mode": str(raw.get("data_mode", "REAL")),
            "assigned_owner": str(raw.get("assigned_owner", "Unassigned")).strip(),
            "last_sync_time": now,
            "created_at": now
        }

        return True, [], clean
