# PHOENIX — Autonomous Self-Healing Digital Infrastructure
**Detect. Diagnose. Predict. Recover. Verify.**

A unified, locally runnable infrastructure reliability console featuring live telemetry, explainable anomaly detection, risk estimation, incident management, root-cause hypotheses, approval-gated recovery simulations, and an audit timeline.

## Run locally
Requires Python 3.10+.

**Windows**
```powershell
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**macOS / Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000. API documentation: http://127.0.0.1:8000/docs

## Included
- Responsive premium dark operations dashboard.
- CPU, memory, disk, network, latency and availability telemetry.
- Explainable threshold/trend anomaly scoring and heuristic failure-risk estimate.
- Incident history, acknowledgement, diagnostic signals and recovery playbooks.
- Operator-approved recovery simulations and verification records.
- SQLite persistence and external telemetry ingestion endpoint.
- Demo controls for pause/resume and CPU, memory, disk or latency fault injection.

## Structure
```text
PHOENIX/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── engine.py
│   └── static/ (index.html, styles.css, app.js)
├── tests/test_engine.py
├── requirements.txt
├── .env.example
└── README.md
```

## API
`GET /health`, `GET /api/overview`, `GET /api/metrics`, `GET /api/incidents`, `GET /api/actions`, `POST /api/telemetry`, `POST /api/demo/fault`, `POST /api/demo/control`, `POST /api/incidents/{id}/acknowledge`, `POST /api/recovery/plan`, `POST /api/recovery/execute`.

## Important safety note
This is a complete runnable prototype, not a production-certified autonomous SRE platform. Telemetry is simulated by default. The included anomaly and risk logic is transparent baseline logic, not a trained deep-learning model. Recovery is intentionally simulation-only: it does not kill processes, restart services, delete files, or modify the host. Before production use, add authentication/RBAC, TLS, tenant isolation, signed policies, secrets management, isolated workers, monitoring adapters and security review.

## Tests
```bash
pytest
```
