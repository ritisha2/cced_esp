# Site Database Complete Schema & Forensic Audit

**Database Path**: `data/opg_wells.db`  
**File Size**: 129,968 KB (133,087,232 bytes)  
**SHA256**: `f380fb22e3328f2351bdaaca32cd42f55b0ab10fa594d78cec2fdf8ef18f0cbe`  
**Total Rows (All Tables)**: 54,887 rows  
**SQLite PRAGMA Version**: SQLite 3.x (WAL journal mode)

---

## 1. Complete Table Inventory

| Table Name | Purpose | Row Count | Primary Key | Foreign Keys | Indexes |
|---|---|---|---|---|---|
| `opg_well_telemetry` | Primary raw & labelled ESP time-series telemetry store | 54,879 | `id` (INTEGER AUTOINCREMENT) | None | `idx_opg_well_lookup`, `idx_opg_category_time` |
| `sqlite_sequence` | Internal SQLite autoincrement tracker | 3 | None | None | None |
| `ingestion_filters` | Ingestion filter configuration rules | 0 | `id` (INTEGER AUTOINCREMENT) | None | None |
| `esp_unified_assessments` | Persisted multi-model ML assessments | 6 | `id` (INTEGER AUTOINCREMENT) | None | Compound on `(esp_id, well_id, timestamp)` |
| `esp_fault_predictions` | Dedicated multiclass classification logs | 0 | `id` (INTEGER AUTOINCREMENT) | None | Compound on `(esp_id, well_id, timestamp)` |
| `esp_risk_predictions` | Dedicated future hazard forecast logs | 0 | `id` (INTEGER AUTOINCREMENT) | None | Compound on `(esp_id, well_id, timestamp)` |
| `esp_rul_predictions` | Dedicated RUL survival predictions | 0 | `id` (INTEGER AUTOINCREMENT) | None | Compound on `(esp_id, well_id, timestamp)` |
| `esp_anomaly_events` | Dedicated unsupervised anomaly events | 0 | `id` (INTEGER AUTOINCREMENT) | None | Compound on `(esp_id, well_id, timestamp)` |
| `esp_prediction_validation` | Operator field ground truth audits & feedback | 2 | `id` (INTEGER AUTOINCREMENT) | None | Compound on `(esp_id, well_id)` |
| `esp_model_registry` | Machine learning model version & artifact metadata | 0 | `model_id` (TEXT PK) | None | None |

---

## 2. Detailed Column Schema: `opg_well_telemetry`

| CID | Column Name | SQLite Type | Nullable? | Default Value | PK? | Description & Sample Value |
|---|---|---|---|---|---|---|
| 0 | `id` | `INTEGER` | YES | `NULL` | **YES** | Unique row ID (`1`, `2`, ...) |
| 1 | `timestamp` | `TEXT` | **NO** | `NULL` | NO | ISO 8601 UTC timestamp (`2026-08-25T04:32:30.744614Z`) |
| 2 | `asset_id` | `TEXT` | **NO** | `NULL` | NO | Asset identifier (`ESP-FSWS-001-A`) |
| 3 | `well_id` | `TEXT` | **NO** | `NULL` | NO | Well identifier (`FSWS-001-A`) |
| 4 | `topic` | `TEXT` | YES | `''` | NO | MQTT Ingestion topic (`opg/wells/telemetry/FSWS-001-A`) |
| 5 | `pressure_psi` | `REAL` | YES | `0.0` | NO | Surface/Discharge Pressure in PSI (`1380.5`) |
| 6 | `temperature_c` | `REAL` | YES | `0.0` | NO | Motor/Wellbore Temperature in °C (`74.2`) |
| 7 | `flow_rate_bpd` | `REAL` | YES | `0.0` | NO | Total Liquid Production Rate in BPD (`418.6`) |
| 8 | `gas_flow_mscfd` | `REAL` | YES | `0.0` | NO | Associated Gas Flow Rate in MSCFD (`12.4`) |
| 9 | `water_cut_pct` | `REAL` | YES | `0.0` | NO | Water Cut Percentage in % (`78.4`) |
| 10 | `choke_size_pct` | `REAL` | YES | `0.0` | NO | Surface Choke opening % (`50.0`) |
| 11 | `status` | `TEXT` | YES | `'NORMAL'` | NO | Operational status string (`NORMAL`, `ALARM`) |
| 12 | `raw_payload` | `TEXT` | YES | `'{}'` | NO | Complete verbatim JSON MQTT message |
| 13 | `created_at` | `TEXT` | YES | `STRFTIME(...)` | NO | Ingestion database insertion timestamp |
| 14 | `intake_pressure_psi` | `REAL` | YES | `0.0` | NO | Pump Intake Pressure (PIP) in PSI (`464.1`) |
| 15 | `frequency_hz` | `REAL` | YES | `0.0` | NO | VFD Operating Frequency in Hz (`60.0`) |
| 16 | `motor_current_a` | `REAL` | YES | `0.0` | NO | Motor Phase Current in Amperes (`11.8`) |
| 17 | `motor_voltage_v` | `REAL` | YES | `0.0` | NO | Motor Terminal Voltage in Volts (`780.0`) |
| 18 | `vibration_g` | `REAL` | YES | `0.0` | NO | Downhole Vibration RMS in g (`0.18`) |
| 19 | `operating_state` | `TEXT` | YES | `'running'` | NO | State indicator (`running`, `tripped`) |
| 20 | `trip_cause` | `TEXT` | YES | `''` | NO | Hardware trip reason (`HIGH_VIBRATION`, etc.) |
| 21 | `data_category` | `TEXT` | YES | `'LABELLED'` | NO | Ingestion category (`LABELLED`, `UNLABELLED`) |
| 22 | `scenario` | `TEXT` | YES | `'normal'` | NO | Ground truth fault scenario name |
| 23 | `alarms` | `TEXT` | YES | `'[]'` | NO | JSON array of active PLC alarm strings |
| 24 | `alerts` | `TEXT` | YES | `'[]'` | NO | JSON array of active PLC alert strings |
