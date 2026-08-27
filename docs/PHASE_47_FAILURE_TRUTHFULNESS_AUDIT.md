# Phase 47: Failure State Truthfulness & Exception Audit

---

## 1. FAILURE SCENARIOS & TRUTHFUL RESPONSES

| Failure Scenario | Trigger Condition | Handled Output | Truthful UI Presentation |
|---|---|---|---|
| **Unknown Well ID** | Querying well not in database | `status: "empty"`, `history: []` | Clean empty state; zero fabricated telemetry |
| **Missing Downhole Sensors**| Telemetry row missing optional gauge | `provenance: "UNAVAILABLE"` | Displayed as `Sensor measurement unavailable` |
| **Model 3 Live Alarm** | Attempting live future hazard inference | Status: `RESEARCH_REPLAY_ONLY` | Displayed as `RESEARCH / REPLAY ONLY` |
| **Model 4 RUL Estimation** | Lifecycle countdown query | Status: `UNAVAILABLE` | `RUL unavailable — insufficient run-to-failure history` |
| **Low Model 2 Confidence** | Classifier top probability $< 0.30$ | Status: `UNKNOWN_UNSEEN` | `Unknown / Unseen Operating Pattern` |
| **MQTT Broker Offline** | Broker connection timeout | Heartbeat age increases | `DISCONNECTED` status pill ($\Delta t > 30$s) |
| **Empty Quarantine Queue** | No confirmed operator ground truth | Candidate list empty | `INSUFFICIENT VERIFIED FIELD FEEDBACK` |
| **Invalid Candidate Promotion**| Candidate macro F1 $< 0.85$ | Promotion rejected | `REJECTED: Candidate did not outperform champion` |
