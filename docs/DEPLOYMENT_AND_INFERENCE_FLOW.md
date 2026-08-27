# Deployment & Inference Flow Specification

## 1. Online Inference vs. Offline Training

The platform enforces strict separation between **Continuous Online Inference** and **Reproducible Offline Training**:

```
[OFFLINE TRAINING PIPELINE]
Historical Data / Public Datasets ──► Preprocessing ──► Feature Matrix ──► Model Training
                                                                                 │
                                                                                 ▼
                                                                     Validation & Calibration
                                                                                 │
                                                                                 ▼
                                                                     Model Artifacts & Registry
                                                                     (models/fault_classifier/v1.0/)
                                                                                 │
═════════════════════════════════════════════════════════════════════════════════╪══════════════════
[ONLINE INFERENCE PIPELINE]                                                      ▼
Live MQTT Message ──► Schema Validation ──► Rolling Window ──► Feature Vector ──► Model Serving
                                                                                 │
                                                                                 ▼
                                                                        Unified Assessment
                                                                                 │
                                                                                 ▼
                                                                        Dedicated ML SQLite Tables
                                                                                 │
                                                                                 ▼
                                                                        WebSocket / REST Stream
```

---

## 2. Real-Time Inference Execution Sequence (16-Step Pipeline)

For every new incoming telemetry sample:
1. **Receive Observation**: Ingest raw MQTT payload or database polling sample.
2. **Schema & Timestamp Validation**: Parse timestamps, enforce UTC standard, check key types.
3. **Raw Telemetry Storage**: Save to raw table `opg_well_telemetry` via existing ingestion loop.
4. **Missing Value & Gap Assessment**: Determine data completeness and sensor status.
5. **Sensor Plausibility & Freezing Check**: Flag stuck or physically impossible values.
6. **Rule & Operating Envelope Evaluation**: Compute deviation and check persistence timers.
7. **Rolling Feature Window Update**: Push to circular in-memory buffer.
8. **Feature Generation**: Compute rolling statistical and domain ratio features.
9. **Fault Classifier Evaluation**: Compute calibrated class probabilities.
10. **Future Risk Estimation**: Predict failure likelihood over relevant horizons.
11. **RUL Evaluation**: Calculate remaining operating margin or return unavailable status.
12. **Anomaly Detection**: Compute healthy-state reconstruction/isolation score.
13. **Explainability Synthesis**: Compute SHAP / contribution vector and map physics rules.
14. **Unified Health Assessment**: Synthesize overall status (`HEALTHY`, `WARNING`, `FAULT`, `CRITICAL`).
15. **Persist Assessment**: Store in `esp_unified_assessments` and `esp_fault_predictions`.
16. **Broadcast Stream**: Send real-time JSON payload over `/ws/esp/live` to frontend.
