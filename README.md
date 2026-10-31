# PHOENIX — Autonomous Self-Healing Digital Infrastructure
**Detect. Diagnose. Predict. Recover. Verify.**

[![Tests](https://img.shields.io/badge/pytest-25%20passed-10b981.svg)](tests/)
[![Python](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-38bdf8.svg)](backend/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-00f2fe.svg)](backend/)
[![React](https://img.shields.io/badge/React-19%20%7C%20TypeScript-61dafb.svg)](frontend/)
[![License](https://img.shields.io/badge/license-Enterprise%20Proprietary-a855f7.svg)](LICENSE)

---

## 1. Executive Summary & Vision

**PHOENIX** is an enterprise-grade Autonomous Site Reliability Engineering (SRE) and Self-Healing Platform designed to transform infrastructure reliability. Modern cloud architectures generate overwhelming volumes of noisy alerts that overload human on-call engineers, causing prolonged Mean Time to Detect (MTTD), delayed Mean Time to Resolve (MTTR), and preventable outages.

PHOENIX closes the observability-to-remediation loop through a continuous, closed-loop workflow:
```
Infrastructure Monitoring ──► Anomaly Detection ──► Failure Prediction ──► Root Cause Analysis
                                                                                   │
                                                                                   ▼
Incident Resolution ◄── Verification ◄── Controlled Execution ◄── Approval ◄── Recovery Planning
```

---

## 2. System Architecture

```
                             ┌──────────────────────────────────────┐
                             │       PHOENIX React 19 Client        │
                             │ (Command Center, Topology, Sandbox)  │
                             └───────────────────┬──────────────────┘
                                                 │ REST / WebSockets
                                                 ▼
                             ┌──────────────────────────────────────┐
                             │        FastAPI Ingress Router        │
                             │ (JWT Security, RBAC Guards, CORS)    │
                             └───────────────────┬──────────────────┘
                                                 │
         ┌───────────────────────────────────────┼───────────────────────────────────────┐
         ▼                                       ▼                                       ▼
┌──────────────────┐                   ┌──────────────────┐                   ┌──────────────────┐
│  Telemetry Core  │                   │  Anomaly Engine  │                   │Predictive Engine │
│ ├─ Host psutil   │                   │ ├─ SLA Threshold │                   │ ├─ Trend Slopes  │
│ ├─ Microservices │                   │ ├─ Z-Score Spike │                   │ ├─ 15m Horizon   │
│ └─ Ingest API    │                   │ └─ Isolation ML  │                   │ └─ Saturation Est│
└────────┬─────────┘                   └────────┬─────────┘                   └────────┬─────────┘
         │                                       │                                       │
         └───────────────────────────────────────┼───────────────────────────────────────┘
                                                 │
                                                 ▼
                             ┌──────────────────────────────────────┐
                             │    Incident & RCA Diagnosis Engine   │
                             │ (Causal Inference & Dependency Mesh) │
                             └───────────────────┬──────────────────┘
                                                 │
                                                 ▼
                             ┌──────────────────────────────────────┐
                             │     Recovery Intelligence Engine     │
                             │ (Catalog Playbooks, Approval Gates)  │
                             └───────────────────┬──────────────────┘
                                                 │
         ┌───────────────────────────────────────┴───────────────────────────────────────┐
         ▼                                                                               ▼
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│     Digital Twin Sandbox        │                             │    Controlled Execution Core    │
│  (Before vs After Simulation)   │                             │  (Rollback Ready, Audit Logged) │
└─────────────────────────────────┘                             └────────────────┬────────────────┘
                                                                                 │
                                                                                 ▼
                                                                ┌─────────────────────────────────┐
                                                                │  Post-Action Verification Core  │
                                                                │  (Zero-Regression Confirmation) │
                                                                └─────────────────────────────────┘
```

---

## 3. The 15 Enterprise Modules

1. **Module 01 — Command Center**: Unified dark operations console. Real-time KPI summary (services, healthy/degraded/critical counts, open incidents, MTTD, MTTR, SLA availability %, failure risk gauge, live Recharts line telemetry, top resource-consuming services).
2. **Module 02 — Infrastructure Monitoring**: Multi-vector telemetry collector monitoring CPU core load, physical RAM, storage partition utilization, network I/O, API latency, throughput, and error rates. Integrates local OS host metrics via `psutil`.
3. **Module 03 — Intelligent Anomaly Detection**: Modular multi-tier detection combining deterministic SLA thresholds, rolling standard-deviation Z-scores ($Z > 2.8\sigma$), and an unsupervised Scikit-Learn `IsolationForest` multivariate outlier model (`iforest-v1.4.2-phoenix`). Includes temporal flapping de-duplication.
4. **Module 04 — Predictive Failure Intelligence**: First-derivative rate-of-change trajectory analysis ($dM/dt$) across 15-minute and 60-minute horizons. Projects time-to-saturation for heap and storage exhaustion.
5. **Module 05 — Root Cause Analysis Intelligence**: Causal diagnostic reasoning engine. Correlates multi-metric anomalies with service dependency topology, producing ranked hypotheses with explicit confidence scores, concrete evidence, and remediation steps.
6. **Module 06 — Incident Management Center**: Full lifecycle incident queue with severity filters, search, assignment, operator acknowledgement, investigation notes, resolution tracking, and recurrence metrics.
7. **Module 07 — Recovery Intelligence Engine**: Standard self-healing playbook catalog (`PBK-CPU-THROTTLE`, `PBK-MEM-RECYCLE`, `PBK-DISK-PURGE`, `PBK-CONN-REFRESH`). Formulates actionable recovery plans with blast-radius ratings and rollback plans.
8. **Module 08 — Recovery Sandbox & Digital Twin**: Virtual simulation environment testing recovery plans without touching live production. Outputs side-by-side **Before Recovery vs Projected After Recovery** metrics and variance deltas.
9. **Module 09 — Autonomous Recovery Verification**: Post-remediation health auditor. Samples telemetry post-execution; incidents are transitioned to `resolved` **strictly** upon verified healthy telemetry confirmation.
10. **Module 10 — Service & Infrastructure Inventory**: Microservice catalog with endpoint configurations, health scores, ports, host IPs, and an interactive service dependency mesh visualizer.
11. **Module 11 — Alerts & Notification Center**: Real-time dispatching queue, alert acknowledgement, threshold rules, and notification preferences.
12. **Module 12 — Reliability Analytics & Executive Reports**: SLO compliance reporting, MTTD/MTTR benchmarks, incident severity distributions, printable report view, and real CSV report export.
13. **Module 13 — AI Operations Assistant**: Grounded operational conversational assistant. Answers questions using real operational database records, explicitly distinguishing verifiable facts from diagnostic hypotheses.
14. **Module 14 — Audit & Activity Trail**: Immutable security audit trail recording all user logins, fault scenarios, plan approvals, playbook executions, and verifications.
15. **Module 15 — Administration & RBAC Security**: Role-Based Access Control enforcing 4 permission tiers (`super_admin`, `infra_admin`, `sre_operator`, `viewer`), user provisioning, telemetry stream controls, and chaos engineering fault injection.

---

## 4. Technology Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, WebSockets.
- **Machine Learning & Analytics**: Scikit-Learn (Isolation Forest), NumPy, Pandas, SciPy.
- **System Monitoring**: `psutil` (Host OS collection adapter).
- **Security**: PBKDF2-HMAC-SHA256 password hashing, python-jose (JWT), Role-Based Access Control (RBAC).
- **Database**: SQLite with WAL mode & foreign key constraints (Default) / PostgreSQL ready.
- **Frontend**: React 19, TypeScript, Vite, Lucide React, Recharts, Custom CSS Design System.

---

## 5. Quick Installation & Startup

### Prerequisites
- Python 3.10+
- Node.js 18+ (tested on Node v24)
- Git

### 1. Clone & Set Up Python Virtual Environment
```powershell
git clone https://github.com/your-org/phoenix.git
cd phoenix

python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Build the Frontend Production Bundle
```powershell
cd frontend
npm install
npm run build
cd ..
```

### 3. Launch the Server
```powershell
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **http://127.0.0.1:8000** in your browser.
Interactive OpenAPI Swagger docs: **http://127.0.0.1:8000/docs**.

---

## 6. Seed Credentials & Role Hierarchy

Default demonstration accounts auto-provisioned on first launch:

| Username | Password | Role | Access Scope |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `super_admin` | Full governance, RBAC management, global policies |
| `operator` | `operator123` | `sre_operator` | Incident triage, RCA, approve and execute playbooks |
| `infra` | `infra123` | `infra_admin` | Register monitoring targets, configure alert rules |
| `viewer` | `viewer123` | `viewer` | Read-only dashboards, metric exploration, reports |

*(The login modal includes one-click buttons to instantly authenticate as any demo profile).*

---

## 7. Testing & Quality Assurance

PHOENIX includes an automated test suite with **100% pass rate** across all API, engine, and integration workflows:

```powershell
# Run the complete test suite
python -m pytest

# Run end-to-end autonomous self-healing workflow test
python -m pytest tests/test_e2e_workflow.py -v
```

### Test Coverage Summary:
- `tests/test_api_v1.py`: 16/16 Passed (Auth, Dashboard, Metrics, Services, Dependencies, Anomalies, Predictions, Incidents, Playbooks, Alerts, Analytics, CSV Export, Assistant, Audit).
- `tests/test_engines.py`: 4/4 Passed (Threshold anomaly detection, Prediction slopes and risk scores, RCA hypotheses and evidence ranking, Sandbox virtual simulation).
- `tests/test_e2e_workflow.py`: 1/1 Passed (Full 10-step autonomous self-healing loop).
- `tests/test_engine.py`: 4/4 Passed (Baseline engine backward compatibility).

---

## 8. Safety & Autonomous Guardrails

1. **Non-Invasive by Default**: All recovery playbooks default to safe simulation.
2. **No Arbitrary Execution**: PHOENIX explicitly prohibits executing arbitrary, unvetted shell commands generated by LLMs.
3. **Statically Audited Playbooks**: Remediation is restricted to cataloged, verified playbooks.
4. **Mandatory Approval Gates**: Operators must review and authorize remediation plans before execution.
5. **Automated Verification**: Incidents are only resolved after quantitative post-remediation telemetry proves that the service has normalized below alert thresholds.
6. **Immutable Audit Trail**: Every action, approval, and verification is permanently logged.

---

## 9. License

Proprietary Enterprise Software. All rights reserved.
**DETECT. DIAGNOSE. PREDICT. RECOVER. VERIFY.**
