# PHASE 47: Engineering Visualization Data Contract

**Version**: 1.0  
**Phase**: Phase 47 — Real Live Engineering Visualization Layer  
**Scope**: JSON Data Contract between Backend REST API / WebSocket and Frontend UI  

---

## 1. Visualization Bundle Contract (`GET /api/esp/assets/{asset_id}/visualization`)

```json
{
  "status": "success",
  "asset_id": "FS-010",
  "well_id": "FS-010",
  "timestamp": "2026-08-25T14:30:00Z",
  "age_seconds": 12.4,
  "connection_state": "LIVE",
  "trace_id": "TRC-8A9F32BCDE",
  "schematic": {
    "surface": {
      "frequency_hz": 60.0,
      "vsd_state": "VSD ACTIVE",
      "transformer_status": "NORMAL",
      "choke_size_64in": 32.0,
      "flowline_pressure_psi": 125.0,
      "wellhead_pressure_psi": 185.0,
      "wellhead_temperature_c": 52.0
    },
    "wellbore": {
      "casing_pressure_psi": 110.0,
      "tubing_pressure_psi": 280.0,
      "fluid_level_above_pump_ft": 4200.0
    },
    "pump": {
      "pump_model": "TE2700",
      "stages": 164,
      "discharge_pressure_psi": 2450.0,
      "intake_pressure_psi": 820.0,
      "differential_pressure_psi": 1630.0,
      "liquid_rate_bpd": 1420.0
    },
    "gas_handler": {
      "intake_gvf_pct": 14.5,
      "gas_flow_mscfd": 450.0,
      "water_cut_pct": 65.0
    },
    "protector": {
      "status": "SEAL INTACT",
      "insulation_resistance_mohm": 850.0
    },
    "motor": {
      "motor_hp": 200.0,
      "motor_current_a": 38.2,
      "motor_voltage_v": 480.0,
      "motor_temperature_c": 84.5,
      "motor_load_pct": 95.5,
      "vibration_rms": 0.14
    },
    "downhole_sensor": {
      "intake_temperature_c": 62.0,
      "sensor_health": "GOOD",
      "data_quality": "GOOD"
    },
    "perforations": {
      "productivity_index_bpd_psi": 1.85,
      "drawdown_psi": 420.0,
      "intake_pressure_psi": 820.0
    }
  },
  "assessment": {
    "overall_status": "HEALTHY",
    "fault_status": "HEALTHY",
    "fault_name": "Healthy Operation",
    "fault_class": "HEALTHY",
    "fault_probability": 0.985,
    "confidence_level": "HIGH",
    "future_risk": "LOW",
    "rul": {
      "status": "UNAVAILABLE",
      "reason": "RUL unavailable — insufficient run-to-failure history.",
      "reason_code": "INSUFFICIENT_RUN_TO_FAILURE_HISTORY"
    },
    "anomaly": {
      "anomaly_score": 0.320,
      "status": "NORMAL",
      "severity": "NONE"
    },
    "parameter_evaluations": [],
    "top_reasons": ["Monitored physical parameters remain within reference safety limits."],
    "operator_action": "Continue standard operational monitoring.",
    "trace_id": "TRC-8A9F32BCDE"
  },
  "model_versions": {
    "model_1_rules": "v1.0 (Physical Envelopes & Rules)",
    "model_2_fault_classifier": "v1.0 (RandomForest 221-Feature)",
    "model_3_risk_predictor": "v1.0 (Multi-Horizon Gated / Research Only)",
    "model_4_rul_engine": "v1.0 (Calibrated Survival Regressor / Unavailable)",
    "model_5_anomaly_detector": "v1.0 (Isolation Forest + PCA Reconstruction)"
  }
}
```

---

## 2. Supporting Evidence History Contract (`GET /api/esp/assets/{asset_id}/history`)

```json
{
  "status": "success",
  "asset_id": "FS-010",
  "range_requested": "6h",
  "available_range_start": "2026-08-25T08:30:00Z",
  "available_range_end": "2026-08-25T14:30:00Z",
  "total_points": 120,
  "total_database_records": 2000,
  "points": [
    {
      "timestamp": "2026-08-25T08:30:00Z",
      "motor_current_a": 38.0,
      "liquid_rate_bpd": 1410.0,
      "intake_pressure_psi": 825.0,
      "discharge_pressure_psi": 2440.0,
      "motor_voltage_v": 480.0,
      "motor_temperature_c": 84.0,
      "vibration_rms": 0.14,
      "frequency_hz": 60.0,
      "operating_state": "running",
      "trip_cause": "",
      "scenario": "normal"
    }
  ]
}
```

---

## 3. Pump Performance Curve Contract (`GET /api/esp/assets/{asset_id}/pump-curve`)

```json
{
  "status": "UNAVAILABLE",
  "available": false,
  "asset_id": "FS-010",
  "pump_model": "TE2700",
  "reason": "No validated pump performance curve is currently configured for this asset.",
  "operating_point": {
    "liquid_rate_bpd": 1420.0,
    "differential_pressure_psi": 1630.0,
    "frequency_hz": 60.0,
    "timestamp": "2026-08-25T14:30:00Z"
  }
}
```
