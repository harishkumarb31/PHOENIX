from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=now_utc, index=True)
    actor_username = Column(String(64), default="system")
    actor_role = Column(String(32), default="system")
    event_type = Column(String(64), nullable=False, index=True) # auth, telemetry, incident, recovery_plan, recovery_approve, recovery_execute, alert_rule, admin
    target_resource = Column(String(128), default="")
    result = Column(String(32), default="success") # success, failed, denied
    metadata_json = Column(Text, default="{}")
