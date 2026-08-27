# Phase 45: 13-Fault Semantic & Mapping Forensic Audit

**Standard Nomenclature Requirement**:
- **13 Fault Modes** + **1 Healthy Baseline** = **14 Operating States**.
- **System Architecture**: `"13-Fault Hybrid Detection System"`.

---

## 1. COMPLETE 14-OPERATING-STATE MAPPING TABLE

| ID | Fault Mode Name | Canonical Fault Class | Raw Database Labels | Rule ID | Detection Method | Training Examples | Event Count | ML Readiness Status |
|---|---|---|---|---|---|---|---|---|
| **0** | **Healthy Operation** | `HEALTHY` | `normal` | `RULE-00-HEALTHY` | ML + Rule + Anomaly | 15,259 | 16 | 🟢 ML VALIDATED (READY) |
| **1** | **Dry-Well Pump Off** | `DRY_WELL_PUMP_OFF` | `dry_well_pump_off`, `gas_interference_to_lock` | `RULE-01-DRY-PUMP` | ML + Rule | 6,091 | 6 | 🟢 ML VALIDATED (READY) |
| **2** | **Blocked Intake** | `BLOCKED_INTAKE` | `blocked_intake` | `RULE-02-BLOCKED-INTAKE` | ML + Rule | 1,015 | 1 | 🟡 COLLECTING MORE DATA |
| **3** | **Scale or Pump Wear** | `SCALE_OR_PUMP_WEAR` | *(None)* | `RULE-03-SCALE-WEAR` | Deterministic Rule | 0 | 0 | ⚫ RULE READY (DATA REQ) |
| **4** | **Sand Ingestion** | `SAND_INGESTION` | `sand_ingestion` | `RULE-04-SAND-INGEST` | ML + Rule | 1,016 | 1 | 🟡 COLLECTING MORE DATA |
| **5** | **Bearing Degradation**| `BEARING_DEGRADATION` | `bearing_degradation` | `RULE-05-BEARING-WEAR` | ML + Rule | 1,016 | 1 | 🟡 COLLECTING MORE DATA |
| **6** | **Cold Start Drag** | `HIGH_VISCOSITY_COLD_START`| *(None)* | `RULE-06-COLD-START` | Deterministic Rule | 0 | 0 | ⚫ RULE READY (DATA REQ) |
| **7** | **High Backpressure** | `HIGH_BACKPRESSURE` | *(None)* | `RULE-07-BACKPRESSURE` | Deterministic Rule | 0 | 0 | ⚫ RULE READY (DATA REQ) |
| **8** | **Open Choke** | `OPEN_CHOKE` | *(None)* | `RULE-08-OPEN-CHOKE` | Deterministic Rule | 0 | 0 | ⚫ RULE READY (DATA REQ) |
| **9** | **Undervoltage** | `UNDERVOLTAGE` | `undervoltage` | `RULE-09-UNDERVOLT` | ML + Rule | 2,031 | 2 | 🟡 COLLECTING MORE DATA |
| **10**| **Phase Imbalance** | `PHASE_IMBALANCE` | `phase_imbalance` | `RULE-10-PHASE-IMBAL` | ML + Rule | 1,015 | 1 | 🟡 COLLECTING MORE DATA |
| **11**| **Motor Overload** | `MOTOR_OVERLOAD` | *(None)* | `RULE-11-MOTOR-OVERLOAD` | Deterministic Rule | 0 | 0 | ⚫ RULE READY (DATA REQ) |
| **12**| **Power Loss** | `POWER_LOSS` | *(None)* | `RULE-12-POWER-LOSS` | Deterministic Rule | 0 | 0 | ⚫ RULE READY (DATA REQ) |
| **13**| **Sensor Drift** | `SENSOR_DRIFT` | *(None)* | `RULE-13-SENSOR-DRIFT` | Deterministic Rule | 0 | 0 | ⚫ RULE READY (DATA REQ) |

---

## 2. CANONICAL TRACE FOR `gas_interference_to_lock`

- **Database Label**: `gas_interference_to_lock` (4,061 rows in `opg_well_telemetry` across 4 wells).
- **Physical Phenomenon**: Gas accumulation in pump stages causing fluid loss and vapor lock (identical hydraulic failure mechanism to dry-well pump off).
- **Canonical Mapping**: Mapped to `DRY_WELL_PUMP_OFF` during feature generation and dataset assembly.
- **Model Classifier Label**: `DRY_WELL_PUMP_OFF` (Combined 6,091 samples across 6 events).
- **Operator Advisory**: Triggers dry-well / gas-lock recovery advisory (throttle choke or cycle pump).
