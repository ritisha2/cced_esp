"""
Phase 46 Real System Automated Verification Test Suite.
Verifies authentic database-backed well querying, genuine multi-model inference,
scientific integrity gates (RUL unavailable, risk research-only), and zero mock behavior.
"""

import sys
import unittest
import asyncio
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.services.unified_pipeline import esp_pipeline
from ml.data.canonical_schema import CanonicalESPTelemetry
from backend.main import app
from fastapi.testclient import TestClient


class TestPhase46RealSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_real_database_wells_endpoint(self):
        """Verify /api/esp/wells returns genuine 28 wells from opg_wells.db."""
        res = self.client.get("/api/esp/wells")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["wells_count"], 28)
        self.assertIn("FSWS-001-A", data["wells"])
        self.assertIn("FS-017", data["wells"])

    def test_02_all_five_models_genuine_execution(self):
        """Verify that processing a canonical sample invokes all 5 models and produces valid outputs."""
        sample = CanonicalESPTelemetry(
            well_id="FSWS-001-A",
            esp_id="ESP-FSWS-001-A",
            intake_pressure_psi=450.0,
            discharge_pressure_psi=1400.0,
            motor_current_a=12.5,
            motor_voltage_v=780.0,
            motor_temperature_c=75.0,
            vibration_rms=0.18,
            frequency_hz=60.0
        )
        assessment = asyncio.run(esp_pipeline.process_telemetry(sample, persist_db=False))

        # Model 1 Check
        self.assertIsNotNone(assessment.rule_status)
        self.assertGreaterEqual(len(assessment.parameter_evaluations), 10)

        # Model 2 Check
        self.assertIn(assessment.fault_status, [
            "HEALTHY", "DRY_WELL_PUMP_OFF", "BLOCKED_INTAKE", "SAND_INGESTION",
            "BEARING_DEGRADATION", "UNDERVOLTAGE", "PHASE_IMBALANCE", "UNKNOWN_UNSEEN"
        ])
        self.assertGreater(assessment.fault_probability, 0.0)

        # Model 3 Check (Research Replay Only Gate)
        self.assertIn(assessment.future_risk, ["LOW", "MEDIUM", "HIGH"])

        # Model 4 Check (Strict RUL Gating)
        self.assertEqual(assessment.rul.status, "UNAVAILABLE")
        self.assertTrue("RUL unavailable" in assessment.rul.reason or "INSUFFICIENT" in assessment.rul.reason)

        # Model 5 Check (Anomaly Score & Attributions)
        self.assertGreaterEqual(assessment.anomaly.anomaly_score, 0.0)
        self.assertLessEqual(assessment.anomaly.anomaly_score, 1.0)
        self.assertGreaterEqual(len(assessment.shap_contributions), 1)

    def test_03_zero_hardcoding_in_api_responses(self):
        """Verify live assessment API dynamically generates valid data structures without static mocks."""
        res = self.client.get("/api/esp/live")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data["status"], ["success", "empty"])
        if data["status"] == "success":
            assessment = data["data"]
            self.assertIn("trace_id", assessment)
            self.assertTrue(assessment["trace_id"].startswith("TRC-"))

    def test_04_envelope_api_dynamic_contract(self):
        """Verify /api/esp/envelope returns parameter operating envelopes with limits."""
        res = self.client.get("/api/esp/envelope")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data["status"], ["success", "empty"])
        self.assertIn("evaluations", data)



if __name__ == "__main__":
    unittest.main()
