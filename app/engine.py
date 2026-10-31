from statistics import mean
def analyze(m,history):
    signals=[]; score=0.0
    checks=[("cpu",m["cpu"],85,.28,"CPU saturation"),("memory",m["memory"],88,.28,"Memory pressure"),("disk",m["disk"],92,.16,"Disk capacity pressure"),("latency",m["latency"],850,.18,"Elevated response latency")]
    for key,val,limit,weight,label in checks:
        if val>=limit:
            signals.append({"metric":key,"value":round(val,2),"threshold":limit,"label":label}); score+=weight*min(1.0,val/limit-.55)
    if m["availability"]<98.5:
        signals.append({"metric":"availability","value":m["availability"],"threshold":98.5,"label":"Availability degradation"}); score+=.25
    if len(history)>=4:
        for key in ("cpu","memory","latency"):
            base=mean(float(x[key]) for x in history[-4:]); val=float(m[key])
            if base>0 and val>base*1.35 and val>(70 if key!="latency" else 500):
                if not any(s["metric"]==key for s in signals): signals.append({"metric":key,"value":round(val,2),"threshold":round(base*1.35,2),"label":f"Rapid {key} increase"})
                score+=.12
    score=round(min(.99,score),2); severity="critical" if score>=.72 else "high" if score>=.48 else "medium" if score>=.25 else "low"
    keys={s["metric"] for s in signals}
    diagnosis=("Likely memory pressure. Inspect process memory growth, cache sizing, and recent deployments." if "memory" in keys else
    "Likely compute saturation. Inspect request concurrency, expensive workloads, and worker utilization." if "cpu" in keys else
    "Likely storage pressure. Inspect log growth, temporary files, and retention policies." if "disk" in keys else
    "Likely service degradation. Inspect upstream latency, error rates, and connection pools." if keys else
    "No material anomaly detected. Service behavior is within configured operating thresholds.")
    return {"score":score,"severity":severity,"signals":signals,"diagnosis":diagnosis}
def predict_risk(h):
    if len(h)<3:return {"risk":8,"horizon":"15 min","trend":"insufficient history"}
    r=h[-6:]; slopes={k:max(0,float(r[-1][k])-float(r[0][k]))/max(1,len(r)-1) for k in ("cpu","memory","latency")}
    last=r[-1]; proximity=max(last["cpu"]/100,last["memory"]/100,last["disk"]/100,last["latency"]/1500)
    acceleration=min(.35,(slopes["cpu"]+slopes["memory"]+slopes["latency"]/20)/100)
    return {"risk":round(min(98,max(4,proximity*68+acceleration*100)),1),"horizon":"15 min","trend":"rising" if acceleration>.025 else "stable","drivers":slopes}
def recovery_plan(i):
    keys={s.get("metric") for s in i.get("signals",[])}
    if "memory" in keys: return {"title":"Relieve memory pressure","steps":["Inspect top memory-consuming processes","Validate cache and worker limits","Simulate controlled worker recycle","Verify memory returns below 80%"],"action":"simulate_worker_recycle","impact":"Medium","rollback":"Restore previous worker count if health worsens"}
    if "cpu" in keys: return {"title":"Reduce compute saturation","steps":["Inspect request and queue load","Simulate traffic throttling","Validate CPU trend and request latency","Remove throttle after stability"],"action":"simulate_traffic_throttle","impact":"Medium","rollback":"Remove traffic throttle"}
    if "disk" in keys: return {"title":"Restore storage headroom","steps":["Identify largest log and temporary paths","Simulate retention cleanup plan","Verify projected disk headroom","Require operator review before cleanup"],"action":"simulate_storage_cleanup","impact":"High","rollback":"Restore from approved backup if required"}
    return {"title":"Stabilize degraded service","steps":["Inspect upstream dependency health","Simulate connection-pool refresh","Verify latency and availability","Monitor for recurrence"],"action":"simulate_dependency_refresh","impact":"Low","rollback":"Restore previous connection-pool configuration"}
