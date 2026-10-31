import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.audit import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit and Activity Trail"])

@router.get("")
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    event_type: str = Query("all"),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if event_type != "all":
        query = query.filter(AuditLog.event_type == event_type)
    logs = query.order_by(AuditLog.id.desc()).limit(limit).all()
    
    out = []
    for l in logs:
        try:
            meta = json.loads(l.metadata_json) if l.metadata_json else {}
        except Exception:
            meta = {}
        out.append({
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "actor_username": l.actor_username,
            "actor_role": l.actor_role,
            "event_type": l.event_type,
            "target_resource": l.target_resource,
            "result": l.result,
            "metadata": meta
        })
    return out
