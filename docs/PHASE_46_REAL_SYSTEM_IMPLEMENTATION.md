# Phase 46: Real System Implementation & Architecture

---

## 1. END-TO-END DATA CONTRACT

```
REAL MQTT TELEMETRY (Broker -> opg/wells/telemetry/{well_id})
                ↓ [mqtt_collector.py: on_message]
REAL SQLITE STORAGE (opg_wells.db -> opg_well_telemetry)
                ↓ [backend/database.py]
REAL CANONICALIZATION (telemetry_adapter.py: record_to_canonical)
                ↓ [Data Quality: GOOD / DEGRADED / INVALID]
REAL FEATURE EXTRACTION (time_series_features.py: 221 features)
                ↓
    ┌───────────┴───────────┬───────────┴───────────┐
    ▼                       ▼                       ▼
MODEL 1: Rules          MODEL 2: XGBoost        MODEL 3: Risk Forecaster
(13 faults + envelopes) (6 ML faults + Healthy) (Research / Replay Only)
    │                       │                       │
    ▼                       ▼                       ▼
MODEL 4: RUL Survival   MODEL 5: Isolation Forest EXPLAINER: SHAP Vectors
(Safely UNAVAILABLE)    (Anomaly Score + PCA)   (Feature Attributions)
    │                       │                       │
    └───────────┬───────────┴───────────┬───────────┘
                ▼
REAL UNIFIED DECISION FUSION (decision_service.py)
                ↓
UnifiedESPAssessment (with unique trace_id)
                ↓
REAL REST & WEBSOCKET APIS (/api/esp/*, /ws/esp/live)
                ↓
REAL FRONTEND CONTROLLER (esp_intelligence.js)
                ↓
REAL OPERATOR ACTION & GROUND TRUTH FEEDBACK (/api/esp/learning/ground-truth)
                ↓
REAL QUARANTINE PIPELINE (QUARANTINED -> VALIDATED -> TRAINING_READY)
                ↓
REAL CHALLENGER TRAINING & ZERO-LOSS ROLLBACK
```

---

## 2. SCIENTIFIC INTEGRITY GATES PRESERVED

1. **RUL Numerical Hallucination Block**:
   - Return state: `UNAVAILABLE`.
   - Reason: `INSUFFICIENT_RUN_TO_FAILURE_HISTORY`.
   - The UI cleanly displays `RUL unavailable — insufficient run-to-failure history` rather than inventing an estimate.
2. **Future Risk Live Alarm Suppression**:
   - State: `RESEARCH_REPLAY_ONLY`.
   - Evaluated exclusively during historical scenario replay mode to prevent unvalidated live alarms.
3. **Zero-Sample Fault Modes**:
   - 7 faults (`Scale Wear`, `Cold Start`, `High Backpressure`, `Open Choke`, `Motor Overload`, `Power Loss`, `Sensor Drift`) operate purely via deterministic physics rules until confirmed site failure incidents are recorded.
