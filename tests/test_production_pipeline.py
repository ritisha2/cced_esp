"""
Unit Test Suite for Production ESP Real-Time Fault Classification & Anomaly Detection Pipeline.
Validates:
1. 13-Tag Standard Input Telemetry Mapping
2. Physics-Informed Invariant Feature Derivations
3. Real Dataset Ingestion & Parquet Artifacts (Zero Synthetics)
4. Dual-Tier Model Inference & Critical Limit Checking
5. Strict JSON Output Schema Compliance
"""

import unittest
import time
import json
import numpy as np
import pandas as pd
from pathlib import Path

from src.features import extract_features_from_dict, compute_features_dataframe, CANONICAL_TAGS, FEATURE_COLUMNS
from src.inference_engine import ESPInferenceEngine, FIELD_LIMIT_SPEC
from src.data_fetcher import DatasetFetcher, TARGET_FAULT_CLASSES

BASE_DIR = Path(__file__).resolve().parent.parent


class TestProductionPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = ESPInferenceEngine()
        cls.processed_dir = BASE_DIR / "data" / "processed"
        cls.models_dir = BASE_DIR / "models" / "v2"

    def test_01_canonical_13_tags_integrity(self):
        """Verify that canonical tags match the 13 required field parameters."""
        expected_tags = [
            "R_PIT_001", "R_PIT_002", "R_PIT_003", "R_INTAKE_PRESS", "R_INTAKE_TEMP",
            "R_DISCH_PRESS", "R_MOTOR_TEMP", "R_FREQUENCY", "R_VIBRATION_X",
            "R_TOOL_CURRENT", "R_DRV_CURR_AVG", "R_DHG_CURR_AVG", "R_BUS_IN_VTG_AVG"
        ]
        self.assertEqual(CANONICAL_TAGS, expected_tags)
        self.assertEqual(len(CANONICAL_TAGS), 13)

    def test_02_physics_features_derivation(self):
        """Verify calculation of physics invariant ratios (Pi, Pi_FL, apparent power, etc.)."""
        sample_dict = {
            "R_PIT_001": 90.0,
            "R_PIT_002": 45.0,
            "R_PIT_003": 50.0,
            "R_INTAKE_PRESS": 1200.0,
            "R_INTAKE_TEMP": 70.0,
            "R_DISCH_PRESS": 2400.0,
            "R_MOTOR_TEMP": 85.0,
            "R_FREQUENCY": 50.0,
            "R_VIBRATION_X": 0.20,
            "R_TOOL_CURRENT": 5.0,
            "R_DRV_CURR_AVG": 40.0,
            "R_DHG_CURR_AVG": 40.0,
            "R_BUS_IN_VTG_AVG": 460.0
        }
        feat_vec = extract_features_from_dict(sample_dict)
        self.assertEqual(len(feat_vec), len(FEATURE_COLUMNS))
        
        # Test Pi Pressure Ratio: (2400 - 1200) / 1200 = 1.0
        pi_idx = FEATURE_COLUMNS.index("pi_pressure_ratio")
        self.assertAlmostEqual(feat_vec[pi_idx], 1.0, places=3)

        # Test Pi Flowline Ratio: 90.0 / 50.0 = 1.8
        pi_fl_idx = FEATURE_COLUMNS.index("pi_flowline_ratio")
        self.assertAlmostEqual(feat_vec[pi_fl_idx], 1.8, places=3)

    def test_03_real_datasets_parquet_existence(self):
        """Verify that genuine train and test parquet feature matrices exist."""
        train_path = self.processed_dir / "train_features.parquet"
        test_path = self.processed_dir / "test_features.parquet"

        self.assertTrue(train_path.exists(), f"Missing {train_path}")
        self.assertTrue(test_path.exists(), f"Missing {test_path}")

        train_df = pd.read_parquet(train_path)
        test_df = pd.read_parquet(test_path)
        
        self.assertGreater(len(train_df), 10000)
        self.assertGreater(len(test_df), 2000)
        
        for tag in CANONICAL_TAGS:
            self.assertIn(tag, train_df.columns)
            self.assertIn(tag, test_df.columns)

    def test_04_trained_model_artifacts(self):
        """Verify that production models v2 artifacts exist on disk."""
        clf_file = self.models_dir / "fault_classifier.joblib"
        ad_file = self.models_dir / "anomaly_detector.joblib"
        scaler_file = self.models_dir / "feature_scaler.joblib"
        le_file = self.models_dir / "label_encoder.joblib"
        metrics_file = self.models_dir / "training_metrics.json"

        self.assertTrue(clf_file.exists())
        self.assertTrue(ad_file.exists())
        self.assertTrue(scaler_file.exists())
        self.assertTrue(le_file.exists())
        self.assertTrue(metrics_file.exists())

        with open(metrics_file, "r") as f:
            metrics = json.load(f)
        self.assertGreaterEqual(metrics["accuracy"], 0.90)

    def test_05_iso_limits_triggering(self):
        """Verify Stage 1 limit checks for high vibration and high temperature."""
        telemetry_over_limits = {
            "R_MOTOR_TEMP": 112.0,    # > 100.0 °C
            "R_VIBRATION_X": 0.45,    # > 0.30 g
            "R_BUS_IN_VTG_AVG": 380.0 # < 400.0 V
        }
        breaches = self.engine.evaluate_physical_limits(telemetry_over_limits)
        tags_triggered = [b["tag"] for b in breaches]

        self.assertIn("R_MOTOR_TEMP", tags_triggered)
        self.assertIn("R_VIBRATION_X", tags_triggered)
        self.assertIn("R_BUS_IN_VTG_AVG", tags_triggered)

    def test_06_prediction_schema_compliance(self):
        """Verify that prediction output strictly matches the required JSON structure."""
        test_payload = {
            "timestamp": 1772186804,
            "R_PIT_001": 84.5,
            "R_PIT_002": 45.1,
            "R_PIT_003": 50.0,
            "R_INTAKE_PRESS": 1180.0,
            "R_INTAKE_TEMP": 74.2,
            "R_DISCH_PRESS": 2210.0,
            "R_MOTOR_TEMP": 102.5,
            "R_FREQUENCY": 50.0,
            "R_VIBRATION_X": 0.44,
            "R_TOOL_CURRENT": 12.0,
            "R_DRV_CURR_AVG": 66.2,
            "R_DHG_CURR_AVG": 65.8,
            "R_BUS_IN_VTG_AVG": 455.0
        }
        pred = self.engine.predict(test_payload)

        # Required Top-level keys
        required_keys = [
            "timestamp", "state", "fault_classification", "confidence_score",
            "is_anomaly", "anomaly_score", "triggered_limits", "telemetry_received"
        ]
        for k in required_keys:
            self.assertIn(k, pred, f"Missing required output key: {k}")

        self.assertIn(pred["state"], ["HEALTHY", "FAULT"])
        self.assertIsInstance(pred["confidence_score"], float)
        self.assertIsInstance(pred["anomaly_score"], float)
        self.assertGreaterEqual(pred["anomaly_score"], 0.0)
        self.assertLessEqual(pred["anomaly_score"], 1.0)
        self.assertIsInstance(pred["is_anomaly"], bool)
        self.assertIsInstance(pred["triggered_limits"], list)
        self.assertIsInstance(pred["telemetry_received"], dict)

        # All 13 canonical tags must be present in telemetry_received
        for tag in CANONICAL_TAGS:
            self.assertIn(tag, pred["telemetry_received"])


if __name__ == "__main__":
    unittest.main()
