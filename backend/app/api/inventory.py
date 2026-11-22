from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.kpi_service import ManufacturingKPIService

router = APIRouter(prefix="/inventory", tags=["Inventory Intelligence"])

@router.get("/summary")
def get_inventory_summary(db: Session = Depends(get_db)):
    kpis = ManufacturingKPIService.calculate_executive_kpis(db)
    return {
        "total_stock_quantity": kpis["total_stock_quantity"],
        "low_stock_materials_count": kpis["low_stock_materials_count"],
        "total_inventory_value": kpis["total_inventory_value"],
        "total_quantity_used": kpis["total_quantity_used"],
        "total_wastage_quantity": kpis["total_wastage_quantity"],
        "material_wastage_pct": kpis["material_wastage_pct"]
    }

@router.get("/analytics")
def get_inventory_analytics(db: Session = Depends(get_db)):
    return ManufacturingKPIService.get_inventory_analytics(db)
