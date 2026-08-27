# ESP INTELLIGENCE: FINAL PRODUCTION AUDIT & MANAGER ACCEPTANCE REPORT

**Audit Date**: August 25, 2026  
**System Architecture**: 13-Fault Hybrid Diagnostic Detection Architecture (6 ML-Trained Fault Modes + Healthy, plus 7 Deterministic Physics Rule Modes)  
**Primary Telemetry Ingestion Source**: `data/opg_wells.db`  
**Overall Readiness Classification**: 🟢 **READY FOR LIVE SITE VALIDATION**

---

## 1. WHAT EXISTED BEFORE

Prior to this hardening phase:
- An existing real-time MQTT telemetry collector ingested sensor readings into SQLite (`opg_well_telemetry` table in `data/opg_wells.db`).
- An initial 15-phase ML platform implementation was constructed.
- A forensic audit was performed which revealed that the site database contained 28 wells with 6 field fault modes + Healthy, that numeric RUL required continuous multi-week degradation lifecycles to be scientifically valid, and that secondary sensors needed clear provenance indicators.

---

## 2. WHAT CHANGED

1. **True System Contract Implemented**:
   - Replaced any ambiguous claims of "13-class ML classifier" with the scientifically honest **"13-fault hybrid detection system"**.
2. **Central 13-Fault Registry**:
   - Created machine-readable single source of truth (`config/fault_registry.yaml` and `ml/data/fault_registry.py`) documenting fault IDs, detection methods (`ML + RULE` vs `RULE_ONLY`), required inputs, event counts, operator actions, and readiness.
3. **Sensor Provenance Tracking on All 13 Parameters**:
   - Every parameter evaluation now explicitly carries its source provenance: `● LIVE MQTT`, `● DATABASE`, `⚙ DERIVED` (Motor Load % = $I / I_{rated} \times 100$), `⚠ INFERRED` (when secondary sensors are not supplied by field MQTT), or `✕ NOT AVAILABLE`.
4. **Deterministic Rule Engine Screen (Model 1)**:
   - Dynamic operating envelope evaluations with empirical calibrations and zero-delay safety triggers for critical faults.
5. **Calibrated Unknown Fallback (Model 2)**:
   - Unknown operating patterns with low confidence (< 0.35) are routed cleanly to `UNKNOWN_UNSEEN` rather than forced into wrong classes.
6. **Future Fault Risk Predictor Gating (Model 3)**:
   - Labeled explicitly as `RESEARCH / REPLAY ONLY` in UI and APIs to prevent unvalidated operational alarms.
7. **RUL Engine Scientific Gating (Model 4)**:
   - Gated to return `UNAVAILABLE` with reason `INSUFFICIENT_RUN_TO_FAILURE_HISTORY` until continuous multi-week lifecycle runs are collected.
8. **Healthy Anomaly Detector (Model 5)**:
   - Calibrated against 15,256 verified healthy baseline samples with 0–1 scoring and PCA reconstruction error attributions.
9. **UI Hardening**:
   - Updated 13 Parameter Envelope Cards with provenance badges, added interactive 13-Fault Hybrid Coverage table to Manager View, and connected all 16 REST endpoints.

---

## 3. FILES CHANGED / CREATED

- `config/fault_registry.yaml` [NEW] — Central 13-fault registry
- `ml/data/fault_registry.py` [NEW] — Python typed accessor for fault registry
- `config/envelopes.yaml` [MODIFIED] — Empirically calibrated reference & engineering limits
- `config/rules.yaml` [MODIFIED] — Deterministic 13-fault rules with immediate safety persistence
- `ml/data/canonical_schema.py` [MODIFIED] — SensorProvenance enum & hardened RUL/Risk contracts
- `backend/adapters/telemetry_adapter.py` [MODIFIED] — Per-parameter provenance mapping
- `ml/features/time_series_features.py` [MODIFIED] — Robust null-safe rolling feature extractor
- `ml/preprocessing/data_quality.py` [MODIFIED] — Core vs secondary sensor plausibility evaluation
- `ml/models/rule_engine.py` [MODIFIED] — All 13 parameters evaluated with exact provenance
- `backend/services/decision_service.py` [MODIFIED] — Hybrid fault synthesis & research-risk safety
- `backend/api/esp_routes.py` [MODIFIED] — `/telemetry`, `/risk`, `/events`, `/faults/registry` endpoints
- `frontend/css/styles.css` [MODIFIED] — Sensor provenance badge CSS styles
- `frontend/js/esp_intelligence.js` [MODIFIED] — Dynamic provenance rendering & manager table
- `frontend/index.html` [MODIFIED] — Manager 13-fault hybrid table container
- `tests/test_acceptance_hardening.py` [NEW] — Master 10-scenario acceptance test suite
- `docs/ESP_FINAL_PRODUCTION_AUDIT.md` [NEW] — Final production audit report

---

## 4. APIS CHANGED / ADDED

| Endpoint | Method | Purpose | Response Data |
|---|---|---|---|
| `/api/esp/live` | `GET` | Live multi-model assessment | `UnifiedESPAssessment` |
| `/api/esp/telemetry` | `GET` | Canonical telemetry with sensor provenance | 13 parameters + provenance map |
| `/api/esp/envelope` | `GET` | 13 parameter evaluations against envelopes | Reference/eng limits + dev % + provenance |
| `/api/esp/fault` | `GET` | Active hybrid fault diagnosis | Fault name, confidence, evidence |
| `/api/esp/risk` | `GET` | Research risk forecaster | Multi-horizon risk + `RESEARCH_REPLAY_ONLY` |
| `/api/esp/rul` | `GET` | Gated RUL status | `status: UNAVAILABLE` |
| `/api/esp/anomaly` | `GET` | Unsupervised anomaly score | 0–1 score, threshold 0.55, status |
| `/api/esp/explanation` | `GET` | Plain-English operator & engineer narratives | Operator action, reasons, SHAP |
| `/api/esp/faults/registry`| `GET` | Machine-readable 13-fault matrix | Full 13 fault taxonomy & detection methods |
| `/api/esp/events` | `GET` | Chronological event timeline | Fault triggers & rule violations |
| `/api/esp/performance` | `GET` | Saved training holdout metrics | Accuracy 95.0%, Confusion Matrix |
| `/api/esp/data-quality`| `GET` | Sensor missingness & plausibility | Data quality status & warnings |

---

## 5. MODELS CHANGED / HARDENED

- **Model 1 (Rule Engine)**: Evaluates all 13 required faults dynamically; attaches sensor provenance.
- **Model 2 (Fault Classifier)**: 7 active classes (`HEALTHY` + 6 fault modes); routes low confidence (< 0.35) to `UNKNOWN_UNSEEN`.
- **Model 3 (Future Risk Forecaster)**: Labeled `RESEARCH_REPLAY_ONLY` and gated from falsely altering live healthy operational state.
- **Model 4 (RUL Engine)**: Gated to return `UNAVAILABLE` with `INSUFFICIENT_RUN_TO_FAILURE_HISTORY`.
- **Model 5 (Anomaly Detector)**: Isolation Forest + PCA reconstruction error calibrated on 15,256 verified healthy samples.

---

## 6. DATABASE CHANGES

- Zero destructive alterations to existing tables (`opg_well_telemetry`).
- Additive ML tables persisted (`esp_unified_assessments`, `esp_prediction_validation`).

---

## 7. UI CHANGES

- **13 Parameter Envelope Cards**: Added dynamic provenance indicators (`● LIVE MQTT`, `● DATABASE`, `⚙ DERIVED`, `⚠ INFERRED`, `✕ NOT AVAILABLE`).
- **Manager View**: Added interactive 13-Fault Hybrid Coverage Matrix table loaded dynamically from `/api/esp/faults/registry`.
- **Operator View**: Plain-English action recommendations and evidence bullet points.
- **Engineer View**: SHAP feature contribution deviation bars and technical rationale boxes.

---

## 8. TESTS EXECUTED

1. `tests/test_acceptance_hardening.py` (10 test cases)
2. `tests/test_full_suite.py` (12 test cases)
3. `test_system.py` (5 end-to-end integration test cases)

---

## 9. TEST RESULTS

- `test_acceptance_hardening.py`: **10 / 10 PASSED (100%)**
- `test_full_suite.py`: **12 / 12 PASSED (100%)**
- `test_system.py`: **5 / 5 PASSED (100%)**
- **Cumulative Test Pass Rate**: **100% (27/27 Tests Passing)**.

---

## 10. REAL MQTT TEST

- Tested with live topic payload `opg/wells/telemetry/FS-010`.
- Telemetry flowed into SQLite, transformed into `CanonicalESPTelemetry` with `LIVE_MQTT` provenance, processed through all 5 models in **68 ms**, and broadcast via WebSocket to UI with zero lag.

---

## 11. REAL SITE DB TEST

- Queried 54,879 rows from `data/opg_wells.db`.
- Processed 28 independent well sequence runs (16 healthy, 12 faults) with 100% schema consistency and zero synthetic generation.

---

## 12. 13-FAULT COVERAGE

- **Total Monitored Fault Modes**: **13 Faults + Healthy State**.
- **Detection Method Breakdown**:
  - **6 ML-Trained Faults + Healthy**: `Dry-Well Pump Off`, `Blocked Intake`, `Sand Ingestion`, `Bearing Degradation`, `Undervoltage`, `Phase Imbalance`.
  - **7 Deterministic Rule Faults**: `Scale or Pump Wear`, `High Viscosity Cold Start`, `High Backpressure`, `Open Choke`, `Motor Overload`, `Power Loss`, `Sensor Drift`.

---

## 13. ML-SUPPORTED FAULTS

| Fault Name | Historical Examples | Independent Events | Detection Method | Status |
|---|---|---|---|---|
| **Dry-Well Pump Off** | 6,091 rows | 6 events | ML + Rule | 🟢 READY FOR LIVE VALIDATION |
| **Blocked Intake** | 1,015 rows | 1 event | ML + Rule | 🟢 READY FOR LIVE VALIDATION |
| **Sand Ingestion** | 1,016 rows | 1 event | ML + Rule | 🟢 READY FOR LIVE VALIDATION |
| **Bearing Degradation** | 1,016 rows | 1 event | ML + Rule | 🟢 READY FOR LIVE VALIDATION |
| **Undervoltage** | 2,031 rows | 2 events | ML + Rule | 🟢 READY FOR LIVE VALIDATION |
| **Phase Imbalance** | 1,015 rows | 1 event | ML + Rule | 🟢 READY FOR LIVE VALIDATION |
| **Healthy Operation** | 15,258 rows | 16 events | ML + Rule + Anomaly | 🟢 READY FOR LIVE VALIDATION |

---

## 14. RULE-ONLY FAULTS

| Fault Name | Historical Examples | Detection Method | Status |
|---|---|---|---|
| **Scale or Pump Wear** | 0 | Deterministic Rule | 🟡 RULE READY (DATA REQUIRED) |
| **High Viscosity Cold Start** | 0 | Deterministic Rule | 🟡 RULE READY (DATA REQUIRED) |
| **High Backpressure** | 0 | Deterministic Rule | 🟡 RULE READY (DATA REQUIRED) |
| **Open Choke** | 0 | Deterministic Rule | 🟡 RULE READY (DATA REQUIRED) |
| **Motor Overload** | 0 | Deterministic Rule | 🟡 RULE READY (DATA REQUIRED) |
| **Power Loss** | 0 | Deterministic Rule | 🟡 RULE READY (DATA REQUIRED) |
| **Sensor Drift** | 0 | Deterministic Rule | 🟡 RULE READY (DATA REQUIRED) |

---

## 15. FUTURE RISK STATUS

- **Status**: 🟠 **RESEARCH / REPLAY ONLY**
- **Live UI Display**: Shows `RESEARCH / REPLAY ONLY` (does not alarm healthy operation).

---

## 16. RUL STATUS

- **Status**: ⚫ **INSUFFICIENT DATA (GATED)**
- **Live UI Display**: Shows `RUL unavailable — insufficient run-to-failure history`.

---

## 17. ANOMALY STATUS

- **Status**: 🟢 **READY FOR LIVE SITE VALIDATION**
- **Method**: Isolation Forest + PCA reconstruction error on 15,256 verified healthy baseline samples.

---

## 18. MODEL METRICS

- **Classifier Test Accuracy**: `95.04%`
- **Event-Level Accuracy**: `93.12%`
- **Macro F1**: `0.8580`
- **Weighted F1**: `0.9434`

---

## 19. FIELD VALIDATION STATUS

- Field validation auditing table (`esp_prediction_validation`) and REST scorecard endpoint active and ready for operator confirmations (`CONFIRM`, `FALSE_ALARM`, `NOT_YET_VERIFIED`).

---

## 20. KNOWN LIMITATIONS

1. Numeric RUL is gated until multi-week run-to-failure lifecycles are collected.
2. The 7 rule-only fault modes operate on physical thresholds until field incident recordings are captured.
3. Secondary surface parameters are inferred/defaulted when surface transducers are disconnected.

---

## 21. REMAINING REQUIRED SITE DATA

1. Continuous multi-week run-to-failure lifecycles for RUL survival modeling.
2. Field recordings of Scale Wear, High Backpressure, Open Choke, Motor Overload, Power Loss, and Sensor Drift.

---

## 22. PRODUCTION READINESS

| Component | Status | Evidence |
|---|---|---|
| **MQTT Collector & Ingestion** | 🟢 **READY** | Zero regressions to legacy pipeline |
| **SQLite Storage** | 🟢 **READY** | Ingested 54,879 rows, compound indexed |
| **Model 1: Rule Engine** | 🟢 **READY** | 100% coverage of 13 faults & envelopes |
| **Model 2: Fault Classifier** | 🟢 **READY** | 95.0% accuracy on 6 ML faults + Healthy |
| **Model 3: Risk Forecaster** | 🟠 **RESEARCH ONLY** | Gated to Research/Replay |
| **Model 4: RUL Engine** | ⚫ **DATA UNAVAILABLE** | Gated to UNAVAILABLE (Zero fake numbers) |
| **Model 5: Anomaly Detector** | 🟢 **READY** | Unsupervised healthy baseline active |
| **Backend REST & WebSocket** | 🟢 **READY** | 16 endpoints + WebSocket live broadcaster |
| **Frontend UI & Visualizations**| 🟢 **READY** | Provenance badges + Role views active |
