export type UserRole = 'super_admin' | 'infra_admin' | 'sre_operator' | 'viewer';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface MetricSample {
  id: number;
  timestamp: string;
  service: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  latency: number;
  availability: number;
  error_rate: number;
  throughput: number;
  is_simulated: boolean;
}

export interface ServiceItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  environment: string;
  host: string;
  port: number;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  health_score: number;
  cpu: number;
  memory: number;
  disk: number;
  latency: number;
  availability: number;
  error_rate: number;
  throughput: number;
  monitoring_enabled: boolean;
  last_heartbeat: string | null;
}

export interface ServiceDependencyItem {
  id: number;
  source: number;
  target: number;
  source_name: string;
  target_name: string;
  type: string;
  is_critical: boolean;
}

export interface IncidentItem {
  id: number;
  incident_number: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'investigating' | 'recovery_pending' | 'recovering' | 'resolved' | 'closed';
  anomaly_score: number;
  affected_service_name: string;
  root_cause_summary: string;
  assigned_to: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_notes: string;
  recurrence_count: number;
  created_at: string;
}

export interface RootCauseHypothesisItem {
  id: number;
  title: string;
  confidence_score: number;
  evidence: string[];
  affected_components: string[];
  recommended_steps: string[];
  ranking: number;
}

export interface AnomalyItem {
  id: number;
  timestamp: string;
  service_name: string;
  metric_name: string;
  current_value: number;
  expected_value: number;
  threshold: number;
  deviation_pct: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detection_method: 'threshold_rule' | 'statistical_zscore' | 'ml_isolation_forest';
  explanation: string;
  is_suppressed: boolean;
  incident_id: number | null;
}

export interface PredictionItem {
  id: number;
  timestamp: string;
  service_name: string;
  risk_score: number;
  risk_classification: 'low' | 'moderate' | 'high' | 'critical';
  horizon_minutes: number;
  confidence_pct: number;
  drivers: Record<string, any>;
  is_ml_calibrated: boolean;
  explanation: string;
}

export interface RecoveryPlaybookItem {
  id: number;
  playbook_code: string;
  title: string;
  target_issue: string;
  description: string;
  steps: string[];
  action_handler: string;
  estimated_impact: string;
  rollback_procedure: string;
  safety_tier: string;
}

export interface RecoveryPlanItem {
  id: number;
  incident_id: number;
  playbook_id: number | null;
  title: string;
  steps: string[];
  action_type: string;
  estimated_impact: string;
  risk_assessment: string;
  rollback_plan: string;
  requires_approval: boolean;
  status: 'draft' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
}

export interface RecoveryExecutionItem {
  id: number;
  plan_id: number;
  incident_id: number;
  operator_username: string;
  execution_mode: string;
  status: string;
  logs: Array<{ step_number: number; action: string; status: string; timestamp: string; output: string }>;
  started_at: string;
  completed_at: string | null;
}

export interface RecoveryVerificationItem {
  id: number;
  execution_id: number;
  incident_id: number;
  status: 'verified_healthy' | 'partially_recovered' | 'recovery_failed' | 'monitoring_required';
  notes: string;
  verified_at: string;
}

export interface AlertItem {
  id: number;
  rule_id: number | null;
  service_name: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  created_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  actor_username: string;
  actor_role: string;
  event_type: string;
  target_resource: string;
  result: string;
  metadata: Record<string, any>;
}

export interface DashboardOverview {
  status: string;
  counts: {
    total_services: number;
    healthy_services: number;
    degraded_services: number;
    critical_services: number;
    open_incidents: number;
  };
  averages: {
    cpu: number;
    memory: number;
    disk: number;
    latency: number;
    availability: number;
    mttd_seconds: number;
    mttr_minutes: number;
  };
  risk: {
    score: number;
    classification: string;
    horizon: string;
    is_calibrated: boolean;
  };
  open_incidents: Array<{
    id: number;
    incident_number: string;
    title: string;
    severity: string;
    status: string;
    affected_service_name: string;
    created_at: string;
    root_cause_summary: string;
  }>;
  top_consumers: Array<{
    name: string;
    cpu: number;
    memory: number;
    status: string;
  }>;
  recent_executions: Array<{
    id: number;
    incident_id: number;
    operator: string;
    status: string;
    started_at: string;
  }>;
  recent_events: Array<{
    id: number;
    event_type: string;
    target: string;
    result: string;
    timestamp: string;
  }>;
  host_metrics: Record<string, any>;
  active_fault: string | null;
  mode: string;
}
