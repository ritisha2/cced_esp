"""Test Phase 5 Multiclass Fault Classifier Inference Engine."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.data.canonical_schema import CanonicalESPTelemetry, FaultClass
from ml.features.time_series_features import RollingFeatureExtractor
from ml.models.fault_classifier import ESPFaultClassifier


def test_phase5():
    print(">>> 1. Initializing Fault Classifier Inference Engine...")
    classifier = ESPFaultClassifier()
    assert classifier.is_ready(), "Model artifact not loaded!"
    print(f"    [OK] Model version {classifier.version} loaded with {len(classifier.classes)} classes: {classifier.classes}")

    print(">>> 2. Testing Classifier on Dataset Samples...")
    from ml.data.dataset_loader import ESPDatasetLoader
    from backend.adapters.telemetry_adapter import record_to_canonical
    
    loader = ESPDatasetLoader()
    df = loader.load_data()
    
    # Test a healthy sequence from dataset
    healthy_df = df[df["fault_class"] == "HEALTHY"]
    extractor = RollingFeatureExtractor()
    result = None
    for _, row in healthy_df.tail(15).iterrows():
        tel = record_to_canonical(row.to_dict())
        feats = extractor.push_and_extract(tel)
        result = classifier.predict(tel, feats)
    
    print(f"    [OK] Healthy sequence predicted as: {result.predicted_fault.value} (Confidence: {result.confidence*100:.1f}%)")
    print(f"         Class Probabilities: {result.class_probabilities}")
    top_class = max(result.class_probabilities, key=result.class_probabilities.get)
    assert top_class == "HEALTHY" or result.predicted_fault == FaultClass.HEALTHY


    # Test an undervoltage sequence from dataset
    uv_rows = df[df["fault_class"] == "UNDERVOLTAGE"]
    if len(uv_rows) > 0:
        uv_extractor = RollingFeatureExtractor()
        uv_result = None
        for _, row in uv_rows.tail(15).iterrows():
            tel = record_to_canonical(row.to_dict())
            feats = uv_extractor.push_and_extract(tel)
            uv_result = classifier.predict(tel, feats)
        print(f"    [OK] Undervoltage sequence predicted as: {uv_result.predicted_fault.value} (Confidence: {uv_result.confidence*100:.1f}%)")
        assert uv_result.predicted_fault == FaultClass.UNDERVOLTAGE


    print("\n>>> PHASE 5 TEST PASSED! <<<\n")


if __name__ == "__main__":
    test_phase5()

