# Phase 47: Frontend Runtime Data Binding & DOM Audit

---

## 1. UI COMPONENT DATA SOURCES

| UI Component | DOM Element ID | Data Origin Layer | API / WebSocket Route |
|---|---|---|---|
| **Well Filter Dropdown** | `#selESPWellFilter` | Database (SQLite `opg_wells.db`) | `GET /api/esp/wells` |
| **Master Health Badge** | `#espMasterStatusBadge` | Unified Decision Fusion | `GET /api/esp/live`, `WS /ws/esp/live` |
| **Active Fault Name** | `#espActiveFaultName` | Model 2 Classifier / Model 1 Rules | `GET /api/esp/live` |
| **Fault Confidence Pill**| `#espActiveFaultConfidence`| Model 2 Class Probability | `GET /api/esp/live` |
| **Future Risk Badge** | `#espFutureRiskBadge` | Model 3 Hazard Forecaster (Gated)| `GET /api/esp/live` |
| **RUL Status Badge** | `#espRulBadge` | Model 4 RUL Engine (`UNAVAILABLE`)| `GET /api/esp/live` |
| **Anomaly Score Pill** | `#espAnomalyScorePill` | Model 5 Isolation Forest | `GET /api/esp/live` |
| **Envelope Cards Grid** | `#espEnvelopeCardsGrid` | Model 1 Physical Envelopes | `GET /api/esp/envelope` |
| **SHAP Attributions** | `#espShapGrid` | Model 5 PCA Deviation Vectors | `GET /api/esp/live` |
| **Operator Action** | `#espOperatorActionText`| Unified Pipeline Action Map | `GET /api/esp/live` |
| **13-Fault Table** | `#learningProgressionTableContainer` | Model Registry & DB Events | `GET /api/esp/learning/13-fault-progression` |
| **Retraining Runs** | `#learningRunsTableContainer` | SQLite `esp_training_runs` | `GET /api/esp/learning/governance` |
