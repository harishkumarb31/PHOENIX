from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services.report_generator import report_generator

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/summary")
def get_analytics_summary(days: int = Query(7, ge=1, le=90), db: Session = Depends(get_db)):
    return report_generator.generate_reliability_summary(db, days=days)

@router.get("/export-csv", response_class=PlainTextResponse)
def export_csv(db: Session = Depends(get_db)):
    csv_data = report_generator.export_incidents_csv(db)
    return PlainTextResponse(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=phoenix_incident_report.csv"}
    )
