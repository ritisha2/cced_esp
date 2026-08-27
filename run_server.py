"""
Production runner script for FastAPI Backend and Static Frontend.
"""

import sys
import uvicorn
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    print("[SERVER] Starting OPG & ESP Intelligence Platform at http://127.0.0.1:8000 ...", flush=True)
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        log_level="info",
        access_log=True
    )
