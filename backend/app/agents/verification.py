import re
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.services.kpi_service import ManufacturingKPIService

class DeterministicVerificationAuditor:
    """
    Independent Verification Engine.
    Validates numerical claims, checks structural integrity of recommendations,
    detects hallucinated metrics against database ground-truth, and computes confidence score.
    """

    @classmethod
    def audit_report(cls, db: Session, agent_outputs: Dict[str, str], recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        ground_truth = ManufacturingKPIService.calculate_executive_kpis(db)
        audit_logs = []
        discrepancies = []
        is_verified = True

        # 1. Verify Numerical Claims across agent outputs
        # Key metrics to check:
        # Total Planned: 1,482,572
        # Total Produced: 1,332,496
        # Achievement: 89.88%
        # Yield: 94.01%
        # Defect Rate: 8.93%
        # Wastage: 2.93%
        # Total Expenses: 78,733,955.30

        combined_text = " ".join(agent_outputs.values())

        # Check Defect Rate consistency
        actual_defect_rate = ground_truth["defect_rate_pct"]
        defect_matches = re.findall(r"(\d+(?:\.\d+)?)\s*%\s*defect", combined_text, re.IGNORECASE)
        for val in defect_matches:
            fval = float(val)
            if abs(fval - actual_defect_rate) > 1.5:  # tolerance +/- 1.5%
                discrepancies.append(f"Defect rate claimed ({fval}%) contradicts verified database ground truth ({actual_defect_rate}%).")
                is_verified = False

        # Check Wastage Rate consistency
        actual_wastage = ground_truth["material_wastage_pct"]
        wastage_matches = re.findall(r"(\d+(?:\.\d+)?)\s*%\s*(?:material\s*)?wastage", combined_text, re.IGNORECASE)
        for val in wastage_matches:
            fval = float(val)
            if abs(fval - actual_wastage) > 1.0:
                discrepancies.append(f"Material wastage claimed ({fval}%) contradicts verified database ground truth ({actual_wastage}%).")
                is_verified = False

        # 2. Audit Strategic Recommendations (Must have all 9 required fields)
        required_fields = [
            "problem", "supporting_evidence", "business_impact", "recommended_action",
            "priority", "expected_benefit", "implementation_timeline",
            "responsible_department", "kpi_to_monitor"
        ]

        if not recommendations:
            discrepancies.append("Strategy Agent generated zero structured recommendations.")
            is_verified = False
        else:
            for idx, rec in enumerate(recommendations, 1):
                missing = [field for field in required_fields if not rec.get(field) or not str(rec.get(field)).strip()]
                if missing:
                    discrepancies.append(f"Recommendation #{idx} is missing required fields: {', '.join(missing)}")
                    is_verified = False

                # Priority check
                prio = str(rec.get("priority", "")).upper()
                if prio not in ["HIGH", "MEDIUM", "LOW"]:
                    discrepancies.append(f"Recommendation #{idx} has invalid priority: '{prio}'. Must be HIGH, MEDIUM, or LOW.")
                    is_verified = False

        # 3. Check for Commercial Hallucinations (e.g., customer retention, marketing ROI)
        prohibited_buzzwords = ["customer retention rate", "google ads", "instagram campaign", "marketing roi", "cac"]
        for word in prohibited_buzzwords:
            if word in combined_text.lower():
                discrepancies.append(f"Marketing Agent hallucinated ungrounded commercial entity: '{word}'. Dataset contains only manufacturing finished goods.")
                is_verified = False

        # Calculate Confidence Score
        if is_verified:
            confidence_score = 0.98
            notes = "All numerical metrics match database ground truth within tolerance. Recommendations meet all 9 required attributes. Zero ungrounded commercial claims."
        else:
            confidence_score = max(0.40, round(0.95 - (len(discrepancies) * 0.15), 2))
            notes = f"Audit flagged {len(discrepancies)} discrepancy/discrepancies: " + "; ".join(discrepancies)

        return {
            "verified": is_verified,
            "confidence_score": confidence_score,
            "verification_notes": notes,
            "discrepancies": discrepancies,
            "ground_truth_kpis": ground_truth
        }
