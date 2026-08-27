# Continuous Learning & Verified Field Feedback Gap Audit

**Document Type**: Phase 43 Architecture & Implementation Gap Analysis  
**Audit Target**: `opg_wells.db`, ML Pipeline, Field Validation, Training Scripts, REST APIs, Frontend UI  
**Audit Date**: August 25, 2026  

---

## 1. Executive Summary

This audit assesses the readiness of the ESP Diagnostic Platform to support a complete **Verified Field Feedback $\rightarrow$ Training Candidate $\rightarrow$ Challenger Training $\rightarrow$ Champion Promotion/Rollback** lifecycle without self-reinforcing errors or data leakage.

---

## 2. Component-by-Component Gap Analysis

| Component / Subsystem | Current State | Classification | Identified Gap / Required Additive Change |
|---|---|---|---|
| **Raw Telemetry Storage (`opg_well_telemetry`)** | 54,879 rows intact in SQLite with complete sensor payload. | **IMPLEMENTED** | Raw telemetry must be permanently preserved; never overwritten by features or labels. |
| **Prediction Event Logging (`esp_unified_assessments`)** | Records latest predictions and assessments. | **PARTIALLY IMPLEMENTED** | Needs explicit foreign reference to telemetry row ID and separate model outputs table. |
| **Field Ground Truth Management** | Basic `esp_prediction_validation` table exists. | **PARTIALLY IMPLEMENTED** | Needs explicit `esp_ground_truth` table with event boundaries (`event_start`, `event_end`), operator notes, and verification statuses (`UNVERIFIED`, `CONFIRMED`, `FALSE_ALARM`, `REJECTED`, `UNKNOWN`). |
| **Prediction-to-Outcome Linkage** | Row-based manual audit in place. | **REQUIRES CHANGE** | Must implement **event-based temporal matching** (linking all predictions in a lead-up window to an actual field incident to compute True/False Positives and Lead Time). |
| **Training Candidate Queue & Quarantine** | Does not exist; training previously ran directly from static parquet/DB. | **MISSING** | Implement quarantine state machine: `QUARANTINED` $\rightarrow$ `VALIDATED` $\rightarrow$ `TRAINING_READY` $\rightarrow$ `USED_IN_TRAINING`. |
| **Self-Reinforcing Protection** | Model predictions were previously separate from training. | **UNSAFE IF UNCHECKED** | Must enforce hard programmatic gate: **Predictions alone can NEVER become training candidates**. Only `CONFIRMED` field outcomes qualify. |
| **Dataset Versioning (`dataset_v1`, `v2`...)** | Single canonical parquet file existed. | **MISSING** | Implement structured dataset registry recording samples, fault distribution, healthy count, wells, and feature version. |
| **Retraining Triggers** | Manual script execution only. | **MISSING** | Implement configurable triggers: $N$ new verified events, $N$ new samples, or performance degradation thresholds. |
| **Champion / Challenger Model Governance** | Models overwrote `models/*/v1.0/` path. | **REQUIRES CHANGE** | Implement Champion/Challenger isolation (`fault_classifier_v1.0` vs `fault_classifier_v1.1_candidate`), promotion gates, and instant rollback. |
| **Model State Machine** | Implicit. | **MISSING** | Implement state machine: `TRAINED` $\rightarrow$ `EVALUATED` $\rightarrow$ `APPROVED` $\rightarrow$ `REJECTED` $\rightarrow$ `DEPLOYED` $\rightarrow$ `ROLLED_BACK`. |
| **13-Fault Learning Progression** | Static registry in YAML. | **PARTIALLY IMPLEMENTED** | Expose live metrics indicating which of the 13 faults have sufficient field data for ML training vs rule-only. |
| **Self-Improvement Historical Trends** | Single point-in-time training report. | **MISSING** | Implement historical tracking of Macro F1, False Alarm Rate, and Verified Events over successive model generations. |

---

## 3. Required Additive Modules

1. `backend/database_ml.py`: Add `esp_ground_truth`, `esp_training_candidates`, `esp_learning_datasets`, `esp_training_runs`, and `esp_prediction_ground_truth_links` tables.
2. `ml/learning/ground_truth_service.py`: Handles field outcome logging, event linking, and validation scoring.
3. `ml/learning/candidate_pipeline.py`: Governs quarantine lifecycle and dataset assembly with anti-leakage gates.
4. `ml/learning/continuous_trainer.py`: Trains challenger models, evaluates against champion on chronological holdout, and manages promotion/rollback.
5. `backend/api/learning_routes.py`: Exposes REST endpoints for ground truth, retraining triggers, champion/challenger comparison, and metrics trends.
6. `frontend/js/esp_intelligence.js`: Integrates operator field feedback modal and Learning Center metrics.
7. `tests/test_continuous_learning.py`: Automated tests verifying that predictions never become ground truth and rollback works.
