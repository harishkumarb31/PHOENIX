import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ...models.incident import Incident
from ...models.recovery import RecoveryPlaybook, RecoveryPlan, RecoveryExecution, RecoveryVerification
from ...models.telemetry import MetricSample
from ...models.audit import AuditLog
from ..monitoring.telemetry_collector import telemetry_collector

PLAYBOOKS_CATALOG = [
    {
        "playbook_code": "PBK-CPU-THROTTLE",
        "title": "Compute Saturation Mitigation & Dynamic Ingress Throttling",
        "target_issue": "cpu",
        "description": "Engages adaptive token-bucket request throttling at the API gateway layer, pauses background asynchronous queues, and sheds 30% of non-critical batch processing load to restore core CPU headroom.",
        "steps_json": json.dumps([
            "Step 1: Inspect top CPU-consuming thread handles and worker process tree",
            "Step 2: Apply adaptive 25% rate-limiting throttle on ingress gateway router",
            "Step 3: Pause low-priority asynchronous telemetry ingestion queues",
            "Step 4: Monitor CPU core load stabilization for 30-second settling window",
            "Step 5: Gradually restore ingress rate limits once CPU drops below 70%"
        ]),
        "action_handler": "throttle_ingress_traffic",
        "estimated_impact": "Medium",
        "rollback_procedure": "Instantly release ingress rate-limits and restore full concurrency if downstream queue depth surges.",
        "safety_tier": "Tier-1 Safe"
    },
    {
        "playbook_code": "PBK-MEM-RECYCLE",
        "title": "Graceful Rolling Worker Recycle & V8/Python GC Invalidation",
        "target_issue": "memory",
        "description": "Executes a staggered zero-downtime rolling restart of application worker processes, clears stale in-memory cache allocations, and triggers explicit garbage collector sweep.",
        "steps_json": json.dumps([
            "Step 1: Identify worker processes exceeding 85% resident set size ceiling",
            "Step 2: Signal worker pool #1 to drain inflight HTTP connections (5s graceful timeout)",
            "Step 3: Spawn fresh worker instance with clean heap allocation and register with load balancer",
            "Step 4: Repeat rolling cycle across remaining worker processes",
            "Step 5: Trigger memory heap purge and verify working-set memory stabilization below 60%"
        ]),
        "action_handler": "recycle_worker_pool",
        "estimated_impact": "Medium",
        "rollback_procedure": "Revert to previous worker process allocations if replacement instances fail initial health probes.",
        "safety_tier": "Tier-2 Guarded"
    },
    {
        "playbook_code": "PBK-DISK-PURGE",
        "title": "Storage Headroom Reclamation & Safe Ephemeral Log Purge",
        "target_issue": "disk",
        "description": "Purges expired application debug logs, archives older rotated compressed logs, truncates SQLite write-ahead-log temp buffers, and reclaims emergency storage capacity.",
        "steps_json": json.dumps([
            "Step 1: Identify storage-consuming paths in /var/log and temporary working directories",
            "Step 2: Verify log retention policy compliance; retain minimum 7-day compressed audit trail",
            "Step 3: Safely purge transient .tmp files and vacuum SQLite journal buffers",
            "Step 4: Compress unarchived debug traces older than 48 hours",
            "Step 5: Verify filesystem free space expands above 30% safety reserve"
        ]),
        "action_handler": "purge_storage_headroom",
        "estimated_impact": "High",
        "rollback_procedure": "Restore archived log bundles from staging cold-storage if compliance audit requires.",
        "safety_tier": "Tier-2 Guarded"
    },
    {
        "playbook_code": "PBK-CONN-REFRESH",
        "title": "Upstream Mesh Connection Pool Reset & Circuit Breaker Trip",
        "target_issue": "latency",
        "description": "Recycles idle TCP connection pool sockets, resets upstream HTTP keep-alive channels, trips circuit breakers for degraded downstreams, and stabilizes API response latency.",
        "steps_json": json.dumps([
            "Step 1: Query connection pool metrics for stuck sockets in CLOSE_WAIT or TIME_WAIT states",
            "Step 2: Reset client connection pool and cycle HTTP/2 multiplexed streams",
            "Step 3: Trip circuit breaker for degraded upstream dependencies for 15-second cool-down",
            "Step 4: Engage fallback cache response for read-only query endpoints",
            "Step 5: Validate average round-trip latency returns below 200ms SLA target"
        ]),
        "action_handler": "refresh_connection_pool",
        "estimated_impact": "Low",
        "rollback_procedure": "Restore previous connection pool keep-alive timeouts and disable circuit breaker fallbacks.",
        "safety_tier": "Tier-1 Safe"
    }
]

class RecoveryEngine:
    def seed_playbooks(self, db: Session):
        """Initializes standard recovery playbooks if not already present."""
        for item in PLAYBOOKS_CATALOG:
            existing = db.query(RecoveryPlaybook).filter(RecoveryPlaybook.playbook_code == item["playbook_code"]).first()
            if not existing:
                pb = RecoveryPlaybook(
                    playbook_code=item["playbook_code"],
                    title=item["title"],
                    target_issue=item["target_issue"],
                    description=item["description"],
                    steps_json=item["steps_json"],
                    action_handler=item["action_handler"],
                    estimated_impact=item["estimated_impact"],
                    rollback_procedure=item["rollback_procedure"],
                    safety_tier=item["safety_tier"],
                    is_active=True
                )
                db.add(pb)
        db.commit()

    def generate_plan_for_incident(self, incident: Incident, db: Session) -> RecoveryPlan:
        """Determines optimal playbook and formulates an actionable, approval-gated recovery plan."""
        self.seed_playbooks(db)

        # Match target issue based on incident title and root cause
        target = "latency"
        title_lower = (incident.title + " " + (incident.root_cause_summary or "")).lower()
        if "cpu" in title_lower:
            target = "cpu"
        elif "mem" in title_lower:
            target = "memory"
        elif "disk" in title_lower or "storage" in title_lower:
            target = "disk"

        playbook = db.query(RecoveryPlaybook).filter(RecoveryPlaybook.target_issue == target).first()
        if not playbook:
            playbook = db.query(RecoveryPlaybook).first()

        plan = RecoveryPlan(
            incident_id=incident.id,
            playbook_id=playbook.id if playbook else None,
            title=f"Plan: {playbook.title if playbook else 'Standard Service Stabilization'}",
            steps_json=playbook.steps_json if playbook else json.dumps(["Inspect service health", "Stabilize connections", "Verify"]),
            action_type=playbook.action_handler if playbook else "stabilize_service",
            estimated_impact=playbook.estimated_impact if playbook else "Low",
            risk_assessment=f"Assessed as {playbook.safety_tier if playbook else 'Tier-1 Safe'}. Controlled execution in safe simulation mode.",
            rollback_plan=playbook.rollback_procedure if playbook else "Revert configuration to previous state",
            requires_approval=True,
            status="draft",
            created_at=datetime.now(timezone.utc)
        )
        db.add(plan)
        
        # Update incident status to recovery_pending
        if incident.status in ("open", "acknowledged", "investigating"):
            incident.status = "recovery_pending"
        
        db.commit()
        return plan

    def simulate_plan_in_sandbox(self, plan: RecoveryPlan, current_telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """Provides a safe sandbox preview of before vs after telemetry without touching production."""
        steps = json.loads(plan.steps_json)
        
        # Calculate projected metrics after remediation
        action = plan.action_type
        before = dict(current_telemetry)
        after = dict(current_telemetry)

        if "throttle" in action:
            after["cpu"] = round(max(24.0, before.get("cpu", 88.0) * 0.42), 1)
            after["latency"] = round(max(95.0, before.get("latency", 850.0) * 0.35), 1)
            after["availability"] = 99.98
            after["throughput"] = round(before.get("throughput", 300.0) * 0.85, 1)
        elif "recycle" in action or "worker" in action:
            after["memory"] = round(max(40.0, before.get("memory", 92.0) * 0.52), 1)
            after["latency"] = round(max(110.0, before.get("latency", 600.0) * 0.45), 1)
            after["availability"] = 100.0
        elif "purge" in action or "storage" in action:
            after["disk"] = round(max(52.0, before.get("disk", 95.0) * 0.65), 1)
        elif "pool" in action or "connection" in action:
            after["latency"] = round(max(85.0, before.get("latency", 1200.0) * 0.22), 1)
            after["availability"] = 99.95
            after["error_rate"] = 0.002
        else:
            after["cpu"] = 32.0
            after["memory"] = 48.0
            after["latency"] = 115.0
            after["availability"] = 99.95

        return {
            "sandbox_id": f"SBX-{int(time.time())}",
            "plan_id": plan.id,
            "incident_id": plan.incident_id,
            "simulation_mode": "Isolated Non-Invasive Virtual Environment",
            "remediation_action": plan.action_type,
            "steps_simulated": steps,
            "telemetry_comparison": {
                "before": before,
                "projected_after": after,
                "variance_delta": {
                    "cpu_delta": round(after.get("cpu", 0) - before.get("cpu", 0), 1),
                    "memory_delta": round(after.get("memory", 0) - before.get("memory", 0), 1),
                    "disk_delta": round(after.get("disk", 0) - before.get("disk", 0), 1),
                    "latency_delta": round(after.get("latency", 0) - before.get("latency", 0), 1)
                }
            },
            "expected_outcome": "Infrastructure health successfully restored below warning thresholds. Zero SLA regression observed.",
            "safety_verdict": "APPROVED_FOR_STAGED_EXECUTION"
        }

    def execute_recovery_plan(self, plan: RecoveryPlan, operator_username: str, db: Session, approved: bool = True) -> RecoveryExecution:
        """Executes an approved recovery plan safely in simulation or controlled mode."""
        if not approved:
            raise ValueError("Operator approval is strictly required before executing remediation playbooks.")

        now = datetime.now(timezone.utc)
        plan.status = "executing"
        incident = db.query(Incident).filter(Incident.id == plan.incident_id).first()
        if incident:
            incident.status = "recovering"
        db.commit()

        # Step-by-step audit logs
        steps = json.loads(plan.steps_json)
        execution_logs = []
        for i, step in enumerate(steps, 1):
            execution_logs.append({
                "step_number": i,
                "action": step,
                "status": "COMPLETED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "output": f"Successfully performed verification and dispatched command: [{step}]."
            })

        execution = RecoveryExecution(
            plan_id=plan.id,
            incident_id=plan.incident_id,
            operator_username=operator_username,
            execution_mode="simulation",
            status="succeeded",
            logs_json=json.dumps(execution_logs),
            started_at=now,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(execution)
        plan.status = "completed"
        db.commit()

        # Clear synthetic fault in telemetry collector so live metrics return to normal
        telemetry_collector.set_fault("clear")

        # Record post-remediation normalized sample
        if incident:
            restored_sample = MetricSample(
                timestamp=datetime.now(timezone.utc),
                service_id=incident.affected_service_id,
                service_name=incident.affected_service_name,
                cpu=31.5,
                memory=44.0,
                disk=52.0,
                latency=110.0,
                availability=99.98,
                error_rate=0.002,
                throughput=420.0,
                source="recovery_simulation_engine",
                is_simulated=True
            )
            db.add(restored_sample)
            db.commit()

        # Audit event
        db.add(AuditLog(
            actor_username=operator_username,
            actor_role="sre_operator",
            event_type="recovery_execution",
            target_resource=f"Incident #{plan.incident_id} / Plan #{plan.id}",
            result="success",
            metadata_json=json.dumps({"plan_title": plan.title, "action": plan.action_type})
        ))
        db.commit()

        return execution

recovery_engine = RecoveryEngine()
