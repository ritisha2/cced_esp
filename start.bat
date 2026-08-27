@echo off
title OPG Wells Telemetry & Asset Ledger Platform
echo ===================================================
echo   OPG Wells Time-Series Ingestion & Dashboard
echo ===================================================
echo.
echo Installing / verifying dependencies...
python -m pip install -r requirements.txt
echo.
echo Starting FastAPI server at http://localhost:8000 ...
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
