from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.alert import Alert, AlertRule
from ..models.audit import AuditLog

class NotificationService:
    def create_alert(self, db: Session, service_name: str, title: str, message: str, severity: str = "high") -> Alert:
        now = datetime.now(timezone.utc)
        alert = Alert(
            service_name=service_name,
            title=title,
            message=message,
            severity=severity,
            status="active",
            created_at=now
        )
        db.add(alert)
        db.commit()
        return alert

    def acknowledge_alert(self, db: Session, alert_id: int, operator_username: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "acknowledged"
        alert.acknowledged_by = operator_username
        alert.acknowledged_at = datetime.now(timezone.utc)
        
        db.add(AuditLog(
            actor_username=operator_username,
            actor_role="operator",
            event_type="alert_acknowledged",
            target_resource=f"Alert #{alert_id}",
            result="success"
        ))
        db.commit()
        return alert

notification_service = NotificationService()
