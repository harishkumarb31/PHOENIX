import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ...models.telemetry import MetricSample
from ...models.prediction import PredictionRecord

class PredictiveFailureEngine:
    def evaluate_risk(self, history: List[MetricSample], service_name: str = "api-gateway") -> Dict[str, Any]:
        """Calculates future infrastructure degradation probability and explicit risk drivers."""
        if len(history) < 3:
            return {
                "risk_score": 12.0,
                "risk_classification": "low",
                "horizon_minutes": 15,
                "confidence_pct": 50.0,
                "drivers": {"message": "Insufficient telemetry history (requires at least 3 samples)"},
                "is_ml_calibrated": False,
                "explanation": "Baseline state. Accumulating operational telemetry samples for trend derivation."
            }

        recent = history[-10:] if len(history) >= 10 else history
        first = recent[0]
        last = recent[-1]
        delta_n = max(1, len(recent) - 1)

        # First derivatives (slopes per sample)
        cpu_slope = max(0.0, (last.cpu - first.cpu) / delta_n)
        mem_slope = max(0.0, (last.memory - first.memory) / delta_n)
        disk_slope = max(0.0, (last.disk - first.disk) / delta_n)
        lat_slope = max(0.0, (last.latency - first.latency) / delta_n)
        err_slope = max(0.0, (last.error_rate - first.error_rate) / delta_n)

        # Proximity to saturation ceiling
        proximity_cpu = last.cpu / 100.0
        proximity_mem = last.memory / 100.0
        proximity_disk = last.disk / 100.0
        proximity_lat = min(1.0, last.latency / 1200.0)
        proximity_err = min(1.0, last.error_rate / 0.10)

        max_proximity = max(proximity_cpu, proximity_mem, proximity_disk, proximity_lat, proximity_err)

        # Trajectory acceleration
        combined_velocity = (cpu_slope * 0.35 + mem_slope * 0.35 + (lat_slope / 15.0) * 0.2 + err_slope * 100.0 * 0.1)

        # Heuristic Risk Score (0-100)
        base_risk = (max_proximity ** 1.6) * 65.0
        velocity_penalty = min(35.0, combined_velocity * 4.5)
        raw_risk = base_risk + velocity_penalty
        risk_score = round(max(5.0, min(99.0, raw_risk)), 1)

        if risk_score >= 75.0:
            classification = "critical"
        elif risk_score >= 50.0:
            classification = "high"
        elif risk_score >= 25.0:
            classification = "moderate"
        else:
            classification = "low"

        # Explicit Risk Drivers
        drivers = {
            "cpu_rate_pct_sample": round(cpu_slope, 2),
            "memory_rate_pct_sample": round(mem_slope, 2),
            "disk_rate_pct_sample": round(disk_slope, 2),
            "latency_rate_ms_sample": round(lat_slope, 1),
            "max_saturation_component": (
                "CPU" if max_proximity == proximity_cpu else
                "Memory" if max_proximity == proximity_mem else
                "Disk" if max_proximity == proximity_disk else
                "Latency" if max_proximity == proximity_lat else "Error Rate"
            ),
            "primary_driver_detail": (
                f"Memory accelerating at +{mem_slope:.1f}%/interval towards 100% threshold" if mem_slope > 1.2 else
                f"CPU demand growing rapidly at +{cpu_slope:.1f}%/interval" if cpu_slope > 2.0 else
                f"Latency degrading at +{lat_slope:.1f}ms/interval" if lat_slope > 25.0 else
                "Telemetry operating in steady-state equilibrium"
            )
        }

        # Projected time-to-exhaustion (minutes) if trending upward
        if mem_slope > 0.5 and last.memory < 98:
            intervals_to_oom = (100.0 - last.memory) / mem_slope
            drivers["projected_time_to_saturation_min"] = round((intervals_to_oom * 3.0) / 60.0, 1)

        confidence = round(min(94.0, 65.0 + len(recent) * 2.8), 1)

        explanation = (
            f"Risk index evaluated at {risk_score:.1f}% ({classification.upper()}). "
            f"Primary stress vector: {drivers['max_saturation_component']}. "
            f"{drivers['primary_driver_detail']}."
        )

        return {
            "risk_score": risk_score,
            "risk_classification": classification,
            "horizon_minutes": 15,
            "confidence_pct": confidence,
            "drivers": drivers,
            "is_ml_calibrated": False, # Explicitly transparent
            "explanation": explanation
        }

    def record_prediction(self, db: Session, history: List[MetricSample], service_name: str = "api-gateway") -> PredictionRecord:
        eval_result = self.evaluate_risk(history, service_name)
        record = PredictionRecord(
            timestamp=datetime.now(timezone.utc),
            service_name=service_name,
            risk_score=eval_result["risk_score"],
            risk_classification=eval_result["risk_classification"],
            horizon_minutes=eval_result["horizon_minutes"],
            confidence_pct=eval_result["confidence_pct"],
            drivers_json=json.dumps(eval_result["drivers"]),
            is_ml_calibrated=eval_result["is_ml_calibrated"],
            explanation=eval_result["explanation"]
        )
        db.add(record)
        db.commit()
        return record

predictive_engine = PredictiveFailureEngine()

