from app.engine import analyze,predict_risk,recovery_plan
def test_cpu_anomaly():
    r=analyze({"cpu":96,"memory":50,"disk":60,"latency":1000,"availability":99.9},[])
    assert r["score"]>0 and any(x["metric"]=="cpu" for x in r["signals"])
def test_healthy():
    r=analyze({"cpu":30,"memory":45,"disk":50,"latency":120,"availability":99.99},[])
    assert r["score"]==0 and r["severity"]=="low"
def test_plan():
    p=recovery_plan({"signals":[{"metric":"memory"}]})
    assert p["action"]=="simulate_worker_recycle" and len(p["steps"])>=3
def test_risk_default():
    assert 0<=predict_risk([])["risk"]<=100
