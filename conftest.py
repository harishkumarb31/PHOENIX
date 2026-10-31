import sys
import os

# Set testing environment flag to disable background worker during pytest
os.environ["TESTING"] = "1"
os.environ["PHOENIX_DATABASE_URL"] = "sqlite:///./phoenix_test.db"

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app.core.database import engine, Base
from backend.app.main import init_seed_data

# Create all tables and seed default data for tests
Base.metadata.create_all(bind=engine)
init_seed_data()
