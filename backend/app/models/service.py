from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, index=True, nullable=False)
    slug = Column(String(64), unique=True, index=True, nullable=False)
    description = Column(String(256), default="")
    environment = Column(String(32), default="production") # production, staging, dev
    host = Column(String(128), default="localhost")
    port = Column(Integer, default=8000)
    endpoint = Column(String(256), default="/health")
    
    status = Column(String(32), default="healthy") # healthy, degraded, critical, offline
    health_score = Column(Float, default=99.5)
    
    # Latest telemetry snapshot
    cpu = Column(Float, default=24.0)
    memory = Column(Float, default=42.0)
    disk = Column(Float, default=52.0)
    latency = Column(Float, default=120.0)
    availability = Column(Float, default=99.9)
    error_rate = Column(Float, default=0.01)
    throughput = Column(Float, default=450.0)
    
    monitoring_enabled = Column(Boolean, default=True)
    last_heartbeat = Column(DateTime, default=now_utc)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    # Dependencies where this service is the downstream consumer
    outgoing_dependencies = relationship(
        "ServiceDependency",
        foreign_keys="ServiceDependency.source_service_id",
        back_populates="source_service",
        cascade="all, delete-orphan"
    )
    # Dependencies where this service is the upstream provider
    incoming_dependencies = relationship(
        "ServiceDependency",
        foreign_keys="ServiceDependency.target_service_id",
        back_populates="target_service",
        cascade="all, delete-orphan"
    )


class ServiceDependency(Base):
    __tablename__ = "service_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    source_service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    target_service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    dependency_type = Column(String(32), default="http") # http, grpc, database, queue
    is_critical = Column(Boolean, default=True)
    description = Column(String(256), default="")

    source_service = relationship("Service", foreign_keys=[source_service_id], back_populates="outgoing_dependencies")
    target_service = relationship("Service", foreign_keys=[target_service_id], back_populates="incoming_dependencies")

