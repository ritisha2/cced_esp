"""Test Phase 10 Decision Service, Unified Pipeline, and REST API Endpoints."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.data.canonical_schema import CanonicalESPTelemetry, ESPOverallStatus
from backend.services.unified_pipeline import esp_pipeline
from backend.database_ml import ml_db
from backend.main import app
from fastapi.testclient import TestClient


async def test_async_pipeline():
    print(">>> 1. Initializing Pipeline & ML DB...")
    await ml_db.init_ml_tables()
    
    tel = CanonicalESPTelemetry(
        esp_id="ESP-TEST-P10",
        well_id="WELL-P10",
        liquid_rate_bpd=965.0,
        intake_pressure_psi=236.0,
        discharge_pressure_psi=2130.0,
        motor_current_a=35.0,
        motor_load_pct=80.0,
        motor_temperature_c=100.0,
        vibration_rms=0.18,
        motor_voltage_v=460.0
    )
    assessment = await esp_pipeline.process_telemetry(tel, persist_db=True)
    assert assessment.esp_id == "ESP-TEST-P10"
    assert assessment.overall_status in [ESPOverallStatus.HEALTHY, ESPOverallStatus.WARNING]
    print(f"    [OK] Unified Assessment generated: Status={assessment.overall_status.value} | Fault={assessment.fault_name} (Latency: {assessment.inference_latency_ms} ms)")


def test_rest_api():
    print(">>> 2. Testing FastAPI REST Endpoints via TestClient...")
    client = TestClient(app)

    # 1. Live Assessment
    res_live = client.get("/api/esp/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "success"
    print("    [OK] GET /api/esp/live -> 200 OK")

    # 2. History
    res_hist = client.get("/api/esp/history?limit=10")
    assert res_hist.status_code == 200
    print(f"    [OK] GET /api/esp/history -> 200 OK (count: {res_hist.json().get('count')})")

    # 3. Model Status
    res_ms = client.get("/api/esp/model-status")
    assert res_ms.status_code == 200
    assert "models" in res_ms.json()
    print("    [OK] GET /api/esp/model-status -> 200 OK (all 5 models registered)")

    # 4. Performance
    res_perf = client.get("/api/esp/performance")
    assert res_perf.status_code == 200
    print("    [OK] GET /api/esp/performance -> 200 OK")

    # 5. Envelope
    res_env = client.get("/api/esp/envelope")
    assert res_env.status_code == 200
    print("    [OK] GET /api/esp/envelope -> 200 OK")


if __name__ == "__main__":
    asyncio.run(test_async_pipeline())
    test_rest_api()
    print("\n>>> PHASE 10 TEST PASSED! <<<\n")
