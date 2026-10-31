import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.prediction import PredictionRecord

router = APIRouter(prefix="/predictions", tags=["Failure Prediction"])

@router.get("")
def list_predictions(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    records = db.query(PredictionRecord).order_by(PredictionRecord.id.desc()).limit(limit).all()
    out = []
    for p in records:
        try:
            drivers = json.loads(p.drivers_json) if p.drivers_json else {}
        except Exception:
            drivers = {}
        out.append({
            "id": p.id,
            "timestamp": p.timestamp.isoformat() if p.timestamp else None,
            "service_name": p.service_name,
            "risk_score": p.risk_score,
            "risk_classification": p.risk_classification,
            "horizon_minutes": p.horizon_minutes,
            "confidence_pct": p.confidence_pct,
            "drivers": drivers,
            "is_ml_calibrated": p.is_ml_calibrated,
            "explanation": p.explanation
        })
    return out

@router.get("/latest")
def get_latest_prediction(db: Session = Depends(get_db)):
    p = db.query(PredictionRecord).order_by(PredictionRecord.id.desc()).first()
    if not p:
        return {
            "risk_score": 12.0,
            "risk_classification": "low",
            "horizon_minutes": 15,
            "confidence_pct": 85.0,
            "drivers": {},
            "is_ml_calibrated": False,
            "explanation": "Nominal operations. Steady state baseline."
        }
    try:
        drivers = json.loads(p.drivers_json) if p.drivers_json else {}
    except Exception:
        drivers = {}
    return {
        "id": p.id,
        "timestamp": p.timestamp.isoformat() if p.timestamp else None,
        "service_name": p.service_name,
        "risk_score": p.risk_score,
        "risk_classification": p.risk_classification,
        "horizon_minutes": p.horizon_minutes,
        "confidence_pct": p.confidence_pct,
        "drivers": drivers,
        "is_ml_calibrated": p.is_ml_calibrated,
        "explanation": p.explanation
    }
