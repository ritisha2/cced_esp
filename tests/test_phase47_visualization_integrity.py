"""
Phase 47 Automated Verification Suite.
Validates the Real Live Engineering Visualization Layer, Zero-Fabrication Contract,
Asset-Centric Data Endpoints, Pump Curve Truthfulness, and Model Gating Integrity.
"""

import asyncio
import unittest
from datetime import datetime, timezone

from ml.data.canonical_schema import (
    CanonicalESPTelemetry,
    DataQualityStatus,
    SensorProvenance,
    FaultClass
)
from backend.adapters.telemetry_adapter import record_to_canonical
from backend.database import db
from backend.database_ml import ml_db
from backend.services.unified_pipeline import esp_pipeline
from backend.api.esp_routes import (
    get_all_assets,
    get_asset_detail,
    get_asset_visualization_bundle,
    get_asset_history,
    get_asset_events,
    get_asset_pump_curve
)
from backend.api.learning_routes import get_metrics_trend


class TestPhase47VisualizationIntegrity(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        await db.init_db()
        await ml_db.init_ml_tables()

    async def test_01_zero_fabrication_telemetry_adapter(self):
        """Verify that telemetry adapter does not fabricate default IDs or synthetic fallback values."""
        # Empty payload
        empty_record = {}
        canonical = record_to_canonical(empty_record)

        self.assertNotEqual(canonical.well_id, "WELL-001", "Must not fallback to WELL-001")
        self.assertNotEqual(canonical.esp_id, "ESP-WELL-001", "Must not fallback to ESP-WELL-001")
        self.assertIsNone(canonical.intake_temperature_c, "Missing intake temp must be None, not fabricated")
        self.assertIsNone(canonical.flowline_pressure_psi, "Missing flowline pressure must be None")
        self.assertIsNone(canonical.wellhead_pressure_psi, "Missing wellhead pressure must be None")
        self.assertIsNone(canonical.casing_pressure_psi, "Missing casing pressure must be None")
        self.assertIsNone(canonical.choke_size_64in, "Missing choke size must be None")

        self.assertEqual(
            canonical.provenance_map.get("intake_temperature_c"),
            SensorProvenance.UNAVAILABLE,
            "Provenance must be marked UNAVAILABLE when sensor reading is absent"
        )

    async def test_02_real_assets_discovery(self):
        """Verify that /api/esp/assets discovers genuine assets from data/opg_wells.db."""
        res = await get_all_assets()
        self.assertEqual(res["status"], "success")
        self.assertGreater(res["assets_count"], 0, "Must discover real assets from SQLite")
        self.assertGreater(res["wells_count"], 0, "Must discover real wells from SQLite")

        first_asset = res["assets"][0]
        self.assertIn("asset_id", first_asset)
        self.assertIn("well_id", first_asset)
        self.assertIn("total_records", first_asset)
        self.assertGreater(first_asset["total_records"], 0)

    async def test_03_asset_visualization_bundle(self):
        """Verify that /api/esp/assets/{id}/visualization returns complete downhole string schematic and health."""
        distinct_assets = await db.get_distinct_assets()
        self.assertTrue(len(distinct_assets) > 0)
        target_asset = distinct_assets[0]

        bundle = await get_asset_visualization_bundle(target_asset)
        self.assertEqual(bundle["status"], "success")
        self.assertEqual(bundle["asset_id"], target_asset)
        self.assertIn("trace_id", bundle)
        self.assertTrue(bundle["trace_id"].startswith("TRC-"))

        # Verify schematic nodes
        sch = bundle["schematic"]
        self.assertIn("surface", sch)
        self.assertIn("pump", sch)
        self.assertIn("motor", sch)
        self.assertIn("downhole_sensor", sch)
        self.assertIn("perforations", sch)

        # Verify live values inside nodes
        self.assertIn("frequency_hz", sch["surface"])
        self.assertIn("discharge_pressure_psi", sch["pump"])
        self.assertIn("intake_pressure_psi", sch["pump"])
        self.assertIn("differential_pressure_psi", sch["pump"])
        self.assertIn("motor_current_a", sch["motor"])
        self.assertIn("motor_temperature_c", sch["motor"])

        # Verify assessment structure
        assessment = bundle["assessment"]
        self.assertIn("overall_status", assessment)
        self.assertIn("fault_name", assessment)
        self.assertIn("rul", assessment)
        self.assertEqual(assessment["rul"]["status"], "UNAVAILABLE")

    async def test_04_supporting_evidence_history(self):
        """Verify that /api/esp/assets/{id}/history returns real chronological points without data fabrication."""
        distinct_assets = await db.get_distinct_assets()
        target_asset = distinct_assets[0]

        hist = await get_asset_history(target_asset, range="6h", limit=50)
        self.assertEqual(hist["status"], "success")
        self.assertEqual(hist["asset_id"], target_asset)
        self.assertGreater(hist["total_points"], 0)
        self.assertIsNotNone(hist["available_range_start"])
        self.assertIsNotNone(hist["available_range_end"])

        point = hist["points"][0]
        self.assertIn("timestamp", point)
        self.assertIn("motor_current_a", point)
        self.assertIn("liquid_rate_bpd", point)
        self.assertIn("intake_pressure_psi", point)
        self.assertIn("discharge_pressure_psi", point)

    async def test_05_pump_curve_zero_fabrication_contract(self):
        """Verify that pump-curve endpoint honestly returns UNAVAILABLE when no validated performance curve is configured."""
        distinct_assets = await db.get_distinct_assets()
        target_asset = distinct_assets[0]

        curve = await get_asset_pump_curve(target_asset)
        self.assertEqual(curve["status"], "UNAVAILABLE")
        self.assertFalse(curve["available"])
        self.assertIn("No validated pump performance curve is currently configured", curve["reason"])
        self.assertIn("operating_point", curve)

    async def test_06_model_integrity_and_gating(self):
        """Verify that all 5 models conform to production integrity and honest gating rules."""
        # 1. Model 1 (Rules)
        sample = CanonicalESPTelemetry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            esp_id="TEST-ESP",
            well_id="TEST-WELL",
            discharge_pressure_psi=2100.0,
            intake_pressure_psi=850.0,
            motor_current_a=38.0,
            motor_temperature_c=82.0,
            vibration_rms=0.14
        )
        evals = esp_pipeline.rule_engine.evaluate_envelopes(sample)
        self.assertEqual(len(evals), 13, "Must evaluate all 13 physical parameters")

        # 2. Model 3 (Risk Predictor) validation status must be RESEARCH_REPLAY_ONLY
        risks = esp_pipeline.risk_predictor.predict_risk(sample, {})
        for r in risks:
            self.assertEqual(r.validation_status, "RESEARCH_REPLAY_ONLY")
            self.assertFalse(r.is_field_validated)

        # 3. Model 4 (RUL) status must be UNAVAILABLE
        rul = esp_pipeline.rul_engine.estimate_rul(sample, {}, FaultClass.HEALTHY)
        self.assertEqual(rul.status, "UNAVAILABLE")
        self.assertEqual(rul.reason_code, "INSUFFICIENT_RUN_TO_FAILURE_HISTORY")

    async def test_07_learning_metrics_trend_dynamic_loading(self):
        """Verify that /api/esp/learning/metrics-trend loads dynamically from training reports and SQLite."""
        res = await get_metrics_trend()
        self.assertIn("metric_trends", res)
        trends = res["metric_trends"]
        self.assertGreater(len(trends), 0)
        baseline = trends[0]
        self.assertIn("version", baseline)
        self.assertIn("samples", baseline)
        self.assertIn("macro_f1", baseline)
        self.assertIn("accuracy", baseline)
        self.assertGreater(baseline["macro_f1"], 0.8)


if __name__ == "__main__":
    unittest.main()
