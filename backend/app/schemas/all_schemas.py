from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = "System Operator"
    role: str = "sre_operator"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

# Telemetry
class TelemetryIngest(BaseModel):
    cpu: float = Field(ge=0.0, le=100.0)
    memory: float = Field(ge=0.0, le=100.0)
    disk: float = Field(ge=0.0, le=100.0)
    network: float = Field(default=25.0, ge=0.0)
    latency: float = Field(default=120.0, ge=0.0)
    availability: float = Field(default=99.9, ge=0.0, le=100.0)
    service: str = "external-ingress"

# Services
class ServiceCreate(BaseModel):
    name: str
    slug: str
    description: str = ""
    environment: str = "production"
    host: str = "localhost"
    port: int = 8000
    endpoint: str = "/health"

class ServiceUpdate(BaseModel):
    description: Optional[str] = None
    environment: Optional[str] = None
    monitoring_enabled: Optional[bool] = None

# Incident
class IncidentAcknowledge(BaseModel):
    notes: Optional[str] = "Acknowledged by operator"

class IncidentResolve(BaseModel):
    resolution_notes: str

# Recovery
class RecoveryPlanRequest(BaseModel):
    incident_id: int

class RecoveryApproveRequest(BaseModel):
    plan_id: int

class RecoveryExecuteRequest(BaseModel):
    plan_id: int
    approved: bool = True
    execution_mode: str = "simulation"

# Demo & Fault Controls
class FaultInjectRequest(BaseModel):
    type: str # cpu, memory, disk, latency, outage, clear
    target_service: Optional[str] = "api-gateway"

class TelemetryControlRequest(BaseModel):
    running: bool

# Assistant
class AssistantQueryRequest(BaseModel):
    query: str
