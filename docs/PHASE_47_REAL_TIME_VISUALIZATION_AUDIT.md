# PHASE 47: Real-Time Visualization & Engineering Layer Audit

**Status**: APPROVED & OPERATIONAL  
**Phase**: Phase 47 — Real Live Engineering Visualization Layer  
**Contract**: Strict Zero-Fabrication • Zero Mocks • Asset-Centric Architecture  
**Database**: `data/opg_wells.db` (56,098 genuine historical telemetry records across 28 wells/assets)  

---

## 1. Executive Summary

Phase 47 implements the **Real Live Engineering Visualization Layer** for the ESP Intelligence platform. This layer operates strictly on genuine physical telemetry ingested via MQTT and stored in SQLite historian databases. 

No mock data, synthetic math curves, default well names, placeholder metrics, or simulated trends exist anywhere in the frontend or backend visualization layer.

---

## 2. Implemented Visualization Components

### 2.1 Asset-Centric Architecture & Dynamic Asset Selector
- **Endpoint**: `GET /api/esp/assets`
- **Dynamic Scope**: Selecting an asset in `#selESPWellFilter` queries and isolates all downstream views (`/api/esp/assets/{id}/visualization`, `/api/esp/assets/{id}/history`, `/api/esp/assets/{id}/events`, `/api/esp/assets/{id}/envelope`, `/api/esp/assets/{id}/pump-curve`).
- **Fleet Scope**: 28 distinct genuine wells (`FS-010`, `FS-011`, `FS-013`, `FSWS-001-A`, `FS-021`, etc.) automatically discovered from the database.
- **WebSocket Scoping**: Live MQTT packets are filtered by active `asset_id` so that only the selected asset triggers reactive UI updates.

### 2.2 Interactive ESP System Schematic
- **Component**: Dedicated downhole string schematic rendering real physical components:
  1. **Surface Node**: VSD (Frequency Hz), Transformer (TX), Choke & Flowline.
  2. **Wellbore Casing & Tubing**: Casing pressure, Tubing pressure, Fluid level above pump (ft).
  3. **Pump Discharge**: Discharge Pressure (PDP) with live marker.
  4. **Multistage Pump**: Pump model, Stage count, Differential pressure ($\Delta P = \text{PDP} - \text{PIP}$).
  5. **Gas Handler & Intake**: Intake Pressure (PIP), Intake Gas Volume Fraction (GVF %), Gas Flow rate (MSCFD), Water Cut %.
  6. **Protector / Seal Section**: Seal status, Insulation resistance ($M\Omega$).
  7. **Submersible Motor**: Motor HP rating, Motor Current (A), Terminal Voltage (V), Motor Winding Temperature (°C), Motor Load %, Vibration (g RMS).
  8. **Downhole Sensor**: Intake fluid temperature (°C), Sensor health, Data quality status.
  9. **Perforations / Inflow**: Liquid Rate (BPD), Reservoir Drawdown (PSI), Productivity Index (BPD/PSI).
- **Interactive Marker Inspector**: Clicking or hovering any marker updates `#markerInspectorCard` with live parameter name, measured value, physical unit, UTC timestamp, data source provenance, data quality status, operating status, and unique end-to-end trace ID.

### 2.3 Supporting Evidence Dual Time-Series Window
- **Endpoint**: `GET /api/esp/assets/{id}/history?range=...` & `GET /api/esp/assets/{id}/events`
- **Left Chart**: Dual y-axis plotting **Motor Current (A)** [left axis, blue] vs **Liquid Rate (BPD)** [right axis, purple].
- **Right Chart**: Multi-axis plotting **Pump Intake Pressure (PSI)** [left axis, emerald] vs **Pump Discharge Pressure (PSI)** [right axis, amber].
- **Range Selectors**: `1h`, `6h`, `24h`, `7d`, `All`. Preserves raw chronological timestamps without fabricating fake equidistant time steps.
- **Real Event Bands**: Displays real trips, unplanned stops, rule violations, and scenario signatures.

### 2.4 Operating Envelope & Operating Point vs Pump Curve
- **Operating Envelope Grid**: Evaluates all 13 canonical parameters against `config/envelopes.yaml` with color-coded status, deviation %, limit boundaries, and provenance badges (`LIVE_MQTT`, `DATABASE`, `DERIVED`, `UNAVAILABLE`).
- **Operating Point vs Pump Curve**: Displays actual operating point coordinates (Flow rate $Q$, Differential Head $\Delta P$, Frequency $\text{Hz}$).
- **Honest Unavailable Notice**: Displays `PUMP CURVE UNAVAILABLE: No validated pump performance curve is currently configured for this asset.` rather than drawing synthetic polynomial curves.

---

## 3. Verification & Acceptance Test Suite

Automated verification suite `tests/test_phase47_visualization_integrity.py` executes 7 rigorous integrity checks:
1. `test_01_zero_fabrication_telemetry_adapter`: Confirms zero fallback defaults (`WELL-001`) and marks missing sensors as `SensorProvenance.UNAVAILABLE`.
2. `test_02_real_assets_discovery`: Confirms dynamic asset list generation from SQLite with non-zero record counts.
3. `test_03_asset_visualization_bundle`: Confirms canonical schema completeness for schematic string, health, and trace IDs.
4. `test_04_supporting_evidence_history`: Confirms real chronological points for dual time-series.
5. `test_05_pump_curve_zero_fabrication_contract`: Confirms honest `UNAVAILABLE` status for unconfigured pump curves.
6. `test_06_model_integrity_and_gating`: Confirms Model 1-5 gating rules (RUL `UNAVAILABLE`, Risk `RESEARCH_REPLAY_ONLY`).
7. `test_07_learning_metrics_trend_dynamic_loading`: Confirms dynamic metric loading from baseline reports and SQLite candidate runs.

**Result**: 7/7 PASSED (`Ran 7 tests in 20.234s. OK`).
