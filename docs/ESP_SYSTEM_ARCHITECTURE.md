# ESP System Architecture Specification

## 1. System Overview & Objective
The ESP (Electrical Submersible Pump) Condition Monitoring, Fault Diagnosis, Fault Prediction, Remaining Useful Life (RUL), and Anomaly Detection Platform is designed to operate on continuous multi-sensor telemetry streams.

The platform provides:
1. **Real-time Safety & Operating Envelope Enforcement** via a deterministic Rule Engine.
2. **Multi-Class Fault Diagnosis** identifying 13 specific failure modes + Healthy + Unknown/Unseen patterns.
3. **Future Fault Risk Forecasting** predicting probability of failure across multi-scale time horizons (1h to 30d).
4. **Calibrated Remaining Useful Life (RUL)** with rigorous uncertainty intervals when valid run-to-failure histories exist, or a strict, scientifically honest "RUL unavailable" status when degradation data is insufficient.
5. **Healthy-State Anomaly Detection** identifying novel operational deviations independent of known fault classifiers.
6. **Explainability & Root-Cause Synthesis** translating multivariate shifts and SHAP attributions into domain-specific engineering narratives.

---

## 2. End-to-End Pipeline Architecture

```
                                  LIVE TELEMETRY STREAM (MQTT)
                                                │
                                                ▼
                                    RAW HISTORIAN (SQLite)
                                                │
                                                ▼
                                 READ-ONLY STREAM ADAPTER LAYER
                                                │
                                                ▼
                                   CANONICAL TELEMETRY SCHEMA
                               (13 Core Parameters + Quality Flags)
                                                │
                                                ▼
                                    DATA QUALITY ENGINE
                     (Outliers, Freezing, Timestamp Gaps, Physics Limits)
                                                │
                                                ▼
                               TIME-SERIES ROLLING WINDOW BUILDER
                         (1m, 5m, 15m, 30m, 1h, 6h, 24h Aggregations)
                                                │
                   ┌────────────────────────────┼────────────────────────────┐
                   ▼                            ▼                            ▼
             MODEL SYSTEM 1               MODEL SYSTEM 2               MODEL SYSTEM 5
             Rule & Envelope             Multiclass Fault              Healthy-State
                 Engine                     Classifier                Anomaly Detector
           (Limits, Persistence,      (13 Faults + Unknown,        (Isolation Forest, PCA,
             Rate of Change)           Calibrated Softmax)          Unsupervised Scores)
                   │                            │                            │
                   └────────────────────────────┼────────────────────────────┘
                                                │
                               ┌────────────────┴────────────────┐
                               ▼                                 ▼
                         MODEL SYSTEM 3                    MODEL SYSTEM 4
                        Future Fault Risk                  RUL Estimation
                           Predictor                           Engine
                       (Multi-Horizon Risk              (Survival Analysis /
                          Trajectories)                   Degradation Gate)
                               │                                 │
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                                     EXPLAINABILITY LAYER
                              (Tree SHAP + Physics Rule Mapping)
                                                │
                                                ▼
                                   UNIFIED DECISION SERVICE
                           (Synthesizes Unified ESP Assessment)
                                                │
                                                ▼
                                  DEDICATED ML STORAGE & CACHE
                          (Predictions, Anomaly Events, Audit Log)
                                                │
                                                ▼
                                     REST & WEBSOCKET APIS
                                    (/api/esp/*, /ws/esp/live)
                                                │
                                                ▼
                                    ADDITIVE FRONTEND SECTION
                                      ("ESP INTELLIGENCE")
```

---

## 3. The 13 Monitored Physical Parameters

| Parameter | Canonical Name | Engineering Unit | Reference Range | Physical Description |
|---|---|---|---|---|
| 1 | `liquid_rate_bpd` | BPD (Barrels/Day) | 956.1 – 974.6 | Surface total liquid production rate |
| 2 | `intake_pressure_psi` | PSI | 234.7 – 238.5 | Downhole pump intake pressure (PIP) |
| 3 | `motor_current_a` | Amperes (A) | Nominal ± 15% | Downhole motor electrical phase/total current |
| 4 | `motor_load_pct` | % | 40.0 – 95.0% | Motor electrical loading percentage |
| 5 | `motor_temperature_c` | °C | 99.2 – 100.9 | Downhole motor internal winding/oil temperature |
| 6 | `vibration_rms` | g (RMS) | 0.05 – 0.35 | Multi-axis downhole mechanical vibration |
| 7 | `discharge_pressure_psi` | PSI | 2109.4 – 2144.9 | Downhole pump discharge pressure (PDP) |
| 8 | `motor_voltage_v` | Volts (V) | Nominal ± 10% | Downhole motor terminal voltage |
| 9 | `intake_temperature_c` | °C | 40.0 – 85.0 | Wellbore reservoir fluid intake temperature |
| 10 | `flowline_pressure_psi` | PSI | 50.0 – 350.0 | Surface production flowline header pressure |
| 11 | `wellhead_pressure_psi` | PSI | 80.0 – 450.0 | Surface wellhead tubing pressure |
| 12 | `casing_pressure_psi` | PSI | 50.0 – 300.0 | Surface well annulus casing pressure |
| 13 | `choke_size_64in` | /64ths inch | 16 – 64 | Surface production choke opening size |

---

## 4. The 13 Monitored Fault Classes

1. `DRY_WELL_PUMP_OFF`: Fluid level drops below intake, loss of prime, intake pressure collapse, severe underload.
2. `BLOCKED_INTAKE`: Debris or scale obstruction at pump intake, sudden suction throttling, differential pressure drop.
3. `SCALE_OR_PUMP_WEAR`: Gradual hydraulic efficiency degradation, increased slippage, head loss over time.
4. `SAND_INGESTION`: Solids production causing abrasive wear, severe vibration spikes, motor current oscillations.
5. `BEARING_DEGRADATION`: Mechanical bearing failure, severe high-frequency vibration, motor temperature escalation.
6. `HIGH_VISCOSITY_COLD_START`: Heavy crude cold-start resistance, high starting torque, prolonged thermal ramp.
7. `HIGH_BACKPRESSURE`: Downhole or surface flowline restriction, elevated PDP, reduced liquid rate, elevated load.
8. `OPEN_CHOKE`: Surface choke over-opened, low backpressure, pump operating off high-flow end of curve.
9. `UNDERVOLTAGE`: Power grid / VFD supply voltage depression below operating threshold.
10. `PHASE_IMBALANCE`: Electrical voltage/current unbalance between phases (flagged when 3-phase telemetry available).
11. `MOTOR_OVERLOAD`: Sustained motor thermal/current overload exceeding rated capacity.
12. `POWER_LOSS`: Sudden grid outage, power supply disruption, or bus collapse.
13. `SENSOR_DRIFT`: Calibration drift or implausible signal divergence in downhole gauges.
14. `HEALTHY`: Stable operation within envelope and normal trajectory.
15. `UNKNOWN_UNSEEN`: Statistically anomalous pattern that does not match known fault library signatures.

---

## 5. Unified Decision Synthesis Logic

The Unified Decision Service aggregates signals from all 5 model systems into a final `UnifiedESPAssessment`:

- If any critical rule is violated OR fault classifier confidence for a severe fault exceeds threshold:
  **Overall Status = CRITICAL** or **FAULT DETECTED**
- If warnings are active OR future risk is HIGH OR anomaly detector indicates unusual behavior:
  **Overall Status = WARNING**
- If all parameters within envelope, fault classifier predicts Healthy with high confidence, and anomaly score is low:
  **Overall Status = HEALTHY**
- If data quality is degraded/missing:
  **Overall Status = UNKNOWN / INSUFFICIENT DATA**
