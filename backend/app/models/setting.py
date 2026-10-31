from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(256), default="")
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
