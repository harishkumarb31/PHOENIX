import {
  DashboardOverview,
  MetricSample,
  ServiceItem,
  IncidentItem,
  AnomalyItem,
  PredictionItem,
  RecoveryPlaybookItem,
  RecoveryPlanItem,
  RecoveryExecutionItem,
  AlertItem,
  AuditLogItem,
  User
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('phoenix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('phoenix_token', data.access_token);
    localStorage.setItem('phoenix_user', JSON.stringify(data.user));
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  logout() {
    localStorage.removeItem('phoenix_token');
    localStorage.removeItem('phoenix_user');
  },

  // Dashboard
  async getOverview(): Promise<DashboardOverview> {
    const res = await fetch(`${API_BASE}/dashboard/overview`);
    if (!res.ok) throw new Error('Failed to fetch dashboard overview');
    return res.json();
  },

  // Metrics
  async getMetrics(limit = 60, service?: string): Promise<MetricSample[]> {
    const url = service 
      ? `${API_BASE}/metrics?limit=${limit}&service=${encodeURIComponent(service)}` 
      : `${API_BASE}/metrics?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getHostMetrics(): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE}/metrics/host`);
    if (!res.ok) throw new Error('Failed to fetch host metrics');
    return res.json();
  },

  // Services
  async getServices(): Promise<ServiceItem[]> {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async getServiceDependencies(): Promise<{ nodes: any[]; edges: any[] }> {
    const res = await fetch(`${API_BASE}/services/dependencies`);
    if (!res.ok) throw new Error('Failed to fetch dependencies');
    return res.json();
  },

  async createService(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create service' }));
      throw new Error(err.detail);
    }
    return res.json();
  },

  async restartService(serviceId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${serviceId}/restart`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to restart service');
    return res.json();
  },

  async isolateService(serviceId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${serviceId}/isolate`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to isolate service');
    return res.json();
  },

  async recoverService(serviceId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${serviceId}/recover`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to recover service');
    return res.json();
  },

  // Anomalies
  async getAnomalies(limit = 50, suppressed = false): Promise<AnomalyItem[]> {
    const res = await fetch(`${API_BASE}/anomalies?limit=${limit}&suppressed=${suppressed}`);
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  // Predictions
  async getPredictions(limit = 30): Promise<PredictionItem[]> {
    const res = await fetch(`${API_BASE}/predictions?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch predictions');
    return res.json();
  },

  async getLatestPrediction(): Promise<PredictionItem> {
    const res = await fetch(`${API_BASE}/predictions/latest`);
    if (!res.ok) throw new Error('Failed to fetch latest prediction');
    return res.json();
  },

  // Incidents
  async getIncidents(status = 'all', severity = 'all', service = 'all', limit = 50): Promise<IncidentItem[]> {
    const url = `${API_BASE}/incidents?status_filter=${status}&severity=${severity}&service=${service}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncidentDetail(id: number): Promise<IncidentItem & { hypotheses: any[] }> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident detail');
    return res.json();
  },

  async acknowledgeIncident(id: number, notes = 'Acknowledged via UI'): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ notes })
    });
    if (!res.ok) throw new Error('Failed to acknowledge incident');
    return res.json();
  },

  async resolveIncident(id: number, resolution_notes: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ resolution_notes })
    });
    if (!res.ok) throw new Error('Failed to resolve incident');
    return res.json();
  },

  // Recovery
  async getPlaybooks(): Promise<RecoveryPlaybookItem[]> {
    const res = await fetch(`${API_BASE}/recovery/playbooks`);
    if (!res.ok) throw new Error('Failed to fetch playbooks');
    return res.json();
  },

  async createRecoveryPlan(incident_id: number): Promise<RecoveryPlanItem> {
    const res = await fetch(`${API_BASE}/recovery/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ incident_id })
    });
    if (!res.ok) throw new Error('Failed to create recovery plan');
    return res.json();
  },

  async approveRecoveryPlan(plan_id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/recovery/plans/${plan_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error('Failed to approve recovery plan');
    return res.json();
  },

  async executeRecoveryPlan(plan_id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/recovery/plans/${plan_id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ plan_id, approved: true, execution_mode: 'simulation' })
    });
    if (!res.ok) throw new Error('Failed to execute recovery plan');
    return res.json();
  },

  async getExecutions(): Promise<RecoveryExecutionItem[]> {
    const res = await fetch(`${API_BASE}/recovery/executions`);
    if (!res.ok) throw new Error('Failed to fetch executions');
    return res.json();
  },

  // Sandbox
  async simulateSandbox(plan_id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sandbox/simulate/${plan_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to simulate recovery plan');
    return res.json();
  },

  // Alerts
  async getAlerts(): Promise<AlertItem[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  // Analytics
  async getAnalyticsSummary(days = 7): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/summary?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  },

  // AI Assistant
  async askAssistant(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Failed to query assistant');
    return res.json();
  },

  // Audit
  async getAuditLogs(limit = 50, event_type = 'all'): Promise<AuditLogItem[]> {
    const res = await fetch(`${API_BASE}/audit?limit=${limit}&event_type=${event_type}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Admin & Controls
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async injectFault(type: string, target_service = 'api-gateway'): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/demo/fault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ type, target_service })
    });
    if (!res.ok) throw new Error('Failed to inject fault scenario');
    return res.json();
  },

  async toggleStream(running: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/demo/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ running })
    });
    if (!res.ok) throw new Error('Failed to toggle telemetry stream');
    return res.json();
  }
};

