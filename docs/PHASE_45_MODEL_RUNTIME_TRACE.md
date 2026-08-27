# Phase 45: Model Runtime Trace & Inference Contract Audit

---

## 1. END-TO-END RUNTIME TRACE CHAIN

```
MQTT Telemetry (opg/wells/telemetry/{well_id})
       ↓ [mqtt_collector.py: on_message]
opg_well_telemetry (SQLite table row insertion)
       ↓ [services/unified_pipeline.py: process_telemetry]
CanonicalESPTelemetry (Data Quality & Plausibility Validation)
       ↓ [features/time_series_features.py: push_and_extract]
221 Statistical Rolling Features
       ↓
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ MODEL 1: Rules          │ MODEL 2: Fault XGBoost  │ MODEL 3: Risk Forecaster│
│ (ml/models/rule_engine) │ (ml/models/fault_class) │ (ml/models/risk_predict)│
└───────────┬─────────────┴───────────┬─────────────┴───────────┬─────────────┘
            │                         │                         │
            ▼                         ▼                         ▼
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ MODEL 4: RUL Survival   │ MODEL 5: Anomaly IF+PCA │ EXPLAINER: SHAP Vectors │
│ (ml/models/rul_engine)  │ (ml/models/anomaly_det) │ (ml/explainability)     │
└───────────┬─────────────┴───────────┬─────────────┴───────────┬─────────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      ▼
                        UnifiedESPAssessment (trace_id)
                                      ▼
                        WebSocket & REST API Route
                                      ▼
                        Frontend Dynamic DOM & Charts
```

---

## 2. RUNTIME INFERENCE PROVENANCE & FRESHNESS

- **Correlation ID**: Every live assessment generates a unique `trace_id` (e.g. `TRC-A1B2C3D4E5`).
- **Freshness Classification**:
  - `● LIVE MQTT`: Age $\le 10$ seconds.
  - `● STALE TELEMETRY`: Age between $10$ and $30$ seconds.
  - `● DISCONNECTED`: Age $> 30$ seconds or broker disconnected.
- **Strict Schema Parity**: All 5 models consume the exact 221 statistical features in matching alphabetical order matching training bundles.
