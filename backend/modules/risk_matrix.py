# PharmaBid AI - 8-Vector Pharmaceutical Risk Intelligence Matrix
from typing import Dict, Any, List

class RiskMatrixEngine:
    """
    Evaluates 8 pharmaceutical procurement risk vectors grounded in:
    1. Extracted tender clauses (Penalties, Fall clause, Payment terms)
    2. Company operational parameters (Batch capacity, Supply lead times)
    3. Regulatory compliance (WHO-GMP, COPP, Stability test data)
    """

    DIMENSIONS = [
        "Regulatory & Eligibility",
        "Product & Technical Compliance",
        "Commercial & Price Fall Risk",
        "Supply & Manufacturing Capacity",
        "Delivery & Lead Time Risk",
        "Payment & Working Capital Risk",
        "Contractual & Penalty Risk",
        "Submission & EMD Risk"
    ]

    @classmethod
    def evaluate_risks(cls, clauses: List[Dict[str, Any]], tender_data: Dict[str, Any], costs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates scores (0 - 100) and produces an actionable mitigation register.
        """
        # Scan extracted clauses for triggers
        has_fall_clause = any(c.get("category") == "PRICE_RULES" or "fall clause" in c.get("extracted_text", "").lower() for c in clauses)
        has_high_ld = any(c.get("category") == "PENALTY" and "10%" in c.get("extracted_text", "").lower() for c in clauses)
        has_extended_credit = any(c.get("category") == "PAYMENT" and any(k in c.get("extracted_text", "").lower() for k in ["60 days", "90 days", "120 days"]) for c in clauses)

        risk_scores = {
            "Regulatory & Eligibility": 25, # Valid GMP in place
            "Product & Technical Compliance": 20, # Pharmacopoeial standard matched
            "Commercial & Price Fall Risk": 75 if has_fall_clause else 35,
            "Supply & Manufacturing Capacity": 40,
            "Delivery & Lead Time Risk": 45,
            "Payment & Working Capital Risk": 65 if has_extended_credit else 30,
            "Contractual & Penalty Risk": 70 if has_high_ld else 40,
            "Submission & EMD Risk": 30
        }

        overall_score = round(sum(risk_scores.values()) / len(risk_scores))

        risk_register = [
            {
                "vector": "Commercial & Price Fall Risk",
                "score": risk_scores["Commercial & Price Fall Risk"],
                "severity": "HIGH" if risk_scores["Commercial & Price Fall Risk"] >= 70 else "MEDIUM",
                "trigger_clause": "Clause 31 (Price Fall / MFC Warranty)",
                "description": "Quoting rate triggers nationwide reference floor. Lower rate cannot be offered to other state RMSCs.",
                "mitigation": "Hold contract rate firm; provide non-price value adds (e.g. enhanced buffer stock) rather than invoice price cuts."
            },
            {
                "vector": "Contractual & Penalty Risk",
                "score": risk_scores["Contractual & Penalty Risk"],
                "severity": "HIGH" if risk_scores["Contractual & Penalty Risk"] >= 70 else "MEDIUM",
                "trigger_clause": "Clause 24 (Liquidated Damages @ 0.5%/week up to 10%)",
                "description": "Consignment dispatch delays carry 10% penalty plus purchaser risk-purchase rights.",
                "mitigation": "Pre-manufacture 100% of first tranche 14 days prior to formal dispatch inspection notification."
            },
            {
                "vector": "Payment & Working Capital Risk",
                "score": risk_scores["Payment & Working Capital Risk"],
                "severity": "MEDIUM",
                "trigger_clause": "Clause 18 (100% Payment within 60 Days against CRC)",
                "description": "60-day milestone tied to consignee receiving certificate (CRC) introduces working capital drag.",
                "mitigation": "Include working capital carrying cost in loaded cost floor; establish factoring facility with commercial bank."
            },
            {
                "vector": "Supply & Manufacturing Capacity",
                "score": risk_scores["Supply & Manufacturing Capacity"],
                "severity": "LOW",
                "trigger_clause": "Technical Schedule of Requirements",
                "description": "Tender batch represents 50% of plant monthly granulation capacity.",
                "mitigation": "Block dedicated blister packaging line 3 for 10 consecutive shifts upon contract confirmation."
            }
        ]

        return {
            "overall_risk_score": overall_score,
            "dimension_scores": risk_scores,
            "register": risk_register
        }
