from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.kpi_service import ManufacturingKPIService

router = APIRouter(prefix="/finance", tags=["Financial Intelligence"])

@router.get("/summary")
def get_finance_summary(db: Session = Depends(get_db)):
    kpis = ManufacturingKPIService.calculate_executive_kpis(db)
    return {
        "total_manufacturing_expenses": kpis["total_manufacturing_expenses"],
        "total_material_cost": kpis["total_material_cost"],
        "avg_gross_margin_pct": kpis["avg_gross_margin_pct"]
    }

@router.get("/analytics")
def get_finance_analytics(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_financial_analytics(db)
