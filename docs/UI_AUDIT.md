# Frontend UI & Component Forensic Audit

**Document Purpose**: Deep audit of all pages, tabs, components, charts, and data bindings in `frontend/index.html`, `frontend/js/app.js`, and `frontend/js/esp_intelligence.js`.

---

## 1. Page & Tab Inventory

| Tab ID | Tab Name | Purpose | Data Source | Connected API | WebSocket Event | Model Output Binding | Hardcoded / Mock Items Found |
|---|---|---|---|---|---|---|---|
| `tab-ledger` | Live Telemetry Ledger & Pipeline Controls | Raw incoming MQTT stream, buffer, broker form, filters | SQLite / MQTT | `/api/telemetry`, `/api/collector/status` | `LIVE_TELEMETRY`, `STATUS_UPDATE` | Raw Ingestion | None |
| `tab-esp` | ESP Intelligence Workspace | Primary diagnostic monitoring, health banner, 13 envelopes, timeline | ML Pipeline / SQLite | `/api/esp/live`, `/api/esp/history` | `ESP_ASSESSMENT` | Models 1, 2, 3, 4, 5 + SHAP | None (Live dynamic binding) |
| `tab-esp-replay` | Scenario Replay Mode | Interactive playback of recorded fault sequences | Processed Parquet / DB | `/api/esp/replay/control`, `/api/esp/replay/status` | `ESP_REPLAY_UPDATE` | Models 1, 2, 3, 4, 5 | None |
| `tab-esp-perf` | Model Performance | Holdout test metrics & confusion matrix | Saved Training Artifacts | `/api/esp/performance` | N/A | Model 2 Metrics | None (Populated from JSON report) |
| `tab-esp-readiness` | Site Data Readiness | Sensor requirements & validation checklist | Static Checklist & DB metadata | `/api/esp/data-quality` | N/A | System Requirements | Static verification checklist |
| `tab-analytics` | Time-Series Trends | Legacy parameter charting | SQLite | `/api/telemetry` | `LIVE_TELEMETRY` | Raw Telemetry | None |
| `tab-fleet` | Well Fleet Summary | Discovered well cards & health status | SQLite | `/api/assets/summary` | `LIVE_TELEMETRY` | Asset Aggregation | None |

---

## 2. Component-by-Component Inspection

1. **Master Health Status Badge (`espMasterStatusBadge`)**:
   - Dynamically changes CSS class (`esp-badge-healthy`, `esp-badge-warning`, `esp-badge-fault`, `esp-badge-critical`) and text based on real-time `UnifiedESPAssessment.overall_status`.
2. **Active Fault & Confidence (`espActiveFaultName`, `espActiveFaultConfidence`)**:
   - Displays real-time predicted fault class and calibrated probability percentage (e.g. `95% Confidence (HIGH)`).
3. **Future Risk Pill (`espFutureRiskBadge`)**:
   - Displays real-time risk level (`LOW`, `MEDIUM`, `HIGH`) and triggers amber/red styling dynamically.
4. **RUL Pill (`espRulBadge`)**:
   - Displays *"RUL unavailable — insufficient run-to-failure history"* when status is `UNAVAILABLE`.
5. **Anomaly Score Pill (`espAnomalyScorePill`)**:
   - Displays continuous score (0.000 to 1.000) and status (`NORMAL`, `UNUSUAL`, `ANOMALOUS`).
6. **13 Parameter Envelope Cards Grid (`espEnvelopeCardsGrid`)**:
   - Dynamically generated from `parameter_evaluations` array; shows value, unit, status dot, deviation bar, and reference range.
7. **Synchronized Multivariate Timeline Chart (`espMultivariateTimelineChart`)**:
   - Chart.js multi-axis line chart rendering real-time history of Discharge P, Intake P, Motor Current, and Motor Temperature.
