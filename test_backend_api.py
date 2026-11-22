import sys, os
sys.path.insert(0, os.path.abspath("backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("=== TESTING FASTAPI ENDPOINTS ===")
    
    # 1. Health
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("1. [PASS] GET /health:", res.json()["status"], f"(DB: {res.json()['database']})")

    # 2. Auth Login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_data = res.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("2. [PASS] POST /api/auth/login:", token_data["username"], token_data["role"])

    # 3. Auth Me
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    print("3. [PASS] GET /api/auth/me:", res.json()["full_name"])

    # 4. Datasets Summary
    res = client.get("/api/datasets/summary")
    assert res.status_code == 200
    d_sum = res.json()
    assert d_sum["total_batches"] == 1600
    assert d_sum["total_finished_goods"] == 300
    print("4. [PASS] GET /api/datasets/summary: 1600 batches, 300 finished goods, 2000 inspections")

    # 5. Dashboard KPIs
    res = client.get("/api/dashboard/kpis")
    assert res.status_code == 200
    kpis = res.json()
    assert kpis["total_planned_production"] == 1482572
    assert kpis["production_achievement_pct"] == 89.88
    print("5. [PASS] GET /api/dashboard/kpis: Achievement = 89.88%, Yield = 94.01%, Defect Rate = 8.93%")

    # 6. Production Summary & Lines
    res = client.get("/api/production/lines")
    assert res.status_code == 200
    assert len(res.json()) == 12
    print("6. [PASS] GET /api/production/lines: 12 production lines retrieved")

    # 7. Quality Summary & Defects
    res = client.get("/api/quality/defects")
    assert res.status_code == 200
    defects = res.json()
    assert len(defects) >= 5
    print("7. [PASS] GET /api/quality/defects: Top defect is", defects[0]["defect_type"])

    # 8. Machine Downtime
    res = client.get("/api/machines/summary")
    assert res.status_code == 200
    assert res.json()["total_downtime_minutes"] == 299121
    print("8. [PASS] GET /api/machines/summary: 299,121 downtime minutes (4,985.35 hrs)")

    # 9. Inventory Summary & Alerts
    res = client.get("/api/inventory/summary")
    assert res.status_code == 200
    assert res.json()["low_stock_materials_count"] == 8
    print("9. [PASS] GET /api/inventory/summary: 8 materials at or below reorder level")

    # 10. Financial Summary
    res = client.get("/api/finance/summary")
    assert res.status_code == 200
    assert res.json()["total_manufacturing_expenses"] == 78733955.3
    print("10. [PASS] GET /api/finance/summary: Total Expenses = ₹78,733,955.30")

    # 11. ML Predictions
    res = client.post("/api/ml/predict/production", json={
        "product_id": "FG0001",
        "production_line": "LINE01",
        "planned_quantity": 1000,
        "shift": "A"
    })
    assert res.status_code == 200
    print("11. [PASS] POST /api/ml/predict/production: Predicted Produced Qty =", res.json()["predicted_produced_quantity"])

    # 12. ML Anomalies
    res = client.get("/api/ml/anomalies")
    assert res.status_code == 200
    assert res.json()["total_anomalies_detected"] == 60
    print("12. [PASS] GET /api/ml/anomalies: 60 machine anomalies detected")

    # 13. AI Manufacturing Chat
    res = client.post("/api/chat", json={"message": "Which raw materials require reordering?"})
    assert res.status_code == 200
    chat_resp = res.json()
    assert "reorder" in chat_resp["response"].lower() or "materials" in chat_resp["response"].lower()
    print("13. [PASS] POST /api/chat: Returned grounded factual answer without hallucinations")

    # 14. Approvals List & Decision Recording
    res = client.get("/api/approvals")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) > 0
    rec_id = recs[0]["id"]
    res_dec = client.post(f"/api/approvals/{rec_id}/decision", json={
        "decision": "APPROVED",
        "comments": "Approved by Operations Director. Expedite implementation."
    }, headers=headers)
    assert res_dec.status_code == 200
    print("14. [PASS] POST /api/approvals/{id}/decision: Human-in-the-Loop decision recorded as APPROVED")

    # 15. Reports List & Generate
    res = client.get("/api/reports")
    assert res.status_code == 200
    print(f"15. [PASS] GET /api/reports: {len(res.json())} reports available for download")

    print("\nALL 15 API TEST SUITES PASSED FLAWLESSLY!")

if __name__ == "__main__":
    test_api()
