from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.recovery import RecoveryPlan
from ...models.telemetry import MetricSample
from ...engines.recovery.recovery_engine import recovery_engine

router = APIRouter(prefix="/sandbox", tags=["Recovery Sandbox"])

@router.post("/simulate/{plan_id}")
def simulate_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")
    
    # Get latest metric sample for affected service
    svc_name = plan.incident.affected_service_name if plan.incident else "api-gateway"
    latest_metric = db.query(MetricSample).filter(MetricSample.service_name == svc_name).order_by(MetricSample.id.desc()).first()

    current_telemetry = {
        "cpu": latest_metric.cpu if latest_metric else 88.5,
        "memory": latest_metric.memory if latest_metric else 92.4,
        "disk": latest_metric.disk if latest_metric else 68.0,
        "latency": latest_metric.latency if latest_metric else 750.0,
        "availability": latest_metric.availability if latest_metric else 98.2,
        "error_rate": latest_metric.error_rate if latest_metric else 0.05,
        "throughput": latest_metric.throughput if latest_metric else 280.0
    }

    result = recovery_engine.simulate_plan_in_sandbox(plan, current_telemetry)
    return result
