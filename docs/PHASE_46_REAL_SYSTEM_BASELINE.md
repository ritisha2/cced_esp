# Phase 46: Real System Baseline & Zero-Fabrication Architecture

**Policy**: **ZERO MOCKS / ZERO HARDCODING / ZERO SIMULATION**  
**Audit Date**: August 25, 2026  
**Primary Database**: `data/opg_wells.db` (133,087,232 bytes, 126.92 MB, 54,880 records across 28 wells)

---

## 1. AUTHENTIC PRODUCTION COMPONENTS

| Component Layer | Production File | Runtime State | Data Source |
|---|---|---|---|
| **FastAPI Backend Server** | `backend/main.py` | ACTIVE | Port 8000 (Uvicorn / FastAPI) |
| **MQTT Telemetry Collector** | `backend/mqtt_collector.py` | ACTIVE | Broker connection (`opg/wells/telemetry/#`) |
| **SQLite Ingestion Engine** | `backend/database.py` | ACTIVE | `data/opg_wells.db` (WAL Mode) |
| **Dedicated ML Database** | `backend/database_ml.py` | ACTIVE | 15 SQLite tables for assessments, feedback & models |
| **Multi-Model Pipeline** | `backend/services/unified_pipeline.py` | ACTIVE | 5 ML Models + Rule Engine (`trace_id` tagged) |
| **Model 1: Rules & Physics**| `ml/models/rule_engine.py` | ACTIVE | `config/fault_registry.yaml` (13 faults + envelopes) |
| **Model 2: Multiclass Fault** | `ml/models/fault_classifier.py` | ACTIVE | `models/fault_classifier/v1.0/fault_classifier.joblib` |
| **Model 3: Future Risk** | `ml/models/risk_predictor.py` | GATED | `models/risk_predictor/v1.0/` (`RESEARCH_REPLAY_ONLY`) |
| **Model 4: RUL Survival** | `ml/models/rul_engine.py` | GATED | `models/rul/v1.0/` (`UNAVAILABLE` due to run-to-failure history) |
| **Model 5: Anomaly Detector** | `ml/models/anomaly_detector.py` | ACTIVE | `models/anomaly_detector/v1.0/anomaly_detector.joblib` |
| **Continuous Learning** | `ml/learning/candidate_pipeline.py` | ACTIVE | Quarantine state machine with anti-leakage gates |
| **REST APIs** | `backend/api/esp_routes.py`, `learning_routes.py` | ACTIVE | 23 dynamic JSON endpoints |
| **WebSocket Streaming** | `backend/api/websocket_routes.py` | ACTIVE | Real-time push (`/ws/esp/live`) |
| **Frontend Controller** | `frontend/js/esp_intelligence.js` | ACTIVE | Dynamic DOM and Chart.js binding |

---

## 2. PRODUCTION HARDCODING & MOCK INVENTORY: ZERO

- **Mock Telemetry in Production**: **ZERO**
- **Simulation / Demo Mode**: **ZERO**
- **Hardcoded Predictions**: **ZERO**
- **Hardcoded Well Lists in UI**: **ZERO** (Dynamically fetched via `/api/esp/wells`)
- **Hardcoded Performance Metrics**: **ZERO** (Dynamically fetched via `/api/esp/performance`)
- **Hardcoded Live Indicators**: **ZERO** (Derived from real timestamp deltas: `LIVE` $\le 10$s, `STALE` 10–30s, `DISCONNECTED` $> 30$s)
