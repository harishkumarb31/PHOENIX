# PHOENIX Setup & Deployment Guide

---

## Prerequisites
- **Python**: 3.10+ (Tested on Python 3.13)
- **Node.js**: 18+ (Tested on Node v24.18.0)
- **Git**

---

## 1. Quick Local Start (Integrated Mode)

In integrated mode, the compiled production React frontend is served directly by FastAPI at `http://127.0.0.1:8000`.

### Step 1: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 2: Build the Frontend Bundle
```powershell
cd frontend
npm install
npm run build
cd ..
```

### Step 3: Launch PHOENIX Server
```powershell
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*(Or via legacy entrypoint `uvicorn app.main:app --port 8000`)*

Open **http://127.0.0.1:8000** in your browser.
API Swagger Documentation is available at **http://127.0.0.1:8000/docs**.

---

## 2. Developer Mode (Hot Reloading Frontend & Backend)

Run the backend and frontend in separate terminals during active development:

### Terminal 1 (FastAPI Backend):
```powershell
uvicorn backend.app.main:app --reload --port 8000
```

### Terminal 2 (Vite Frontend):
```powershell
cd frontend
npm run dev
```
Open **http://localhost:5173**. Vite proxies `/api` and `/ws` to `http://127.0.0.1:8000`.

---

## 3. Seed Accounts & Credentials

Initial default accounts auto-seeded upon first startup:

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `super_admin` | Full System Administrator |
| `operator` | `operator123` | `sre_operator` | SRE Remediation Lead |
| `infra` | `infra123` | `infra_admin` | Infrastructure Architect |
| `viewer` | `viewer123` | `viewer` | Read-Only Observability |

*(One-click demo buttons are available on the login modal to instantly authenticate as any profile).*

---

## 4. Running Automated Tests

Run the full pytest suite:
```powershell
python -m pytest
```
Run specific test modules:
```powershell
python -m pytest tests/test_e2e_workflow.py -v
```

