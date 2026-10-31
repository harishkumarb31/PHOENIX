from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import get_current_user_optional
from ...models.alert import Alert, AlertRule
from ...models.user import User
from ...services.notification_service import notification_service

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("")
def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.id.desc()).limit(50).all()
    return [
        {
            "id": a.id,
            "rule_id": a.rule_id,
            "service_name": a.service_name,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "acknowledged_by": a.acknowledged_by,
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None
        }
        for a in alerts
    ]

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    operator = current_user.username if current_user else "sre_operator"
    alert = notification_service.acknowledge_alert(db, alert_id, operator)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged", "alert_id": alert_id, "status": alert.status}

@router.get("/rules")
def list_alert_rules(db: Session = Depends(get_db)):
    rules = db.query(AlertRule).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "service_name": r.service_name,
            "metric_name": r.metric_name,
            "condition": r.condition,
            "threshold": r.threshold,
            "severity": r.severity,
            "duration_seconds": r.duration_seconds,
            "is_enabled": r.is_enabled
        }
        for r in rules
    ]
