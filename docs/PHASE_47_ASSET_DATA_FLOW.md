# PHASE 47: Asset-Centric Data Flow Architecture

**Document Version**: 1.0  
**Phase**: Phase 47 — Real Live Engineering Visualization Layer  
**Target Architecture**: Complete Asset Isolation and End-to-End Lineage  

---

## 1. End-to-End Data Pipeline Flow

```mermaid
flowchart TD
    subgraph Ingestion["1. Ingestion Layer"]
        A1[Live MQTT Telemetry Stream] --> B[FastAPI MQTT Collector]
        A2[SQLite opg_wells.db] --> B
    end

    subgraph Normalization["2. Telemetry Adapter & Schema Validation"]
        B --> C[telemetry_adapter.py]
        C --> D[CanonicalESPTelemetry Schema]
        D -->|Field Provenance Map| D1[LIVE_MQTT / DATABASE / DERIVED / UNAVAILABLE]
    end

    subgraph FeatureAndInference["3. Feature Engineering & 5-Model Engines"]
        D --> E[RollingFeatureExtractor - 221 Features]
        E --> M1[Model 1: ESPRuleEngine Physics Envelopes]
        E --> M2[Model 2: ESPFaultClassifier RandomForest 221-Feat]
        E --> M3[Model 3: ESPRiskPredictor Multi-Horizon Gated]
        E --> M4[Model 4: ESPRULEngine Status: UNAVAILABLE]
        E --> M5[Model 5: ESPAnomalyDetector IsoForest + PCA]
    end

    subgraph Synthesis["4. Decision Service & Master Health Synthesis"]
        M1 & M2 & M3 & M4 & M5 --> F[ESPDecisionService]
        F --> G[UnifiedESPAssessment with Trace ID]
    end

    subgraph Visualization["5. Asset-Centric Visualization API"]
        G --> H1[GET /api/esp/assets/{id}/visualization]
        G --> H2[GET /api/esp/assets/{id}/history]
        G --> H3[GET /api/esp/assets/{id}/events]
        G --> H4[GET /api/esp/assets/{id}/envelope]
        G --> H5[GET /api/esp/assets/{id}/pump-curve]
    end

    subgraph Frontend["6. Live Frontend UI (SCADA Theme)"]
        H1 --> UI1[ESP System Downhole String Schematic]
        H2 & H3 --> UI2[Supporting Evidence Dual Time-Series Window]
        H4 --> UI3[13 Parameters Operating Envelope Cards]
        H5 --> UI4[Operating Point vs Pump Curve Card]
        G --> UI5[Unified Master Health Banner & Operator Action]
    end
```

---

## 2. Asset Scoping Rules

1. **Dynamic Asset Selection**: The user selects an Asset ID from `/api/esp/assets`. No hardcoded fallback asset is used.
2. **Subscription Isolation**: WebSocket incoming messages check `record.asset_id === window.espIntelligence.currentAsset`. If matching, UI updates immediately. If not matching, background cache updates without disturbing the current asset view.
3. **Historical Window Queries**:
   - `range=1h`: Latest 1 hour of telemetry points.
   - `range=6h`: Latest 6 hours of telemetry points.
   - `range=24h`: Latest 24 hours of telemetry points.
   - `range=7d`: Latest 7 days of telemetry points.
   - `range=all`: All available points in historian database.
4. **Data Gaps**: Chronological data gaps are rendered honestly without synthetic mathematical interpolation.
