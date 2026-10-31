from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.telemetry import MetricSample
from ...schemas.all_schemas import TelemetryIngest
from ...engines.monitoring.telemetry_collector import telemetry_collector
from ...engines.anomaly.detector import anomaly_detector

router = APIRouter(prefix="/metrics", tags=["Infrastructure Monitoring"])

@router.get("")
def get_metrics(
    limit: int = Query(60, ge=1, le=300),
    service: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MetricSample)
    if service:
        query = query.filter(MetricSample.service_name == service)
    samples = query.order_by(MetricSample.id.desc()).limit(limit).all()
    samples.reverse()
    return [
        {
            "id": s.id,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            "service": s.service_name,
            "cpu": s.cpu,
            "memory": s.memory,
            "disk": s.disk,
            "network": s.network,
            "latency": s.latency,
            "availability": s.availability,
            "error_rate": s.error_rate,
            "throughput": s.throughput,
            "is_simulated": s.is_simulated
        }
        for s in samples
    ]

@router.get("/host")
def get_host_metrics():
    return telemetry_collector.get_host_metrics()

@router.post("/ingest")
def ingest_external_telemetry(payload: TelemetryIngest, db: Session = Depends(get_db)):
    sample = MetricSample(
        service_name=payload.service,
        cpu=payload.cpu,
        memory=payload.memory,
        disk=payload.disk,
        network=payload.network,
        latency=payload.latency,
        availability=payload.availability,
        source="external_api_ingest",
        is_simulated=False
    )
    db.add(sample)
    db.commit()

    # Immediate anomaly evaluation
    history = db.query(MetricSample).filter(MetricSample.service_name == payload.service).order_by(MetricSample.id.desc()).limit(20).all()
    anomalies = anomaly_detector.evaluate_sample(sample, history, db)

    incident_id = None
    if anomalies:
        import uuid
        from ...models.incident import Incident
        from ...engines.diagnosis.rca_engine import rca_engine
        primary = anomalies[0]
        inc = Incident(
            incident_number=f"INC-{uuid.uuid4().hex[:6].upper()}",
            title=primary.explanation[:120],
            description=primary.explanation,
            severity=primary.severity,
            status="open",
            anomaly_score=round(primary.deviation_pct / 100.0, 2),
            affected_service_name=payload.service
        )
        db.add(inc)
        db.commit()
        incident_id = inc.id
        for a in anomalies:
            a.incident_id = inc.id
        db.commit()
        rca_engine.diagnose_incident(inc, anomalies, db)

    return {
        "status": "ingested",
        "sample_id": sample.id,
        "anomalies_detected": len(anomalies),
        "incident_id": incident_id
    }
