import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Set
from fastapi import WebSocket
from ..core.database import SessionLocal
from ..engines.monitoring.telemetry_collector import telemetry_collector
from ..engines.anomaly.detector import anomaly_detector
from ..engines.prediction.predictor import predictive_engine
from ..engines.diagnosis.rca_engine import rca_engine
from ..models.telemetry import MetricSample
from ..models.incident import Incident
from ..models.alert import AlertRule, Alert
from ..models.audit import AuditLog

logger = logging.getLogger("phoenix.worker")

class TelemetryWorker:
    def __init__(self):
        self.is_running = True
        self.active_websockets: Set[WebSocket] = set()

    async def register_ws(self, ws: WebSocket):
        await ws.accept()
        self.active_websockets.add(ws)

    def unregister_ws(self, ws: WebSocket):
        self.active_websockets.discard(ws)

    async def broadcast(self, data: dict):
        dead_sockets = set()
        for ws in self.active_websockets:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead_sockets.add(ws)
        for dead in dead_sockets:
            self.active_websockets.discard(dead)

    async def run_loop(self):
        incident_counter = 100
        while True:
            try:
                if self.is_running:
                    db = SessionLocal()
                    try:
                        # 1. Collect and store telemetry
                        new_samples = telemetry_collector.collect_and_store(db)
                        
                        # 2. Retrieve recent history
                        history = db.query(MetricSample).order_by(MetricSample.id.desc()).limit(30).all()
                        history.reverse()

                        # 3. Anomaly Evaluation
                        for sample in new_samples:
                            svc_history = [h for h in history if h.service_name == sample.service_name]
                            detected_anomalies = anomaly_detector.evaluate_sample(sample, svc_history, db)

                            if detected_anomalies:
                                # Check if open incident exists for this service
                                existing_inc = db.query(Incident).filter(
                                    Incident.affected_service_name == sample.service_name,
                                    Incident.status.in_(["open", "acknowledged", "investigating", "recovery_pending"])
                                ).first()

                                if not existing_inc:
                                    incident_counter += 1
                                    primary_anom = detected_anomalies[0]
                                    inc = Incident(
                                        incident_number=f"INC-{datetime.now().year}-{incident_counter:04d}",
                                        title=primary_anom.explanation[:120],
                                        description=primary_anom.explanation,
                                        severity=primary_anom.severity,
                                        status="open",
                                        anomaly_score=round(primary_anom.deviation_pct / 100.0, 2),
                                        affected_service_id=sample.service_id,
                                        affected_service_name=sample.service_name,
                                        created_at=datetime.now(timezone.utc)
                                    )
                                    db.add(inc)
                                    db.commit()

                                    # Link anomaly to incident
                                    for an in detected_anomalies:
                                        an.incident_id = inc.id
                                    db.commit()

                                    # Run RCA diagnosis
                                    rca_engine.diagnose_incident(inc, detected_anomalies, db)

                                    # Log audit
                                    db.add(AuditLog(
                                        actor_username="anomaly_engine",
                                        actor_role="system",
                                        event_type="incident_created",
                                        target_resource=f"{inc.incident_number} / {sample.service_name}",
                                        result="success",
                                        metadata_json=json.dumps({"title": inc.title, "severity": inc.severity})
                                    ))
                                    db.commit()

                        # 4. Predict failure risk
                        prediction = predictive_engine.record_prediction(db, history, "api-gateway")

                        # 5. Broadcast live metrics to WebSockets
                        if self.active_websockets and new_samples:
                            latest_sample = new_samples[0]
                            host_telemetry = telemetry_collector.get_host_metrics()
                            open_incidents_count = db.query(Incident).filter(
                                Incident.status.in_(["open", "acknowledged", "investigating", "recovery_pending"])
                            ).count()

                            payload = {
                                "type": "telemetry_tick",
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                "latest_metric": {
                                    "cpu": latest_sample.cpu,
                                    "memory": latest_sample.memory,
                                    "disk": latest_sample.disk,
                                    "latency": latest_sample.latency,
                                    "availability": latest_sample.availability,
                                    "service": latest_sample.service_name
                                },
                                "host_metrics": host_telemetry,
                                "risk_score": prediction.risk_score,
                                "risk_classification": prediction.risk_classification,
                                "open_incidents_count": open_incidents_count,
                                "active_fault": telemetry_collector.active_fault
                            }
                            await self.broadcast(payload)

                    except Exception as ex:
                        logger.error(f"Error in telemetry loop cycle: {ex}", exc_info=True)
                    finally:
                        db.close()

            except Exception as e:
                logger.error(f"Unexpected worker error: {e}", exc_info=True)

            await asyncio.sleep(3.0)

telemetry_worker = TelemetryWorker()

