import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.analysis import Report
from app.services.report_service import ManufacturingReportService
from app.schemas.analysis import ReportSchema

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportSchema)
def generate_report(analysis_id: str = None, db: Session = Depends(get_db)):
    """
    Generates a new official executive PDF report with verified KPIs and auditor stamps.
    """
    report = ManufacturingReportService.generate_pdf_report(db, analysis_id)
    return report

@router.get("", response_model=list[ReportSchema])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.generated_at.desc()).all()

@router.get("/{report_id}", response_model=ReportSchema)
def get_report(report_id: str, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    return rep

@router.get("/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep or not os.path.exists(rep.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        path=rep.file_path,
        filename=rep.file_name,
        media_type="application/pdf"
    )
