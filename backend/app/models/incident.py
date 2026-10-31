from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(32), unique=True, index=True, nullable=False) # e.g. INC-2026-0042
    title = Column(String(256), nullable=False)
    description = Column(Text, default="")
    severity = Column(String(32), default="medium") # low, medium, high, critical
    status = Column(String(32), default="open", index=True) # open, acknowledged, investigating, recovery_pending, recovering, resolved, closed
    
    anomaly_score = Column(Float, default=0.5)
    affected_service_id = Column(Integer, ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    affected_service_name = Column(String(128), default="api-gateway")
    
    root_cause_summary = Column(Text, default="")
    assigned_to = Column(String(64), nullable=True)
    acknowledged_by = Column(String(64), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, default="")
    recurrence_count = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=now_utc, index=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    # Relationships
    hypotheses = relationship("RootCauseHypothesis", back_populates="incident", cascade="all, delete-orphan")
    recovery_plans = relationship("RecoveryPlan", back_populates="incident", cascade="all, delete-orphan")


class RootCauseHypothesis(Base):
    __tablename__ = "root_cause_hypotheses"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    hypothesis_title = Column(String(256), nullable=False)
    confidence_score = Column(Float, default=0.75) # 0.0 to 1.0
    evidence_json = Column(Text, default="[]")
    affected_components_json = Column(Text, default="[]")
    recommended_steps_json = Column(Text, default="[]")
    ranking = Column(Integer, default=1) # 1 = primary, 2 = secondary...
    created_at = Column(DateTime, default=now_utc)

    incident = relationship("Incident", back_populates="hypotheses")
