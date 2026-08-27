# Phase 46: Real Data Flow Trace & End-to-End Dependency Chain

---

## 1. TRACEABILITY FROM MQTT TO OPERATOR SCREEN

| Step | Processing Stage | Function / Module | Input Schema | Output Schema | Latency |
|---|---|---|---|---|---|
| **1** | **MQTT Ingestion** | `backend/mqtt_collector.py: on_message` | Raw JSON string from broker | Dict payload, SQL INSERT | 1.8 ms |
| **2** | **SQLite Storage** | `backend/database.py: insert_telemetry` | Parameter dictionary | `opg_well_telemetry` row | 2.1 ms |
| **3** | **Canonicalization** | `backend/adapters/telemetry_adapter.py` | SQLite Row / Dict | `CanonicalESPTelemetry` | 0.4 ms |
| **4** | **Data Quality Check**| `ml/preprocessing/data_quality.py` | `CanonicalESPTelemetry` | `DataQualityStatus`, Warnings | 0.8 ms |
| **5** | **Feature Engineering**| `ml/features/time_series_features.py` | `CanonicalESPTelemetry` | 221 statistical features | 12.4 ms |
| **6** | **Model 1: Rules** | `ml/models/rule_engine.py` | Telemetry + 221 Features | Envelopes, Rules fired, Severity | 1.8 ms |
| **7** | **Model 2: Classifier**| `ml/models/fault_classifier.py` | 221 Features | Probabilities, Predicted fault | 4.6 ms |
| **8** | **Model 3: Risk** | `ml/models/risk_predictor.py` | 221 Features | 1h/6h/24h Hazard Risk (Gated) | 6.2 ms |
| **9** | **Model 4: RUL** | `ml/models/rul_engine.py` | 221 Features | Status: `UNAVAILABLE` | 0.2 ms |
| **10**| **Model 5: Anomaly** | `ml/models/anomaly_detector.py` | Scaled 221 Features | Anomaly score, PCA Attributions | 114.5 ms |
| **11**| **Decision Fusion** | `backend/services/decision_service.py` | Multi-model outputs | Canonical health state, Action | 0.6 ms |
| **12**| **Assessment Assembly**| `backend/services/unified_pipeline.py` | All evaluated objects | `UnifiedESPAssessment` (`trace_id`) | 0.4 ms |
| **13**| **REST & WebSocket** | `backend/api/esp_routes.py`, `ws_routes.py` | `UnifiedESPAssessment` | JSON / WebSocket frame | 1.2 ms |
| **14**| **Frontend Render** | `frontend/js/esp_intelligence.js` | WebSocket / REST JSON | Dynamic DOM & Chart.js update | 4.0 ms |

---

## 2. TRACEABILITY FROM OPERATOR SCREEN TO RETRAINING

```
OPERATOR SCREEN: Clicks "Confirm Real Fault" / "Flag False Alarm"
                ↓
API REQUEST: POST /api/esp/learning/ground-truth (Payload: fault_type, status, note)
                ↓
SQLITE TABLE: esp_ground_truth (Records GT-XXXXXXXX with timestamp)
                ↓
TEMPORAL LINKING: Links recent predictions within lead window to ground truth event
                ↓
QUARANTINE QUEUE: esp_training_candidates (Records placed in QUARANTINED state)
                ↓
QUALITY & LEAKAGE GATES: Advance batch (QUARANTINED -> VALIDATED -> TRAINING_READY)
                ↓
DATASET COMPILER: Compiles TRAINING_READY into versioned dataset (dataset_v1.1)
                ↓
CHALLENGER TRAINING: Trains challenger model in memory & disk with new version tag
                ↓
PROMOTION EVALUATION: Tests against holdout; verifies Macro F1, false alarm rate <= 5%
                ↓
PROMOTION / ROLLBACK: Single-click promotion or instant rollback
```
