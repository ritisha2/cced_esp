"""Test Phase 3 Data Quality, Feature Engineering, and Leakage Guard."""

import os
import sys
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.data.canonical_schema import CanonicalESPTelemetry, DataQualityStatus
from ml.preprocessing.data_quality import DataQualityEngine
from ml.features.time_series_features import RollingFeatureExtractor, extract_batch_dataframe_features
from ml.preprocessing.leakage_guard import assert_no_temporal_leakage, assert_no_target_in_features
from ml.data.dataset_loader import ESPDatasetLoader


def test_phase3():
    print(">>> 1. Testing Data Quality Engine on Nominal & Out-of-Bounds Telemetry...")
    dq = DataQualityEngine()
    
    # Healthy record
    healthy_tel = CanonicalESPTelemetry(
        liquid_rate_bpd=965.0,
        intake_pressure_psi=236.0,
        discharge_pressure_psi=2130.0,
        motor_current_a=35.0,
        motor_voltage_v=460.0,
        motor_temperature_c=100.2,
        vibration_rms=0.18
    )
    status, warnings = dq.evaluate(healthy_tel)
    assert status == DataQualityStatus.GOOD
    assert len(warnings) == 0
    print("    [OK] Healthy telemetry correctly identified as GOOD.")

    # Bad record (negative pressure, impossible values)
    bad_tel = CanonicalESPTelemetry(
        liquid_rate_bpd=965.0,
        intake_pressure_psi=-50.0,  # Impossible negative
        discharge_pressure_psi=2130.0,
        motor_current_a=-10.0,      # Impossible negative
        motor_voltage_v=460.0
    )
    bad_status, bad_warns = dq.evaluate(bad_tel)
    assert bad_status == DataQualityStatus.INSUFFICIENT
    assert len(bad_warns) >= 2
    print(f"    [OK] Out-of-bounds telemetry flagged as INSUFFICIENT with {len(bad_warns)} warnings.")

    print(">>> 2. Testing Rolling Feature Extractor...")
    extractor = RollingFeatureExtractor(window_sizes=[5, 15, 30])
    for i in range(10):
        t = CanonicalESPTelemetry(
            esp_id="ESP-TEST-1",
            well_id="WELL-TEST-1",
            liquid_rate_bpd=950.0 + i * 2,
            intake_pressure_psi=235.0 - i * 0.5,
            discharge_pressure_psi=2120.0 + i * 5,
            motor_current_a=34.0 + i * 0.3,
            motor_voltage_v=460.0,
            motor_temperature_c=99.0 + i * 0.2,
            vibration_rms=0.18 + i * 0.01
        )
        feats = extractor.push_and_extract(t)

    assert "differential_pressure_psi" in feats
    assert "apparent_impedance_ohms" in feats
    assert "motor_current_a_mean_5" in feats
    assert "discharge_pressure_psi_slope_5" in feats
    assert feats["discharge_pressure_psi_slope_5"] > 0
    print(f"    [OK] Extracted {len(feats)} rolling and domain features successfully.")

    print(">>> 3. Testing Leakage Guard and Temporal Splitting...")
    loader = ESPDatasetLoader()
    train_df, val_df, test_df = loader.get_temporal_split(0.7, 0.15, 0.15)
    assert_no_temporal_leakage(train_df, val_df, test_df)
    
    feature_cols = [c for c in train_df.columns if c not in ["fault_class", "scenario", "operating_state", "trip_cause", "alarms", "alerts", "status"]]
    assert_no_target_in_features(feature_cols)
    print("    [OK] Zero temporal leakage and zero target contamination verified.")

    print("\n>>> PHASE 3 TEST PASSED! <<<\n")


if __name__ == "__main__":
    test_phase3()
