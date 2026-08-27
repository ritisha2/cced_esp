# Explainability & Engineering Root-Cause Specification

## 1. Objective
Machine learning outputs without domain-specific explanations fail in field operations. The explainability layer translates statistical feature attributions (SHAP values) and multivariate rule deviations into clear, human-understandable engineering narratives.

---

## 2. Multi-Level Information Architecture

```
                                  [UNIFIED DECISION]
                                          │
       ┌──────────────────────────────────┴──────────────────────────────────┐
       ▼                                                                     ▼
[OPERATOR LEVEL]                                                      [ENGINEER LEVEL]
• High-level status: FAULT DETECTED                                   • Raw probability vector
• Plain-English summary:                                              • SHAP feature contributions
  "Motor Overload: Motor current elevated                             • Parameter deviations (Δ PSI, Δ °C)
   18% above rated threshold for 22 mins"                             • Envelope violation durations
• Recommended Action:                                                 • Model version & feature schema hash
  "Inspect surface VFD current limit and well fluid level"            • Sensor consistency scores
```

---

## 3. Engineering Explanation Templates for 13 Faults

| Fault Class | Primary Physics Drivers | Template Narrative Example | Recommended Action |
|---|---|---|---|
| `DRY_WELL_PUMP_OFF` | PIP collapse, motor underload, flow drop | *"Pump intake pressure collapsed to {pip} PSI with fluid rate falling to {flow} BPD and motor underload at {current} A."* | Throttling or cycling well; verify fluid level. |
| `BLOCKED_INTAKE` | Severe PIP drop, PDP drop, stable VFD speed | *"Sudden pump intake restriction detected: PIP dropped by {delta_pip} PSI while motor current remained stable at {current} A."* | Backwash or clean intake screen; check for debris. |
| `SCALE_OR_PUMP_WEAR` | Gradual differential pressure drop, flow decay | *"Long-term pump degradation: Differential pressure has decayed by {delta_dp} PSI over {days} days at constant Hz."* | Schedule pump performance test / scale inhibitor. |
| `SAND_INGESTION` | High vibration RMS, current spikes, solids wear | *"Abrasive solids detected: Vibration RMS surged to {vib} g with erratic motor current fluctuations ({cur_std} A std)."* | Choke well to reduce drawdown; inspect sand filters. |
| `BEARING_DEGRADATION`| High frequency vibration, motor temp escalation | *"Mechanical bearing wear: Vibration elevated to {vib} g accompanied by a {delta_temp}°C rise in motor temperature."* | Monitor vibration trend closely; plan workover intervention. |
| `HIGH_VISCOSITY_COLD_START`| High initial load/current, slow ramp-up | *"High viscosity startup resistance: High torque loading ({load}%) with extended thermal stabilization period."* | Allow thermal stabilization; optimize ramp rate. |
| `HIGH_BACKPRESSURE`| PDP elevated, flow reduced, motor load elevated | *"High backpressure detected: Discharge pressure elevated to {pdp} PSI ({delta_pdp} above normal) with reduced flow."* | Inspect surface flowlines, valves, and separator pressure. |
| `OPEN_CHOKE` | PDP low, liquid rate elevated, PIP drawn down | *"Open choke operation: High liquid rate ({flow} BPD) with depressed PDP ({pdp} PSI), operating right of pump curve."* | Adjust surface choke orifice to restore design head. |
| `UNDERVOLTAGE` | Terminal voltage depressed, current compensation | *"Electrical undervoltage: Motor voltage dropped to {volts} V ({pct_drop}% below rated)."* | Check power grid / transformer tap setting / VFD bus. |
| `PHASE_IMBALANCE` | Current/voltage variance between phases | *"Electrical phase unbalance detected: Current imbalance exceeds {imbalance_pct}%."* | Inspect surface power leads, cable insulation, and VFD. |
| `MOTOR_OVERLOAD` | Sustained high current, high motor temperature | *"Thermal overload: Motor current at {current} A ({load}% load) persistently for {duration} min with temp at {temp}°C."* | Reduce operating frequency or reduce choke size. |
| `POWER_LOSS` | Instantaneous current & voltage collapse | *"Sudden electrical interruption: Voltage and current collapsed to zero during active operation."* | Verify grid power and breaker status. |
| `SENSOR_DRIFT` | Implausible physical divergence between gauges | *"Sensor drift: Downhole gauge reading deviates persistently from redundant and hydraulic correlation models."* | Calibrate sensor; switch to secondary gauge model. |
| `UNKNOWN_UNSEEN` | High anomaly score, low classifier confidence | *"Unusual multivariate operating trajectory detected that does not match trained fault library signatures."* | Monitor telemetry closely and request engineering review. |
