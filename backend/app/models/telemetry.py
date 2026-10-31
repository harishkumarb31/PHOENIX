from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Index
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class MetricSample(Base):
    __tablename__ = "metric_samples"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=now_utc, index=True)
    service_id = Column(Integer, nullable=True, index=True)
    service_name = Column(String(128), default="api-gateway", index=True)
    
    cpu = Column(Float, nullable=False)
    memory = Column(Float, nullable=False)
    disk = Column(Float, nullable=False)
    network = Column(Float, default=25.0)
    latency = Column(Float, default=110.0)
    availability = Column(Float, default=100.0)
    error_rate = Column(Float, default=0.0)
    throughput = Column(Float, default=300.0)
    
    source = Column(String(32), default="local_collector") # psutil_host, synthetic_cluster, external_agent
    is_simulated = Column(Boolean, default=True)

    __table_args__ = (
        Index("idx_service_ts", "service_name", "timestamp"),
    )

