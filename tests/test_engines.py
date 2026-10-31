import pytest
import uuid
from backend.app.core.database import SessionLocal
from backend.app.models.telemetry import MetricSample
from backend.app.models.incident import Incident
from backend.app.engines.anomaly.detector import anomaly_detector
from backend.app.engines.prediction.predictor import predictive_engine
from backend.app.engines.diagnosis.rca_engine import rca_engine
from backend.app.engines.recovery.recovery_engine import recovery_engine
from backend.app.engines.recovery.verifier import verification_engine

def test_anomaly_threshold_detection():
    db = SessionLocal()
    try:
        sample = MetricSample(
            service_name=f"anom-test-{uuid.uuid4().hex[:6]}",
            cpu=95.4,
            memory=50.0,
            disk=60.0,
            latency=150.0,
            availability=99.9,
            error_rate=0.01
        )
        anomalies = anomaly_detector.evaluate_sample(sample, [], db)
        assert len(anomalies) > 0
        assert any(a.metric_name == "cpu" for a in anomalies)
        assert anomalies[0].severity in ("high", "critical")
    finally:
        db.close()

def test_prediction_engine_risk_drivers():
    samples = []
    svc_name = f"pred-test-{uuid.uuid4().hex[:6]}"
    for i in range(10):
        samples.append(MetricSample(
            service_name=svc_name,
            cpu=30.0 + (i * 5.0), # accelerating from 30 to 75
            memory=45.0 + (i * 4.0),
            disk=55.0,
            latency=100.0 + (i * 40.0),
            error_rate=0.01
        ))
    result = predictive_engine.evaluate_risk(samples, svc_name)
    assert result["risk_score"] > 25.0
    assert result["risk_classification"] in ("moderate", "high", "critical")
    assert "drivers" in result
    assert result["drivers"]["cpu_rate_pct_sample"] > 0

def test_root_cause_diagnosis():
    db = SessionLocal()
    try:
        uid = uuid.uuid4().hex[:6]
        svc = f"rca-svc-{uid}"
        inc = Incident(
            incident_number=f"INC-{uid.upper()}",
            title=f"Compute saturation alert on {svc}",
            severity="critical",
            status="open",
            affected_service_name=svc
        )
        db.add(inc)
        db.commit()

        sample = MetricSample(service_name=svc, cpu=96.0, memory=52.0, disk=50.0, latency=210.0, availability=99.9, error_rate=0.01)
        anomalies = anomaly_detector.evaluate_sample(sample, [], db)

        hypotheses = rca_engine.diagnose_incident(inc, anomalies, db)
        assert len(hypotheses) > 0
        assert hypotheses[0].ranking == 1
        assert hypotheses[0].confidence_score >= 0.70
        assert "Thread Pool" in hypotheses[0].hypothesis_title or "Compute" in hypotheses[0].hypothesis_title
    finally:
        db.close()

def test_recovery_sandbox_simulation():
    db = SessionLocal()
    try:
        uid = uuid.uuid4().hex[:6]
        svc = f"sbx-svc-{uid}"
        inc = Incident(
            incident_number=f"INC-{uid.upper()}",
            title=f"CPU saturation on {svc}",
            severity="critical",
            status="open",
            affected_service_name=svc
        )
        db.add(inc)
        db.commit()

        plan = recovery_engine.generate_plan_for_incident(inc, db)
        assert plan.status == "draft"
        assert plan.requires_approval is True

        # Simulate in Sandbox
        before_telemetry = {"cpu": 94.0, "memory": 60.0, "latency": 850.0, "availability": 98.2}
        sim_result = recovery_engine.simulate_plan_in_sandbox(plan, before_telemetry)

        assert sim_result["safety_verdict"] == "APPROVED_FOR_STAGED_EXECUTION"
        assert sim_result["telemetry_comparison"]["projected_after"]["cpu"] < 50.0
        assert sim_result["telemetry_comparison"]["variance_delta"]["cpu_delta"] < 0
    finally:
        db.close()
