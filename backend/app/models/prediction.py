from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=now_utc, index=True)
    service_id = Column(Integer, nullable=True)
    service_name = Column(String(128), default="api-gateway")
    
    risk_score = Column(Float, nullable=False) # 0 to 100
    risk_classification = Column(String(32), default="low") # low, moderate, high, critical
    horizon_minutes = Column(Integer, default=15)
    confidence_pct = Column(Float, default=85.0)
    
    drivers_json = Column(Text, default="{}") # JSON representation of metric slopes and contributors
    is_ml_calibrated = Column(Boolean, default=False)
    explanation = Column(Text, default="")

