# PHOENIX REST & WebSocket API Reference
**Version:** 2.0.0 | **Base Path:** `/api/v1`

---

## 1. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Authenticate operator credentials; returns JWT bearer token.
- `GET /api/v1/auth/me`: Retrieve authenticated user identity, role, and active permissions.

## 2. Command Center & Observability (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/overview`: Complete dashboard summary (KPI cards, active incidents, host metrics, risk).

## 3. Telemetry & Monitoring (`/api/v1/metrics`)
- `GET /api/v1/metrics?limit=60&service={name}`: Historical metric samples for charting.
- `GET /api/v1/metrics/host`: Host OS metrics from `psutil` adapter.
- `POST /api/v1/metrics/ingest`: External telemetry ingestion with instantaneous anomaly detection.

## 4. Service Inventory (`/api/v1/services`)
- `GET /api/v1/services`: List monitored microservices with live health scores.
- `GET /api/v1/services/dependencies`: Topological dependency graph (nodes and edges).
- `POST /api/v1/services`: Register new monitoring target (`infra_admin`+).
- `DELETE /api/v1/services/{id}`: Deregister monitoring target (`super_admin`).

## 5. Anomaly Intelligence (`/api/v1/anomalies`)
- `GET /api/v1/anomalies?limit=50&suppressed=false`: Live stream of detected anomalies across all tiers.

## 6. Failure Prediction (`/api/v1/predictions`)
- `GET /api/v1/predictions`: Historical degradation risk scores and rate-of-change drivers.
- `GET /api/v1/predictions/latest`: Most recent infrastructure failure risk index.

## 7. Incident Management (`/api/v1/incidents`)
- `GET /api/v1/incidents`: Filterable list by status, severity, service.
- `GET /api/v1/incidents/{id}`: Detailed incident view with ranked root cause hypotheses and evidence.
- `POST /api/v1/incidents/{id}/acknowledge`: Mark incident as acknowledged.
- `POST /api/v1/incidents/{id}/resolve`: Mark incident as resolved with resolution notes.

## 8. Recovery Intelligence & Execution (`/api/v1/recovery`)
- `GET /api/v1/recovery/playbooks`: Standard remediation playbook catalog.
- `POST /api/v1/recovery/plans`: Formulate customized recovery plan for an incident.
- `POST /api/v1/recovery/plans/{id}/approve`: Operator approval for plan execution.
- `POST /api/v1/recovery/plans/{id}/execute`: Execute remediation plan; automatically triggers verification.
- `GET /api/v1/recovery/executions`: List past remediation executions.
- `POST /api/v1/recovery/executions/{id}/verify`: Trigger manual verification audit.

## 9. Recovery Sandbox (`/api/v1/sandbox`)
- `POST /api/v1/sandbox/simulate/{plan_id}`: Run virtual remediation in sandbox, returning before-vs-after delta metrics.

## 10. Alerts & Notifications (`/api/v1/alerts`)
- `GET /api/v1/alerts`: Active notification queue.
- `POST /api/v1/alerts/{id}/acknowledge`: Acknowledge alert notification.
- `GET /api/v1/alerts/rules`: List configured alert rules.

## 11. Analytics & Reports (`/api/v1/analytics`)
- `GET /api/v1/analytics/summary?days=7`: Reliability KPIs (MTTD, MTTR, SLA availability, recurrence rate).
- `GET /api/v1/analytics/export-csv`: Download CSV report of incidents, root causes, and verifications.

## 12. AI Operations Assistant (`/api/v1/assistant`)
- `POST /api/v1/assistant/query`: Ask SRE assistant; answers grounded strictly in real database records.

## 13. Audit & Activity Trail (`/api/v1/audit`)
- `GET /api/v1/audit?limit=50&event_type=all`: Comprehensive audit log trail.

## 14. Administration (`/api/v1/admin`)
- `GET /api/v1/admin/users`: List users and roles.
- `POST /api/v1/admin/users`: Create user account (`super_admin`).
- `POST /api/v1/admin/demo/fault`: Chaos engineering fault scenario injection (`cpu`, `memory`, `disk`, `latency`, `outage`, `clear`).
- `POST /api/v1/admin/demo/control`: Pause / resume background telemetry stream.

## 15. WebSockets
- `ws://localhost:8000/ws/telemetry`: Real-time streaming connection pushing telemetry ticks every 3s.

