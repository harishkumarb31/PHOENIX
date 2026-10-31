import os, sqlite3, json
from datetime import datetime, timezone
DB_PATH = os.getenv("PHOENIX_DB_PATH", "phoenix.db")
def connect():
    c=sqlite3.connect(DB_PATH,check_same_thread=False); c.row_factory=sqlite3.Row; return c
def now(): return datetime.now(timezone.utc).isoformat()
def init_db():
    with connect() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS metrics(id INTEGER PRIMARY KEY,ts TEXT,cpu REAL,memory REAL,disk REAL,network REAL,latency REAL,availability REAL,service TEXT);
        CREATE TABLE IF NOT EXISTS incidents(id INTEGER PRIMARY KEY,ts TEXT,title TEXT,severity TEXT,status TEXT,score REAL,diagnosis TEXT,signals TEXT,source TEXT);
        CREATE TABLE IF NOT EXISTS actions(id INTEGER PRIMARY KEY,ts TEXT,incident_id INTEGER,action TEXT,status TEXT,result TEXT,verification TEXT);
        CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,ts TEXT,kind TEXT,message TEXT);
        """)
def add_metric(m):
    with connect() as c: c.execute("INSERT INTO metrics(ts,cpu,memory,disk,network,latency,availability,service) VALUES(?,?,?,?,?,?,?,?)",(m.get("ts") or now(),m["cpu"],m["memory"],m["disk"],m["network"],m["latency"],m["availability"],m.get("service","api-gateway")))
def recent_metrics(n=60):
    with connect() as c: return [dict(x) for x in c.execute("SELECT * FROM metrics ORDER BY id DESC LIMIT ?",(n,)).fetchall()][::-1]
def add_incident(title,severity,score,diagnosis,signals,source="monitor"):
    with connect() as c:
        cur=c.execute("INSERT INTO incidents(ts,title,severity,status,score,diagnosis,signals,source) VALUES(?,?,?,?,?,?,?,?)",(now(),title,severity,"open",score,diagnosis,json.dumps(signals),source)); return cur.lastrowid
def incidents(n=30):
    with connect() as c:
        out=[]
        for x in c.execute("SELECT * FROM incidents ORDER BY id DESC LIMIT ?",(n,)).fetchall():
            d=dict(x); d["signals"]=json.loads(d["signals"] or "[]"); out.append(d)
        return out
def update_incident(i,s):
    with connect() as c: return c.execute("UPDATE incidents SET status=? WHERE id=?",(s,i)).rowcount>0
def add_action(i,a,s,r,v):
    with connect() as c:
        cur=c.execute("INSERT INTO actions(ts,incident_id,action,status,result,verification) VALUES(?,?,?,?,?,?)",(now(),i,a,s,r,v)); return cur.lastrowid
def actions(n=30):
    with connect() as c: return [dict(x) for x in c.execute("SELECT * FROM actions ORDER BY id DESC LIMIT ?",(n,)).fetchall()]
def add_event(k,m):
    with connect() as c: c.execute("INSERT INTO events(ts,kind,message) VALUES(?,?,?)",(now(),k,m))
def events(n=30):
    with connect() as c: return [dict(x) for x in c.execute("SELECT * FROM events ORDER BY id DESC LIMIT ?",(n,)).fetchall()]
