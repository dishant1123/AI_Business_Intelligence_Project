import os
import json
from typing import Dict, Any, List
from crewai.tools import tool
from app.core.database import SessionLocal
from app.services.kpi_service import ManufacturingKPIService

@tool("Query Production KPIs")
def query_production_kpis(line: str = None, shift: str = None) -> str:
    """
    Retrieves deterministic manufacturing production KPIs directly from the database.
    Optional line filter (e.g. 'LINE01') and shift filter ('A', 'B', 'C').
    """
    db = SessionLocal()
    try:
        filters = {}
        if line:
            filters["production_line"] = line
        if shift:
            filters["shift"] = shift
        kpis = ManufacturingKPIService.calculate_executive_kpis(db, filters)
        return json.dumps({
            "total_planned_production": kpis["total_planned_production"],
            "total_produced_units": kpis["total_produced_units"],
            "total_rejected_units": kpis["total_rejected_units"],
            "production_achievement_pct": kpis["production_achievement_pct"],
            "production_yield_pct": kpis["production_yield_pct"],
            "production_gap": kpis["production_gap"],
            "average_daily_production": kpis["average_daily_production"]
        })
    finally:
        db.close()

@tool("Query Quality & Defect KPIs")
def query_quality_kpis() -> str:
    """
    Retrieves deterministic product quality, defect distribution, and rework statistics from database.
    """
    db = SessionLocal()
    try:
        kpis = ManufacturingKPIService.calculate_executive_kpis(db)
        defects = ManufacturingKPIService.get_defect_distribution(db)
        return json.dumps({
            "total_inspected_units": kpis["total_inspected_units"],
            "total_defective_units": kpis["total_defective_units"],
            "defect_rate_pct": kpis["defect_rate_pct"],
            "quality_pass_rate_pct": kpis["quality_pass_rate_pct"],
            "rework_rate_pct": kpis["rework_rate_pct"],
            "top_defects": defects[:5]
        })
    finally:
        db.close()

@tool("Query Machine Downtime & Maintenance")
def query_machine_downtime() -> str:
    """
    Retrieves machine downtime hours, maintenance costs, availability, and reasons from database.
    """
    db = SessionLocal()
    try:
        kpis = ManufacturingKPIService.calculate_executive_kpis(db)
        downtime = ManufacturingKPIService.get_downtime_analytics(db)
        return json.dumps({
            "total_downtime_hours": kpis["total_downtime_hours"],
            "total_downtime_minutes": kpis["total_downtime_minutes"],
            "total_maintenance_cost_inr": kpis["total_maintenance_cost"],
            "machine_availability_pct": kpis["machine_availability_pct"],
            "top_downtime_reasons": downtime["by_reason"][:5],
            "top_machines_downtime": downtime["by_machine"][:5]
        })
    finally:
        db.close()

@tool("Query Inventory & Material Usage")
def query_inventory_kpis() -> str:
    """
    Retrieves raw material inventory stock, stockout alerts, material usage, and scrap/wastage numbers.
    """
    db = SessionLocal()
    try:
        kpis = ManufacturingKPIService.calculate_executive_kpis(db)
        inv = ManufacturingKPIService.get_inventory_analytics(db)
        return json.dumps({
            "total_stock_quantity": kpis["total_stock_quantity"],
            "total_inventory_value_inr": kpis["total_inventory_value"],
            "low_stock_materials_count": kpis["low_stock_materials_count"],
            "reorder_materials": [r["material_id"] for r in inv["reorder_alerts"]],
            "total_quantity_used": kpis["total_quantity_used"],
            "total_wastage_quantity": kpis["total_wastage_quantity"],
            "material_wastage_pct": kpis["material_wastage_pct"]
        })
    finally:
        db.close()

@tool("Query Financial Expenses & Margins")
def query_financial_kpis() -> str:
    """
    Retrieves manufacturing expenses by cost center, category, and finished goods portfolio profit margins.
    """
    db = SessionLocal()
    try:
        kpis = ManufacturingKPIService.calculate_executive_kpis(db)
        fin = ManufacturingKPIService.get_financial_analytics(db)
        return json.dumps({
            "total_manufacturing_expenses_inr": kpis["total_manufacturing_expenses"],
            "total_material_cost_inr": kpis["total_material_cost"],
            "portfolio_gross_margin_pct": kpis["avg_gross_margin_pct"],
            "cost_center_breakdown": fin["by_cost_center"],
            "category_breakdown": fin["by_category"],
            "top_margin_products": [p["product_id"] for p in fin["top_margin_products"][:3]],
            "low_margin_products": [p["product_id"] for p in fin["low_margin_products"][:3]]
        })
    finally:
        db.close()
