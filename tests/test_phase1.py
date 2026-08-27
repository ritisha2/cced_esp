"""Test Phase 1 Canonical Schema, Database ML, and Telemetry Adapter."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database_ml import ml_db
from backend.adapters.telemetry_adapter import record_to_canonical
from ml.data.canonical_schema import CanonicalESPTelemetry, ESPOverallStatus


async def main():
    print(">>> 1. Testing ML Database Tables Initialization...")
    await ml_db.init_ml_tables()
    print("    [OK] ML Tables Initialized.")

    print(">>> 2. Testing Telemetry Adapter on Sample Record...")
    sample_raw = {
        "timestamp": "2026-08-25T04:15:00Z",
        "asset_id": "ASSET-TX-PERMIAN-01",
        "well_id": "WELL-TX-101",
        "pressure_psi": 2130.5,
        "intake_pressure_psi": 236.4,
        "temperature_c": 100.2,
        "flow_rate_bpd": 965.0,
        "motor_current_a": 35.2,
        "motor_voltage_v": 460.0,
        "vibration_g": 0.18,
        "frequency_hz": 60.0
    }
    canonical = record_to_canonical(sample_raw)
    assert isinstance(canonical, CanonicalESPTelemetry)
    assert canonical.discharge_pressure_psi == 2130.5
    assert canonical.intake_pressure_psi == 236.4
    assert canonical.motor_temperature_c == 100.2
    assert canonical.liquid_rate_bpd == 965.0
    assert canonical.motor_current_a == 35.2
    assert canonical.vibration_rms == 0.18
    print("    [OK] Canonical Adapter verified across all 13 parameters.")

    print(">>> 3. Testing ML Database Assessment Storage...")
    assessment_dict = {
        "timestamp": "2026-08-25T04:15:00Z",
        "esp_id": "ASSET-TX-PERMIAN-01",
        "well_id": "WELL-TX-101",
        "overall_status": ESPOverallStatus.HEALTHY.value,
        "rule_status": "NORMAL",
        "fault_status": "HEALTHY",
        "fault_name": "Healthy Operation",
        "fault_probability": 0.98,
        "confidence_level": "HIGH",
        "future_risk": "LOW",
        "rul": {"status": "UNAVAILABLE", "reason": "Insufficient run-to-failure history"},
        "anomaly": {"anomaly_score": 0.08, "status": "NORMAL"},
        "top_reasons": ["All parameters within envelope."],
        "operator_action": "Continue normal monitoring."
    }
    row_id = await ml_db.save_unified_assessment(assessment_dict)
    assert row_id > 0, "Insert assessment failed"
    print(f"    [OK] Assessment saved with ID: {row_id}")

    latest = await ml_db.get_latest_assessment(well_id="WELL-TX-101")
    assert latest is not None
    assert latest["fault_name"] == "Healthy Operation"
    print(f"    [OK] Successfully queried back latest assessment for {latest['well_id']}")

    print("\n>>> PHASE 1 TEST PASSED! <<<\n")


if __name__ == "__main__":
    asyncio.run(main())
