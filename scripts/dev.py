#!/usr/bin/env python3
"""
PHOENIX Autonomous Self-Healing Digital Infrastructure
Full-Stack Development Orchestrator

Launches and monitors both the FastAPI backend and Vite frontend
in unified coordinated processes with graceful signal handling and clean shutdown.
"""

import os
import sys
import time
import signal
import shutil
import platform
import subprocess
import threading
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
IS_WINDOWS = platform.system() == "Windows"

# Color support
USE_COLOR = os.isatty(sys.stdout.fileno()) if hasattr(sys.stdout, "isatty") else False

def color(text: str, code: str) -> str:
    if not USE_COLOR:
        return text
    return f"\033[{code}m{text}\033[0m"

CYAN = "36"
BLUE = "34"
GREEN = "32"
YELLOW = "33"
RED = "31"
BOLD = "1"
MAGENTA = "35"

BANNER = f"""
{color("================================================================================", CYAN)}
  {color("PHOENIX", BOLD + ";" + CYAN)} — {color("Autonomous Self-Healing Digital Infrastructure", BOLD)}
  {color("Detect. Diagnose. Predict. Recover. Verify.", YELLOW)}
{color("================================================================================", CYAN)}
  • {color("Frontend Interface:", BOLD)}      {color("http://localhost:5173", GREEN)}
  • {color("FastAPI Backend:", BOLD)}        {color("http://localhost:8000", GREEN)}
  • {color("Swagger API Docs:", BOLD)}       {color("http://localhost:8000/docs", BLUE)}
  • {color("WebSocket Telemetry:", BOLD)}    {color("ws://localhost:8000/ws/telemetry", MAGENTA)}
{color("================================================================================", CYAN)}
  {color("[Press Ctrl+C at any time to shut down all services cleanly]", YELLOW)}
{color("--------------------------------------------------------------------------------", CYAN)}
"""

def check_environment():
    """Verify prerequisites before launching subprocesses."""
    print(color("[PHOENIX-INIT] Checking runtime environment...", CYAN))

    # 1. Python version
    if sys.version_info < (3, 10):
        print(color(f"[ERROR] Python 3.10+ required. Current: {sys.version}", RED))
        sys.exit(1)

    # 2. Python core packages
    required_packages = ["fastapi", "uvicorn", "sqlalchemy", "pydantic"]
    missing_packages = []
    for pkg in required_packages:
        try:
            __import__(pkg)
        except ImportError:
            missing_packages.append(pkg)
    
    if missing_packages:
        print(color(f"[ERROR] Missing Python packages: {', '.join(missing_packages)}", RED))
        print(color("Please run: pip install -r requirements.txt", YELLOW))
        sys.exit(1)

    # 3. Node & NPM
    node_bin = shutil.which("node")
    npm_bin = shutil.which("npm")
    if not node_bin or not npm_bin:
        print(color("[ERROR] Node.js or npm is not found in PATH.", RED))
        print(color("Please install Node.js 18+ to run the React/Vite frontend.", YELLOW))
        sys.exit(1)

    # 4. Frontend node_modules
    if not (FRONTEND_DIR / "node_modules").exists():
        print(color("[PHOENIX-INIT] Frontend node_modules missing. Running npm install...", YELLOW))
        cmd = ["npm", "install"]
        ret = subprocess.run(cmd, cwd=str(FRONTEND_DIR), shell=IS_WINDOWS)
        if ret.returncode != 0:
            print(color("[ERROR] Failed to install frontend dependencies.", RED))
            sys.exit(1)

    print(color("[PHOENIX-INIT] Prerequisites verified successfully.", GREEN))


def stream_logs(pipe, prefix: str, prefix_color: str):
    """Stream process stdout/stderr with clean colored tagging."""
    try:
        for line in iter(pipe.readline, ''):
            if not line:
                break
            clean_line = line.rstrip('\r\n')
            if clean_line:
                tag = color(f"[{prefix}]", prefix_color)
                print(f"{tag} {clean_line}", flush=True)
    except Exception:
        pass
    finally:
        try:
            pipe.close()
        except Exception:
            pass


def terminate_tree(pid: int):
    """Terminate a process and all its children cleanly."""
    if not pid:
        return
    try:
        if IS_WINDOWS:
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        else:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
    except Exception:
        pass


def main():
    check_environment()
    print(BANNER)

    shutdown_event = threading.Event()
    processes = []

    # Prepare commands
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "backend.app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
    ]

    npm_exec = "npm.cmd" if IS_WINDOWS else "npm"
    frontend_cmd = [npm_exec, "run", "dev"]

    try:
        # Launch Backend
        print(color("[PHOENIX-ORCHESTRATOR] Starting FastAPI Backend on port 8000...", CYAN))
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(ROOT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env=os.environ.copy()
        )
        processes.append(("BACKEND", backend_proc))

        t_backend = threading.Thread(
            target=stream_logs,
            args=(backend_proc.stdout, "PHOENIX-API", BLUE),
            daemon=True
        )
        t_backend.start()

        # Wait briefly for backend initialization
        time.sleep(1.5)

        # Launch Frontend
        print(color("[PHOENIX-ORCHESTRATOR] Starting React/Vite Frontend on port 5173...", CYAN))
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env=os.environ.copy(),
            shell=IS_WINDOWS
        )
        processes.append(("FRONTEND", frontend_proc))

        t_frontend = threading.Thread(
            target=stream_logs,
            args=(frontend_proc.stdout, "PHOENIX-UI", GREEN),
            daemon=True
        )
        t_frontend.start()

        # Signal handlers
        def handle_signal(sig, frame):
            print("\n" + color("[PHOENIX-ORCHESTRATOR] Termination requested. Shutting down full stack...", YELLOW))
            shutdown_event.set()

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        # Monitor loop
        while not shutdown_event.is_set():
            for name, proc in processes:
                poll = proc.poll()
                if poll is not None:
                    print(color(f"[PHOENIX-ORCHESTRATOR] Process {name} exited with status {poll}.", RED if poll != 0 else YELLOW))
                    shutdown_event.set()
                    break
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n" + color("[PHOENIX-ORCHESTRATOR] KeyboardInterrupt caught. Terminating all processes...", YELLOW))
    finally:
        print(color("[PHOENIX-ORCHESTRATOR] Cleaning up child processes...", CYAN))
        for name, proc in processes:
            if proc.poll() is None:
                terminate_tree(proc.pid)
        print(color("[PHOENIX-ORCHESTRATOR] All services stopped. PHOENIX shutdown complete.", GREEN))

if __name__ == "__main__":
    main()
