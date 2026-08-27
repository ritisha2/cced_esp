"""
Model 5: Healthy-State Anomaly Detector Inference Engine.
Calculates continuous anomaly scores, severity statuses, and affected parameters.
Decoupled from fault classifiers to identify novel unseen patterns.
"""

import os
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
from ml.data.canonical_schema import (
    CanonicalESPTelemetry,
    AnomalyDetectionResult
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
V2_MODEL_DIR = BASE_DIR / "models" / "v2"
V1_MODEL_DIR = BASE_DIR / "models" / "anomaly_detector" / "v1.0"


def build_v2_feature_dict_ad(telemetry: CanonicalESPTelemetry, feature_dict: Dict[str, float]) -> Dict[str, float]:
    wellhead = feature_dict.get("wellhead_pressure_psi", telemetry.wellhead_pressure_psi or 150.0)
    flowline = feature_dict.get("flowline_pressure_psi", telemetry.flowline_pressure_psi or 120.0)
    casing = feature_dict.get("casing_pressure_psi", telemetry.casing_pressure_psi or 80.0)
    intake_p = feature_dict.get("intake_pressure_psi", telemetry.intake_pressure_psi or 0.0)
    intake_t = feature_dict.get("intake_temperature_c", telemetry.intake_temperature_c if telemetry.intake_temperature_c is not None else 60.0)
    disch_p = feature_dict.get("discharge_pressure_psi", telemetry.discharge_pressure_psi or 0.0)
    motor_t = feature_dict.get("motor_temperature_c", telemetry.motor_temperature_c or 0.0)
    freq = feature_dict.get("frequency_hz", telemetry.frequency_hz or 60.0)
    vib = feature_dict.get("vibration_rms", telemetry.vibration_rms or 0.0)
    curr = feature_dict.get("motor_current_a", telemetry.motor_current_a or 0.0)
    volt = feature_dict.get("motor_voltage_v", telemetry.motor_voltage_v or 480.0)
    load = max(1.0, feature_dict.get("motor_load_pct", telemetry.motor_load_pct or 100.0))

    pip_safe = max(1.0, intake_p)
    fl_safe = max(1.0, flowline)
    freq_safe = max(1.0, freq)

    return {
        "R_PIT_001": wellhead,
        "R_PIT_002": flowline,
        "R_PIT_003": casing,
        "R_INTAKE_PRESS": intake_p,
        "R_INTAKE_TEMP": intake_t,
        "R_DISCH_PRESS": disch_p,
        "R_MOTOR_TEMP": motor_t,
        "R_FREQUENCY": freq,
        "R_VIBRATION_X": vib,
        "R_TOOL_CURRENT": curr,
        "R_DRV_CURR_AVG": curr,
        "R_DHG_CURR_AVG": curr,
        "R_BUS_IN_VTG_AVG": volt,
        "pi_pressure_ratio": disch_p / pip_safe,
        "pi_flowline_ratio": disch_p / fl_safe,
        "apparent_power_kva": (volt * curr * 1.732) / 1000.0,
        "vf_ratio": volt / freq_safe,
        "thermal_gradient_c": motor_t - intake_t,
        "vibration_energy": vib ** 2,
        "pip_margin_psi": intake_p - 100.0,
        "current_deviation_ratio": curr / load
    }


class ESPAnomalyDetector:
    def __init__(self):
        self.scaler = None
        self.iso_forest = None
        self.pca = None
        self.feature_names: List[str] = []
        self.threshold = 0.70
        self.version = "UNAVAILABLE"
        self.is_v2 = False
        self._load_model()

    def _load_model(self):
        v2_path = V2_MODEL_DIR / "anomaly_detector.joblib"
        if v2_path.exists():
            try:
                import json
                self.iso_forest = joblib.load(v2_path)
                self.scaler = joblib.load(V2_MODEL_DIR / "feature_scaler.joblib")
                meta_path = V2_MODEL_DIR / "training_metrics.json"
                if meta_path.exists():
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                        self.feature_names = meta.get("feature_columns", [])
                self.version = "v2.0"
                self.is_v2 = True
                return
            except Exception as e:
                pass

        v1_path = V1_MODEL_DIR / "anomaly_detector.joblib"
        if v1_path.exists():
            bundle = joblib.load(v1_path)
            self.scaler = bundle["scaler"]
            self.iso_forest = bundle["isolation_forest"]
            self.pca = bundle.get("pca")
            self.feature_names = bundle["feature_names"]
            self.threshold = bundle.get("threshold", 0.70)
            self.version = bundle.get("version", "v1.0")
            self.is_v2 = False

    def is_ready(self) -> bool:
        return self.iso_forest is not None

    def score(
        self,
        telemetry: CanonicalESPTelemetry,
        feature_dict: Dict[str, float]
    ) -> AnomalyDetectionResult:
        """Evaluates anomaly score and parameter attributions for single sample."""
        if not self.is_ready():
            return AnomalyDetectionResult(
                anomaly_score=0.0,
                threshold=0.70,
                status="UNAVAILABLE",
                severity="UNAVAILABLE",
                is_anomaly=False,
                affected_parameters=[],
                reason="Anomaly detector model artifact not loaded or unavailable."
            )

        import pandas as pd
        if self.is_v2:
            v2_feats = build_v2_feature_dict_ad(telemetry, feature_dict)
            df_vec = pd.DataFrame([[v2_feats.get(fname, 0.0) for fname in self.feature_names]], columns=self.feature_names)
            scaled_vec = self.scaler.transform(df_vec) if self.scaler is not None else df_vec.to_numpy()
        else:
            df_vec = pd.DataFrame([[feature_dict.get(fname, 0.0) for fname in self.feature_names]], columns=self.feature_names)
            scaled_vec = self.scaler.transform(df_vec) if self.scaler is not None else df_vec.to_numpy()

        # 1. Isolation Forest Calibrated Decision Score
        dec_score = float(self.iso_forest.decision_function(scaled_vec)[0])
        # Higher score = more anomalous
        norm_score = float(1.0 / (1.0 + np.exp(dec_score * 4.0)))
        norm_score = float(np.clip(norm_score, 0.0, 1.0))

        # 2. Parameter Attribution / Reconstruction Error
        if self.pca is not None:
            pca_proj = self.pca.transform(scaled_vec)
            reconstructed = self.pca.inverse_transform(pca_proj)
            recon_errs = (scaled_vec - reconstructed) ** 2
            recon_dict = {
                self.feature_names[i]: float(recon_errs[0, i])
                for i in np.argsort(-recon_errs[0])[:5]
            }
        else:
            recon_errs = scaled_vec ** 2
            recon_dict = {
                self.feature_names[i]: float(recon_errs[0, i])
                for i in np.argsort(-recon_errs[0])[:5]
            }

        affected_params = [
            f.split("_")[0] + "_" + f.split("_")[1] if "_" in f else f
            for f in recon_dict.keys()
        ]
        affected_params = list(dict.fromkeys(affected_params))[:3]

        # 3. Determine Severity Status
        is_anomaly = norm_score > self.threshold
        if norm_score >= 0.88:
            status = "SEVERE_ANOMALY"
            severity = "HIGH"
            reason = f"Severe multivariate anomaly detected across {', '.join(affected_params)}."
        elif norm_score >= self.threshold:
            status = "ANOMALOUS"
            severity = "MEDIUM"
            reason = f"Unusual operating pattern detected with high reconstruction deviation in {', '.join(affected_params)}."
        elif norm_score >= 0.55:
            status = "UNUSUAL"
            severity = "LOW"
            reason = "Slight deviation from normal steady-state baseline cluster."
        else:
            status = "NORMAL"
            severity = "NONE"
            reason = "Operating inside normal learned steady-state manifold."

        return AnomalyDetectionResult(
            anomaly_score=round(norm_score, 3),
            threshold=round(self.threshold, 3),
            status=status,
            severity=severity,
            is_anomaly=is_anomaly,
            affected_parameters=affected_params,
            reconstruction_errors=recon_dict,
            reason=reason
        )
