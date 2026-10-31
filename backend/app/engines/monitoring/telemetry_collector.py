import random
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ...models.service import Service
from ...models.telemetry import MetricSample
from ...core.config import settings

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    psutil = None
    PSUTIL_AVAILABLE = False


class TelemetryCollector:
    def __init__(self):
        self.active_fault: Optional[str] = None
        self.fault_target_service: Optional[str] = None
        self.fault_start_time: Optional[float] = None

    def set_fault(self, fault_type: Optional[str], target_service: Optional[str] = None):
        self.active_fault = fault_type if fault_type != "clear" else None
        self.fault_target_service = target_service or "api-gateway"
        self.fault_start_time = time.time() if self.active_fault else None

    def get_host_metrics(self) -> Dict[str, Any]:
        """Collects actual local operating-system metrics using psutil."""
        if not PSUTIL_AVAILABLE:
            return {
                "available": False,
                "reason": "psutil not installed or host metrics unsupported"
            }
        try:
            cpu_pct = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            root_path = os.path.splitdrive(os.getcwd())[0] + "\\" if os.name == "nt" else "/"
            disk = psutil.disk_usage(root_path)
            net_io = psutil.net_io_counters()
            return {
                "available": True,
                "cpu": round(cpu_pct, 1),
                "memory": round(mem.percent, 1),
                "memory_used_mb": round(mem.used / (1024 * 1024), 1),
                "memory_total_mb": round(mem.total / (1024 * 1024), 1),
                "disk": round(disk.percent, 1),
                "disk_free_gb": round(disk.free / (1024 * 1024 * 1024), 1),
                "network_sent_mb": round(net_io.bytes_sent / (1024 * 1024), 1),
                "network_recv_mb": round(net_io.bytes_recv / (1024 * 1024), 1),
                "process_count": len(psutil.pids()),
                "source": "psutil_host"
            }
        except Exception as e:
            return {
                "available": False,
                "error": str(e),
                "source": "psutil_host"
            }

    def generate_service_sample(self, service: Service) -> Dict[str, Any]:
        """Generates realistic telemetry for microservices, respecting active faults."""
        is_faulted = (self.active_fault is not None and 
                      (self.fault_target_service == "*" or self.fault_target_service == service.name))
        
        base_cpu = 28.0 + (hash(service.name) % 15)
        base_mem = 45.0 + (hash(service.name) % 18)
        base_disk = 55.0 + (hash(service.name) % 12)
        base_lat = 95.0 + (hash(service.name) % 40)
        base_avail = 99.95
        base_err = 0.01
        base_tps = 350.0 + (hash(service.name) % 200)

        # Baseline jitter
        cpu = base_cpu + random.uniform(-4.0, 5.0)
        mem = base_mem + random.uniform(-1.5, 2.0)
        disk = base_disk + random.uniform(-0.2, 0.3)
        lat = base_lat + random.uniform(-15.0, 25.0)
        avail = base_avail - random.uniform(0.0, 0.05)
        err = max(0.0, base_err + random.uniform(-0.005, 0.01))
        tps = base_tps + random.uniform(-25.0, 35.0)
        net = 35.0 + random.uniform(-5.0, 15.0)

        # Apply synthetic fault scenario
        if is_faulted:
            if self.active_fault == "cpu":
                cpu = random.uniform(88.5, 98.2)
                lat = random.uniform(550.0, 1150.0)
                tps = max(50.0, tps * 0.4)
                err = random.uniform(0.04, 0.12)
            elif self.active_fault == "memory":
                mem = random.uniform(91.0, 97.8)
                lat = random.uniform(420.0, 890.0)
                err = random.uniform(0.03, 0.09)
            elif self.active_fault == "disk":
                disk = random.uniform(93.5, 98.9)
                err = random.uniform(0.05, 0.15)
            elif self.active_fault == "latency":
                lat = random.uniform(850.0, 1750.0)
                avail = random.uniform(96.0, 98.4)
                err = random.uniform(0.06, 0.18)
            elif self.active_fault == "outage":
                avail = random.uniform(82.0, 91.0)
                err = random.uniform(0.25, 0.65)
                lat = random.uniform(1800.0, 3500.0)

        return {
            "service_id": service.id,
            "service_name": service.name,
            "cpu": round(max(1.0, min(100.0, cpu)), 1),
            "memory": round(max(1.0, min(100.0, mem)), 1),
            "disk": round(max(1.0, min(100.0, disk)), 1),
            "network": round(max(0.0, net), 1),
            "latency": round(max(5.0, lat), 1),
            "availability": round(max(0.0, min(100.0, avail)), 2),
            "error_rate": round(max(0.0, min(1.0, err)), 3),
            "throughput": round(max(0.0, tps), 1),
            "is_simulated": True
        }

    def collect_and_store(self, db: Session) -> List[MetricSample]:
        """Collects metrics for all active services, persists them, updates service status, and trims history."""
        services = db.query(Service).filter(Service.monitoring_enabled == True).all()
        created_samples = []
        now = datetime.now(timezone.utc)

        for svc in services:
            sample_data = self.generate_service_sample(svc)
            sample = MetricSample(
                timestamp=now,
                service_id=svc.id,
                service_name=svc.name,
                cpu=sample_data["cpu"],
                memory=sample_data["memory"],
                disk=sample_data["disk"],
                network=sample_data["network"],
                latency=sample_data["latency"],
                availability=sample_data["availability"],
                error_rate=sample_data["error_rate"],
                throughput=sample_data["throughput"],
                source="cluster_telemetry_engine",
                is_simulated=sample_data["is_simulated"]
            )
            db.add(sample)
            created_samples.append(sample)

            # Update latest service snapshot
            svc.cpu = sample_data["cpu"]
            svc.memory = sample_data["memory"]
            svc.disk = sample_data["disk"]
            svc.latency = sample_data["latency"]
            svc.availability = sample_data["availability"]
            svc.error_rate = sample_data["error_rate"]
            svc.throughput = sample_data["throughput"]
            svc.last_heartbeat = now
            
            # Health classification
            if svc.cpu > 90 or svc.memory > 92 or svc.disk > 95 or svc.availability < 96:
                svc.status = "critical"
                svc.health_score = round(max(30.0, 100 - (svc.cpu * 0.4 + svc.memory * 0.3)), 1)
            elif svc.cpu > 75 or svc.memory > 80 or svc.latency > 500 or svc.availability < 98.5:
                svc.status = "degraded"
                svc.health_score = round(max(60.0, 100 - (svc.cpu * 0.2 + svc.memory * 0.2)), 1)
            else:
                svc.status = "healthy"
                svc.health_score = round(min(100.0, 99.0 + random.uniform(0.0, 1.0)), 1)

        db.commit()

        # Prune old samples beyond max retention
        total_samples = db.query(MetricSample).count()
        if total_samples > settings.MAX_METRIC_SAMPLES:
            excess = total_samples - settings.MAX_METRIC_SAMPLES
            old_ids = [row[0] for row in db.query(MetricSample.id).order_by(MetricSample.id.asc()).limit(excess).all()]
            if old_ids:
                db.query(MetricSample).filter(MetricSample.id.in_(old_ids)).delete(synchronize_session=False)
                db.commit()

        return created_samples

telemetry_collector = TelemetryCollector()
