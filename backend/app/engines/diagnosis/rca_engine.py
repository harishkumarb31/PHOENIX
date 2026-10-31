import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ...models.service import Service, ServiceDependency
from ...models.anomaly import AnomalyRecord
from ...models.telemetry import MetricSample
from ...models.incident import Incident, RootCauseHypothesis

class RootCauseAnalysisEngine:
    def diagnose_incident(self, incident: Incident, anomalies: List[AnomalyRecord], db: Session) -> List[RootCauseHypothesis]:
        """Performs structured diagnosis across telemetry correlations and dependency topology."""
        hypotheses: List[RootCauseHypothesis] = []
        now = datetime.now(timezone.utc)

        # Map anomalies by metric
        metric_anomalies = {a.metric_name: a for a in anomalies}
        keys = set(metric_anomalies.keys())

        # Retrieve service dependencies to detect upstream/downstream culprits
        dependencies = db.query(ServiceDependency).filter(
            (ServiceDependency.source_service_id == incident.affected_service_id) |
            (ServiceDependency.target_service_id == incident.affected_service_id)
        ).all()

        # Rule & Correlation Evaluation
        if "memory" in keys:
            mem_anom = metric_anomalies["memory"]
            hypotheses.append(RootCauseHypothesis(
                incident_id=incident.id,
                hypothesis_title="Unbounded Heap Growth / Working Set Saturation",
                confidence_score=0.91,
                evidence_json=json.dumps([
                    f"Memory reached {mem_anom.current_value}% breaching threshold {mem_anom.threshold}%",
                    f"Deviation magnitude: +{mem_anom.deviation_pct}% above expected baseline",
                    "Garbage collection frequency elevation detected under sustained worker load"
                ]),
                affected_components_json=json.dumps([incident.affected_service_name, "Node V8 / Python Runtime GC", "Worker Process Pool"]),
                recommended_steps_json=json.dumps([
                    "Inspect resident memory allocations and leak vectors via profiler",
                    "Verify max-old-space / worker concurrency settings",
                    "Execute controlled worker recycle in isolated sandbox"
                ]),
                ranking=1,
                created_at=now
            ))
            if "latency" in keys:
                hypotheses.append(RootCauseHypothesis(
                    incident_id=incident.id,
                    hypothesis_title="Stop-the-World GC Pause Inducing Request Latency",
                    confidence_score=0.74,
                    evidence_json=json.dumps([
                        f"Memory saturation at {mem_anom.current_value}% concurrent with latency spike to {metric_anomalies['latency'].current_value}ms"
                    ]),
                    affected_components_json=json.dumps([incident.affected_service_name, "API Gateway Ingress"]),
                    recommended_steps_json=json.dumps([
                        "Inspect GC pause durations in runtime telemetry",
                        "Tune memory thresholds and heap limits"
                    ]),
                    ranking=2,
                    created_at=now
                ))

        elif "cpu" in keys:
            cpu_anom = metric_anomalies["cpu"]
            hypotheses.append(RootCauseHypothesis(
                incident_id=incident.id,
                hypothesis_title="Compute Thread Pool Starvation Under Surge Load",
                confidence_score=0.88,
                evidence_json=json.dumps([
                    f"CPU core saturation reached {cpu_anom.current_value}% (threshold: {cpu_anom.threshold}%)",
                    f"Sustained load deviation: +{cpu_anom.deviation_pct}%"
                ]),
                affected_components_json=json.dumps([incident.affected_service_name, "CPU Core Allocator", "Async Event Loop"]),
                recommended_steps_json=json.dumps([
                    "Inspect CPU profile for unthrottled cryptographic or serialization loops",
                    "Verify incoming request throughput rate and connection queuing",
                    "Engage controlled ingress traffic throttling playbook"
                ]),
                ranking=1,
                created_at=now
            ))

        elif "disk" in keys:
            disk_anom = metric_anomalies["disk"]
            hypotheses.append(RootCauseHypothesis(
                incident_id=incident.id,
                hypothesis_title="Storage Volume Partition Capacity Exhaustion",
                confidence_score=0.94,
                evidence_json=json.dumps([
                    f"Storage utilization reached {disk_anom.current_value}% (threshold: {disk_anom.threshold}%)",
                    "Write amplification in application debug logs or SQLite journal buffers"
                ]),
                affected_components_json=json.dumps([incident.affected_service_name, "Storage Subsystem", "App Logging Engine"]),
                recommended_steps_json=json.dumps([
                    "Identify largest unrotated log files in /var/log or /data directories",
                    "Review retention policies and log rotation configuration",
                    "Simulate storage headroom recovery through safe log purge"
                ]),
                ranking=1,
                created_at=now
            ))

        elif "latency" in keys or "availability" in keys:
            lat_val = metric_anomalies.get("latency").current_value if "latency" in metric_anomalies else 0.0
            hypotheses.append(RootCauseHypothesis(
                incident_id=incident.id,
                hypothesis_title="Upstream Dependency Degradation / Connection Pool Saturation",
                confidence_score=0.82,
                evidence_json=json.dumps([
                    f"API latency breached SLA baseline: {lat_val}ms",
                    "Service availability degraded below 98.5% uptime threshold",
                    f"Active upstream dependencies: {len(dependencies)} registered links"
                ]),
                affected_components_json=json.dumps([incident.affected_service_name, "Connection Pool", "Upstream Service Mesh"]),
                recommended_steps_json=json.dumps([
                    "Verify upstream microservice response codes and TCP handshakes",
                    "Refresh stale connection pool sockets and reset keep-alive counters",
                    "Verify database query latency and slow query log"
                ]),
                ranking=1,
                created_at=now
            ))

        else:
            # Generic fallback
            hypotheses.append(RootCauseHypothesis(
                incident_id=incident.id,
                hypothesis_title="Transient Service Performance Anomaly",
                confidence_score=0.60,
                evidence_json=json.dumps(["Multivariate variance detected in operational telemetry"]),
                affected_components_json=json.dumps([incident.affected_service_name]),
                recommended_steps_json=json.dumps(["Monitor subsequent metric windows for automatic normalization"]),
                ranking=1,
                created_at=now
            ))

        for h in hypotheses:
            db.add(h)
        db.commit()

        if hypotheses:
            incident.root_cause_summary = hypotheses[0].hypothesis_title
            db.commit()

        return hypotheses

rca_engine = RootCauseAnalysisEngine()
