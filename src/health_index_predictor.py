"""
ESP Health Index Predictor (ISO 10816 + Physics + ML Fusion Engine).
Calculates authentic composite health index percentage (0-100%) and sub-component degradation factors.
"""

from typing import Dict, Any, Tuple

class HealthIndexPredictor:
    """Predicts a 0-100% Health Index from 13 real engineering telemetry channels and ML outputs."""

    def predict(self, telemetry: Dict[str, Any], anomaly_score: float = 0.05, fault_class: str = "Normal") -> Dict[str, Any]:
        has_sensors = any(telemetry.get(k) is not None for k in ["R_INTAKE_PRESS", "intake_pressure_psi", "R_DISCH_PRESS", "discharge_pressure_psi", "R_MOTOR_TEMP", "motor_temperature_c", "R_VIBRATION_X", "vibration_rms", "pressure_psi", "temperature_c"])
        
        # Extract 13 canonical channels safely
        p_wh = float(telemetry.get("R_PIT_001") or telemetry.get("wellhead_pressure_psi") or 0.0)
        p_fl = float(telemetry.get("R_PIT_003") or telemetry.get("flowline_pressure_psi") or 0.0)
        p_cas = float(telemetry.get("R_PIT_002") or telemetry.get("casing_pressure_psi") or 0.0)
        p_pip = float(telemetry.get("R_INTAKE_PRESS") or telemetry.get("intake_pressure_psi") or 0.0)
        p_pdp = float(telemetry.get("R_DISCH_PRESS") or telemetry.get("discharge_pressure_psi") or telemetry.get("pressure_psi") or 0.0)
        t_pip = float(telemetry.get("R_INTAKE_TEMP") or telemetry.get("intake_temperature_c") or 0.0)
        t_mot = float(telemetry.get("R_MOTOR_TEMP") or telemetry.get("motor_temperature_c") or telemetry.get("temperature_c") or 0.0)
        v_vib = float(telemetry.get("R_VIBRATION_X") or telemetry.get("vibration_g") or telemetry.get("vibration_rms") or 0.0)
        i_drv = float(telemetry.get("R_DRV_CURR_AVG") or telemetry.get("motor_current_a") or 0.0)
        v_bus = float(telemetry.get("R_BUS_IN_VTG_AVG") or telemetry.get("motor_voltage_v") or 0.0)
        freq = float(telemetry.get("R_FREQUENCY") or telemetry.get("frequency_hz") or 50.0)

        # 1. Hydraulic Sub-Index (0 - 100)
        diff_head = max(0.0, p_pdp - p_pip)
        if diff_head >= 800.0 and diff_head <= 2600.0:
            hydraulic_score = 100.0
        elif diff_head > 0.0 and diff_head < 800.0:
            hydraulic_score = max(20.0, (diff_head / 800.0) * 100.0)
        elif diff_head > 2600.0:
            hydraulic_score = max(30.0, 100.0 - ((diff_head - 2600.0) / 1000.0) * 50.0)
        else:
            hydraulic_score = 50.0  # Offline / low pressure

        # 2. Vibration Severity Sub-Index (ISO 10816-3 standard) (0 - 100)
        if v_vib <= 0.18:
            vibration_score = 100.0
        elif v_vib <= 0.30:
            # Linear decay from 100 to 70
            vibration_score = 100.0 - ((v_vib - 0.18) / 0.12) * 30.0
        elif v_vib <= 0.60:
            # Linear decay from 70 to 20
            vibration_score = max(15.0, 70.0 - ((v_vib - 0.30) / 0.30) * 55.0)
        else:
            vibration_score = max(5.0, 15.0 - (v_vib - 0.60) * 10.0)

        # 3. Thermal Degradation Sub-Index (0 - 100)
        if t_mot <= 85.0:
            thermal_score = 100.0
        elif t_mot <= 100.0:
            thermal_score = 100.0 - ((t_mot - 85.0) / 15.0) * 35.0
        elif t_mot <= 125.0:
            thermal_score = max(10.0, 65.0 - ((t_mot - 100.0) / 25.0) * 50.0)
        else:
            thermal_score = 5.0

        # 4. Electrical Load & Stability Sub-Index (0 - 100)
        if i_drv >= 25.0 and i_drv <= 65.0 and v_bus >= 380.0:
            electrical_score = 100.0
        elif i_drv > 0.0 and i_drv < 25.0:
            electrical_score = max(30.0, 60.0 + (i_drv / 25.0) * 40.0)
        elif i_drv > 65.0:
            electrical_score = max(10.0, 100.0 - ((i_drv - 65.0) / 35.0) * 80.0)
        else:
            electrical_score = 75.0 if freq > 0 else 50.0

        # 5. ML Anomaly Sub-Index (0 - 100)
        ml_score = max(0.0, min(100.0, (1.0 - float(anomaly_score)) * 100.0))

        # Fault Classification Modifier
        fault_penalty = 0.0
        if fault_class.lower() not in ("normal", "healthy", ""):
            fault_penalty = 25.0

        # Weighted Composite Fusion
        composite_hi = (
            0.25 * hydraulic_score +
            0.25 * vibration_score +
            0.20 * thermal_score +
            0.15 * electrical_score +
            0.15 * ml_score
        ) - fault_penalty

        composite_hi = max(0.0, min(100.0, round(composite_hi, 1)))

        # Status category
        if composite_hi >= 80.0:
            health_status = "HEALTHY"
            color = "#10b981"
        elif composite_hi >= 60.0:
            health_status = "DEGRADED_WATCH"
            color = "#f59e0b"
        else:
            health_status = "CRITICAL_FAULT"
            color = "#ef4444"

        return {
            "health_index": composite_hi,
            "status": health_status,
            "color": color,
            "sub_indices": {
                "hydraulic_health": round(hydraulic_score, 1),
                "vibration_health": round(vibration_score, 1),
                "thermal_health": round(thermal_score, 1),
                "electrical_health": round(electrical_score, 1),
                "anomaly_conformance": round(ml_score, 1)
            },
            "differential_head_psi": round(diff_head, 1),
            "vibration_rms": round(v_vib, 3),
            "motor_temp_c": round(t_mot, 1)
        }

health_predictor = HealthIndexPredictor()
