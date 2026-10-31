import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "phoenix-api"

def test_auth_login_success():
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "super_admin"

def test_auth_login_invalid():
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert res.status_code == 401

def test_dashboard_overview():
    res = client.get("/api/v1/dashboard/overview")
    assert res.status_code == 200
    data = res.json()
    assert "counts" in data
    assert "averages" in data
    assert "risk" in data
    assert data["counts"]["total_services"] >= 4

def test_metrics_api():
    res = client.get("/api/v1/metrics?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        sample = data[0]
        assert "cpu" in sample
        assert "memory" in sample
        assert "latency" in sample

def test_services_list():
    res = client.get("/api/v1/services")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    names = [s["name"] for s in data]
    assert "api-gateway" in names

def test_service_dependencies():
    res = client.get("/api/v1/services/dependencies")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["edges"]) >= 2

def test_anomalies_list():
    res = client.get("/api/v1/anomalies")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_predictions_list():
    res = client.get("/api/v1/predictions")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_incidents_list():
    res = client.get("/api/v1/incidents")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_recovery_playbooks():
    res = client.get("/api/v1/recovery/playbooks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    codes = [p["playbook_code"] for p in data]
    assert "PBK-CPU-THROTTLE" in codes
    assert "PBK-MEM-RECYCLE" in codes

def test_alerts_list():
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_analytics_summary():
    res = client.get("/api/v1/analytics/summary?days=7")
    assert res.status_code == 200
    data = res.json()
    assert "mttd_seconds" in data
    assert "mttr_minutes" in data
    assert "infrastructure_availability_pct" in data

def test_analytics_export_csv():
    res = client.get("/api/v1/analytics/export-csv")
    assert res.status_code == 200
    assert "Incident ID" in res.text

def test_ai_assistant_query():
    res = client.post("/api/v1/assistant/query", json={"query": "What is the current infrastructure health?"})
    assert res.status_code == 200
    data = res.json()
    assert "headline" in data
    assert "facts" in data
    assert len(data["facts"]) > 0

def test_audit_logs():
    res = client.get("/api/v1/audit")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

