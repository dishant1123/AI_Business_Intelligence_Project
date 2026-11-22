from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.kpi_service import ManufacturingKPIService

router = APIRouter(prefix="/production", tags=["Production Intelligence"])

@router.get("/summary")
def get_production_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    shift: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {"start_date": start_date, "end_date": end_date, "production_line": production_line, "shift": shift}
    kpis = ManufacturingKPIService.calculate_executive_kpis(db, filters)
    return {
        "total_planned_production": kpis["total_planned_production"],
        "total_produced_units": kpis["total_produced_units"],
        "total_rejected_units": kpis["total_rejected_units"],
        "production_achievement_pct": kpis["production_achievement_pct"],
        "production_yield_pct": kpis["production_yield_pct"],
        "production_gap": kpis["production_gap"],
        "average_daily_production": kpis["average_daily_production"]
    }

@router.get("/lines")
def get_production_lines(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_line_performance(db)

@router.get("/shifts")
def get_production_shifts(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_shift_performance(db)

@router.get("/trends")
def get_production_trends(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_monthly_production_trends(db)
