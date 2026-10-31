import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session

from .core.config import settings
from .core.database import engine, Base, SessionLocal, get_db
from .core.security import hash_password
from .models.user import User
from .models.service import Service, ServiceDependency
from .models.recovery import RecoveryPlaybook
from .models.telemetry import MetricSample
from .engines.monitoring.telemetry_collector import telemetry_collector
from .engines.recovery.recovery_engine import recovery_engine
from .workers.telemetry_worker import telemetry_worker

# API Routers
from .api.v1.auth import router as auth_router
from .api.v1.dashboard import router as dashboard_router
from .api.v1.metrics import router as metrics_router
from .api.v1.services import router as services_router
from .api.v1.anomalies import router as anomalies_router
from .api.v1.predictions import router as predictions_router
from .api.v1.incidents import router as incidents_router
from .api.v1.recovery import router as recovery_router
from .api.v1.sandbox import router as sandbox_router
from .api.v1.alerts import router as alerts_router
from .api.v1.analytics import router as analytics_router
from .api.v1.assistant import router as assistant_router
from .api.v1.audit import router as audit_router
from .api.v1.admin import router as admin_router
from .api.v1.ws import router as ws_router

def init_seed_data():
    db = SessionLocal()
    try:
        # 1. Seed Users
        if not db.query(User).first():
            users = [
                User(username="admin", email="admin@phoenix.infra", hashed_password=hash_password("admin123"), full_name="Super Administrator", role="super_admin"),
                User(username="operator", email="operator@phoenix.infra", hashed_password=hash_password("operator123"), full_name="SRE Operations Lead", role="sre_operator"),
                User(username="infra", email="infra@phoenix.infra", hashed_password=hash_password("infra123"), full_name="Infrastructure Architect", role="infra_admin"),
                User(username="viewer", email="viewer@phoenix.infra", hashed_password=hash_password("viewer123"), full_name="Observability Viewer", role="viewer"),
            ]
            for u in users:
                db.add(u)
            db.commit()

        # 2. Seed Services
        if not db.query(Service).first():
            services_data = [
                {"name": "api-gateway", "slug": "api-gateway", "desc": "Ingress HTTP/REST reverse proxy and routing fabric", "host": "10.0.1.10", "port": 443, "cpu": 32.4, "mem": 48.2, "lat": 115.0},
                {"name": "auth-service", "slug": "auth-service", "desc": "OAuth2 / JWT identity verification and session authority", "host": "10.0.1.12", "port": 8081, "cpu": 22.0, "mem": 39.5, "lat": 85.0},
                {"name": "billing-api", "slug": "billing-api", "desc": "Transactional ledger and payment gateway synchronization", "host": "10.0.1.14", "port": 8082, "cpu": 18.5, "mem": 44.1, "lat": 140.0},
                {"name": "database-proxy", "slug": "database-proxy", "desc": "PostgreSQL connection pooling and read-write split proxy", "host": "10.0.1.20", "port": 5432, "cpu": 41.2, "mem": 62.0, "lat": 45.0},
                {"name": "telemetry-worker", "slug": "telemetry-worker", "desc": "High-throughput asynchronous metrics collector and stream aggregator", "host": "10.0.1.25", "port": 9090, "cpu": 27.8, "mem": 51.3, "lat": 60.0}
            ]
            created_svcs = {}
            for s in services_data:
                svc = Service(
                    name=s["name"],
                    slug=s["slug"],
                    description=s["desc"],
                    environment="production",
                    host=s["host"],
                    port=s["port"],
                    status="healthy",
                    health_score=99.8,
                    cpu=s["cpu"],
                    memory=s["mem"],
                    disk=58.0,
                    latency=s["lat"],
                    availability=99.98,
                    throughput=420.0,
                    monitoring_enabled=True
                )
                db.add(svc)
                db.flush()
                created_svcs[s["name"]] = svc.id

            # Seed Dependencies
            if "api-gateway" in created_svcs and "auth-service" in created_svcs:
                db.add(ServiceDependency(source_service_id=created_svcs["api-gateway"], target_service_id=created_svcs["auth-service"], dependency_type="http", is_critical=True, description="Authentication gateway check"))
            if "api-gateway" in created_svcs and "billing-api" in created_svcs:
                db.add(ServiceDependency(source_service_id=created_svcs["api-gateway"], target_service_id=created_svcs["billing-api"], dependency_type="http", is_critical=True, description="Payment routing ingress"))
            if "billing-api" in created_svcs and "database-proxy" in created_svcs:
                db.add(ServiceDependency(source_service_id=created_svcs["billing-api"], target_service_id=created_svcs["database-proxy"], dependency_type="tcp", is_critical=True, description="Transactional state persistence"))
            if "telemetry-worker" in created_svcs and "database-proxy" in created_svcs:
                db.add(ServiceDependency(source_service_id=created_svcs["telemetry-worker"], target_service_id=created_svcs["database-proxy"], dependency_type="tcp", is_critical=False, description="Aggregated metric buffer"))

            db.commit()

        # 3. Seed Playbooks
        recovery_engine.seed_playbooks(db)

        # 4. Seed initial metrics if empty
        if not db.query(MetricSample).first():
            telemetry_collector.collect_and_store(db)

    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    init_seed_data()
    
    worker_task = None
    if os.getenv("PHOENIX_ENV") != "testing" and not os.getenv("TESTING"):
        worker_task = asyncio.create_task(telemetry_worker.run_loop())
    
    yield
    
    if worker_task:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Enterprise Autonomous Self-Healing Digital Infrastructure. Detect. Diagnose. Predict. Recover. Verify.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include V1 Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(metrics_router, prefix=settings.API_V1_PREFIX)
app.include_router(services_router, prefix=settings.API_V1_PREFIX)
app.include_router(anomalies_router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions_router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)
app.include_router(recovery_router, prefix=settings.API_V1_PREFIX)
app.include_router(sandbox_router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(assistant_router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)

# Backward Compatibility Endpoints for baseline tests and existing integrations
@app.get("/health")
def health():
    return {"status": "ok", "service": "phoenix-api", "version": settings.PROJECT_VERSION, "simulation": True}

@app.get("/api/overview")
def legacy_overview(db: Session = Depends(get_db)):
    from .api.v1.dashboard import get_dashboard_overview
    return get_dashboard_overview(db)

@app.get("/api/metrics")
def legacy_metrics(limit: int = 60, db: Session = Depends(get_db)):
    from .api.v1.metrics import get_metrics
    return get_metrics(limit=limit, service=None, db=db)

@app.get("/api/incidents")
def legacy_incidents(limit: int = 30, db: Session = Depends(get_db)):
    from .api.v1.incidents import list_incidents
    return list_incidents(limit=limit, db=db)

@app.get("/api/actions")
def legacy_actions(db: Session = Depends(get_db)):
    from .api.v1.recovery import list_executions
    return list_executions(db=db)

@app.post("/api/demo/fault")
def legacy_fault(payload: dict, db: Session = Depends(get_db)):
    from .schemas.all_schemas import FaultInjectRequest
    from .api.v1.admin import inject_fault
    return inject_fault(FaultInjectRequest(type=payload.get("type", "clear"), target_service=payload.get("service", "api-gateway")), db=db)

@app.post("/api/demo/control")
def legacy_control(payload: dict, db: Session = Depends(get_db)):
    from .schemas.all_schemas import TelemetryControlRequest
    from .api.v1.admin import toggle_telemetry
    return toggle_telemetry(TelemetryControlRequest(running=payload.get("running", True)), db=db)

@app.post("/api/incidents/{incident_id}/acknowledge")
def legacy_ack(incident_id: int, db: Session = Depends(get_db)):
    from .schemas.all_schemas import IncidentAcknowledge
    from .api.v1.incidents import acknowledge_incident
    return acknowledge_incident(incident_id=incident_id, payload=IncidentAcknowledge(notes="Legacy ACK"), current_user=None, db=db)

@app.post("/api/recovery/plan")
def legacy_plan(payload: dict, db: Session = Depends(get_db)):
    from .schemas.all_schemas import RecoveryPlanRequest
    from .api.v1.recovery import create_recovery_plan
    inc_id = payload.get("incident_id")
    if not inc_id:
        raise HTTPException(400, "incident_id required")
    return create_recovery_plan(RecoveryPlanRequest(incident_id=inc_id), db=db)

@app.post("/api/recovery/execute")
def legacy_execute(payload: dict, db: Session = Depends(get_db)):
    from .schemas.all_schemas import RecoveryPlanRequest, RecoveryExecuteRequest
    from .api.v1.recovery import create_recovery_plan, execute_recovery_plan
    inc_id = payload.get("incident_id")
    plan = create_recovery_plan(RecoveryPlanRequest(incident_id=inc_id), db=db)
    return execute_recovery_plan(plan_id=plan["id"], payload=RecoveryExecuteRequest(plan_id=plan["id"], approved=payload.get("approved", True)), current_user=None, db=db)

# Static files / SPA Mount
dist_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
legacy_static_path = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_path, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
elif os.path.exists(legacy_static_path):
    app.mount("/static", StaticFiles(directory=legacy_static_path), name="static")
    @app.get("/", response_class=HTMLResponse)
    def home():
        index_file = os.path.join(legacy_static_path, "index.html")
        if os.path.exists(index_file):
            with open(index_file, encoding="utf-8") as f:
                return f.read()
        return "<h1>PHOENIX API Online</h1>"
