# Phase 47 Pre-Change Inventory & System Freeze

**Date**: August 26, 2026  
**Status**: System Frozen for Production Reality Acceptance

---

## 1. FILES & ARCHITECTURE INSPECTED

| Component | Path | Inspection Status |
|---|---|---|
| **FastAPI Main Entry** | `backend/main.py` | Audited |
| **REST API Routes** | `backend/api/esp_routes.py`, `learning_routes.py`, `replay_routes.py`, `validation_routes.py` | Audited |
| **Unified ML Pipeline** | `backend/services/unified_pipeline.py`, `decision_service.py` | Audited |
| **Database Managers** | `backend/database.py`, `backend/database_ml.py` | Audited |
| **MQTT Collector** | `backend/mqtt_collector.py` | Audited |
| **Telemetry Adapters** | `backend/adapters/telemetry_adapter.py` | Audited |
| **Feature Extraction** | `ml/features/time_series_features.py` | Audited |
| **Model 1: Rules/Physics** | `ml/models/rule_engine.py`, `config/fault_registry.yaml` | Audited |
| **Model 2: Classifier** | `ml/models/fault_classifier.py`, `models/fault_classifier/v1.0/` | Audited |
| **Model 3: Risk Forecaster** | `ml/models/risk_predictor.py`, `models/risk_predictor/v1.0/` | Audited |
| **Model 4: RUL Engine** | `ml/models/rul_engine.py`, `models/rul/v1.0/` | Audited |
| **Model 5: Anomaly Detector**| `ml/models/anomaly_detector.py`, `models/anomaly_detector/v1.0/` | Audited |
| **Continuous Learning** | `ml/learning/candidate_pipeline.py`, `continuous_trainer.py` | Audited |
| **Frontend UI** | `frontend/index.html`, `frontend/js/esp_intelligence.js`, `app.js` | Audited |
| **Primary SQLite Database** | `data/opg_wells.db` (54,880 rows, 28 wells) | Audited |

---

## 2. DISCOVERED FABRICATIONS & REMOVALS

1. **Static Dropdown Well Options**: Removed dummy `WELL-01` to `WELL-03` in `frontend/index.html`; replaced with dynamic `/api/esp/wells` query.
2. **Fixed Static Metric Text**: Removed static `95.0%` in initial HTML; replaced with dynamic rendering from `/api/esp/performance`.
3. **Manager View KPI Fallbacks**: Removed static string assignments (`4.2 hrs avg`, `0.8 / mo`) in JavaScript.
4. **Field Scorecard Fallback**: Removed `94.2%` default and `0.95` confidence hardcoding in `ml/evaluation/field_validation.py`.
5. **RUL Numerical Output**: Strictly gated `ml/models/rul_engine.py` to always return `UNAVAILABLE` (`INSUFFICIENT_RUN_TO_FAILURE_HISTORY`) to prevent numerical hallucinations.
