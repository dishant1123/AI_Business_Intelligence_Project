import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.analysis import AnalysisRun, AgentLog, Recommendation
from app.schemas.analysis import AnalysisRunResponse, AgentLogSchema
from app.agents.crew import ManufacturingCrewOrchestrator

router = APIRouter(prefix="/agents", tags=["AI Agents Control Center"])

@router.post("/run")
def trigger_agent_analysis(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Triggers the multi-agent manufacturing analysis workflow across all 6 specialized agents.
    Runs asynchronously in background task, updating live database state.
    """
    analysis_id = str(uuid.uuid4())
    run = AnalysisRun(
        id=analysis_id,
        trigger_type="API_TRIGGER",
        status="PENDING"
    )
    db.add(run)
    db.commit()

    background_tasks.add_task(ManufacturingCrewOrchestrator._execute_workflow, analysis_id)

    return {
        "message": "Multi-agent manufacturing intelligence workflow initiated",
        "analysis_id": analysis_id,
        "status": "PENDING"
    }

@router.get("/status/{analysis_id}")
def get_analysis_status(analysis_id: str, db: Session = Depends(get_db)):
    run = db.query(AnalysisRun).filter(AnalysisRun.id == analysis_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    logs = db.query(AgentLog).filter(AgentLog.analysis_id == analysis_id).order_by(AgentLog.id.asc()).all()
    recs = db.query(Recommendation).filter(Recommendation.analysis_id == analysis_id).all()

    return {
        "id": run.id,
        "status": run.status,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "verified": run.verified,
        "verification_notes": run.verification_notes,
        "confidence_score": run.confidence_score,
        "agent_logs": logs,
        "recommendations": recs
    }

@router.get("/logs/{analysis_id}")
def get_analysis_logs(analysis_id: str, db: Session = Depends(get_db)):
    logs = db.query(AgentLog).filter(AgentLog.analysis_id == analysis_id).order_by(AgentLog.id.asc()).all()
    return logs

@router.get("/history")
def get_analysis_history(db: Session = Depends(get_db)):
    runs = db.query(AnalysisRun).order_by(AnalysisRun.started_at.desc()).limit(15).all()
    return runs
