import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ...models.telemetry import MetricSample
from ...models.anomaly import AnomalyRecord
from ...models.incident import Incident, RootCauseHypothesis

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    IsolationForest = None
    SKLEARN_AVAILABLE = False


class AnomalyDetector:
    def __init__(self):
        self.model_version = "iforest-v1.4.2-phoenix"
        self.iforest_model = None
        self.last_trained_at = None

    def _train_isolation_forest(self, samples: List[MetricSample]):
        """Trains or refreshes Isolation Forest model on historical samples."""
        if not SKLEARN_AVAILABLE or len(samples) < 30:
            return
        
        feature_matrix = []
        for s in samples:
            feature_matrix.append([s.cpu, s.memory, s.disk, s.latency, s.error_rate])
        
        X = np.array(feature_matrix)
        model = IsolationForest(n_estimators=60, contamination=0.08, random_state=42)
        model.fit(X)
        self.iforest_model = model
        self.last_trained_at = datetime.now(timezone.utc)

    def evaluate_sample(self, current: MetricSample, history: List[MetricSample], db: Session) -> List[AnomalyRecord]:
        """Runs multi-strategy detection across rule-based, statistical, and ML methods."""
        anomalies_found: List[AnomalyRecord] = []
        now = datetime.now(timezone.utc)

        # 1. Configurable Threshold Rule Checks
        threshold_rules = [
            ("cpu", current.cpu, 85.0, 70.0, "CPU Saturation Alert", "Compute resource utilization exceeded critical operational threshold (85.0%)"),
            ("memory", current.memory, 88.0, 75.0, "Memory Pressure Alert", "Memory consumption exceeded working-set ceiling (88.0%)"),
            ("disk", current.disk, 90.0, 80.0, "Storage Capacity Breach", "Storage partition utilization breached safe operating threshold (90.0%)"),
            ("latency", current.latency, 650.0, 200.0, "Elevated Response Latency", "API round-trip response latency exceeded SLA threshold (650ms)"),
            ("availability", current.availability, 98.5, 99.9, "Service Availability Degradation", "Service availability degraded below SLA baseline (98.5%)", "lt"),
            ("error_rate", current.error_rate, 0.05, 0.01, "Elevated HTTP Error Rate", "Application error rate breached 5.0% threshold")
        ]

        for rule in threshold_rules:
            metric_name = rule[0]
            val = rule[1]
            threshold = rule[2]
            expected = rule[3]
            label = rule[4]
            desc = rule[5]
            op = rule[6] if len(rule) > 6 else "gt"

            breached = (val < threshold) if op == "lt" else (val >= threshold)
            if breached:
                dev_pct = abs((val - expected) / max(0.001, expected)) * 100.0
                severity = "critical" if (val > threshold * 1.15 if op == "gt" else val < threshold * 0.95) else "high"
                
                anomalies_found.append(AnomalyRecord(
                    timestamp=now,
                    service_id=current.service_id,
                    service_name=current.service_name,
                    metric_name=metric_name,
                    current_value=round(val, 2),
                    expected_value=round(expected, 2),
                    threshold=round(threshold, 2),
                    deviation_pct=round(dev_pct, 1),
                    severity=severity,
                    detection_method="threshold_rule",
                    explanation=f"{label}: {desc}. Current: {val:.1f}, Expected: {expected:.1f}."
                ))

        # 2. Statistical Z-Score / Moving Average Detection
        if len(history) >= 8:
            metrics_to_check = ["cpu", "memory", "latency"]
            for m in metrics_to_check:
                hist_vals = [getattr(h, m) for h in history if getattr(h, m) is not None]
                if len(hist_vals) >= 6:
                    mean_val = float(np.mean(hist_vals))
                    std_val = float(np.std(hist_vals))
                    curr_val = float(getattr(current, m))

                    if std_val > 0.01:
                        z_score = (curr_val - mean_val) / std_val
                        # Sudden spike (> 2.8 standard deviations and significantly above baseline)
                        if z_score >= 2.8 and curr_val > mean_val * 1.3:
                            # Avoid duplicate if threshold already flagged the same metric
                            if not any(a.metric_name == m for a in anomalies_found):
                                dev_pct = ((curr_val - mean_val) / mean_val) * 100.0
                                anomalies_found.append(AnomalyRecord(
                                    timestamp=now,
                                    service_id=current.service_id,
                                    service_name=current.service_name,
                                    metric_name=m,
                                    current_value=round(curr_val, 2),
                                    expected_value=round(mean_val, 2),
                                    threshold=round(mean_val + 2.8 * std_val, 2),
                                    deviation_pct=round(dev_pct, 1),
                                    severity="high" if z_score < 4.0 else "critical",
                                    detection_method="statistical_zscore",
                                    explanation=f"Statistical Spike Detected on {m.upper()}: Value {curr_val:.1f} is {z_score:.2f} standard deviations above rolling mean ({mean_val:.1f})."
                                ))

        # 3. Machine Learning Detection via Isolation Forest
        if SKLEARN_AVAILABLE:
            if self.iforest_model is None or (self.last_trained_at and (now - self.last_trained_at).total_seconds() > 300):
                self._train_isolation_forest(history)
            
            if self.iforest_model is not None:
                feat = np.array([[current.cpu, current.memory, current.disk, current.latency, current.error_rate]])
                pred = self.iforest_model.predict(feat) # -1 is outlier
                score = float(self.iforest_model.decision_function(feat)[0]) # negative = anomalous
                if pred[0] == -1 and score < -0.08:
                    if not any(a.detection_method == "ml_isolation_forest" for a in anomalies_found):
                        anomalies_found.append(AnomalyRecord(
                            timestamp=now,
                            service_id=current.service_id,
                            service_name=current.service_name,
                            metric_name="cluster_multivariate",
                            current_value=round(abs(score) * 100, 1),
                            expected_value=0.0,
                            threshold=8.0,
                            deviation_pct=round(abs(score) * 200, 1),
                            severity="high" if score > -0.15 else "critical",
                            detection_method="ml_isolation_forest",
                            explanation=f"Unsupervised ML Anomaly ({self.model_version}): Multivariate isolation score {score:.3f} indicates significant distribution outlier across CPU, memory, and latency vectors."
                        ))

        # Persist anomalies and suppress duplicates
        persisted: List[AnomalyRecord] = []
        for anom in anomalies_found:
            # Check suppression within 45 seconds for same service and metric
            cutoff = now - timedelta(seconds=45)
            existing = db.query(AnomalyRecord).filter(
                AnomalyRecord.service_name == anom.service_name,
                AnomalyRecord.metric_name == anom.metric_name,
                AnomalyRecord.timestamp >= cutoff,
                AnomalyRecord.is_suppressed == False
            ).first()

            if existing:
                anom.is_suppressed = True
            
            db.add(anom)
            persisted.append(anom)

        db.commit()
        return [a for a in persisted if not a.is_suppressed]

anomaly_detector = AnomalyDetector()

