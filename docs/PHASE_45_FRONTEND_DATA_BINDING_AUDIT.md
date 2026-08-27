# Phase 45: Frontend Data Binding & Visualization Forensic Audit

---

## 1. COMPONENT DATA SOURCE TRACEABILITY

| UI Element | DOM Element ID | Backend Data Source | Dynamic Update Mechanism | Hardcoded Fallback? |
|---|---|---|---|---|
| Master Health Badge | `#espMasterStatusBadge` | `/api/esp/live` $\rightarrow$ `overall_status` | 3-second polling & WebSocket | **NO (Dynamic)** |
| Active Fault Name | `#espActiveFaultName` | `/api/esp/live` $\rightarrow$ `fault_name` | 3-second polling & WebSocket | **NO (Dynamic)** |
| Confidence Level | `#espActiveFaultConfidence` | `/api/esp/live` $\rightarrow$ `fault_probability` | 3-second polling & WebSocket | **NO (Dynamic)** |
| Future Risk Badge | `#espFutureRiskBadge` | `/api/esp/live` $\rightarrow$ `future_risk` | 3-second polling & WebSocket | **NO (Dynamic)** |
| RUL Badge | `#espRulBadge` | `/api/esp/live` $\rightarrow$ `rul.status` | 3-second polling & WebSocket | **NO (Displays UNAVAILABLE)** |
| Anomaly Score Pill | `#espAnomalyScorePill` | `/api/esp/live` $\rightarrow$ `anomaly.anomaly_score` | 3-second polling & WebSocket | **NO (Dynamic)** |
| 13 Envelope Cards | `#espEnvelopeCardsGrid` | `/api/esp/envelope` | Polled per well selection | **NO (Dynamic)** |
| Multivariate Timeline | `#espMultivariateTimelineChart` | `/api/esp/history` | Chart.js dynamic update | **NO (Real time-series)** |
| SHAP Feature Bars | `#espShapGrid` | `/api/esp/explanation` $\rightarrow$ `shap_contributions`| Dynamic DOM render | **NO (Real SHAP values)** |
| 13-Fault Manager Table | `#mgrFaultCoverageTableContainer`| `/api/esp/faults/registry` | Dynamically generated table | **NO (From yaml config)** |
| Model Performance Cards| `#perfAccuracyVal`, `#perfF1Val`| `/api/esp/performance` | Populated from test report | **NO (Dynamic from API)** |
| Confusion Matrix Table | `#perfConfusionMatrixTable` | `/api/esp/performance` $\rightarrow$ `confusion_matrix`| Dynamic table render | **NO (Real test matrix)** |
| 13-Fault Learning Matrix | `#learningProgressionTableContainer`| `/api/esp/learning/13-fault-progression` | Live API table render | **NO (Dynamic from DB)** |
| Training Runs History | `#learningRunsTableContainer` | `/api/esp/learning/models` | Live API table render | **NO (Dynamic from DB)** |

---

## 2. HARDCODING ELIMINATION SUMMARY

- **Eliminated**: Initial placeholder `95.0%` in `index.html` replaced with `—` until dynamic response from `/api/esp/performance` arrives.
- **Eliminated**: Default fallback float values in `renderModelPerformancePage` removed; API responses are rendered directly.
- **Enforced**: `● LIVE MQTT` is computed dynamically from MQTT timestamp delta; transitions to `STALE` and `DISCONNECTED` based on real elapsed time.
