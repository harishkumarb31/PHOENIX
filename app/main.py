import asyncio,random
from contextlib import asynccontextmanager
from fastapi import FastAPI,HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field
from . import database as db
from .engine import analyze,predict_risk,recovery_plan
state={"running":True,"fault":None,"latest":None}
services=["api-gateway","auth-service","telemetry-worker","database-proxy"]
def generate():
    f=state["fault"]; cpu=random.uniform(24,58); mem=random.uniform(38,66); disk=random.uniform(48,73); lat=random.uniform(85,240); av=random.uniform(99.92,100)
    if f=="cpu": cpu=random.uniform(88,98); lat=random.uniform(650,1250)
    if f=="memory": mem=random.uniform(90,98); lat=random.uniform(500,950)
    if f=="disk": disk=random.uniform(93,99)
    if f=="latency": lat=random.uniform(900,1600); av=random.uniform(96.5,99)
    return {"cpu":round(cpu,1),"memory":round(mem,1),"disk":round(disk,1),"network":round(random.uniform(18,76),1),"latency":round(lat,0),"availability":round(av,2),"service":random.choice(services)}
async def loop():
    while True:
        if state["running"]:
            m=generate(); db.add_metric(m); h=db.recent_metrics(12); a=analyze(m,h[:-1]); state["latest"]={**m,**a}
            if a["score"]>=.25:
                old=db.incidents(1)
                if not old or old[0]["status"]!="open" or old[0]["title"]!=a["diagnosis"][:80]:
                    db.add_incident(a["diagnosis"][:80],a["severity"],a["score"],a["diagnosis"],a["signals"]); db.add_event("incident",a["severity"].upper()+" anomaly detected — "+a["diagnosis"])
        await asyncio.sleep(3)
@asynccontextmanager
async def lifespan(app):
    db.init_db()
    if not db.recent_metrics(1):
        for _ in range(12): db.add_metric(generate())
    task=asyncio.create_task(loop()); yield; task.cancel()
app=FastAPI(title="PHOENIX Infrastructure Intelligence",version="1.0.0",lifespan=lifespan)
app.mount("/static",StaticFiles(directory="app/static"),name="static")
@app.get("/",response_class=HTMLResponse)
def home():
    with open("app/static/index.html",encoding="utf-8") as f:return f.read()
@app.get("/health")
def health():return {"status":"ok","service":"phoenix-api","simulation":True}
@app.get("/api/overview")
def overview():
    h=db.recent_metrics(60); m=state["latest"] or h[-1]; inc=[i for i in db.incidents(100) if i["status"]=="open"]
    return {"metrics":m,"risk":predict_risk(h),"incidents":inc[:8],"incident_count":len(inc),"actions":db.actions(5),"events":db.events(8),"telemetry_running":state["running"],"fault":state["fault"],"mode":"SIMULATION"}
@app.get("/api/metrics")
def metrics(limit:int=60):return db.recent_metrics(max(1,min(limit,300)))
@app.get("/api/incidents")
def get_incidents(limit:int=30):return db.incidents(max(1,min(limit,100)))
@app.get("/api/actions")
def get_actions(limit:int=30):return db.actions(max(1,min(limit,100)))
class Telemetry(BaseModel):
    cpu:float=Field(ge=0,le=100); memory:float=Field(ge=0,le=100); disk:float=Field(ge=0,le=100)
    network:float=Field(ge=0); latency:float=Field(ge=0); availability:float=Field(ge=0,le=100); service:str="external-service"
@app.post("/api/telemetry")
def ingest(p:Telemetry):
    m=p.model_dump(); db.add_metric(m); h=db.recent_metrics(12); a=analyze(m,h[:-1])
    if a["score"]>=.25:db.add_incident(a["diagnosis"][:80],a["severity"],a["score"],a["diagnosis"],a["signals"],"external")
    db.add_event("ingest","External telemetry received from "+m["service"]); return {"accepted":True,"analysis":a}
@app.post("/api/demo/fault")
def fault(p:dict):
    k=p.get("type")
    if k not in ("cpu","memory","disk","latency","clear"):raise HTTPException(400,"Use cpu, memory, disk, latency or clear")
    state["fault"]=None if k=="clear" else k; db.add_event("simulation","Fault scenario: "+k); return {"ok":True,"fault":state["fault"]}
@app.post("/api/demo/control")
def control(p:dict):
    if not isinstance(p.get("running"),bool):raise HTTPException(400,"running must be boolean")
    state["running"]=p["running"]; db.add_event("control","Telemetry "+("resumed" if state["running"] else "paused")); return {"running":state["running"]}
@app.post("/api/incidents/{incident_id}/acknowledge")
def ack(incident_id:int):
    if not db.update_incident(incident_id,"acknowledged"):raise HTTPException(404,"Incident not found")
    db.add_event("incident",f"Incident #{incident_id} acknowledged"); return {"ok":True}
@app.post("/api/recovery/plan")
def plan(p:dict):
    found=[i for i in db.incidents(100) if i["id"]==p.get("incident_id")]
    if not found:raise HTTPException(404,"Incident not found")
    return recovery_plan(found[0])
@app.post("/api/recovery/execute")
def execute(p:dict):
    if p.get("approved") is not True:raise HTTPException(403,"Explicit operator approval is required")
    found=[i for i in db.incidents(100) if i["id"]==p.get("incident_id")]
    if not found:raise HTTPException(404,"Incident not found")
    plan=recovery_plan(found[0]); result="Recovery action simulated in isolated, non-invasive demonstration mode."
    verify="Verification record saved. A stable telemetry window is required for production-grade confirmation."
    aid=db.add_action(found[0]["id"],plan["action"],"simulated",result,verify); db.add_event("recovery",f"Approved recovery simulation completed for incident #{found[0]['id']}")
    return {"action_id":aid,"status":"simulated","result":result,"verification":verify,"plan":plan}
