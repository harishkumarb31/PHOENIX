import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_complete_autonomous_self_healing_workflow():
    """
    Validates end-to-end operational workflow:
    Telemetry Ingestion -> Anomaly Detection -> Incident Creation ->
    Root Cause Diagnosis -> Failure Prediction -> Recovery Plan Generation ->
    Approval -> Controlled Execution -> Verification -> Incident Resolution -> Audit
    """
    svc_name = f"e2e-svc-{uuid.uuid4().hex[:6]}"

    # 1. Ingest telemetry with CPU saturation (96.5% CPU, 1100ms latency)
    ingest_res = client.post("/api/v1/metrics/ingest", json={
        "service": svc_name,
        "cpu": 96.5,
        "memory": 58.0,
        "disk": 62.0,
        "latency": 1100.0,
        "availability": 98.2
    })
    assert ingest_res.status_code == 200
    ingest_data = ingest_res.json()
    assert ingest_data["anomalies_detected"] > 0
    inc_id = ingest_data["incident_id"]
    assert inc_id is not None

    # 2. Check Anomaly Intelligence
    anom_res = client.get("/api/v1/anomalies?limit=10")
    assert anom_res.status_code == 200
    anomalies = anom_res.json()
    assert len(anomalies) > 0
    cpu_anom = [a for a in anomalies if a["metric_name"] == "cpu" and a["service_name"] == svc_name]
    assert len(cpu_anom) > 0

    # 3. Verify Incident Creation
    inc_res = client.get("/api/v1/incidents?limit=10")
    assert inc_res.status_code == 200
    incidents = inc_res.json()
    matching_incidents = [i for i in incidents if i["id"] == inc_id]
    assert len(matching_incidents) == 1
    target_incident = matching_incidents[0]
    assert target_incident["status"] == "open"

    # 4. Examine Root Cause Diagnosis Hypotheses
    detail_res = client.get(f"/api/v1/incidents/{inc_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["hypotheses"]) > 0
    primary_hypothesis = detail["hypotheses"][0]
    assert primary_hypothesis["ranking"] == 1
    assert len(primary_hypothesis["evidence"]) > 0

    # 5. Formulate Recovery Plan
    plan_res = client.post("/api/v1/recovery/plans", json={"incident_id": inc_id})
    assert plan_res.status_code == 200
    plan = plan_res.json()
    plan_id = plan["id"]
    assert plan["requires_approval"] is True
    assert len(plan["steps"]) >= 3

    # 6. Test Recovery Plan in Sandbox Simulation
    sandbox_res = client.post(f"/api/v1/sandbox/simulate/{plan_id}")
    assert sandbox_res.status_code == 200
    sim_data = sandbox_res.json()
    assert sim_data["safety_verdict"] == "APPROVED_FOR_STAGED_EXECUTION"
    assert sim_data["telemetry_comparison"]["variance_delta"]["cpu_delta"] < 0

    # 7. Operator Approves Recovery Plan
    approve_res = client.post(f"/api/v1/recovery/plans/{plan_id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 8. Execute Approved Remediation Plan
    exec_res = client.post(f"/api/v1/recovery/plans/{plan_id}/execute", json={
        "plan_id": plan_id,
        "approved": True,
        "execution_mode": "simulation"
    })
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert exec_data["status"] == "succeeded"
    assert len(exec_data["logs"]) >= 3

    # 9. Autonomous Verification Confirms Health
    assert "verification" in exec_data
    assert exec_data["verification"]["status"] in ("verified_healthy", "partially_recovered")

    # 10. Audit Trail Confirms Entire Sequence
    audit_res = client.get("/api/v1/audit?limit=15")
    assert audit_res.status_code == 200
    audit_events = [a["event_type"] for a in audit_res.json()]
    assert "recovery_execution" in audit_events
    assert "recovery_verification" in audit_events
