import json
import os
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models.service import Service
from ..models.incident import Incident
from ..models.telemetry import MetricSample
from ..models.recovery import RecoveryPlan, RecoveryExecution, RecoveryVerification
from ..models.audit import AuditLog
from ..models.anomaly import AnomalyRecord
from ..models.prediction import PredictionRecord

class OperationsAssistant:
    def answer_query(self, query: str, db: Session) -> Dict[str, Any]:
        """Synthesizes structured operational answers grounded strictly in real PHOENIX database records."""
        q = query.lower().strip()
        
        # Pull live operational state from DB
        services = db.query(Service).all()
        incidents = db.query(Incident).order_by(Incident.id.desc()).limit(10).all()
        open_incidents = [i for i in incidents if i.status in ("open", "acknowledged", "investigating", "recovery_pending")]
        latest_metrics = db.query(MetricSample).order_by(MetricSample.id.desc()).limit(15).all()
        recent_verifications = db.query(RecoveryVerification).order_by(RecoveryVerification.id.desc()).limit(5).all()
        recent_executions = db.query(RecoveryExecution).order_by(RecoveryExecution.id.desc()).limit(5).all()
        latest_prediction = db.query(PredictionRecord).order_by(PredictionRecord.id.desc()).first()

        facts = []
        hypotheses = []
        recommendations = []
        referenced_records = []

        # Find highest resource consumers
        highest_cpu_svc = max(services, key=lambda s: s.cpu) if services else None
        highest_mem_svc = max(services, key=lambda s: s.memory) if services else None

        # Scenario 1: Overall Infrastructure Health
        if any(w in q for w in ["health", "status", "overview", "infrastructure"]):
            degraded_count = sum(1 for s in services if s.status != "healthy")
            facts.append(f"Total monitored services: {len(services)}. Healthy: {len(services) - degraded_count}, Degraded/Critical: {degraded_count}.")
            facts.append(f"Active open incidents: {len(open_incidents)}.")
            if latest_prediction:
                facts.append(f"Infrastructure Risk Index: {latest_prediction.risk_score}% ({latest_prediction.risk_classification.upper()}).")
                referenced_records.append(f"Prediction #{latest_prediction.id}")
            
            if degraded_count > 0:
                hypotheses.append("System is experiencing load pressure or simulated fault injection on active services.")
                recommendations.append("Inspect degraded services on the Infrastructure Monitoring page.")
            else:
                facts.append("All service telemetry vectors are operating within nominal baseline parameters.")

            headline = f"Infrastructure Status: {'Operational with degraded components' if degraded_count > 0 else 'All Systems Nominal'}"

        # Scenario 2: Resource utilization / Highest consumer
        elif any(w in q for w in ["highest", "resource", "cpu", "memory", "consuming", "utilization"]):
            if highest_cpu_svc:
                facts.append(f"Highest CPU: {highest_cpu_svc.name} currently at {highest_cpu_svc.cpu}% utilization.")
                referenced_records.append(f"Service: {highest_cpu_svc.name}")
            if highest_mem_svc:
                facts.append(f"Highest Memory: {highest_mem_svc.name} currently at {highest_mem_svc.memory}% memory usage.")
                referenced_records.append(f"Service: {highest_mem_svc.name}")
            
            if highest_cpu_svc and highest_cpu_svc.cpu > 80:
                hypotheses.append(f"{highest_cpu_svc.name} is approaching compute saturation limit.")
                recommendations.append("Generate and review PBK-CPU-THROTTLE recovery plan.")
            else:
                facts.append("Resource consumption across all nodes is balanced and sustainable.")
            
            headline = f"Resource Telemetry: Top consumer is {highest_cpu_svc.name if highest_cpu_svc else 'None'}"

        # Scenario 3: Incidents & Root Causes
        elif any(w in q for w in ["incident", "why", "cause", "anomaly", "created", "failed"]):
            if open_incidents:
                latest_inc = open_incidents[0]
                facts.append(f"Most recent active incident is #{latest_inc.id} ({latest_inc.incident_number}): '{latest_inc.title}'.")
                facts.append(f"Affected service: {latest_inc.affected_service_name}, Severity: {latest_inc.severity.upper()}, Status: {latest_inc.status.upper()}.")
                referenced_records.append(f"Incident #{latest_inc.id} ({latest_inc.incident_number})")
                
                if latest_inc.root_cause_summary:
                    hypotheses.append(f"Identified Root Cause: {latest_inc.root_cause_summary}")
                recommendations.append(f"Review hypotheses and approve recommended playbook for incident #{latest_inc.id}.")
                headline = f"Active Incident Analysis: #{latest_inc.incident_number}"
            else:
                facts.append("There are currently no active open incidents.")
                headline = "Zero Active Incidents"

        # Scenario 4: Recovery & Verification outcome
        elif any(w in q for w in ["recovery", "playbook", "verify", "succeed", "execution"]):
            if recent_verifications:
                latest_ver = recent_verifications[0]
                facts.append(f"Latest recovery verification status: {latest_ver.status.upper()} at {latest_ver.verified_at.strftime('%H:%M:%S UTC')}.")
                facts.append(f"Verification notes: {latest_ver.verification_notes}")
                referenced_records.append(f"Verification #{latest_ver.id}")
                if latest_ver.status == "verified_healthy":
                    facts.append("Post-remediation telemetry confirms metrics have safely stabilized below alert thresholds.")
                headline = f"Recovery Verification Result: {latest_ver.status.replace('_', ' ').title()}"
            elif recent_executions:
                exec_item = recent_executions[0]
                facts.append(f"Latest execution #{exec_item.id} completed with status: {exec_item.status.upper()}.")
                headline = "Recovery Execution Complete"
            else:
                facts.append("No recovery executions have been triggered in the current session.")
                headline = "Recovery Engine Ready"

        # Default Fallback Query Handling
        else:
            facts.append(f"Currently tracking {len(services)} services and {len(open_incidents)} open incidents.")
            if open_incidents:
                facts.append(f"Primary issue: {open_incidents[0].title} on service {open_incidents[0].affected_service_name}.")
                referenced_records.append(f"Incident #{open_incidents[0].id}")
            headline = "Operational Context Overview"

        return {
            "query": query,
            "headline": headline,
            "facts": facts,
            "hypotheses": hypotheses,
            "recommendations": recommendations,
            "referenced_records": referenced_records,
            "source": "phoenix_operational_database_grounded"
        }

assistant = OperationsAssistant()
