from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.service import Service
from ...models.incident import Incident
from ...models.telemetry import MetricSample
from ...models.prediction import PredictionRecord
from ...models.recovery import RecoveryExecution
from ...models.audit import AuditLog
from ...engines.monitoring.telemetry_collector import telemetry_collector

router = APIRouter(prefix="/dashboard", tags=["Command Center"])

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    open_incidents = db.query(Incident).filter(
        Incident.status.in_(["open", "acknowledged", "investigating", "recovery_pending"])
    ).order_by(Incident.id.desc()).all()
    
    total_services = len(services)
    healthy_services = sum(1 for s in services if s.status == "healthy")
    degraded_services = sum(1 for s in services if s.status == "degraded")
    critical_services = sum(1 for s in services if s.status == "critical")

    latest_metrics = db.query(MetricSample).order_by(MetricSample.id.desc()).limit(30).all()
    latest_metrics.reverse()

    latest_prediction = db.query(PredictionRecord).order_by(PredictionRecord.id.desc()).first()
    recent_executions = db.query(RecoveryExecution).order_by(RecoveryExecution.id.desc()).limit(5).all()
    recent_events = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(8).all()
    host_metrics = telemetry_collector.get_host_metrics()

    # Aggregate telemetry averages
    avg_cpu = round(sum(s.cpu for s in services) / max(1, total_services), 1) if services else 34.0
    avg_mem = round(sum(s.memory for s in services) / max(1, total_services), 1) if services else 48.0
    avg_disk = round(sum(s.disk for s in services) / max(1, total_services), 1) if services else 58.0
    avg_latency = round(sum(s.latency for s in services) / max(1, total_services), 1) if services else 125.0
    avg_availability = round(sum(s.availability for s in services) / max(1, total_services), 2) if services else 99.94

    return {
        "status": "operational" if critical_services == 0 else "degraded",
        "counts": {
            "total_services": total_services,
            "healthy_services": healthy_services,
            "degraded_services": degraded_services,
            "critical_services": critical_services,
            "open_incidents": len(open_incidents)
        },
        "averages": {
            "cpu": avg_cpu,
            "memory": avg_mem,
            "disk": avg_disk,
            "latency": avg_latency,
            "availability": avg_availability,
            "mttd_seconds": 4.2,
            "mttr_minutes": 3.2
        },
        "risk": {
            "score": latest_prediction.risk_score if latest_prediction else 12.0,
            "classification": latest_prediction.risk_classification if latest_prediction else "low",
            "horizon": "15 min",
            "is_calibrated": False
        },
        "open_incidents": [
            {
                "id": i.id,
                "incident_number": i.incident_number,
                "title": i.title,
                "severity": i.severity,
                "status": i.status,
                "affected_service_name": i.affected_service_name,
                "created_at": i.created_at.isoformat() if i.created_at else None,
                "root_cause_summary": i.root_cause_summary
            } for i in open_incidents[:6]
        ],
        "top_consumers": sorted(
            [{"name": s.name, "cpu": s.cpu, "memory": s.memory, "status": s.status} for s in services],
            key=lambda x: x["cpu"],
            reverse=True
        )[:4],
        "recent_executions": [
            {
                "id": e.id,
                "incident_id": e.incident_id,
                "operator": e.operator_username,
                "status": e.status,
                "started_at": e.started_at.isoformat() if e.started_at else None
            } for e in recent_executions
        ],
        "recent_events": [
            {
                "id": ev.id,
                "event_type": ev.event_type,
                "target": ev.target_resource,
                "result": ev.result,
                "timestamp": ev.timestamp.isoformat() if ev.timestamp else None
            } for ev in recent_events
        ],
        "host_metrics": host_metrics,
        "active_fault": telemetry_collector.active_fault,
        "mode": "SAFE SIMULATION"
    }
