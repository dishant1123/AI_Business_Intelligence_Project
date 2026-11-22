from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.analysis import Recommendation, ApprovalDecision
from app.schemas.analysis import RecommendationSchema, ApprovalDecisionCreate
from app.api.auth import get_current_user, require_role
from app.models.users import User

router = APIRouter(prefix="/approvals", tags=["Human Approval Center"])

@router.get("", response_model=list[RecommendationSchema])
def list_recommendations(db: Session = Depends(get_db)):
    """
    Returns all AI-generated strategic recommendations requiring managerial review.
    """
    return db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()

@router.get("/{recommendation_id}")
def get_recommendation_details(recommendation_id: str, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    decisions = db.query(ApprovalDecision).filter(ApprovalDecision.recommendation_id == recommendation_id).all()
    return {
        "recommendation": rec,
        "decisions": decisions
    }

@router.post("/{recommendation_id}/decision")
def record_decision(
    recommendation_id: str,
    payload: ApprovalDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "MANAGER"]))
):
    """
    Records a managerial approval or rejection decision with audit comments.
    Enforces Human-in-the-Loop governance before consequential business actions are executed.
    """
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    decision_val = payload.decision.upper()
    if decision_val not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVED' or 'REJECTED'")

    decision_record = ApprovalDecision(
        recommendation_id=recommendation_id,
        user_id=current_user.id,
        user_name=current_user.full_name or current_user.username,
        decision=decision_val,
        comments=payload.comments,
        decided_at=datetime.utcnow()
    )
    db.add(decision_record)

    rec.status = decision_val
    db.commit()

    return {
        "message": f"Recommendation successfully {decision_val.lower()}",
        "recommendation_id": recommendation_id,
        "decision": decision_val,
        "decided_by": current_user.username,
        "timestamp": datetime.utcnow().isoformat()
    }
