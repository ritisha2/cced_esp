# ESP Site Data Requirements & Readiness Specification

## 1. Purpose
This document defines the mandatory and optional telemetry, historical records, electrical parameters, and equipment specifications required from the operator / site for production-grade ESP condition monitoring and machine learning validation.

---

## 2. Mandatory Site Data Checklist

| Category | Requirement | Field Name(s) | Expected Format / Unit | Impact if Missing |
|---|---|---|---|---|
| **Asset Identity** | Unique ESP Identifier | `esp_id` | String (e.g. `ESP-PERMIAN-01`) | Cannot partition multi-well models |
| | Unique Well Identifier | `well_id` | String (e.g. `WELL-TX-101`) | Cannot associate reservoir context |
| **Time Reference** | Synchronized Timestamp | `timestamp` | UTC ISO-8601 string | Temporal alignment fails |
| **Hydraulic Sensors** | Total Liquid Rate | `liquid_rate_bpd` | BPD | Cannot evaluate pump curve & productivity |
| | Pump Intake Pressure | `intake_pressure_psi` | PSI | Cannot detect gas interference, pump-off, blockage |
| | Pump Discharge Pressure | `discharge_pressure_psi`| PSI | Cannot calculate total dynamic head (TDH) |
| | Flowline Pressure | `flowline_pressure_psi` | PSI | Cannot isolate surface flowline restrictions |
| | Wellhead Pressure | `wellhead_pressure_psi` | PSI | Cannot compute tubing friction loss |
| | Casing Pressure | `casing_pressure_psi` | PSI | Cannot assess annulus gas buildup |
| | Surface Choke Size | `choke_size_64in` | 64ths of an inch | Cannot account for surface throttling |
| **Thermal Sensors** | Motor Internal Temp | `motor_temperature_c` | °C | Cannot detect motor overheating / thermal trips |
| | Fluid Intake Temp | `intake_temperature_c` | °C | Cannot assess fluid viscosity & thermal gradient |
| **Electrical Sensors** | Motor Phase/Total Current | `motor_current_a` | Amperes (A) | Cannot assess electrical loading / underload |
| | Motor Supply Voltage | `motor_voltage_v` | Volts (V) | Cannot detect undervoltage / power fluctuations |
| | Motor Load % | `motor_load_pct` | % of Rated BHP | Cannot evaluate motor operating margin |
| **Mechanical Sensors**| Multi-Axis Vibration RMS | `vibration_rms` | g (RMS) | Cannot detect bearing wear, sand erosion, imbalance |

---

## 3. High-Priority Electrical Data for Advanced Faults

> [!WARNING]
> **Phase Imbalance Diagnostic Limitation**:
> Single-phase aggregate voltage or aggregate current is mathematically insufficient to calculate true Phase Voltage/Current Unbalance (% NEMA).
> For high-confidence Phase Imbalance diagnosis, the site must provide:
> - Individual Phase Currents: $I_A, I_B, I_C$ (Amperes)
> - Individual Phase Voltages: $V_{AB}, V_{BC}, V_{CA}$ (Volts)
> - VFD Output Frequency: $f$ (Hz)
> - Current Imbalance %: $\frac{\max(|I - I_{avg}|)}{I_{avg}} \times 100$

---

## 4. Run-to-Failure & RUL Historical Data Requirements

To enable legitimate, scientifically validated Remaining Useful Life (RUL) modeling, the site must provide historical run-to-failure records containing:
1. **Initial Commissioning / Clean State Timestamp**: When the ESP was installed or workover completed.
2. **First Observable Symptom Timestamp**: First anomalous vibration, thermal ramp, or pressure drop.
3. **Confirmed Degradation Window**: Telemetry sequence during progressive degradation.
4. **Failure / Trip Timestamp**: Exact moment of catastrophic or threshold-induced operational shutdown.
5. **Post-Mortem / Teardown Report**: Physical confirmation of failure mechanism (e.g. bearing seizure, sand cut impeller, stator burnout).

*Note: In the absence of confirmed run-to-failure histories, the platform will report "RUL unavailable — insufficient run-to-failure history" while maintaining active Future Fault Risk forecasting.*
