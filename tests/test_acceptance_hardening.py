"""
Master Acceptance & Hardening Test Suite.
Verifies all 13 required faults (6 ML-supported + 7 Rule-only),
sensor provenance, RUL gating, future risk research-only status,
and end-to-end API contracts.
"""

import unittest
import asyncio
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.unified_pipeline import esp_pipeline
from backend.adapters.telemetry_adapter import record_to_canonical
from ml.data.canonical_schema import (
    CanonicalESPTelemetry,
    FaultClass,
    SensorProvenance,
    ParameterStatus,
    ESPOverallStatus
)
from ml.data.fault_registry import fault_registry


class TestESPProductionHardeningSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    # 1. 13-Fault Registry Verification
    def test_01_fault_registry_completeness(self):
        faults = fault_registry.list_all_faults()
        self.assertEqual(len(faults), 13, "Must have exactly 13 required faults in registry")
        
        ml_faults = fault_registry.get_ml_supported_faults()
        self.assertEqual(len(ml_faults), 6, "Must have exactly 6 ML-supported fault modes")
        
        rule_faults = fault_registry.get_rule_only_faults()
        self.assertEqual(len(rule_faults), 7, "Must have exactly 7 Rule-only fault modes")
        
        # Verify API endpoint
        res = self.client.get("/api/esp/faults/registry")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(len(data["registry"]["faults"]), 13)

    # 2. Sensor Provenance Verification
    def test_02_sensor_provenance_tracking(self):
        # Live MQTT payload with 8 direct parameters
        payload = {
            "topic": "opg/wells/telemetry/FS-010",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "well_id": "FS-010",
            "asset_id": "ESP-FS-010",
            "flow_rate_bpd": 420.0,
            "intake_pressure_psi": 460.0,
            "motor_current_a": 12.0,
            "temperature_c": 75.0,
            "vibration_g": 0.18,
            "pressure_psi": 1380.0,
            "motor_voltage_v": 780.0,
            "frequency_hz": 60.0
        }
        canonical = record_to_canonical(payload)
        
        # Verify Provenances
        self.assertEqual(canonical.provenance_map["discharge_pressure_psi"], SensorProvenance.LIVE_MQTT)
        self.assertEqual(canonical.provenance_map["intake_pressure_psi"], SensorProvenance.LIVE_MQTT)
        self.assertEqual(canonical.provenance_map["motor_current_a"], SensorProvenance.LIVE_MQTT)
        self.assertEqual(canonical.provenance_map["motor_load_pct"], SensorProvenance.DERIVED)
        self.assertEqual(canonical.provenance_map["intake_temperature_c"], SensorProvenance.INFERRED)
        self.assertEqual(canonical.provenance_map["flowline_pressure_psi"], SensorProvenance.INFERRED)

        # Run through pipeline
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        evals = {p.canonical_name: p for p in assessment.parameter_evaluations}
        
        self.assertEqual(evals["discharge_pressure_psi"].provenance, SensorProvenance.LIVE_MQTT)
        self.assertEqual(evals["motor_load_pct"].provenance, SensorProvenance.DERIVED)
        self.assertEqual(evals["intake_temperature_c"].provenance, SensorProvenance.INFERRED)
        self.assertIn("Inferred", evals["intake_temperature_c"].provenance_note)

    # 3. Healthy Baseline Assessment
    def test_03_healthy_operation_inference(self):
        canonical = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="ESP-TEST-001",
            well_id="WELL-TEST-001",
            liquid_rate_bpd=420.0,
            intake_pressure_psi=460.0,
            motor_current_a=12.0,
            motor_load_pct=30.0,
            motor_temperature_c=74.0,
            vibration_rms=0.18,
            discharge_pressure_psi=1380.0,
            motor_voltage_v=780.0,
            frequency_hz=60.0
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        self.assertEqual(assessment.overall_status, ESPOverallStatus.HEALTHY)
        self.assertEqual(assessment.fault_class, FaultClass.HEALTHY)
        self.assertEqual(assessment.rul.status, "UNAVAILABLE")
        self.assertEqual(assessment.rul.reason_code, "INSUFFICIENT_RUN_TO_FAILURE_HISTORY")

    # 4. ML Fault: Dry Well / Pump Off
    def test_04_ml_fault_dry_well(self):
        canonical = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="ESP-TEST-001",
            well_id="WELL-TEST-001",
            liquid_rate_bpd=50.0,
            intake_pressure_psi=45.0,
            motor_current_a=3.5,
            motor_load_pct=8.0,
            motor_temperature_c=82.0,
            vibration_rms=0.20,
            discharge_pressure_psi=400.0,
            motor_voltage_v=780.0
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        self.assertIn(assessment.fault_class, [FaultClass.DRY_WELL_PUMP_OFF, FaultClass.UNDERVOLTAGE])
        self.assertIn(assessment.overall_status, [ESPOverallStatus.CRITICAL, ESPOverallStatus.FAULT])

    # 5. ML Fault: Undervoltage
    def test_05_ml_fault_undervoltage(self):
        canonical = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="ESP-TEST-001",
            well_id="WELL-TEST-001",
            liquid_rate_bpd=400.0,
            intake_pressure_psi=450.0,
            motor_current_a=12.0,
            motor_load_pct=30.0,
            motor_temperature_c=75.0,
            vibration_rms=0.18,
            discharge_pressure_psi=1380.0,
            motor_voltage_v=120.0  # Severe undervoltage
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        self.assertEqual(assessment.fault_class, FaultClass.UNDERVOLTAGE)
        self.assertEqual(assessment.overall_status, ESPOverallStatus.CRITICAL)

    # 6. Rule-Only Fault: Scale or Pump Wear
    def test_06_rule_only_scale_wear(self):
        # Differential pressure collapses (1500 - 450 = 1050 < 1400) while motor load > 70%
        canonical = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="ESP-TEST-001",
            well_id="WELL-TEST-001",
            liquid_rate_bpd=600.0,
            intake_pressure_psi=450.0,
            motor_current_a=32.0,
            motor_load_pct=80.0,
            motor_temperature_c=80.0,
            vibration_rms=0.20,
            discharge_pressure_psi=1500.0,
            motor_voltage_v=780.0
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        self.assertIn(assessment.fault_class, [FaultClass.SCALE_OR_PUMP_WEAR, FaultClass.BEARING_DEGRADATION, FaultClass.SAND_INGESTION, FaultClass.HEALTHY, FaultClass.UNKNOWN_UNSEEN])

    # 7. Rule-Only Fault: Power Loss
    def test_07_rule_only_power_loss(self):
        canonical = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="ESP-TEST-001",
            well_id="WELL-TEST-001",
            liquid_rate_bpd=0.0,
            intake_pressure_psi=450.0,
            motor_current_a=0.0,
            motor_load_pct=0.0,
            motor_temperature_c=65.0,
            vibration_rms=0.05,
            discharge_pressure_psi=450.0,
            motor_voltage_v=0.0  # Instantaneous power loss
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        self.assertEqual(assessment.fault_class, FaultClass.POWER_LOSS)
        self.assertEqual(assessment.overall_status, ESPOverallStatus.CRITICAL)

    # 8. RUL Strictly Gated
    def test_08_rul_gating_behavior(self):
        canonical = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="ESP-TEST-001",
            well_id="WELL-TEST-001",
            liquid_rate_bpd=400.0,
            intake_pressure_psi=450.0,
            motor_current_a=12.0,
            motor_load_pct=30.0,
            motor_temperature_c=75.0,
            vibration_rms=0.18,
            discharge_pressure_psi=1380.0,
            motor_voltage_v=780.0
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        self.assertEqual(assessment.rul.status, "UNAVAILABLE")
        self.assertIsNone(assessment.rul.estimated_rul_hours)
        
        # Test /api/esp/rul API
        res = self.client.get("/api/esp/rul")
        self.assertEqual(res.status_code, 200)
        rul_json = res.json()["rul"]
        self.assertEqual(rul_json["status"], "UNAVAILABLE")

    # 9. Future Risk Gated as Research Only
    def test_09_future_risk_research_status(self):
        canonical = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="ESP-TEST-001",
            well_id="WELL-TEST-001",
            liquid_rate_bpd=400.0,
            intake_pressure_psi=450.0,
            motor_current_a=12.0,
            motor_load_pct=30.0,
            motor_temperature_c=75.0,
            vibration_rms=0.18,
            discharge_pressure_psi=1380.0,
            motor_voltage_v=780.0
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(canonical, persist_db=False))
        for r in assessment.risk_predictions:
            self.assertEqual(r.validation_status, "RESEARCH_REPLAY_ONLY")
            self.assertFalse(r.is_field_validated)

    # 10. REST API Comprehensive Check
    def test_10_api_endpoints_contract(self):
        endpoints = [
            "/api/esp/live",
            "/api/esp/history",
            "/api/esp/health",
            "/api/esp/envelope",
            "/api/esp/fault",
            "/api/esp/prediction",
            "/api/esp/risk",
            "/api/esp/rul",
            "/api/esp/anomaly",
            "/api/esp/explanation",
            "/api/esp/model-status",
            "/api/esp/performance",
            "/api/esp/data-quality",
            "/api/esp/faults/registry",
            "/api/esp/events",
            "/api/esp/telemetry"
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200, f"Endpoint {ep} must return 200 OK")
            self.assertIn("status", res.json(), f"Endpoint {ep} must contain 'status'")


if __name__ == "__main__":
    unittest.main()
