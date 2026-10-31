from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from ..core.database import Base

def now_utc():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), default="System Operator")
    role = Column(String(32), default="sre_operator", nullable=False) # super_admin, infra_admin, sre_operator, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)
    last_login = Column(DateTime, nullable=True)
