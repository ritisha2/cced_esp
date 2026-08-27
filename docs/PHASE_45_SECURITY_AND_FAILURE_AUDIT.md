# Phase 45: Security, Failure Modes & Edge-Case Audit

---

## 1. SIMULATED FAILURE MODES & SAFE DEGRADATION BEHAVIOR

| Failure Scenario | Simulated Fault Injection | System Behavior & Safety Gate | Test Verification |
|---|---|---|---|
| **MQTT Broker Offline** | Disconnect Paho-MQTT client | Ingestion pauses; UI displays `● DISCONNECTED`; cached telemetry retained safely. | `test_system.py` |
| **Malformed JSON Payload** | Ingest corrupted payload (`{"broken: ...`) | Parser catches JSONDecodeError; logs warning; discards corrupt packet without crash. | `test_system.py` |
| **Missing Secondary Sensors** | Telemetry missing `intake_temp`, `choke_size` | Default values applied; flagged as `⚠ INFERRED` / `✕ NOT AVAILABLE` on card badges. | `test_acceptance_hardening.py` |
| **Out-of-Range Sensor Reading** | PIP = -999.0 PSI or Motor Current = 500 A | Data Quality Engine flags `DEGRADED`; rule persistence prevents false trip triggering. | `test_acceptance_hardening.py` |
| **Unverified Model Prediction** | High-confidence model prediction with no operator feedback | Retained in predictions log; strictly blocked from training candidate queue. | `test_continuous_learning.py` |
| **False Alarm Flagged by Field** | Operator flags prediction as `FALSE_ALARM` | Negative sample recorded; excluded from positive fault training sets. | `test_continuous_learning.py` |
| **Challenger Model Degradation**| Challenger trained with degraded Macro F1 | Multi-metric promotion gate rejects candidate; Champion remains active. | `test_continuous_learning.py` |
| **Single-Click Model Rollback** | Administrative rollback triggered | Previous champion restored instantly from memory & disk; state marked `ROLLED_BACK`. | `test_continuous_learning.py` |

---

## 2. RBAC ROADMAP & SENSITIVE ENDPOINTS

While complete RBAC is postponed by design, the following endpoints are architecturally designated for Administrator authorization:
- `POST /api/esp/learning/retrain`
- `POST /api/esp/learning/promote`
- `POST /api/esp/learning/rollback`
- `POST /api/esp/learning/dataset/compile`
- `POST /api/esp/learning/quarantine/advance`
