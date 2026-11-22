from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.kpi_service import ManufacturingKPIService

router = APIRouter(prefix="/machines", tags=["Machine Intelligence"])

@router.get("/summary")
def get_machine_summary(db: Session = Depends(get_db)):
    kpis = ManufacturingKPIService.calculate_executive_kpis(db)
    return {
        "total_downtime_minutes": kpis["total_downtime_minutes"],
        "total_downtime_hours": kpis["total_downtime_hours"],
        "downtime_frequency": kpis["downtime_frequency"],
        "total_maintenance_cost": kpis["total_maintenance_cost"],
        "machine_availability_pct": kpis["machine_availability_pct"]
    }

@router.get("/downtime")
def get_machine_downtime_details(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_downtime_analytics(db)
