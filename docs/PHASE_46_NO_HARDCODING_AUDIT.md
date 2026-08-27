# Phase 46: Zero-Hardcoding & Zero-Simulation Forensic Audit

---

## 1. REPOSITORY SCAN RESULTS

| Prohibited Category | Audit Result | Evidence |
|---|---|---|
| **Production Mock Data** | **0 (None)** | All data sourced directly from `data/opg_wells.db` |
| **Simulated Telemetry** | **0 (None)** | All ingestion happens via real MQTT or historical DB replay |
| **Demo / Simulation Modes** | **0 (None)** | Prohibited and eliminated from codebase |
| **Hardcoded Performance Metrics** | **0 (None)** | Metrics served dynamically via `/api/esp/performance` |
| **Hardcoded Well / Asset Lists** | **0 (None)** | Dynamically populated via `/api/esp/wells` |
| **Hardcoded Live Indicators** | **0 (None)** | Derived dynamically from MQTT timestamp freshness: `LIVE` ($\le 10$s), `STALE` (10–30s), `DISCONNECTED` ($> 30$s) |
| **Fake RUL Numbers** | **0 (None)** | Gated strictly to `UNAVAILABLE` (`INSUFFICIENT_HISTORY`) |
| **Fake Future Risk Alarms** | **0 (None)** | Gated strictly to `RESEARCH_REPLAY_ONLY` |

---

## 2. JUSTIFIED CONFIGURATION CONSTANTS

The following constants exist exclusively as legitimate engineering parameters in `config/`:
- Nominal parameter limits (e.g. Max Motor Temp = 115°C, Min PIP = 150 PSI) in `config/fault_registry.yaml`.
- MQTT broker host/port in `backend/config.py`.
- ML confidence threshold (0.30) in `ml/models/fault_classifier.py`.
- Retraining triggers (`min_new_verified_events: 3`, `min_new_samples: 200`) in `ml/learning/continuous_trainer.py`.
