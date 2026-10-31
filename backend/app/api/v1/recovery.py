import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import get_current_user_optional, require_role
from ...models.recovery import RecoveryPlaybook, RecoveryPlan, RecoveryExecution, RecoveryVerification
from ...models.incident import Incident
from ...models.user import User
from ...engines.recovery.recovery_engine import recovery_engine
from ...engines.recovery.verifier import verification_engine
from ...schemas.all_schemas import RecoveryPlanRequest, RecoveryApproveRequest, RecoveryExecuteRequest

router = APIRouter(prefix="/recovery", tags=["Recovery Intelligence & Execution"])

@router.get("/playbooks")
def list_playbooks(db: Session = Depends(get_db)):
    recovery_engine.seed_playbooks(db)
    pbs = db.query(RecoveryPlaybook).all()
    out = []
    for p in pbs:
        try:
            steps = json.loads(p.steps_json)
        except Exception:
            steps = []
        out.append({
            "id": p.id,
            "playbook_code": p.playbook_code,
            "title": p.title,
            "target_issue": p.target_issue,
            "description": p.description,
            "steps": steps,
            "action_handler": p.action_handler,
            "estimated_impact": p.estimated_impact,
            "rollback_procedure": p.rollback_procedure,
            "safety_tier": p.safety_tier
        })
    return out

@router.post("/plans")
def create_recovery_plan(payload: RecoveryPlanRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    plan = recovery_engine.generate_plan_for_incident(incident, db)
    try:
        steps = json.loads(plan.steps_json)
    except Exception:
        steps = []
        
    return {
        "id": plan.id,
        "incident_id": plan.incident_id,
        "playbook_id": plan.playbook_id,
        "title": plan.title,
        "steps": steps,
        "action_type": plan.action_type,
        "estimated_impact": plan.estimated_impact,
        "risk_assessment": plan.risk_assessment,
        "rollback_plan": plan.rollback_plan,
        "requires_approval": plan.requires_approval,
        "status": plan.status
    }

@router.post("/plans/{plan_id}/approve")
def approve_recovery_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")
    
    operator = current_user.username if current_user else "sre_operator"
    plan.status = "approved"
    plan.approved_by = operator
    db.commit()
    return {"message": "Recovery plan approved for controlled execution", "plan_id": plan_id, "status": plan.status}

@router.post("/plans/{plan_id}/execute")
def execute_recovery_plan(
    plan_id: int,
    payload: RecoveryExecuteRequest,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")
    
    if not payload.approved and plan.status != "approved":
        raise HTTPException(status_code=403, detail="Operator approval is required before execution")

    operator = current_user.username if current_user else "sre_operator"
    execution = recovery_engine.execute_recovery_plan(plan, operator, db, approved=True)
    
    # Automatically run verification to validate post-remediation telemetry!
    verification = verification_engine.verify_execution(execution, db)

    try:
        logs = json.loads(execution.logs_json)
    except Exception:
        logs = []

    return {
        "execution_id": execution.id,
        "plan_id": execution.plan_id,
        "incident_id": execution.incident_id,
        "status": execution.status,
        "logs": logs,
        "verification": {
            "id": verification.id,
            "status": verification.status,
            "notes": verification.verification_notes,
            "verified_at": verification.verified_at.isoformat() if verification.verified_at else None
        }
    }

@router.get("/executions")
def list_executions(db: Session = Depends(get_db)):
    execs = db.query(RecoveryExecution).order_by(RecoveryExecution.id.desc()).limit(20).all()
    out = []
    for e in execs:
        try:
            logs = json.loads(e.logs_json)
        except Exception:
            logs = []
        out.append({
            "id": e.id,
            "plan_id": e.plan_id,
            "incident_id": e.incident_id,
            "operator_username": e.operator_username,
            "execution_mode": e.execution_mode,
            "status": e.status,
            "logs": logs,
            "started_at": e.started_at.isoformat() if e.started_at else None,
            "completed_at": e.completed_at.isoformat() if e.completed_at else None
        })
    return out

@router.post("/executions/{execution_id}/verify")
def verify_execution_manually(execution_id: int, db: Session = Depends(get_db)):
    execution = db.query(RecoveryExecution).filter(RecoveryExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    ver = verification_engine.verify_execution(execution, db)
    return {
        "id": ver.id,
        "execution_id": ver.execution_id,
        "incident_id": ver.incident_id,
        "status": ver.status,
        "notes": ver.verification_notes,
        "verified_at": ver.verified_at.isoformat() if ver.verified_at else None
    }
