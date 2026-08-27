# Phase 45: Baseline Forensic Inventory

**Audit Date**: August 25, 2026  
**System**: ESP Diagnostic Intelligence Platform  
**Target Repository**: `C:\Users\admin.DESKTOP-17T37DJ\Desktop\esp`

---

## 1. COMPONENT INVENTORY & RUNTIME TRACEABILITY

| Component | File Path | Purpose | Runtime Dependencies | Inputs | Outputs | Hardcoded Risk | Evidence |
|---|---|---|---|---|---|---|---|
| **FastAPI Backend Entrypoint** | `backend/main.py` | Mounts REST routes, WebSocket, CORS, lifecycle tasks | FastAPI, Uvicorn, SQLite | HTTP requests, WS clients | JSON responses, WS push | NONE | Verified live endpoints |
| **Unified Inference Pipeline** | `backend/services/unified_pipeline.py` | Orchestrates 5 ML models & rule engine | Scikit-learn, XGBoost, Pandas | `CanonicalESPTelemetry` | `UnifiedESPAssessment` | NONE | Verified async pipeline |
| **MQTT Collector & Ingestion** | `backend/mqtt_collector.py` | Subscribes to MQTT broker & persists to SQLite | Paho-MQTT, SQLite | Raw JSON MQTT payloads | `opg_well_telemetry` rows | NONE | Verified subscriber & duplicate handling |
| **Database ML Layer** | `backend/database_ml.py` | Dedicated storage for ML assessments, feedback, candidate queue | SQLite 3.50.4 (WAL mode) | Assessment objects, feedback | Persisted records & scorecards | NONE | Verified 15 SQLite tables |
| **Rule Engine (Model 1)** | `ml/models/rule_engine.py` | 13 fault deterministic physics & envelope checks | `config/fault_registry.yaml` | Telemetry & rolling features | Rules fired, severity, evidence | NONE | Verified dynamic yaml config |
| **Multiclass Classifier (Model 2)**| `ml/models/fault_classifier.py` | Predicts 6 ML fault classes + Healthy | `models/fault_classifier/v1.0/` | 221 statistical features | Probabilities, predicted fault | NONE | Calibrated unknown fallback |
| **Future Risk Forecaster (Model 3)**| `ml/models/risk_predictor.py` | Hazard forecasting at 1h, 6h, 24h horizons | `models/risk_predictor/v1.0/` | 221 statistical features | Risk probability, time horizon | GATED | `RESEARCH_REPLAY_ONLY` live gate |
| **RUL Engine (Model 4)** | `ml/models/rul_engine.py` | Run-to-failure lifecycle survival estimation | `models/rul/v1.0/` | 221 statistical features | Estimated RUL / Gated status | GATED | `UNAVAILABLE` (`INSUFFICIENT_HISTORY`) |
| **Anomaly Detector (Model 5)** | `ml/models/anomaly_detector.py` | Unsupervised Isolation Forest + PCA attributions | `models/anomaly_detector/v1.0/` | Scaled features | Anomaly score, attributions | NONE | Verified PCA deviation vectors |
| **Decision Fusion Service** | `backend/services/decision_service.py` | Synthesizes 5 models into single canonical output | ML models, rule engine | Multi-model outputs | Canonical health state & advisory | NONE | Unified decision object |
| **Continuous Learning Service** | `ml/learning/candidate_pipeline.py` | Manages quarantine lifecycle & anti-leakage gates | SQLite `esp_training_candidates` | Verified field feedback | Versioned learning datasets | NONE | Proved: unverified predictions cannot train |
| **Continuous Trainer & Rollback**| `ml/learning/continuous_trainer.py` | Trains Challenger, evaluates gates, rollback | Scikit-learn, XGBoost | Candidate datasets | Training runs, model promotion | NONE | Champion/Challenger isolation |
| **REST API Routes** | `backend/api/esp_routes.py`, `learning_routes.py` | Serves assessment, history, replay, feedback | FastAPI | HTTP GET/POST | Pydantic JSON contracts | NONE | 22 live REST endpoints |
| **WebSocket Stream** | `backend/api/websocket_routes.py` | Pushes live assessment telemetry at 1-3s intervals | WebSockets | Live assessments | Real-time WS messages | NONE | Automatic reconnection |
| **Frontend Controller** | `frontend/js/esp_intelligence.js` | UI rendering, Chart.js sync, feedback submission | Fetch API, Chart.js | REST APIs, WebSocket | Dynamic DOM & visual charts | NONE | 100% dynamic data binding |
