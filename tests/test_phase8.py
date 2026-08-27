"""Test Phase 8 Healthy-State Anomaly Detector."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.data.canonical_schema import CanonicalESPTelemetry
from ml.features.time_series_features import RollingFeatureExtractor
from ml.models.anomaly_detector import ESPAnomalyDetector


def test_phase8():
    print(">>> 1. Initializing Anomaly Detector...")
    detector = ESPAnomalyDetector()
    assert detector.is_ready(), "Anomaly detector model not loaded!"
    print(f"    [OK] Loaded Anomaly Detector version {detector.version} (Threshold: {detector.threshold})")

    print(">>> 2. Evaluating Nominal Healthy Telemetry...")
    from ml.data.dataset_loader import ESPDatasetLoader
    from backend.adapters.telemetry_adapter import record_to_canonical
    
    loader = ESPDatasetLoader()
    df = loader.load_data()
    healthy_df = df[df["fault_class"] == "HEALTHY"]
    
    extractor = RollingFeatureExtractor()
    result = None
    for _, row in healthy_df.tail(15).iterrows():
        tel = record_to_canonical(row.to_dict())
        feats = extractor.push_and_extract(tel)
        result = detector.score(tel, feats)
        
    print(f"    [OK] Healthy anomaly score: {result.anomaly_score:.3f} | Status: {result.status} | Reason: {result.reason}")
    assert result.status in ["NORMAL", "UNUSUAL"]


    print(">>> 3. Evaluating Novel Out-of-Distribution Telemetry...")
    novel_tel = CanonicalESPTelemetry(
        esp_id="ESP-TEST-NOVEL",
        well_id="WELL-NOVEL",
        liquid_rate_bpd=4200.0,          # Extreme flow rate out of distribution
        intake_pressure_psi=3200.0,       # Extreme PIP
        discharge_pressure_psi=500.0,     # Inverted PDP
        motor_current_a=95.0,            # Extreme current
        motor_temperature_c=145.0,       # Extreme temp
        vibration_rms=3.2                # Severe vibration
    )
    novel_extractor = RollingFeatureExtractor()
    for _ in range(10):
        novel_feats = novel_extractor.push_and_extract(novel_tel)
    novel_res = detector.score(novel_tel, novel_feats)
    print(f"    [OK] Novel anomaly score: {novel_res.anomaly_score:.3f} | Status: {novel_res.status} | Affected: {novel_res.affected_parameters}")
    assert novel_res.is_anomaly
    assert novel_res.anomaly_score >= detector.threshold

    print("\n>>> PHASE 8 TEST PASSED! <<<\n")


if __name__ == "__main__":
    test_phase8()
