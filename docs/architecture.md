# PHOENIX System Architecture
**Autonomous Self-Healing Digital Infrastructure**
*Detect. Diagnose. Predict. Recover. Verify.*

---

## 1. Overview & Operational Philosophy

PHOENIX is an enterprise-grade Autonomous Site Reliability Engineering (SRE) and Self-Healing Infrastructure Platform. It transitions infrastructure management from reactive triage to an automated, explainable, and safety-gated closed-loop workflow:

```
Telemetry Ingestion
       │
       ▼
Intelligent Anomaly Detection (Threshold + Z-Score + Isolation Forest ML)
       │
       ▼
Incident Management Queue
       │
       ▼
Root Cause Analysis (Causal Diagnostic Reasoning)
       │
       ▼
Predictive Failure Intelligence (Horizon & Risk Trajectory)
       │
       ▼
Recovery Playbook Formulation (Blast Radius & Rollback Planning)
       │
       ▼
Operator Review & Approval Gate (RBAC Authorization)
       │
       ▼
Digital Twin Sandbox Simulation (Before vs. After Delta Preview)
       │
       ▼
Controlled Remediation Execution (Allowlist Guardrails)
       │
       ▼
Autonomous Post-Remediation Verification (Telemetry Delta Validation)
       │
       ▼
Incident Resolution & Comprehensive Audit Trail Persistence
```

---

## 2. Core Subsystems

### 2.1 Telemetry Collection & Monitoring
- **Local Node Host Adapter**: Direct OS-level collection via `psutil` (CPU core percent, resident memory bytes, disk free partitions, socket network IO counters, process handles).
- **Cluster Telemetry Engine**: Multi-service telemetry synthesis for microservice clusters (`api-gateway`, `auth-service`, `billing-api`, `database-proxy`, `telemetry-worker`).
- **External Ingress API**: Validated REST ingest point (`POST /api/v1/metrics/ingest`) for third-party agents and Prometheus/OpenTelemetry exporters.

### 2.2 Multi-Tier Anomaly Intelligence
- **Tier 1 (Deterministic SLA Thresholds)**: Hard boundaries for immediate alerting (CPU > 85%, RAM > 88%, Disk > 90%, Latency > 650ms, Availability < 98.5%).
- **Tier 2 (Statistical Z-Score & Moving Average)**: Rolling 30-sample window deriving mean ($\mu$) and standard deviation ($\sigma$). Detects sudden non-linear spikes ($Z > 2.8\sigma$).
- **Tier 3 (Unsupervised Machine Learning)**: Scikit-Learn `IsolationForest` model (`iforest-v1.4.2-phoenix`) evaluating 5-dimensional covariance spaces (CPU, Memory, Disk, Latency, Error Rate).
- **De-duplication & Flapping Suppression**: Temporal window suppression prevents notification storms.

### 2.3 Predictive Failure Intelligence
- First derivative rate-of-change calculation ($dM/dt$) across 15-minute and 60-minute horizons.
- Time-to-exhaustion projection for heap growth and storage consumption.
- Heuristic trajectory model clearly distinguished from validated ML probability models.

### 2.4 Diagnostic Root Cause Analysis (RCA) Engine
- Correlates multi-metric anomalies with service dependency mesh topology.
- Generates ranked causal hypotheses with confidence ratings, concrete supporting telemetry evidence, affected subcomponents, and actionable SRE investigation steps.

### 2.5 Recovery Intelligence & Safety Architecture
- **Cataloged Playbooks**:
  - `PBK-CPU-THROTTLE`: Adaptive token-bucket ingress rate limiting.
  - `PBK-MEM-RECYCLE`: Zero-downtime rolling worker restart and garbage collector heap purge.
  - `PBK-DISK-PURGE`: Temporary file cleanup, journal vacuuming, and log rotation.
  - `PBK-CONN-REFRESH`: Connection pool recycling and circuit breaker trips.
- **Safety Tiers**: Tier-1 Safe (non-invasive throttle), Tier-2 Guarded (restart/purge), Tier-3 Critical.
- **Approval Gate**: Mandatory operator authorization before live or staged execution.
- **Digital Twin Sandbox**: Virtual simulation forecasting before-vs-after metrics and variance deltas.
- **Post-Action Verification Engine**: Collects settling window metrics; incident transitions to `resolved` ONLY upon verified healthy confirmation.
