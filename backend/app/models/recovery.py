from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class RecoveryPlaybook(Base):
    __tablename__ = "recovery_playbooks"

    id = Column(Integer, primary_key=True, index=True)
    playbook_code = Column(String(64), unique=True, index=True, nullable=False) # e.g. PBK-CPU-THROTTLE, PBK-MEM-RECYCLE
    title = Column(String(128), nullable=False)
    target_issue = Column(String(64), nullable=False) # cpu, memory, disk, latency, availability
    description = Column(Text, nullable=False)
    steps_json = Column(Text, nullable=False) # list of execution steps
    action_handler = Column(String(64), nullable=False)
    estimated_impact = Column(String(32), default="Low") # Low, Medium, High
    rollback_procedure = Column(Text, nullable=False)
    safety_tier = Column(String(32), default="Tier-1 Safe") # Tier-1 Safe (Dry-run/throttle), Tier-2 Guarded (Restart), Tier-3 Critical (Data)
    is_active = Column(Boolean, default=True)


class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    playbook_id = Column(Integer, ForeignKey("recovery_playbooks.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(256), nullable=False)
    steps_json = Column(Text, nullable=False)
    action_type = Column(String(64), nullable=False)
    estimated_impact = Column(String(32), default="Medium")
    risk_assessment = Column(Text, default="")
    rollback_plan = Column(Text, default="")
    requires_approval = Column(Boolean, default=True)
    
    status = Column(String(32), default="draft") # draft, approved, rejected, executing, completed, failed
    created_at = Column(DateTime, default=now_utc)
    approved_by = Column(String(64), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    incident = relationship("Incident", back_populates="recovery_plans")
    executions = relationship("RecoveryExecution", back_populates="plan", cascade="all, delete-orphan")


class RecoveryExecution(Base):
    __tablename__ = "recovery_executions"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("recovery_plans.id", ondelete="CASCADE"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    operator_username = Column(String(64), default="system")
    execution_mode = Column(String(32), default="simulation") # simulation, sandbox, controlled_live
    status = Column(String(32), default="in_progress") # in_progress, succeeded, failed, rolled_back
    logs_json = Column(Text, default="[]")
    
    started_at = Column(DateTime, default=now_utc)
    completed_at = Column(DateTime, nullable=True)
    
    plan = relationship("RecoveryPlan", back_populates="executions")
    verifications = relationship("RecoveryVerification", back_populates="execution", cascade="all, delete-orphan")


class RecoveryVerification(Base):
    __tablename__ = "recovery_verifications"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("recovery_executions.id", ondelete="CASCADE"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(String(32), default="verified_healthy") # verified_healthy, partially_recovered, recovery_failed, monitoring_required
    telemetry_before_json = Column(Text, default="{}")
    telemetry_after_json = Column(Text, default="{}")
    verification_notes = Column(Text, default="")
    verified_at = Column(DateTime, default=now_utc)
    
    execution = relationship("RecoveryExecution", back_populates="verifications")

