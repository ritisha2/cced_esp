# PowerShell launcher for OPG Wells Platform
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  OPG Wells Time-Series Ingestion & Dashboard" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting FastAPI server at http://localhost:8000 ..." -ForegroundColor Yellow
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
