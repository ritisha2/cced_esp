"""
OPG & ESP Wells Telemetry Data Transformer
Transforms incoming live MQTT telemetry into:
1. LABELLED Dataset (complete ground truth with Scenario/Fault, Alarms, Alerts, Operating State, Trip Cause)
2. UNLABELLED Dataset (pure sensor parameter time-series stripped of all fault/anomaly labels)
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

logger = logging.getLogger("opg_transformer")

def normalize_sensor_value(val: Any, default: float = 0.0) -> float:
    """Safely convert any sensor reading to float."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def create_unlabelled_from_labelled(labelled_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms a LABELLED telemetry record into an UNLABELLED record
    by stripping out all ground-truth scenario labels, alarms, alerts, and trip causes.
    """
    unlabelled = dict(labelled_record)
    
    # 1. Set Category Flag
    unlabelled["data_category"] = "UNLABELLED"
    
    # 2. Strip Ground-Truth Fault / Scenario
    unlabelled["scenario"] = ""
    
    # 3. Strip Alarms and Alerts
    unlabelled["alarms"] = "[]"
    unlabelled["alerts"] = "[]"
    
    # 4. Strip Trip Cause and sanitize Operating State to pure status
    unlabelled["trip_cause"] = ""
    unlabelled["operating_state"] = "unlabelled"
    unlabelled["status"] = "UNLABELLED"
    
    # 5. Raw payload in unlabelled is stripped of labels
    raw = labelled_record.get("raw_payload")
    if isinstance(raw, str):
        try:
            raw_dict = json.loads(raw)
        except Exception:
            raw_dict = {"raw": raw}
    elif isinstance(raw, dict):
        raw_dict = dict(raw)
    else:
        raw_dict = {}

    # Remove labels from raw JSON
    raw_dict.pop("scenario", None)
    raw_dict.pop("alarms", None)
    raw_dict.pop("alerts", None)
    raw_dict.pop("trip_cause", None)
    raw_dict["data_category"] = "UNLABELLED"
    unlabelled["raw_payload"] = json.dumps(raw_dict)

    return unlabelled

def transform_mqtt_payload(data: Dict[str, Any], topic: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Processes an incoming MQTT message into both LABELLED and UNLABELLED records.
    """
    # 1. Extract Well ID
    well_id = (
        data.get("well_id") or data.get("wellId") or data.get("WellID") or data.get("well")
        or data.get("well_name") or data.get("wellName")
    )
    if not well_id:
        parts = topic.strip("/").split("/")
        if len(parts) >= 3 and parts[0] == "esp" and parts[1] == "v1":
            well_id = parts[2]
        elif len(parts) >= 2:
            well_id = parts[-2] if parts[-1] == "telemetry" else parts[-1]
        else:
            well_id = "WELL-001"

    well_id_str = str(well_id).upper()

    # 2. Extract Asset ID / Pump Specifications
    asset_obj = data.get("asset") or data.get("asset_id") or data.get("AssetID")
    if isinstance(asset_obj, dict):
        pump_model = asset_obj.get("pump_model") or asset_obj.get("model") or "ESP"
        stages = asset_obj.get("stages")
        hp = asset_obj.get("motor_hp") or asset_obj.get("hp")
        details = []
        if stages: details.append(f"{stages}ST")
        if hp: details.append(f"{hp}HP")
        spec_str = f" ({'/'.join(details)})" if details else ""
        asset_id_str = f"{well_id_str} [{pump_model}{spec_str}]"
    elif isinstance(asset_obj, str) and asset_obj:
        asset_id_str = asset_obj.upper()
    else:
        asset_id_str = f"ASSET-{well_id_str}"

    # 3. Extract Nested / Flat Measurements
    meas = data.get("measurements") if isinstance(data.get("measurements"), dict) else data

    discharge_p = normalize_sensor_value(
        meas.get("discharge_pressure_psi") or meas.get("discharge_p") or meas.get("Discharge P")
        or meas.get("R_DISCH_PRESS") or meas.get("R_PIT_001") or meas.get("pressure_psi") or meas.get("pressure")
        or meas.get("tubing_pressure_psi") or meas.get("tubing_pressure") or meas.get("whp_psi")
    )
    intake_p = normalize_sensor_value(
        meas.get("intake_pressure_psi") or meas.get("intake_p") or meas.get("Intake P")
        or meas.get("R_INTAKE_PRESS") or meas.get("R_PIT_003") or meas.get("casing_pressure_psi") or meas.get("casing_pressure")
    )
    flow_bpd = normalize_sensor_value(
        meas.get("flow_bpd") or meas.get("flow_rate_bpd") or meas.get("flow_rate")
        or meas.get("flow") or meas.get("Flow") or meas.get("oil_rate_bpd")
    )
    temp_c = normalize_sensor_value(
        meas.get("motor_temperature_c") or meas.get("temperature_c") or meas.get("temperature")
        or meas.get("R_MOTOR_TEMP") or meas.get("R_INTAKE_TEMP") or meas.get("temp") or meas.get("Temp")
    )
    frequency_hz = normalize_sensor_value(
        meas.get("frequency_hz") or meas.get("freq") or meas.get("Freq")
        or meas.get("R_FREQUENCY") or meas.get("frequency_setpoint_hz")
    )
    motor_current_a = normalize_sensor_value(
        meas.get("motor_current_a") or meas.get("current") or meas.get("Current")
        or meas.get("R_DRV_CURR_AVG") or meas.get("R_TOOL_CURRENT") or meas.get("amps")
    )
    motor_voltage_v = normalize_sensor_value(
        meas.get("motor_voltage_v") or meas.get("voltage") or meas.get("Voltage")
        or meas.get("R_BUS_IN_VTG_AVG") or meas.get("volts")
    )
    vibration_g = normalize_sensor_value(
        meas.get("vibration_g_rms") or meas.get("vibration") or meas.get("Vibration")
        or meas.get("R_VIBRATION_X") or meas.get("vibration_g") or meas.get("vibration_rms")
    )
    water_cut_pct = normalize_sensor_value(meas.get("water_cut_pct") or meas.get("water_cut"))
    gas_flow = normalize_sensor_value(meas.get("gas_flow_mscfd") or meas.get("gas_rate"))
    choke_pct = normalize_sensor_value(meas.get("choke_size_64ths") or meas.get("choke_size_pct"))

    # 4. Extract Timestamp
    ts_str = data.get("timestamp") or data.get("time") or datetime.now(timezone.utc).isoformat()

    # 5. Extract Ground-Truth Fault / Scenario & Alarms
    scenario = str(data.get("scenario") or "normal").strip()
    operating_state = str(data.get("operating_state") or data.get("state") or "running").lower()
    trip_cause = str(data.get("trip_cause") or "").strip()
    
    alarms = data.get("alarms") or []
    if isinstance(alarms, str):
        alarms = [alarms]
    alerts = data.get("alerts") or []
    if isinstance(alerts, str):
        alerts = [alerts]

    # Health status classification
    if operating_state == "tripped" or trip_cause != "" or vibration_g > 2.5 or temp_c > 130:
        status = "CRITICAL"
    elif alarms or alerts or scenario.lower() not in ["normal", ""]:
        status = "WARNING"
    else:
        status = "NORMAL"

    # Build LABELLED record
    labelled_record = {
        "timestamp": ts_str,
        "asset_id": asset_id_str,
        "well_id": well_id_str,
        "topic": topic,
        "data_category": "LABELLED",
        "scenario": scenario,
        "alarms": json.dumps(alarms),
        "alerts": json.dumps(alerts),
        "pressure_psi": discharge_p,
        "intake_pressure_psi": intake_p,
        "flow_rate_bpd": flow_bpd,
        "frequency_hz": frequency_hz,
        "motor_current_a": motor_current_a,
        "motor_voltage_v": motor_voltage_v,
        "temperature_c": temp_c,
        "vibration_g": vibration_g,
        "water_cut_pct": water_cut_pct,
        "gas_flow_mscfd": gas_flow,
        "choke_size_pct": choke_pct,
        "operating_state": operating_state,
        "trip_cause": trip_cause,
        "status": status,
        "raw_payload": json.dumps(data)
    }

    # Pass through single transformer function to create the unlabelled counterpart
    unlabelled_record = create_unlabelled_from_labelled(labelled_record)

    return labelled_record, unlabelled_record
