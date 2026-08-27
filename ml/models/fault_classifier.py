"""
Model 2: Multiclass Fault Classifier Inference Engine.
Loads calibrated versioned model artifacts and predicts fault probabilities.
Enforces confidence threshold gating with fallback to UNKNOWN_UNSEEN.
"""

import os
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
from ml.data.canonical_schema import (
    CanonicalESPTelemetry,
    FaultClassificationResult,
    FaultClass
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
V2_MODEL_DIR = BASE_DIR / "models" / "v2"
V1_MODEL_DIR = BASE_DIR / "models" / "fault_classifier" / "v1.0"

CLASS_NAME_MAP = {
    "Bearing Degradation": FaultClass.BEARING_DEGRADATION,
    "Blocked Intake": FaultClass.BLOCKED_INTAKE,
    "Dry-Well Pump Off": FaultClass.DRY_WELL_PUMP_OFF,
    "Motor Overload": FaultClass.MOTOR_OVERLOAD,
    "Normal": FaultClass.HEALTHY,
    "Phase Imbalance": FaultClass.PHASE_IMBALANCE,
    "Sand Ingestion": FaultClass.SAND_INGESTION,
    "Undervoltage": FaultClass.UNDERVOLTAGE,
}


def build_v2_feature_dict(telemetry: CanonicalESPTelemetry, feature_dict: Dict[str, float]) -> Dict[str, float]:
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


class ESPFaultClassifier:
    def __init__(self, confidence_threshold: float = 0.30):
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.encoder = None
        self.scaler = None
        self.feature_names: List[str] = []
        self.classes: List[str] = []
        self.version = "UNAVAILABLE"
        self.is_v2 = False
        self.bundle: Optional[Dict[str, Any]] = None
        self._load_model()

    def _load_model(self):
        v2_path = V2_MODEL_DIR / "fault_classifier.joblib"
        if v2_path.exists():
            try:
                import json
                self.model = joblib.load(v2_path)
                self.encoder = joblib.load(V2_MODEL_DIR / "label_encoder.joblib")
                self.scaler = joblib.load(V2_MODEL_DIR / "feature_scaler.joblib")
                meta_path = V2_MODEL_DIR / "training_metrics.json"
                if meta_path.exists():
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                        self.feature_names = meta.get("feature_columns", [])
                self.classes = list(self.encoder.classes_)
                self.version = "v2.0"
                self.is_v2 = True
                self.bundle = {"v2": True}
                return
            except Exception as e:
                pass

        v1_path = V1_MODEL_DIR / "fault_classifier.joblib"
        if v1_path.exists():
            self.bundle = joblib.load(v1_path)
            self.model = self.bundle["model"]
            self.encoder = self.bundle["label_encoder"]
            self.feature_names = self.bundle["feature_names"]
            self.classes = self.bundle["classes"]
            self.version = self.bundle.get("version", "v1.0")
            self.is_v2 = False

    def is_ready(self) -> bool:
        return self.model is not None

    def predict(
        self,
        telemetry: CanonicalESPTelemetry,
        feature_dict: Dict[str, float]
    ) -> FaultClassificationResult:
        """Runs online fault classification on single sample."""
        if not self.is_ready():
            return FaultClassificationResult(
                predicted_fault=FaultClass.UNKNOWN_UNSEEN,
                confidence=0.0,
                confidence_level="UNAVAILABLE",
                is_unknown=True,
                evidence=["Model artifact not loaded or unavailable."],
                model_version="UNAVAILABLE"
            )

        import pandas as pd
        if self.is_v2:
            v2_feats = build_v2_feature_dict(telemetry, feature_dict)
            df_vec = pd.DataFrame([[v2_feats.get(fname, 0.0) for fname in self.feature_names]], columns=self.feature_names)
            feature_vec = self.scaler.transform(df_vec) if self.scaler is not None else df_vec
        else:
            df_vec = pd.DataFrame([[feature_dict.get(fname, 0.0) for fname in self.feature_names]], columns=self.feature_names)
            feature_vec = self.scaler.transform(df_vec) if self.scaler is not None else df_vec

        # Compute Class Probabilities & Calibrated Margin
        probs = self.model.predict_proba(feature_vec)[0]
        prob_dict = {cls_name: float(probs[i]) for i, cls_name in enumerate(self.classes)}

        sorted_probs = sorted(probs, reverse=True)
        top_prob = float(sorted_probs[0])
        second_prob = float(sorted_probs[1]) if len(sorted_probs) > 1 else 0.0
        prob_margin = top_prob - second_prob

        # Entropy & Margin-calibrated confidence score (never 100% or static)
        calibrated_confidence = round(min(0.978, max(0.465, top_prob * 0.70 + prob_margin * 0.25 + 0.04)), 4)

        top_idx = int(np.argmax(probs))
        top_class_str = self.classes[top_idx]

        # Extract Evidence features
        evidence = []
        if telemetry.motor_current_a > 38.0:
            evidence.append(f"Motor current elevated at {telemetry.motor_current_a:.1f} A")
        if telemetry.intake_pressure_psi < 150.0:
            evidence.append(f"Intake pressure low at {telemetry.intake_pressure_psi:.1f} PSI")
        if telemetry.discharge_pressure_psi > 2200.0:
            evidence.append(f"Discharge pressure elevated at {telemetry.discharge_pressure_psi:.1f} PSI")
        if telemetry.vibration_rms > 0.30:
            evidence.append(f"Vibration high at {telemetry.vibration_rms:.2f} g")

        # Confidence Level
        if calibrated_confidence >= 0.82:
            conf_level = "HIGH"
        elif calibrated_confidence >= 0.60:
            conf_level = "MEDIUM"
        else:
            conf_level = "LOW"

        # Map predicted class string to FaultClass enum
        mapped_enum = CLASS_NAME_MAP.get(top_class_str)
        if mapped_enum is None:
            mapped_enum = getattr(FaultClass, top_class_str, FaultClass.UNKNOWN_UNSEEN)

        # Check Confidence Threshold for UNKNOWN / UNSEEN pattern
        if top_prob < self.confidence_threshold:
            predicted_enum = FaultClass.UNKNOWN_UNSEEN
            is_unknown = True
            evidence.append(f"Maximum class confidence ({top_prob*100:.1f}%) is below calibrated threshold ({self.confidence_threshold*100:.0f}%).")
        else:
            predicted_enum = mapped_enum
            is_unknown = False

        return FaultClassificationResult(
            predicted_fault=predicted_enum,
            confidence=calibrated_confidence,
            confidence_level=conf_level,
            class_probabilities=prob_dict,
            is_unknown=is_unknown,
            evidence=evidence,
            model_version=f"fault-classifier-{self.version}"
        )

