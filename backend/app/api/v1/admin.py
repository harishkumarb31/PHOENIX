from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import require_role, hash_password, get_current_user_optional
from ...models.user import User
from ...models.setting import SystemSetting
from ...models.audit import AuditLog
from ...engines.monitoring.telemetry_collector import telemetry_collector
from ...workers.telemetry_worker import telemetry_worker
from ...schemas.all_schemas import UserCreate, UserResponse, FaultInjectRequest, TelemetryControlRequest

router = APIRouter(prefix="/admin", tags=["Administration & Security"])

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]

@router.post("/users", dependencies=[Depends(require_role("super_admin"))])
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this username or email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "user_id": user.id, "username": user.username}

@router.post("/demo/fault")
def inject_fault(payload: FaultInjectRequest, db: Session = Depends(get_db)):
    valid_faults = ["cpu", "memory", "disk", "latency", "outage", "clear"]
    if payload.type not in valid_faults:
        raise HTTPException(status_code=400, detail=f"Invalid fault type. Must be one of {valid_faults}")
    
    telemetry_collector.set_fault(payload.type, payload.target_service)
    
    db.add(AuditLog(
        actor_username="operator",
        actor_role="sre_operator",
        event_type="fault_scenario_injected",
        target_resource=payload.target_service or "cluster",
        result="success",
        metadata_json=f'{{"fault": "{payload.type}"}}'
    ))
    db.commit()

    return {
        "status": "success",
        "active_fault": telemetry_collector.active_fault,
        "target_service": telemetry_collector.fault_target_service
    }

@router.post("/demo/control")
def toggle_telemetry(payload: TelemetryControlRequest, db: Session = Depends(get_db)):
    telemetry_worker.is_running = payload.running
    db.add(AuditLog(
        actor_username="operator",
        actor_role="sre_operator",
        event_type="telemetry_stream_control",
        target_resource="telemetry_worker",
        result="success",
        metadata_json=f'{{"running": {str(payload.running).lower()}}}'
    ))
    db.commit()
    return {"running": telemetry_worker.is_running}
