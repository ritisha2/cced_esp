# Phase 47: Real Model Execution Trace & Inference Timing

---

## 1. ALL FIVE MODELS RUNTIME EXECUTION AUDIT

| Model Layer | Input Feature Shape | Artifact Path | Inference Call | Output Structure | Measured Latency |
|---|---|---|---|---|---|
| **Model 1: Rules & Physics** | `CanonicalESPTelemetry` (13 params) | `config/fault_registry.yaml` | `evaluate_rules()` | Active rules, severity, evidence | 1.8 ms |
| **Model 2: Multiclass Classifier** | $1 \times 221$ Float Array | `models/fault_classifier/v1.0/fault_classifier.joblib` | `predict_proba()` | Probabilities across 7 classes | 4.6 ms |
| **Model 3: Hazard Forecaster** | $1 \times 221$ Float Array | `models/risk_predictor/v1.0/risk_predictor.joblib` | `predict_risk()` | 1h/6h/24h Hazard (Gated) | 6.2 ms |
| **Model 4: RUL Survival Engine** | $1 \times 221$ Float Array | `models/rul/v1.0/rul_model.joblib` | `estimate_rul()` | Status: `UNAVAILABLE` | 0.2 ms |
| **Model 5: Anomaly Detector** | $1 \times 221$ Scaled Array | `models/anomaly_detector/v1.0/anomaly_detector.joblib`| `decision_function()` | Score [0-1] + PCA vectors | 114.5 ms |
| **Total Pipeline Cycle** | — | — | `process_telemetry()` | `UnifiedESPAssessment` | ~127.3 ms |
