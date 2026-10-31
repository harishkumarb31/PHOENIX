from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    service_name = Column(String(128), default="*")
    metric_name = Column(String(64), nullable=False) # cpu, memory, disk, latency, availability, error_rate
    condition = Column(String(16), default="gt") # gt, lt, gte, lte, eq
    threshold = Column(Float, nullable=False)
    severity = Column(String(32), default="high") # low, medium, high, critical
    duration_seconds = Column(Integer, default=60)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    service_name = Column(String(128), default="api-gateway")
    title = Column(String(256), nullable=False)
    message = Column(Text, default="")
    severity = Column(String(32), default="high") # low, medium, high, critical
    status = Column(String(32), default="active") # active, acknowledged, resolved
    
    created_at = Column(DateTime, default=now_utc, index=True)
    acknowledged_by = Column(String(64), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
