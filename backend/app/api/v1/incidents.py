import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import get_current_user_optional
from ...models.incident import Incident, RootCauseHypothesis
from ...models.user import User
from ...models.audit import AuditLog
from ...schemas.all_schemas import IncidentAcknowledge, IncidentResolve

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("")
def list_incidents(
    status_filter: str = Query("all"),
    severity: str = Query("all"),
    service: str = Query("all"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status_filter != "all":
        query = query.filter(Incident.status == status_filter)
    if severity != "all":
        query = query.filter(Incident.severity == severity)
    if service != "all":
        query = query.filter(Incident.affected_service_name == service)
        
    records = query.order_by(Incident.id.desc()).limit(limit).all()
    return [
        {
            "id": i.id,
            "incident_number": i.incident_number,
            "title": i.title,
            "description": i.description,
            "severity": i.severity,
            "status": i.status,
            "anomaly_score": i.anomaly_score,
            "affected_service_name": i.affected_service_name,
            "root_cause_summary": i.root_cause_summary,
            "assigned_to": i.assigned_to,
            "acknowledged_by": i.acknowledged_by,
            "acknowledged_at": i.acknowledged_at.isoformat() if i.acknowledged_at else None,
            "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
            "resolution_notes": i.resolution_notes,
            "recurrence_count": i.recurrence_count,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in records
    ]

@router.get("/{incident_id}")
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    hypotheses = db.query(RootCauseHypothesis).filter(RootCauseHypothesis.incident_id == incident_id).all()
    hypotheses_data = []
    for h in hypotheses:
        try:
            ev = json.loads(h.evidence_json)
        except Exception:
            ev = []
        try:
            comps = json.loads(h.affected_components_json)
        except Exception:
            comps = []
        try:
            steps = json.loads(h.recommended_steps_json)
        except Exception:
            steps = []
        hypotheses_data.append({
            "id": h.id,
            "title": h.hypothesis_title,
            "confidence_score": h.confidence_score,
            "evidence": ev,
            "affected_components": comps,
            "recommended_steps": steps,
            "ranking": h.ranking
        })

    return {
        "id": incident.id,
        "incident_number": incident.incident_number,
        "title": incident.title,
        "description": incident.description,
        "severity": incident.severity,
        "status": incident.status,
        "anomaly_score": incident.anomaly_score,
        "affected_service_name": incident.affected_service_name,
        "root_cause_summary": incident.root_cause_summary,
        "assigned_to": incident.assigned_to,
        "acknowledged_by": incident.acknowledged_by,
        "acknowledged_at": incident.acknowledged_at.isoformat() if incident.acknowledged_at else None,
        "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None,
        "resolution_notes": incident.resolution_notes,
        "recurrence_count": incident.recurrence_count,
        "created_at": incident.created_at.isoformat() if incident.created_at else None,
        "hypotheses": hypotheses_data
    }

@router.post("/{incident_id}/acknowledge")
def acknowledge_incident(
    incident_id: int,
    payload: IncidentAcknowledge,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    operator = current_user.username if current_user else "sre_operator"
    incident.status = "acknowledged"
    incident.acknowledged_by = operator
    incident.acknowledged_at = datetime.now(timezone.utc)
    
    db.add(AuditLog(
        actor_username=operator,
        actor_role="sre_operator",
        event_type="incident_acknowledged",
        target_resource=f"Incident #{incident.id} ({incident.incident_number})",
        result="success",
        metadata_json=json.dumps({"notes": payload.notes})
    ))
    db.commit()
    return {"message": "Incident acknowledged successfully", "incident_id": incident_id, "status": incident.status}

@router.post("/{incident_id}/resolve")
def resolve_incident(
    incident_id: int,
    payload: IncidentResolve,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    operator = current_user.username if current_user else "sre_operator"
    incident.status = "resolved"
    incident.resolved_at = datetime.now(timezone.utc)
    incident.resolution_notes = payload.resolution_notes
    
    db.add(AuditLog(
        actor_username=operator,
        actor_role="sre_operator",
        event_type="incident_resolved",
        target_resource=f"Incident #{incident.id} ({incident.incident_number})",
        result="success",
        metadata_json=json.dumps({"resolution_notes": payload.resolution_notes})
    ))
    db.commit()
    return {"message": "Incident marked as resolved", "incident_id": incident_id, "status": incident.status}
