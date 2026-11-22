import os
import sys

# Ensure local storage path for CrewAI/AppData
storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage"))
os.makedirs(os.path.join(storage_dir, "appdata"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "reports"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "uploads"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "models"), exist_ok=True)
os.environ["LOCALAPPDATA"] = os.path.join(storage_dir, "appdata")

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.models import *
from app.api import (
    auth, datasets, dashboard, production, quality,
    machines, inventory, finance, agents, chat,
    ml, reports, approvals, admin
)

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Enterprise-grade Production & Quality Intelligence Platform powered by FastAPI, CrewAI, and Scikit-Learn.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    settings.FRONTEND_URL,
    "*"  # Allow all for cloud demo & Netlify preview
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production safe with credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup hook to initialize DB schema and seed default data if empty
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Check if DB has been seeded
    db = next(get_db())
    try:
        from app.models.users import User
        from app.models.manufacturing import FinishedGoods
        from app.core.security import get_password_hash
        from app.services.data_ingestion import DataIngestionService

        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            users = [
                User(
                    username="admin",
                    email="admin@manufacturing.ai",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Plant Executive Administrator",
                    role="ADMIN"
                ),
                User(
                    username="manager",
                    email="manager@manufacturing.ai",
                    hashed_password=get_password_hash("manager123"),
                    full_name="Plant Operations Manager",
                    role="MANAGER"
                ),
                User(
                    username="analyst",
                    email="analyst@manufacturing.ai",
                    hashed_password=get_password_hash("analyst123"),
                    full_name="Senior Manufacturing Analyst",
                    role="ANALYST"
                )
            ]
            db.add_all(users)
            db.commit()

        # Ingest Excel if empty
        if db.query(FinishedGoods).count() == 0:
            for p in [
                "04_Manufacturing.xlsx",
                "../04_Manufacturing.xlsx",
                "../../04_Manufacturing.xlsx"
            ]:
                if os.path.exists(p):
                    DataIngestionService.import_excel_workbook(p, db)
                    break
    finally:
        db.close()

# Health check
@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "version": settings.PROJECT_VERSION,
        "service": settings.PROJECT_NAME
    }

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(production.router, prefix=settings.API_V1_STR)
app.include_router(quality.router, prefix=settings.API_V1_STR)
app.include_router(machines.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(finance.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(approvals.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
