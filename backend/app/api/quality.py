from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.kpi_service import ManufacturingKPIService

router = APIRouter(prefix="/quality", tags=["Quality Intelligence"])

@router.get("/summary")
def get_quality_summary(db: Session = Depends(get_db)):
    kpis = ManufacturingKPIService.calculate_executive_kpis(db)
    return {
        "total_inspected_units": kpis["total_inspected_units"],
        "total_defective_units": kpis["total_defective_units"],
        "defect_rate_pct": kpis["defect_rate_pct"],
        "quality_pass_rate_pct": kpis["quality_pass_rate_pct"],
        "rework_rate_pct": kpis["rework_rate_pct"]
    }

@router.get("/defects")
def get_quality_defects(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_defect_distribution(db)

@router.get("/trends")
def get_quality_trends(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_monthly_quality_trends(db)
