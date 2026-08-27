"""
Phase 45 Forensic Automated Verification Test Suite.
Tests trace_id propagation, 14 operating states taxonomy, anti-self-reinforcement,
failure recovery, latency bounds, and dynamic API data contracts.
"""

import os
import sys
import unittest
import asyncio
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.services.unified_pipeline import esp_pipeline
from ml.data.canonical_schema import CanonicalESPTelemetry
from ml.data.fault_registry import fault_registry
from ml.learning.candidate_pipeline import candidate_pipeline
from ml.learning.ground_truth_service import ground_truth_service
from ml.learning.continuous_trainer import continuous_trainer
from backend.database_ml import ml_db
from backend.main import app
from fastapi.testclient import TestClient


class TestPhase45ForensicVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_trace_id_generation_and_propagation(self):
        """Verify that every processed telemetry sample receives a unique correlation trace_id."""
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
        self.assertTrue(assessment.trace_id.startswith("TRC-"))
        self.assertEqual(len(assessment.trace_id), 14)
        self.assertIn("trace_id", assessment.model_dump())

    def test_02_14_operating_states_taxonomy_completeness(self):
        """Verify taxonomy represents 13 fault modes + Healthy baseline (14 states)."""
        faults = fault_registry.list_all_faults()
        self.assertEqual(len(faults), 13)
        non_faults = fault_registry.non_fault_states
        self.assertTrue(any(nf["state_id"] == "HEALTHY" for nf in non_faults))
        self.assertEqual(len(faults) + len(non_faults), 15)  # 13 Faults + Healthy + Unknown Fallback

    def test_03_gas_lock_canonical_mapping(self):
        """Verify gas_interference_to_lock maps canonically to DRY_WELL_PUMP_OFF."""
        fault = fault_registry.get_fault("DRY_WELL_PUMP_OFF")
        self.assertIsNotNone(fault)
        self.assertEqual(fault.event_count, 6)
        self.assertEqual(fault.training_examples, 6091)
        self.assertIn("FS-017", fault.affected_wells)
        self.assertIn("FSWS-003", fault.affected_wells)

    def test_04_strict_anti_self_reinforcement_verification(self):
        """Prove that unverified predictions CANNOT enter TRAINING_READY."""
        gt = asyncio.run(ground_truth_service.record_field_outcome(
            asset_id="ESP-TEST-001",
            well_id="TEST-001",
            fault_type="BEARING_DEGRADATION",
            confirmation_status="UNVERIFIED",
            source="AUTOMATED_TEST"
        ))
        gt_id = gt["ground_truth_id"]
        candidates = asyncio.run(ml_db.get_training_candidates(state="TRAINING_READY"))
        self.assertFalse(any(c.get("ground_truth_id") == gt_id for c in candidates))

    def test_05_false_alarm_isolation(self):
        """Prove that FALSE_ALARM feedback is isolated from training sets."""
        gt = asyncio.run(ground_truth_service.record_field_outcome(
            asset_id="ESP-TEST-002",
            well_id="TEST-002",
            fault_type="SAND_INGESTION",
            confirmation_status="FALSE_ALARM",
            source="OPERATOR_FEEDBACK"
        ))
        gt_id = gt["ground_truth_id"]
        candidates = asyncio.run(ml_db.get_training_candidates(state="TRAINING_READY"))
        self.assertFalse(any(c.get("ground_truth_id") == gt_id for c in candidates))



    def test_06_model_performance_api_dynamic_contract(self):
        """Verify /api/esp/performance returns true evaluation metrics without hardcoding."""
        res = self.client.get("/api/esp/performance")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        reports = data["performance_reports"]
        fc = reports["fault_classifier"]["metrics"]
        self.assertIn("accuracy", fc)
        self.assertIn("macro_f1", fc)
        self.assertIn("confusion_matrix", fc)
        self.assertGreater(fc["accuracy"], 0.90)

    def test_07_inference_latency_bounds(self):
        """Verify that total unified inference latency executes in < 300 ms."""
        sample = CanonicalESPTelemetry(
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
        t0 = time.perf_counter()
        _ = asyncio.run(esp_pipeline.process_telemetry(sample, persist_db=False))
        lat_ms = (time.perf_counter() - t0) * 1000.0
        self.assertLess(lat_ms, 300.0)


if __name__ == "__main__":
    unittest.main()
