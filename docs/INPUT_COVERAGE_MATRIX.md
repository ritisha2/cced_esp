# ESP Input Variable Coverage Matrix

This matrix tracks the flow and utilization of each physical parameter across MQTT ingestion, SQLite storage, feature extraction, and all 5 model systems.

---

### Variable Matrix

| Parameter Name | Canonical Name | Available in Site MQTT? | Stored in SQLite? | Present in Training Data? | Used by Rule Engine? | Used by Classifier (221 feats)? | Used by Risk Predictor? | Used by RUL Engine? | Used by Anomaly Detector? |
|---|---|---|---|---|---|---|---|---|---|
| **Discharge Pressure** | `discharge_pressure_psi` | **YES** (`pressure_psi` / `pdp`) | **YES** | **YES** | **YES** (Envelope & DP rules) | **YES** (Raw + Rolling 5,15,30) | **YES** (Slope & Mean) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Intake Pressure** | `intake_pressure_psi` | **YES** (`intake_pressure_psi` / `pip`) | **YES** | **YES** | **YES** (Envelope & PIP rules) | **YES** (Raw + Rolling 5,15,30) | **YES** (Slope & Mean) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Motor Current** | `motor_current_a` | **YES** (`motor_current_a` / `current`) | **YES** | **YES** | **YES** (Envelope & Under/Overload) | **YES** (Raw + Rolling 5,15,30) | **YES** (Slope & Mean) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Motor Load** | `motor_load_pct` | **YES** (Calculated $I / I_{rated}$) | **YES** | **YES** | **YES** (Overload envelope) | **YES** (Raw + Rolling 5,15,30) | **YES** (Trend) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Motor Temperature** | `motor_temperature_c` | **YES** (`temperature_c`) | **YES** | **YES** | **YES** (Thermal limits) | **YES** (Raw + Rolling 5,15,30) | **YES** (Thermal slope) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Vibration RMS** | `vibration_rms` | **YES** (`vibration_g` / `vibration_rms`) | **YES** | **YES** | **YES** (Vibration limits) | **YES** (Raw + Rolling 5,15,30) | **YES** (Vibration trend) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Motor Voltage** | `motor_voltage_v` | **YES** (`motor_voltage_v` / `voltage`) | **YES** | **YES** | **YES** (Undervoltage & Power loss)| **YES** (Raw + Rolling 5,15,30) | **YES** (Mean & min) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Liquid Rate** | `liquid_rate_bpd` | **YES** (`flow_rate_bpd`) | **YES** | **YES** | **YES** (Flow limits) | **YES** (Raw + Rolling 5,15,30) | **YES** (Flow slope) | **YES** (Degradation) | **YES** (Scaled + PCA) |
| **Intake Temperature**| `intake_temperature_c` | **PARTIAL** (Inferred / Default 65°C) | **YES** | **YES** | **YES** (Thermal gradient) | **YES** (Rolling stats) | **YES** | **YES** | **YES** |
| **Flowline Pressure** | `flowline_pressure_psi` | **PARTIAL** (Mapped to surface P) | **YES** | **YES** | **YES** (Backpressure rules) | **YES** (Rolling stats) | **YES** | **YES** | **YES** |
| **Wellhead Pressure** | `wellhead_pressure_psi` | **PARTIAL** (Mapped to surface P) | **YES** | **YES** | **YES** (Surface restriction) | **YES** (Rolling stats) | **YES** | **YES** | **YES** |
| **Casing Pressure** | `casing_pressure_psi` | **PARTIAL** (Mapped to annulus P) | **YES** | **YES** | **YES** (Gas interference) | **YES** (Rolling stats) | **YES** | **YES** | **YES** |
| **Choke Size** | `choke_size_64ths` | **PARTIAL** (Surface default 32/64) | **YES** | **YES** | **YES** (Open choke / restriction) | **YES** (Rolling stats) | **YES** | **YES** | **YES** |
| **Operating Frequency**| `frequency_hz` | **YES** (`frequency_hz`) | **YES** | **YES** | **YES** (VFD speed scaling) | **YES** (Affinity law ratios)| **YES** | **YES** | **YES** |
| **Water Cut %** | `water_cut_pct` | **YES** (`water_cut_pct`) | **YES** | **YES** | **YES** (Fluid density scaling) | **YES** (Hydraulic ratios) | **YES** | **YES** | **YES** |
