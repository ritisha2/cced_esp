"""
Physics-Informed Feature Engineering Module.
Derives domain-specific physics invariants and dimensionless indicators:
- Pressure Ratio: Pi = (R_DISCH_PRESS - R_INTAKE_PRESS) / R_INTAKE_PRESS
- Flowline Ratio: Pi_FL = R_PIT_001 / R_PIT_003
- Apparent Power & V/f Ratio
- Thermal and Mechanical Energy Gradients

Supports single-sample live inference and batch dataset transformations.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Union, List

CANONICAL_TAGS = [
    "R_PIT_001",
    "R_PIT_002",
    "R_PIT_003",
    "R_INTAKE_PRESS",
    "R_INTAKE_TEMP",
    "R_DISCH_PRESS",
    "R_MOTOR_TEMP",
    "R_FREQUENCY",
    "R_VIBRATION_X",
    "R_TOOL_CURRENT",
    "R_DRV_CURR_AVG",
    "R_DHG_CURR_AVG",
    "R_BUS_IN_VTG_AVG"
]

FEATURE_COLUMNS = CANONICAL_TAGS + [
    "pi_pressure_ratio",
    "pi_flowline_ratio",
    "apparent_power_kva",
    "vf_ratio",
    "thermal_gradient_c",
    "vibration_energy",
    "pip_margin_psi",
    "current_deviation_ratio"
]


def extract_features_from_dict(telemetry: Dict[str, Any]) -> np.ndarray:
    """
    Extract standardized feature vector from a single incoming telemetry dictionary.
    Returns 1D numpy array of shape (n_features,).
    """
    # 13 Base Tags with physical defaults if missing
    p_wh = float(telemetry.get("R_PIT_001", 80.0))
    p_cas = float(telemetry.get("R_PIT_002", 45.0))
    p_fl = max(0.1, float(telemetry.get("R_PIT_003", 50.0)))
    p_pip = max(1.0, float(telemetry.get("R_INTAKE_PRESS", 1200.0)))
    t_pip = float(telemetry.get("R_INTAKE_TEMP", 70.0))
    p_pdp = float(telemetry.get("R_DISCH_PRESS", 2200.0))
    t_mot = float(telemetry.get("R_MOTOR_TEMP", 85.0))
    freq = max(1.0, float(telemetry.get("R_FREQUENCY", 50.0)))
    vib = max(0.0, float(telemetry.get("R_VIBRATION_X", 0.18)))
    i_tool = float(telemetry.get("R_TOOL_CURRENT", 4.0))
    i_drv = float(telemetry.get("R_DRV_CURR_AVG", 50.0))
    i_dhg = float(telemetry.get("R_DHG_CURR_AVG", i_drv))
    v_bus = float(telemetry.get("R_BUS_IN_VTG_AVG", 460.0))

    # Physics-Informed Invariants
    # 1. Pressure Differential Ratio: Pi = (PDP - PIP) / PIP
    pi_pressure_ratio = (p_pdp - p_pip) / p_pip

    # 2. Flowline Wellhead Ratio: Pi_FL = R_PIT_001 / R_PIT_003
    pi_flowline_ratio = p_wh / p_fl

    # 3. 3-Phase Apparent Power: S = (sqrt(3) * V * I) / 1000
    apparent_power_kva = (np.sqrt(3.0) * v_bus * i_drv) / 1000.0

    # 4. Volts-per-Hertz Ratio
    vf_ratio = v_bus / freq

    # 5. Motor to Intake Thermal Gradient
    thermal_gradient_c = t_mot - t_pip

    # 6. Vibration Severity Energy
    vibration_energy = vib ** 2

    # 7. Intake Pressure Margin above pump-off threshold (800 psi)
    pip_margin_psi = p_pip - 800.0

    # 8. Drive to Gauge Current Consistency Ratio
    current_deviation_ratio = abs(i_drv - i_dhg) / max(1.0, i_drv)

    features = [
        p_wh, p_cas, p_fl, p_pip, t_pip, p_pdp, t_mot, freq, vib, i_tool, i_drv, i_dhg, v_bus,
        pi_pressure_ratio,
        pi_flowline_ratio,
        apparent_power_kva,
        vf_ratio,
        thermal_gradient_c,
        vibration_energy,
        pip_margin_psi,
        current_deviation_ratio
    ]
    return np.array(features, dtype=np.float32)


def compute_features_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute physics invariant columns for a batch pandas DataFrame.
    """
    df_out = df.copy()
    
    # Base 13 columns
    p_wh = df_out["R_PIT_001"].astype(float)
    p_fl = df_out["R_PIT_003"].astype(float).clip(lower=0.1)
    p_pip = df_out["R_INTAKE_PRESS"].astype(float).clip(lower=1.0)
    p_pdp = df_out["R_DISCH_PRESS"].astype(float)
    t_pip = df_out["R_INTAKE_TEMP"].astype(float)
    t_mot = df_out["R_MOTOR_TEMP"].astype(float)
    freq = df_out["R_FREQUENCY"].astype(float).clip(lower=1.0)
    vib = df_out["R_VIBRATION_X"].astype(float).clip(lower=0.0)
    i_drv = df_out["R_DRV_CURR_AVG"].astype(float)
    i_dhg = df_out["R_DHG_CURR_AVG"].astype(float)
    v_bus = df_out["R_BUS_IN_VTG_AVG"].astype(float)

    # Physics Invariants
    df_out["pi_pressure_ratio"] = (p_pdp - p_pip) / p_pip
    df_out["pi_flowline_ratio"] = p_wh / p_fl
    df_out["apparent_power_kva"] = (np.sqrt(3.0) * v_bus * i_drv) / 1000.0
    df_out["vf_ratio"] = v_bus / freq
    df_out["thermal_gradient_c"] = t_mot - t_pip
    df_out["vibration_energy"] = vib ** 2
    df_out["pip_margin_psi"] = p_pip - 800.0
    df_out["current_deviation_ratio"] = (abs(i_drv - i_dhg) / i_drv.clip(lower=1.0))

    return df_out[FEATURE_COLUMNS]
