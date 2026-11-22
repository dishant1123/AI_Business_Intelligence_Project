from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.users import User
from app.models.analysis import AnalysisRun, AgentLog
from app.models.manufacturing import DatasetImportHistory
from app.schemas.users import UserOut, UserCreate
from app.core.security import get_password_hash
from app.api.auth import require_role

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user = Depends(require_role(["ADMIN"]))):
    return db.query(User).all()

@router.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMIN"]))):
    existing = db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role or "ANALYST"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/system-activity")
def get_system_activity(db: Session = Depends(get_db), current_user = Depends(require_role(["ADMIN"]))):
    analyses_count = db.query(AnalysisRun).count()
    agent_logs_count = db.query(AgentLog).count()
    imports_count = db.query(DatasetImportHistory).count()
    users_count = db.query(User).count()

    recent_runs = db.query(AnalysisRun).order_by(AnalysisRun.started_at.desc()).limit(5).all()

    return {
        "total_users": users_count,
        "total_analyses_run": analyses_count,
        "total_agent_logs": agent_logs_count,
        "total_dataset_imports": imports_count,
        "recent_runs": recent_runs
    }
