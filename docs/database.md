# PHOENIX Database Architecture & Entity Relationships
**Engine: SQLAlchemy 2.0 ORM with SQLite WAL / PostgreSQL Compatible**

---

## 1. Relational Schema Design

```
+----------------+       1:N       +---------------------+
|    services    | <-------------- | service_dependencies|
+----------------+                 +---------------------+
        │ 1:N
        ▼
+----------------+       1:N       +---------------------+
| metric_samples |                 |      anomalies      |
+----------------+                 +---------------------+
                                              │ 1:N
                                              ▼
                                   +---------------------+
                                   |      incidents      |
                                   +---------------------+
                                     │ 1:N          │ 1:N
                                     ▼              ▼
                    +--------------------+    +--------------------+
                    |root_cause_hypotheses|   |   recovery_plans   |
                    +--------------------+    +--------------------+
                                                        │ 1:N
                                                        ▼
                                              +--------------------+
                                              |recovery_executions |
                                              +--------------------+
                                                        │ 1:N
                                                        ▼
                                              +--------------------+
                                              |recovery_verifications|
                                              +--------------------+
```

---

## 2. Table Catalog

1. **users**: Operator accounts, PBKDF2 salted hashes, RBAC roles (`super_admin`, `infra_admin`, `sre_operator`, `viewer`).
2. **services**: Target catalog, host IPs, ports, endpoints, health scores, live telemetry snapshots.
3. **service_dependencies**: Mesh graph links, source/target IDs, protocol types, criticality flags.
4. **metric_samples**: Time-series store for CPU, Memory, Disk, Network, Latency, Availability, Error Rate, and Throughput.
5. **anomalies**: Detected deviations, expected values, threshold breaches, severity, and detection algorithms.
6. **predictions**: Failure risk scores, horizons, trajectory slopes ($dM/dt$), and risk driver payloads.
7. **incidents**: Incident records, status progression (`open` -> `acknowledged` -> `investigating` -> `recovery_pending` -> `recovering` -> `resolved` -> `closed`), recurrence tracking.
8. **root_cause_hypotheses**: Diagnostic hypotheses, evidence arrays, component maps, confidence scores, ranking.
9. **recovery_playbooks**: Standardized remediation procedures, safety tiers, handlers, rollback plans.
10. **recovery_plans**: Generated remediation plans linked to incidents, approval status, and risk assessments.
11. **recovery_executions**: Execution audit logs, operator IDs, mode (`simulation` / `controlled_live`), step results.
12. **recovery_verifications**: Post-remediation telemetry checks, before/after comparison snapshots, verification verdicts.
13. **alerts & alert_rules**: Notification events, thresholds, durations, acknowledgement tracking.
14. **audit_logs**: Immutable system audit trail (actor, role, event type, target, result, JSON metadata).
15. **system_settings**: Key-value operational configuration, polling intervals, and retention ceilings.
