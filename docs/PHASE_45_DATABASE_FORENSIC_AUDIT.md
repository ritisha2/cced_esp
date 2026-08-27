# Phase 45: Database Forensic Audit Report

**Audit Target**: `C:\Users\admin.DESKTOP-17T37DJ\Desktop\esp\data\opg_wells.db`  
**Database Size**: 133,087,232 bytes (126.92 MB)  
**SQLite Version**: 3.50.4 (WAL Journal Mode)  
**Total Tables**: 15 Tables  
**Total Telemetry Records**: 54,880 rows  

---

## 1. TABLE INVENTORY & INTEGRITY

| Table Name | Row Count | Column Count | Primary Key | Purpose |
|---|---|---|---|---|
| `opg_well_telemetry` | 54,880 | 25 | `id` (INTEGER AUTO) | Primary raw & labelled ESP telemetry time-series |
| `sqlite_sequence` | 5 | 2 | None | Internal SQLite sequence table |
| `ingestion_filters` | 0 | 5 | `id` (INTEGER AUTO) | Ingestion filter rules |
| `esp_unified_assessments` | 9 | 27 | `id` (INTEGER AUTO) | Persisted multi-model condition monitoring assessments |
| `esp_fault_predictions` | 0 | 11 | `id` (INTEGER AUTO) | Dedicated multiclass classification logs |
| `esp_risk_predictions` | 0 | 11 | `id` (INTEGER AUTO) | Dedicated future hazard forecast logs |
| `esp_rul_predictions` | 0 | 13 | `id` (INTEGER AUTO) | Dedicated RUL survival predictions |
| `esp_anomaly_events` | 0 | 12 | `id` (INTEGER AUTO) | Dedicated unsupervised anomaly events |
| `esp_prediction_validation` | 5 | 15 | `id` (INTEGER AUTO) | Operator field ground truth audits |
| `esp_model_registry` | 0 | 10 | `model_id` (TEXT PK) | Model artifact registry |
| `esp_ground_truth` | 16 | 14 | `ground_truth_id` (TEXT) | Operator-verified field outcomes |
| `esp_prediction_ground_truth_links` | 0 | 8 | `link_id` (TEXT) | Event-matched prediction scorecards |
| `esp_training_candidates` | 3 | 14 | `candidate_id` (TEXT) | Continuous learning quarantine queue |
| `esp_learning_datasets` | 1 | 10 | `dataset_id` (TEXT) | Versioned learning dataset registry |
| `esp_training_runs` | 4 | 14 | `training_run_id` (TEXT) | Model governance and candidate evaluation log |

---

## 2. SCENARIO LABEL DISTRIBUTION (`opg_well_telemetry`)

| Raw Scenario Label | Mapped Fault Mode | Row Count | Unique Wells | Time Span per Event |
|---|---|---|---|---|
| *Unlabeled Raw Telemetry* | *(Unlabeled)* | **27,437** | 27 wells | 44.07 min avg |
| `normal` | `HEALTHY` | **15,259** | 16 wells | 44.07 min avg |
| `gas_interference_to_lock` | `DRY_WELL_PUMP_OFF` (Gas Lock) | **4,061** | 4 wells (`FS-017`, `FS-028`, `FSWS-003`, `FSWS-012`) | 44.07 min avg |
| `undervoltage` | `UNDERVOLTAGE` | **2,031** | 2 wells (`FS-013`, `FS-042`) | 44.07 min avg |
| `dry_well_pump_off` | `DRY_WELL_PUMP_OFF` | **2,030** | 2 wells (`FSWS-001-A`, `FSWS-005`) | 44.07 min avg |
| `sand_ingestion` | `SAND_INGESTION` | **1,016** | 1 well (`FS-038`) | 44.07 min avg |
| `bearing_degradation` | `BEARING_DEGRADATION` | **1,016** | 1 well (`FS-023`) | 44.07 min avg |
| `phase_imbalance` | `PHASE_IMBALANCE` | **1,015** | 1 well (`FS-018`) | 44.07 min avg |
| `blocked_intake` | `BLOCKED_INTAKE` | **1,015** | 1 well (`FSWS-008`) | 44.07 min avg |
| **Total Rows** | | **54,880** | **28 wells** | |

---

## 3. NULL & ZERO DISTRIBUTIONS

- `timestamp`, `asset_id`, `well_id`, `topic`: **0 NULLs** (100% complete)
- `pressure_psi`, `temperature_c`, `water_cut_pct`: **0 NULLs** (100% complete)
- `intake_pressure_psi`, `vibration_g`: **6 zero values** (during initial well startup transients)
- `frequency_hz`: 14,488 zero values (when ESPs are in stopped/tripped state)
- `motor_current_a`: 21,086 zero values (when ESPs are de-energized/tripped)
- `motor_voltage_v`: 24,374 zero values (when electrical feed is off)
- `gas_flow_mscfd`: 54,874 zero values (unassociated gas field configuration)
