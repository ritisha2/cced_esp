"""Test Phase 7 Remaining Useful Life (RUL) Inference Engine & Gating."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.data.canonical_schema import CanonicalESPTelemetry, FaultClass
from ml.features.time_series_features import RollingFeatureExtractor
from ml.models.rul_engine import ESPRULEngine


def test_phase7():
    print(">>> 1. Initializing RUL Inference Engine...")
    rul_engine = ESPRULEngine()
    assert rul_engine.is_ready(), "RUL model artifact not loaded!"
    print(f"    [OK] Loaded RUL model version {rul_engine.version}")

    print(">>> 2. Testing Strict Scientific Gate: Healthy Operating State...")
    extractor = RollingFeatureExtractor()
    healthy_tel = CanonicalESPTelemetry(
        esp_id="ESP-TEST-01",
        well_id="WELL-01",
        liquid_rate_bpd=965.0,
        intake_pressure_psi=236.0,
        discharge_pressure_psi=2130.0,
        motor_current_a=35.0,
        motor_temperature_c=100.0,
        vibration_rms=0.18
    )
    feats = extractor.push_and_extract(healthy_tel)
    healthy_rul = rul_engine.estimate_rul(healthy_tel, feats, FaultClass.HEALTHY)
    
    assert healthy_rul.status == "UNAVAILABLE"
    assert healthy_rul.estimated_rul_hours is None
    print(f"    [OK] Healthy pump correctly gated: status='{healthy_rul.status}' ({healthy_rul.reason})")

    print(">>> 3. Testing Degraded Fault State RUL Estimation...")
    degraded_tel = CanonicalESPTelemetry(
        esp_id="ESP-TEST-DEG",
        well_id="WELL-DEG",
        liquid_rate_bpd=300.0,
        intake_pressure_psi=110.0,
        discharge_pressure_psi=1400.0,
        motor_current_a=14.0,
        motor_temperature_c=108.0,
        vibration_rms=0.45
    )
    deg_feats = extractor.push_and_extract(degraded_tel)
    degraded_rul = rul_engine.estimate_rul(degraded_tel, deg_feats, FaultClass.BEARING_DEGRADATION)
    
    assert degraded_rul.status == "AVAILABLE"
    assert degraded_rul.estimated_rul_hours is not None
    assert degraded_rul.uncertainty_lower_hours is not None
    assert degraded_rul.uncertainty_upper_hours is not None
    print(f"    [OK] Degraded pump RUL: {degraded_rul.estimated_rul_hours} hrs ({degraded_rul.estimated_rul_days} days) [95% CI: {degraded_rul.uncertainty_lower_hours} - {degraded_rul.uncertainty_upper_hours} hrs]")

    print("\n>>> PHASE 7 TEST PASSED! <<<\n")


if __name__ == "__main__":
    test_phase7()
