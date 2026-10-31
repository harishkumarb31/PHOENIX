from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.anomaly import AnomalyRecord

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.get("")
def list_anomalies(
    limit: int = Query(50, ge=1, le=200),
    suppressed: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyRecord)
    if not suppressed:
        query = query.filter(AnomalyRecord.is_suppressed == False)
    records = query.order_by(AnomalyRecord.id.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "service_name": a.service_name,
            "metric_name": a.metric_name,
            "current_value": a.current_value,
            "expected_value": a.expected_value,
            "threshold": a.threshold,
            "deviation_pct": a.deviation_pct,
            "severity": a.severity,
            "detection_method": a.detection_method,
            "explanation": a.explanation,
            "is_suppressed": a.is_suppressed,
            "incident_id": a.incident_id
        }
        for a in records
    ]
