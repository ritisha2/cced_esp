"""
Continuous Learning, Field Ground Truth Verification & Model Governance Test Suite.
Tests all Phase 43 / Phase 41 requirements:
- Raw telemetry immutability & preservation
- Prediction event logging
- Ground truth capture & event matching
- STRICT GATE: Unverified predictions cannot enter training candidates
- Quarantine lifecycle state transitions
- Anti-leakage & false alarm isolation
- Champion / Challenger isolation & promotion gates
- Rollback engine verification
- All Continuous Learning REST APIs
"""

import sys
import unittest
import asyncio
from pathlib import Path
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

# Ensure root directory is on path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.main import app
from backend.database_ml import ml_db
from ml.learning.ground_truth_service import ground_truth_service
from ml.learning.candidate_pipeline import candidate_pipeline
from ml.learning.continuous_trainer import continuous_trainer


class TestESPContinuousLearningSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        asyncio.run(ml_db.init_ml_tables())

    def test_01_raw_telemetry_preservation(self):
        """Verify raw telemetry storage remains separate and immutable."""
        res = self.client.get("/api/esp/telemetry")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("data", data)
        self.assertEqual(data["status"], "success")

    def test_02_prediction_event_history(self):
        """Verify model predictions are persistently stored with full metadata."""
        res = self.client.get("/api/esp/history?limit=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("data", data)
        records = data["data"]
        self.assertIsInstance(records, list)
        if len(records) > 0:
            pred = records[0]
            self.assertIn("overall_status", pred)
            self.assertIn("fault_status", pred)
            self.assertIn("esp_id", pred)


    def test_03_field_ground_truth_recording(self):
        """Verify operator field feedback recording and event temporal matching."""
        req_payload = {
            "asset_id": "FS-010",
            "well_id": "WELL-010",
            "fault_type": "DRY_WELL_PUMP_OFF",
            "confirmation_status": "CONFIRMED",
            "event_start": datetime.now(timezone.utc).isoformat(),
            "operator_note": "Field crew confirmed fluid pump-off and throttled choke.",
            "maintenance_action": "Choke trimmed from 38/64 to 26/64",
            "source": "OPERATOR_FIELD"
        }
        res = self.client.post("/api/esp/learning/ground-truth", json=req_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["confirmation_status"], "CONFIRMED")
        self.assertTrue(data["ground_truth_id"].startswith("GT-"))

    def test_04_strict_gate_unverified_predictions_cannot_train(self):
        """CRITICAL GATE: Verify that an unverified prediction CANNOT enter TRAINING_READY."""
        # Create an UNVERIFIED ground truth record
        unverified_gt = asyncio.run(ground_truth_service.record_field_outcome(
            asset_id="FS-025",
            well_id="WELL-025",
            fault_type="BEARING_DEGRADATION",
            confirmation_status="UNVERIFIED",
            operator_note="Model predicted bearing fault; field technician has not yet inspected."
        ))
        gt_id = unverified_gt["ground_truth_id"]
        
        # Attempt to advance quarantine batch
        advance_res = asyncio.run(candidate_pipeline.advance_quarantine_batch(gt_id))
        self.assertEqual(advance_res["status"], "REJECTED")
        self.assertIn("Only 'CONFIRMED' events can enter TRAINING_READY", advance_res["reason"])

    def test_05_false_alarms_isolation(self):
        """Verify false alarms are recorded without entering positive fault training sets."""
        false_alarm_payload = {
            "asset_id": "FS-012",
            "well_id": "WELL-012",
            "fault_type": "SAND_INGESTION",
            "confirmation_status": "FALSE_ALARM",
            "event_start": datetime.now(timezone.utc).isoformat(),
            "operator_note": "Vibration spike was surface workover truck vibration, not downhole sand.",
            "source": "OPERATOR_FIELD"
        }
        res = self.client.post("/api/esp/learning/ground-truth", json=false_alarm_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["confirmation_status"], "FALSE_ALARM")

        # Attempt to advance quarantine batch for false alarm
        advance_res = asyncio.run(candidate_pipeline.advance_quarantine_batch(data["ground_truth_id"]))
        self.assertEqual(advance_res["status"], "REJECTED")

    def test_06_confirmed_fault_candidate_lifecycle(self):
        """Verify confirmed fault transitions through quarantine to TRAINING_READY."""
        # 1. Record confirmed ground truth
        now_dt = datetime.now(timezone.utc)
        gt_res = asyncio.run(ground_truth_service.record_field_outcome(
            asset_id="FS-005",
            well_id="WELL-005",
            fault_type="UNDERVOLTAGE",
            confirmation_status="CONFIRMED",
            event_start=(now_dt - timedelta(minutes=30)).isoformat(),
            event_end=now_dt.isoformat(),
            operator_note="Grid voltage drop confirmed by electrician."
        ))
        gt_id = gt_res["ground_truth_id"]

        # 2. Add sample to candidate queue
        import uuid
        cand_id = f"CAND-TEST-{uuid.uuid4().hex[:6]}"
        cand = [{
            "candidate_id": cand_id,
            "telemetry_id": 9999,
            "asset_id": "FS-005",
            "well_id": "WELL-005",
            "timestamp": now_dt.isoformat(),
            "ground_truth_id": gt_id,
            "verified_label": "UNDERVOLTAGE",
            "lifecycle_state": "QUARANTINED",
            "quality_check_passed": True,
            "leakage_check_passed": True
        }]
        asyncio.run(ml_db.add_training_candidates(cand))


        # 3. Advance quarantine
        advance_res = asyncio.run(candidate_pipeline.advance_quarantine_batch(gt_id))
        self.assertEqual(advance_res["status"], "SUCCESS")
        self.assertGreaterEqual(advance_res["promoted_to_training_ready"], 1)

    def test_07_dataset_versioning_and_metadata(self):
        """Verify compilation of TRAINING_READY candidates into versioned dataset metadata."""
        compile_res = asyncio.run(candidate_pipeline.compile_continuous_dataset(version_tag="v1.2_test"))
        self.assertEqual(compile_res["status"], "DATASET_COMPILED")
        self.assertEqual(compile_res["version"], "v1.2_test")
        self.assertIn("dataset_id", compile_res)

        # Check API
        res = self.client.get("/api/esp/learning/datasets")
        self.assertEqual(res.status_code, 200)
        datasets = res.json().get("datasets", [])
        self.assertTrue(any(d["version"] == "v1.2_test" for d in datasets))

    def test_08_champion_challenger_isolation_and_promotion_gate(self):
        """Verify candidate model training without overwriting champion, and gate evaluation."""
        # 1. Trigger candidate training
        req = {
            "candidate_version_tag": "fault_classifier_v1.2_candidate",
            "dataset_version": "v1.2"
        }
        res = self.client.post("/api/esp/learning/retrain", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["candidate_version"], "fault_classifier_v1.2_candidate")
        self.assertEqual(data["champion_version"], "fault_classifier_v1.0")
        self.assertTrue(data["passed_promotion_gates"])

        run_id = data["training_run_id"]

        # 2. Promote candidate to champion
        promote_req = {
            "training_run_id": run_id,
            "approved_by": "LEAD_DATA_SCIENTIST"
        }
        promote_res = self.client.post("/api/esp/learning/promote", json=promote_req)
        self.assertEqual(promote_res.status_code, 200)
        p_data = promote_res.json()
        self.assertEqual(p_data["status"], "DEPLOYED")
        self.assertEqual(p_data["new_champion"], "fault_classifier_v1.2_candidate")
        self.assertEqual(p_data["previous_champion"], "fault_classifier_v1.0")

    def test_09_model_rollback_engine(self):
        """Verify instant rollback restoring previous champion version."""
        rollback_req = {
            "reason": "Test automated rollback validation"
        }
        res = self.client.post("/api/esp/learning/rollback", json=rollback_req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ROLLED_BACK")
        self.assertEqual(data["active_champion"], "fault_classifier_v1.0")
        self.assertEqual(data["rolled_back_model"], "fault_classifier_v1.2_candidate")

    def test_10_learning_apis_contract_completeness(self):
        """Verify all Phase 43 REST endpoints return 200 OK with proper payload structures."""
        endpoints = [
            "/api/esp/learning/ground-truth",
            "/api/esp/learning/candidates",
            "/api/esp/learning/datasets",
            "/api/esp/learning/retrain/triggers",
            "/api/esp/learning/models",
            "/api/esp/learning/13-fault-progression",
            "/api/esp/learning/validation-scorecard",
            "/api/esp/learning/metrics-trend"
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200, f"Endpoint {ep} failed with {res.status_code}")


if __name__ == "__main__":
    unittest.main()
