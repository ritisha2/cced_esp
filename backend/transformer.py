"""
OPG & ESP Wells Telemetry Data Transformer
Transforms incoming live MQTT telemetry into:
1. LABELLED Dataset (complete ground truth with Scenario/Fault, Alarms, Alerts, Operating State, Trip Cause)
2. UNLABELLED Dataset (pure sensor parameter time-series stripped of all fault/anomaly labels)

Also provides extract_vfd_signals() — an ADDITIVE mapping layer that resolves the raw MQTT
payload into the 14 VFD parameter names consumed by ESP_APM_models.WellDiagnosticEngine.
This does not replace or alter transform_mqtt_payload()/create_unlabelled_from_labelled();
the old-schema DB write path above is untouched. See vfd_diagnostic_service.py for the caller.
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("opg_transformer")

# -- Make ESP_APM_models importable (workspace root is two levels above cced_esp/backend) ---
_WORKSPACE_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
if _WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, _WORKSPACE_ROOT)

try:
    from ESP_APM_models.calibration_registry import STANDARD_SENSORS, clean_col_key
    _VFD_MODELS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"[transformer] ESP_APM_models not importable, extract_vfd_signals will no-op: {e}")
    STANDARD_SENSORS = []
    clean_col_key = None
    _VFD_MODELS_AVAILABLE = False


# Known legacy/alternate field-name aliases -> canonical VFD sensor name. Checked BEFORE the
# generic clean_col_key() fuzzy pass below, since several legacy SCADA tags (R_PIT_001/002/003,
# R_DRV_CURR_AVG, R_BUS_IN_VTG_AVG) don't contain a substring clean_col_key recognizes.
_VFD_ALIAS_MAP: Dict[str, list] = {
    "Inp bar/psi":        ["intake_pressure_psi", "intake_pressure", "intake_p", "R_INTAKE_PRESS", "pip"],
    "Int temp °C":         ["intake_temperature_c", "intake_temp", "R_INTAKE_TEMP"],
    "Motor temp °C":       ["motor_temperature_c", "motor_temperature", "temperature_c", "R_MOTOR_TEMP"],
    "Disch pr. Bar/psi":  ["discharge_pressure_psi", "discharge_pressure", "discharge_p", "pressure_psi", "R_DISCH_PRESS", "pdp"],
    "Vibration G's-Vx":   ["vibration_g", "vibration_g_rms", "vibration_rms", "vibration", "R_VIBRATION_X"],
    "Leak Current Ct":    ["leak_current", "leakage_current", "insulation_current"],
    "Volt":               ["motor_voltage_v", "motor_voltage", "voltage", "R_BUS_IN_VTG_AVG", "volts"],
    "VSD Amps/Load":      ["motor_current_a", "motor_current", "current", "R_DRV_CURR_AVG", "amps", "vsd_amps", "drive_current"],
    "Frequency":          ["frequency_hz", "frequency", "freq", "R_FREQUENCY"],
    "DHG Current":        ["dhg_current", "R_DHG_CURR_AVG", "downhole_gauge_current"],
    "WHP (PSI)":          ["wellhead_pressure_psi", "whp_psi", "whp", "R_PIT_001"],
    "FLP (PSI)":          ["flowline_pressure_psi", "flp_psi", "flp", "R_PIT_003"],
    "AP (PSI)":           ["casing_pressure_psi", "annulus_pressure_psi", "ap_psi", "ap", "R_PIT_002"],
}

# VFD STS is a run-status flag, not a STANDARD_SENSORS channel — resolved separately below,
# including string-state normalization (e.g. operating_state="tripped" -> 0).
_VFD_STS_ALIASES = ["VFD STS", "vfd_sts", "vfd_status", "run_status", "status_flag"]
_VFD_STS_RUNNING_STATES = {"running", "normal", "active", "on"}
_VFD_STS_STOPPED_STATES = {"tripped", "stopped", "off", "shut_in", "shutdown"}


def _coerce_float(v: Any) -> Optional[float]:
    """Best-effort float coercion; returns None (not a synthetic default) if it fails."""
    if v is None:
        return None
    if isinstance(v, dict):
        v = v.get("value")
    try:
        s = str(v).strip()
        return float(s) if s != "" else None
    except (ValueError, TypeError):
        return None


def _resolve_vfd_sts(meas: Dict[str, Any], top_level: Dict[str, Any]) -> Optional[float]:
    """
    Resolve VFD STS with priority:
      1. Known explicit aliases (exact key match)
      2. Fuzzy clean_col_key() pass — catches broker field names not in the alias list
         but that clean_col_key already recognizes (any key containing "vfd"/"sts"/"status").
         VFD STS is NOT in STANDARD_SENSORS, so it is excluded from extract_vfd_signals()'s
         main fuzzy loop — this is the fuzzy-match path for VFD STS specifically.
      3. Fall back to the labelled/raw operating_state string (e.g. "running" / "tripped")
         — a soft heuristic, only used if the broker sends no run-status signal at all.
    """
    for alias in _VFD_STS_ALIASES:
        if alias in meas:
            f = _coerce_float(meas[alias])
            if f is not None:
                return f

    if clean_col_key is not None:
        for raw_key, raw_val in meas.items():
            if clean_col_key(raw_key) == "VFD STS":
                f = _coerce_float(raw_val)
                if f is not None:
                    return f

    state = str(top_level.get("operating_state") or top_level.get("state") or "").strip().lower()
    if state in _VFD_STS_RUNNING_STATES:
        return 1.0
    if state in _VFD_STS_STOPPED_STATES:
        return 0.0
    return None


def extract_vfd_signals(data: Dict[str, Any]) -> Dict[str, float]:
    """
    Resolves the raw MQTT payload dict into whatever subset of the 14 VFD parameter
    names (STANDARD_SENSORS + "VFD STS") it can find, using:
      1. Known legacy alias lookup (R_* SCADA tags, old snake_case DB names)
      2. ESP_APM_models.clean_col_key() fuzzy substring matching (covers literal VFD
         names already, e.g. if the payload already uses "Inp bar/psi" directly)

    Only sensors actually resolved are included in the returned dict — unresolved
    sensors are intentionally omitted (not defaulted here) so that
    WellDiagnosticEngine's own calibrated-median fill (see normalize_live_telemetry)
    supplies a well-appropriate fallback instead of an arbitrary constant.
    """
    if not _VFD_MODELS_AVAILABLE:
        return {}

    meas = (
        data.get("telemetry") if isinstance(data.get("telemetry"), dict)
        else data.get("measurements") if isinstance(data.get("measurements"), dict)
        else data.get("data") if isinstance(data.get("data"), dict)
        else data
    )
    resolved: Dict[str, float] = {}

    for canonical, aliases in _VFD_ALIAS_MAP.items():
        val = None
        for alias in aliases:
            if alias in meas:
                val = _coerce_float(meas[alias])
                if val is not None:
                    break
        resolved[canonical] = val

    # Fuzzy pass: for any STANDARD_SENSOR not yet resolved, scan all payload keys through
    # clean_col_key() in case the payload already carries the literal/near-literal VFD name.
    unresolved = [s for s in STANDARD_SENSORS if resolved.get(s) is None]
    if unresolved:
        for raw_key, raw_val in meas.items():
            ck = clean_col_key(raw_key)
            if ck in unresolved:
                f = _coerce_float(raw_val)
                if f is not None:
                    resolved[ck] = f
                    unresolved.remove(ck)

    # Drop any sensor that was never resolved (let the engine's median-fill handle it)
    resolved = {k: v for k, v in resolved.items() if v is not None}

    vfd_sts = _resolve_vfd_sts(meas, data)
    if vfd_sts is not None:
        resolved["VFD STS"] = vfd_sts

    return resolved

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

    # 3b. Extract native 14-parameter VFD columns using canonical VFD signal resolver.
    #     Returns only signals that were actually resolved; unresolved keys are absent (→ None in DB).
    vfd_signals = extract_vfd_signals(data)
    # Map canonical VFD names → new native SQL column names
    _VFD_COL_MAP = {
        "Disch pr. Bar/psi":  "discharge_pressure_psi",
        "Int temp °C":        "intake_temperature_c",
        "Motor temp °C":      "motor_temperature_c",
        "WHP (PSI)":          "whp_psi",
        "FLP (PSI)":          "flp_psi",
        "AP (PSI)":           "annulus_pressure_psi",
        "Leak Current Ct":    "leak_current_ct",
        "DHG Current":        "dhg_current",
        "VFD STS":            "vfd_status",
    }
    native_vfd_cols: Dict[str, Any] = {}
    for canonical, sql_col in _VFD_COL_MAP.items():
        v = vfd_signals.get(canonical)
        native_vfd_cols[sql_col] = int(v) if sql_col == "vfd_status" and v is not None else v

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

    # Build LABELLED record (includes native VFD columns)
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
        "raw_payload": json.dumps(data),
        # ── Native 14-parameter VFD columns ──────────────────────────────
        **native_vfd_cols,
    }

    # Pass through single transformer function to create the unlabelled counterpart
    unlabelled_record = create_unlabelled_from_labelled(labelled_record)

    return labelled_record, unlabelled_record
