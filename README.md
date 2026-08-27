# CCED-ESP-AI_ML: ESP Surveillance, Telemetry & Intelligence Platform

An industrial-grade, real-time data collection, storage, and monitoring system for **OPG & ESP (Electric Submersible Pump) Wells**, categorized by **Asset ID** via **MQTT**, storing data in **SQLite** in an optimized **Time-Series format**, featuring a high-performance **Live Table / Ledger Dashboard**, 13 Canonical Engineering Telemetry Channels, Dual-Tier ML Diagnostics, Operating Envelopes, Pump Performance Curves, and Asset Registry.

---

## Key Features

1. **Asset-Categorized Ingestion**:
   - Collects telemetry grouped by `ASSET_ID` and `WELL_ID`.
   - Flexible JSON normalization (handles pressure, temperature, flow rates, water cut, gas flow, choke %, battery voltage, sensor health, and raw payloads).

2. **SQLite Time-Series Storage**:
   - High-throughput **WAL (Write-Ahead Logging)** mode with in-memory caching and batch writes.
   - Compound indexes on `(asset_id, timestamp)`, `(well_id, timestamp)`, and `(timestamp)`.

3. **Dynamic Pipeline Controls**:
   - **Play / Resume / Pause**: Pause ingestion at any time without dropping connection.
   - **Pause Buffer Policy**: Optionally buffer incoming telemetry during pause and flush on resume, or drop discarded packets.

4. **Dynamic Ingestion Filters**:
   - **Filter Modes**: `ALL` (ingest everything), `WHITELIST` (ingest selected Asset IDs only), `BLACKLIST` (block specific assets).
   - **Interactive Asset Chips**: Click-to-toggle allowed Asset IDs on the fly.
   - **Threshold Rules**: Dynamic Min/Max Pressure (PSI) filtering.

5. **Live Ledger & Analytics Dashboard**:
   - Real-time row insertion with glowing status pulses over WebSockets.
   - Live KPI cards: Total SQLite Records, Ingestion Rate (`msg/s`), Active Asset Count, Filtered / Buffer Counts.
   - Instant Search & Filter by Asset ID, Well ID, Status (`NORMAL`, `WARNING`, `CRITICAL`), or keyword.
   - Interactive **Time-Series Charts** (Chart.js) for Pressure, Temperature, Liquid Flow, and Gas Flow trends.
   - **Asset Fleet Summary Cards** showing average pressures, water cut, and last-seen timestamps.
   - **Raw JSON Inspector**: View and copy formatted payload metadata with one click.
   - **One-Click Export**: Export stored data to CSV or JSON.
   - **Built-in Realistic Multi-Well Simulator**: Generates live realistic well physics telemetry out-of-the-box.

---

## Quick Start

### 1. Launch with One Click
In PowerShell or Command Prompt, run:
```powershell
.\start.ps1
```
or
```bat
start.bat
```
or manually:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Access the Dashboard
Open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## MQTT Configuration & Topic Structure

### Supported MQTT Topics:
- `opg/wells/<asset_id>/telemetry` (e.g. `opg/wells/ASSET-TX-PERMIAN-01/telemetry`)
- `opg/<asset_id>/data`
- `wells/#`

### Sample MQTT Payload (JSON):
```json
{
  "asset_id": "ASSET-TX-PERMIAN-01",
  "well_id": "WELL-TX-101",
  "timestamp": "2026-08-25T04:15:00Z",
  "pressure_psi": 2450.5,
  "temperature_c": 72.4,
  "flow_rate_bpd": 1250.0,
  "gas_flow_mscfd": 680.0,
  "water_cut_pct": 22.0,
  "choke_size_pct": 45.0,
  "status": "NORMAL",
  "sensor_health": "OK",
  "battery_volts": 24.1
}
```

*Note: The ingestion parser also gracefully handles varying field names such as `tubing_pressure`, `casing_pressure`, `oil_rate_bpd`, `temp_c`, or raw string payloads.*

---

## REST API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Live collector stats, MQTT status, SQLite record counts |
| `POST` | `/api/control` | Pipeline control (`play`, `pause`, `resume`, `clear_buffer`) |
| `GET` | `/api/filters` | Active ingestion filter configuration and discovered assets |
| `POST` | `/api/filters` | Update dynamic filter rules (whitelist, mode, pressure limits) |
| `GET` | `/api/telemetry` | Paginated query of time-series records from SQLite |
| `GET` | `/api/assets` | Fleet-level aggregated summaries and distinct assets |
| `GET` | `/api/analytics/timeseries` | Chronological points for time-series charts |
| `GET` | `/api/export/csv` | Download filtered dataset in CSV format |
| `GET` | `/api/export/json` | Download filtered dataset in JSON format |
| `POST` | `/api/mqtt/config` | Update MQTT Broker host/port/credentials dynamically |
| `POST` | `/api/simulator/toggle` | Start/stop the built-in multi-well simulator |
| `POST` | `/api/database/clear` | Truncate telemetry table in SQLite |
| `WS` | `/ws/live` | WebSocket stream for zero-latency live updates |

---

## Project Structure

```
esp/
├── backend/
│   ├── __init__.py
│   ├── config.py           # MQTT, database, and ingestion state config
│   ├── database.py         # SQLite WAL time-series manager & queries
│   ├── mqtt_collector.py   # Async MQTT subscriber & dynamic filter engine
│   ├── simulator.py        # Realistic OPG multi-well telemetry simulator
│   └── main.py             # FastAPI REST + WebSocket application
├── frontend/
│   ├── index.html          # SCADA dashboard interface
│   ├── css/
│   │   └── styles.css      # Dark-mode industrial glassmorphism styling
│   └── js/
│       └── app.js          # Real-time WebSocket logic, charts & table
├── frontend-react/         # React SPA Operations Center
├── ml/                     # Dual-Tier ML Inference & ISO Rule Engine
├── data/
│   └── opg_wells.db        # SQLite Time-Series Database
├── requirements.txt
├── start.bat
├── start.ps1
└── README.md
```
