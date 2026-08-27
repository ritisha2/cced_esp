# Phase 46: Model Connection & Inference Audit

---

## 1. ALL FIVE MODELS GENUINE CONNECTION BREAKDOWN

| Model | Input Source | Feature Source | Model Artifact | Inference Function | Output | Unified Pipeline Connection | API / WebSocket Route | Frontend DOM Element |
|---|---|---|---|---|---|---|---|---|
| **Model 1: Rules & Physics** | `CanonicalESPTelemetry` | Raw inputs + rolling rates | `config/fault_registry.yaml` | `rule_engine.evaluate_rules()` | Active rules, severity, evidence | Included in `UnifiedESPAssessment` | `/api/esp/envelope`, `/api/esp/live` | `#espActiveFaultName`, `#espEnvelopeCardsGrid` |
| **Model 2: Multiclass Classifier**| `CanonicalESPTelemetry` | 221 statistical rolling features | `models/fault_classifier/v1.0/fault_classifier.joblib` | `classifier.predict()` | Probabilities, predicted fault | Included in `UnifiedESPAssessment` | `/api/esp/fault`, `/api/esp/live` | `#espActiveFaultName`, `#espActiveFaultConfidence` |
| **Model 3: Future Risk Predictor**| `CanonicalESPTelemetry` | 221 statistical rolling features | `models/risk_predictor/v1.0/risk_predictor.joblib` | `risk_predictor.predict_risk()` | 1h, 6h, 24h hazard probabilities | Included in `UnifiedESPAssessment` (Gated) | `/api/esp/risk`, `/api/esp/live` | `#espFutureRiskBadge` |
| **Model 4: RUL Survival Engine** | `CanonicalESPTelemetry` | 221 statistical rolling features | `models/rul/v1.0/rul_model.joblib` | `rul_engine.estimate_rul()` | Status: `UNAVAILABLE` | Included in `UnifiedESPAssessment` | `/api/esp/rul`, `/api/esp/live` | `#espRulBadge` |
| **Model 5: Anomaly Detector** | `CanonicalESPTelemetry` | Scaled 221 features | `models/anomaly_detector/v1.0/anomaly_detector.joblib` | `anomaly_detector.detect_anomaly()`| Anomaly score, PCA attributions | Included in `UnifiedESPAssessment` | `/api/esp/anomaly`, `/api/esp/live` | `#espAnomalyScorePill`, `#espShapGrid` |
