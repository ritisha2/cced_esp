# Existing System Audit & Code Protection Report

Date: 2026-08-25
System: OPG & ESP Wells Telemetry & Asset Ledger System

---

## 1. Executive Summary

This audit establishes the baseline of the pre-existing ESP monitoring application. The existing codebase is responsible for collecting ESP telemetry over MQTT, normalizing it into Labelled and Unlabelled time-series records, storing them in SQLite (WAL mode), providing dynamic ingestion controls, and displaying them via a SCADA Ledger Dashboard.

**All existing files are designated as READ-ONLY / PRESERVED.**
All new ML, fault diagnosis, RUL, anomaly detection, and advanced UI capabilities will be built as **ADDITIVE EXTENSIONS** without modifying the core telemetry ingestion loop or altering existing database schemas.

---

## 2. File-by-File Audit & Protection Matrix

| File Path | Component | Purpose & Dependencies | Protection Status | Modification Justification (if any) |
|---|---|---|---|---|
| `backend/config.py` | Config Layer | Defines MQTT broker parameters, IngestionState, base paths. | **PRESERVED** | Read-only. ML configs will reside in separate `config/` YAML files or additive models. |
| `backend/database.py` | Database Layer | Manages `opg_well_telemetry` table, WAL mode, queries, batch inserts. | **PRESERVED** | Read-only. New tables for ML predictions, RUL, and anomalies will be managed via `backend/database_ml.py`. |
| `backend/mqtt_collector.py` | Ingestion Layer | Async Paho-MQTT subscriber, queueing, filters, WebSocket callbacks. | **PRESERVED** | Read-only. An additive stream listener/hook will bridge telemetry to the ML pipeline. |
| `backend/transformer.py` | Normalization | Normalizes raw MQTT JSON into Labelled and Unlabelled schema dictionaries. | **PRESERVED** | Read-only. Canonical schema adapter will consume from normalized or raw records. |
| `backend/main.py` | API & Entry | FastAPI application, existing REST endpoints, `/ws/live` stream. | **PRESERVED / EXTENDED ADDITIVELY** | Include new router (`app.include_router(esp_router)`) without modifying existing route handlers. |
| `frontend/index.html` | Frontend UI | SCADA Ledger Dashboard, Ingestion console, time-series chart, fleet cards. | **PRESERVED / EXTENDED ADDITIVELY** | The existing tabs (`tab-ledger`, `tab-analytics`, `tab-fleet`) remain untouched. Add new "ESP INTELLIGENCE" tabs/sections. |
| `frontend/js/app.js` | Frontend Logic | WebSocket consumer, ledger table rendering, filter handlers, Chart.js trends. | **PRESERVED / EXTENDED ADDITIVELY** | Keep existing JavaScript logic intact. Add modular JS modules for ESP Intelligence. |
| `frontend/css/styles.css` | Styling | Dark theme glassmorphism styling, layout, responsive design. | **PRESERVED / EXTENDED ADDITIVELY** | Append styling rules for new ESP Intelligence widgets and charts. |
| `data/opg_wells.db` | SQLite Storage | SQLite database containing `opg_well_telemetry` (50,000+ historical records). | **PRESERVED / READ-ONLY HISTORIAN** | Zero row deletion/alteration. New tables created in or alongside DB for ML predictions. |
| `test_system.py` | Testing | Tests SQLite init, telemetry insertion, queries, and MQTT normalization. | **PRESERVED** | Continuous regression benchmark. New tests added to `tests/`. |

---

## 3. Existing Telemetry Data Flow

```
MQTT Source (esp/#, opg/#, wells/#)
      │
      ▼
MQTTCollector._on_message
      │
      ▼
Transformer.transform_mqtt_payload
      ├──► LABELLED Record (Scenario, Alarms, Alerts, Operating State, Trip Cause)
      └──► UNLABELLED Record (Pure physical sensor parameters)
      │
      ▼
Database.insert_telemetry_batch ──► SQLite: opg_well_telemetry
      │
      ▼
WebSocketManager.broadcast ──► Frontend Live Ledger (app.js)
```

---

## 4. Existing Data Schema (`opg_well_telemetry`)

The existing table contains 23 columns:
1. `id` (INTEGER PRIMARY KEY)
2. `timestamp` (TEXT ISO8601)
3. `asset_id` (TEXT)
4. `well_id` (TEXT)
5. `topic` (TEXT)
6. `data_category` (TEXT: 'LABELLED' or 'UNLABELLED')
7. `scenario` (TEXT: 'normal', 'dry_well_pump_off', 'blocked_intake', 'gas_interference_to_lock', etc.)
8. `alarms` (TEXT JSON array)
9. `alerts` (TEXT JSON array)
10. `pressure_psi` (REAL - Discharge Pressure)
11. `intake_pressure_psi` (REAL - Intake Pressure)
12. `temperature_c` (REAL - Motor / Well Temperature)
13. `flow_rate_bpd` (REAL - Liquid Flow Rate)
14. `frequency_hz` (REAL - Motor Frequency)
15. `motor_current_a` (REAL - Motor Current)
16. `motor_voltage_v` (REAL - Motor Voltage)
17. `vibration_g` (REAL - Pump Vibration)
18. `water_cut_pct` (REAL - Water Cut %)
19. `gas_flow_mscfd` (REAL - Gas Flow)
20. `choke_size_pct` (REAL - Choke Size %)
21. `operating_state` (TEXT: 'running', 'tripped', 'unlabelled')
22. `trip_cause` (TEXT: 'UNDER_VOLTAGE', 'GAS_LOCK_UNDERLOAD', etc.)
23. `status` (TEXT: 'NORMAL', 'WARNING', 'CRITICAL', 'UNLABELLED')
24. `raw_payload` (TEXT JSON)
25. `created_at` (TEXT)

---

## 5. Additive Integration Architecture

To adhere to the preservation mandate, the new ML pipeline will attach via a **non-blocking asynchronous subscriber pattern**:
1. When telemetry arrives or is queried from the historian, it passes to the **Canonical Adapter**.
2. The ML pipeline computes features and runs the 4 Model Systems + Explainability without slowing down or mutating the existing ingestion path.
3. Inference results are stored in dedicated tables (`esp_unified_assessments`, `esp_fault_predictions`, `esp_anomaly_events`, etc.).
4. The frontend receives ML updates via a dedicated WebSocket channel (`/ws/esp/live`) and REST API endpoints (`/api/esp/*`).

---

## 6. Audit Conclusion & Gating Check
- Existing codebase is stable and running.
- Baseline tests in `test_system.py` pass.
- No existing functionality will be disrupted.
