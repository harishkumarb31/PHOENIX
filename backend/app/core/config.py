import os
from typing import List

class Settings:
    PROJECT_NAME: str = "PHOENIX — Autonomous Self-Healing Digital Infrastructure"
    PROJECT_VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("PHOENIX_SECRET_KEY", "phoenix-hyper-secure-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    DATABASE_URL: str = os.getenv("PHOENIX_DATABASE_URL", "sqlite:///./phoenix_v2.db")
    
    SIMULATION_MODE: bool = os.getenv("PHOENIX_SIMULATION_MODE", "true").lower() == "true"
    TELEMETRY_INTERVAL_SECONDS: float = float(os.getenv("PHOENIX_INTERVAL", "3.0"))
    MAX_METRIC_SAMPLES: int = int(os.getenv("PHOENIX_MAX_SAMPLES", "1000"))
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "*"
    ]
    
    # AI Assistant optional API key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
