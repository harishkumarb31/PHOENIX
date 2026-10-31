from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Index
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class AnomalyRecord(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=now_utc, index=True)
    service_id = Column(Integer, nullable=True, index=True)
    service_name = Column(String(128), default="api-gateway", index=True)
    
    metric_name = Column(String(64), nullable=False) # cpu, memory, disk, latency, availability, error_rate
    current_value = Column(Float, nullable=False)
    expected_value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    
    severity = Column(String(32), default="medium") # low, medium, high, critical
    detection_method = Column(String(64), default="statistical_zscore") # threshold_rule, statistical_zscore, trend_slope, ml_isolation_forest
    explanation = Column(Text, nullable=False)
    is_suppressed = Column(Boolean, default=False)
    incident_id = Column(Integer, nullable=True, index=True)

