# Phase 47: Runtime Data Lineage & Diagnostic Trace

---

## 1. COMPLETE DIAGNOSTIC LINEAGE MAP

```
SOURCE: Real Site Well (e.g. FSWS-001-A)
  ↓
DATABASE RECORD ID: opg_well_telemetry (ID #14022)
  ↓
TELEMETRY TIMESTAMP: 2026-08-25T05:16:34.744591Z
  ↓
CANONICAL ADAPTER: CanonicalESPTelemetry (DataQuality = GOOD)
  ↓
FEATURE VECTOR: 221 statistical rolling features (Mean, Std, Min, Max, Slope)
  ↓
MODEL 1 (Physics Rules): Parameter Operating Envelopes Evaluated (PIP, PDP, Motor Current, Temp, Vibration)
  ↓
MODEL 2 (Classifier): XGBoost v1.0 Inference (Output: DRY_WELL_PUMP_OFF, Probability: 0.96)
  ↓
MODEL 3 (Risk Forecaster): Research Gate Active (State: RESEARCH_REPLAY_ONLY)
  ↓
MODEL 4 (RUL Survival): Data Gate Active (State: UNAVAILABLE, Reason: INSUFFICIENT_HISTORY)
  ↓
MODEL 5 (Anomaly Detector): Isolation Forest v1.0 (Anomaly Score: 0.680, Status: ANOMALY)
  ↓
DECISION FUSION: Unified Decision Synthesizer (Overall Status: CRITICAL)
  ↓
TRACE ID: TRC-D4F8A2B9 (UUIDv4 Hash)
  ↓
API / WEBSOCKET: /api/esp/live, /ws/esp/live
  ↓
UI RENDER: Dynamic DOM Updates (Banner: CRITICAL, Card: DRY_WELL_PUMP_OFF, Envelopes: PIP Breach)
```
