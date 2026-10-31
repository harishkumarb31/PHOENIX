from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import require_role
from ...models.service import Service, ServiceDependency
from ...schemas.all_schemas import ServiceCreate, ServiceUpdate

router = APIRouter(prefix="/services", tags=["Service Inventory"])

@router.get("")
def list_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "slug": s.slug,
            "description": s.description,
            "environment": s.environment,
            "host": s.host,
            "port": s.port,
            "endpoint": s.endpoint,
            "status": s.status,
            "health_score": s.health_score,
            "cpu": s.cpu,
            "memory": s.memory,
            "disk": s.disk,
            "latency": s.latency,
            "availability": s.availability,
            "error_rate": s.error_rate,
            "throughput": s.throughput,
            "monitoring_enabled": s.monitoring_enabled,
            "last_heartbeat": s.last_heartbeat.isoformat() if s.last_heartbeat else None
        }
        for s in services
    ]

@router.get("/dependencies")
def get_service_dependencies(db: Session = Depends(get_db)):
    deps = db.query(ServiceDependency).all()
    services = db.query(Service).all()
    svc_map = {s.id: s.name for s in services}
    
    return {
        "nodes": [{"id": s.id, "name": s.name, "status": s.status, "environment": s.environment} for s in services],
        "edges": [
            {
                "id": d.id,
                "source": d.source_service_id,
                "target": d.target_service_id,
                "source_name": svc_map.get(d.source_service_id, "unknown"),
                "target_name": svc_map.get(d.target_service_id, "unknown"),
                "type": d.dependency_type,
                "is_critical": d.is_critical
            }
            for d in deps
        ]
    }

@router.post("", dependencies=[Depends(require_role("infra_admin"))])
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    existing = db.query(Service).filter(Service.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service with this name already exists")
    
    svc = Service(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        environment=payload.environment,
        host=payload.host,
        port=payload.port,
        endpoint=payload.endpoint,
        monitoring_enabled=True
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc

@router.delete("/{service_id}", dependencies=[Depends(require_role("super_admin"))])
def delete_service(service_id: int, db: Session = Depends(get_db)):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(svc)
    db.commit()
    return {"message": f"Service {svc.name} deleted successfully"}
