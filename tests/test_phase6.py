"""Test Phase 6 Future Fault Risk Predictor Inference Engine."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.data.canonical_schema import CanonicalESPTelemetry
from ml.features.time_series_features import RollingFeatureExtractor
from ml.models.risk_predictor import ESPRiskPredictor


def test_phase6():
    print(">>> 1. Initializing Risk Predictor Inference Engine...")
    predictor = ESPRiskPredictor()
    assert predictor.is_ready(), "Model artifact not loaded!"
    print(f"    [OK] Loaded Risk Predictor version {predictor.version} for horizons: {predictor.horizons}")

    print(">>> 2. Evaluating Risk on Nominal Telemetry...")
    extractor = RollingFeatureExtractor()
    healthy_tel = CanonicalESPTelemetry(
        esp_id="ESP-TEST-01",
        well_id="WELL-01",
        liquid_rate_bpd=965.0,
        intake_pressure_psi=236.0,
        discharge_pressure_psi=2130.0,
        motor_current_a=35.0,
        motor_load_pct=80.0,
        motor_temperature_c=100.0,
        vibration_rms=0.18,
        motor_voltage_v=460.0
    )
    feats = extractor.push_and_extract(healthy_tel)
    predictions = predictor.predict_risk(healthy_tel, feats)
    assert len(predictions) == 3
    for p in predictions:
        print(f"    [OK] Horizon {p.horizon_label} -> Probability: {p.probability*100:.1f}% | Risk Level: {p.risk_level} | Trend: {p.trend}")

    print("\n>>> PHASE 6 TEST PASSED! <<<\n")


if __name__ == "__main__":
    test_phase6()
