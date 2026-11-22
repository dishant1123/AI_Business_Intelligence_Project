from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.kpi_service import ManufacturingKPIService
from app.schemas.manufacturing import DashboardKPIResponse

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])

@router.get("/kpis", response_model=DashboardKPIResponse)
def get_dashboard_kpis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    shift: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "production_line": production_line,
        "shift": shift,
        "product_id": product_id
    }
    return ManufacturingKPIService.calculate_executive_kpis(db, filters)

@router.get("/trends")
def get_dashboard_trends(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {"start_date": start_date, "end_date": end_date, "production_line": production_line}
    prod_trends = ManufacturingKPIService.get_monthly_production_trends(db, filters)
    qual_trends = ManufacturingKPIService.get_monthly_quality_trends(db, filters)
    return {
        "production_trends": prod_trends,
        "quality_trends": qual_trends
    }

@router.get("/production")
def get_dashboard_production_overview(db: Session = Depends(get_db)):
    line_perf = ManufacturingKPIService.get_line_performance(db)
    shift_perf = ManufacturingKPIService.get_shift_performance(db)
    return {
        "lines": line_perf,
        "shifts": shift_perf
    }

@router.get("/quality")
def get_dashboard_quality_overview(db: Session = Depends(get_db)):
    defects = ManufacturingKPIService.get_defect_distribution(db)
    monthly_quality = ManufacturingKPIService.get_monthly_quality_trends(db)
    return {
        "defect_distribution": defects,
        "monthly_quality": monthly_quality
    }
