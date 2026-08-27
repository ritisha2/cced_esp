"""
Hybrid Two-Tier Inference Engine.
Tier 1: ISO 10816 / Critical Physical Limits Evaluation Layer
Tier 2: Dual ML Classifier (XGBoost) & Unsupervised Anomaly Detector (IsolationForest)

Outputs strictly standardized prediction dictionaries according to specification.
"""

import os
import sys
import time
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.features import extract_features_from_dict, CANONICAL_TAGS

MODELS_DIR = BASE_DIR / "models" / "v2"

# Engineering and Critical ISO / Field Limits
FIELD_LIMIT_SPEC = {
    "R_PIT_001": {
        "unit": "Barg",
        "normal_min": 50.0,
        "normal_max": 120.0,
        "critical_min": 50.0,
        "critical_max": 120.0,
        "description": "Wellhead Pressure"
    },
    "R_PIT_002": {
        "unit": "Barg",
        "normal_min": 30.0,
        "normal_max": 100.0,
        "critical_min": None,
        "critical_max": 100.0,
        "description": "Casing / Annulus Pressure"
    },
    "R_PIT_003": {
        "unit": "Barg",
        "normal_min": 30.0,
        "normal_max": 100.0,
        "critical_min": None,
        "critical_max": 100.0,
        "description": "Flowline Pressure"
    },
    "R_INTAKE_PRESS": {
        "unit": "psi",
        "normal_min": 800.0,
        "normal_max": 2000.0,
        "critical_min": 800.0,
        "critical_max": 2000.0,
        "description": "Intake Pressure (PIP)"
    },
    "R_INTAKE_TEMP": {
        "unit": "°C",
        "normal_min": 50.0,
        "normal_max": 90.0,
        "critical_min": None,
        "critical_max": 90.0,
        "description": "Intake Temperature"
    },
    "R_DISCH_PRESS": {
        "unit": "psi",
        "normal_min": 1500.0,
        "normal_max": 3000.0,
        "critical_min": 1500.0,
        "critical_max": 3000.0,
        "description": "Discharge Pressure (PDP)"
    },
    "R_MOTOR_TEMP": {
        "unit": "°C",
        "normal_min": 60.0,
        "normal_max": 100.0,
        "critical_min": None,
        "critical_max": 100.0,
        "description": "Motor Temperature"
    },
    "R_FREQUENCY": {
        "unit": "Hz",
        "normal_min": 40.0,
        "normal_max": 60.0,
        "critical_min": 40.0,
        "critical_max": 60.0,
        "description": "Frequency"
    },
    "R_VIBRATION_X": {
        "unit": "g",
        "normal_min": 0.05,
        "normal_max": 0.30,
        "critical_min": None,
        "critical_max": 0.30,
        "description": "Vibration RMS"
    },
    "R_TOOL_CURRENT": {
        "unit": "mA",
        "normal_min": 0.0,
        "normal_max": 20.0,
        "critical_min": None,
        "critical_max": 20.0,
        "description": "Leakage / Tool Current"
    },
    "R_DRV_CURR_AVG": {
        "unit": "A",
        "normal_min": 30.0,
        "normal_max": 90.0,
        "critical_min": 30.0,
        "critical_max": 90.0,
        "description": "Drive Current Average"
    },
    "R_DHG_CURR_AVG": {
        "unit": "A",
        "normal_min": 30.0,
        "normal_max": 90.0,
        "critical_min": 10.0,
        "critical_max": 90.0,
        "description": "Downhole Gauge Current"
    },
    "R_BUS_IN_VTG_AVG": {
        "unit": "V",
        "normal_min": 400.0,
        "normal_max": 500.0,
        "critical_min": 400.0,
        "critical_max": 500.0,
        "description": "Bus Voltage"
    }
}


class ESPInferenceEngine:
    """Production Two-Tier Inference Engine."""

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir
        self.classifier = None
        self.anomaly_detector = None
        self.scaler = None
        self.label_encoder = None
        self._load_artifacts()

    def _load_artifacts(self):
        """Load trained production models from disk."""
        clf_path = self.models_dir / "fault_classifier.joblib"
        ad_path = self.models_dir / "anomaly_detector.joblib"
        scaler_path = self.models_dir / "feature_scaler.joblib"
        le_path = self.models_dir / "label_encoder.joblib"

        if clf_path.exists() and ad_path.exists() and scaler_path.exists() and le_path.exists():
            self.classifier = joblib.load(clf_path)
            self.anomaly_detector = joblib.load(ad_path)
            self.scaler = joblib.load(scaler_path)
            self.label_encoder = joblib.load(le_path)
            print(f"[OK] ESPInferenceEngine loaded artifacts from {self.models_dir}")
        else:
            print(f"[*] Training production models on authentic datasets...")
            from src.train import ProductionModelTrainer
            trainer = ProductionModelTrainer()
            trainer.train()
            self._load_artifacts()

    def evaluate_physical_limits(self, telemetry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Stage 1: Evaluate sensor values against critical ISO/physical boundaries.
        Returns a list of triggered limit breaches.
        """
        triggered = []
        for tag, spec in FIELD_LIMIT_SPEC.items():
            if tag in telemetry and telemetry[tag] is not None:
                try:
                    val = float(telemetry[tag])
                    crit_min = spec.get("critical_min")
                    crit_max = spec.get("critical_max")

                    if crit_max is not None and val > crit_max:
                        triggered.append({
                            "tag": tag,
                            "value": round(val, 3),
                            "limit": crit_max,
                            "type": "HIGH"
                        })
                    elif crit_min is not None and val < crit_min:
                        triggered.append({
                            "tag": tag,
                            "value": round(val, 3),
                            "limit": crit_min,
                            "type": "LOW"
                        })
                except (ValueError, TypeError):
                    continue
        return triggered

    def predict(self, telemetry_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run end-to-end two-tier inference on incoming telemetry.
        Returns standardized JSON dictionary matching the required schema.
        """
        now_ts = int(telemetry_payload.get("timestamp", time.time()))

        # Clean standardized 13 tags representation
        telemetry_clean = {}
        for tag in CANONICAL_TAGS:
            val = telemetry_payload.get(tag)
            if val is None:
                # Fallback mapping from common alternative payload keys
                alt_keys = {
                    "R_PIT_001": ["wellhead_pressure_psi", "wh_pressure_bar", "p_wh"],
                    "R_PIT_002": ["casing_pressure_psi", "casing_bar", "p_cas"],
                    "R_PIT_003": ["flowline_pressure_psi", "flowline_bar", "p_fl"],
                    "R_INTAKE_PRESS": ["intake_pressure_psi", "pip_psi", "pressure_intake"],
                    "R_INTAKE_TEMP": ["intake_temperature_c", "t_intake", "intake_temp"],
                    "R_DISCH_PRESS": ["discharge_pressure_psi", "pressure_psi", "pdp_psi"],
                    "R_MOTOR_TEMP": ["motor_temperature_c", "temperature_c", "motor_temp"],
                    "R_FREQUENCY": ["frequency_hz", "freq_hz", "frequency"],
                    "R_VIBRATION_X": ["vibration_g", "vibration_g_rms", "vibration_rms"],
                    "R_TOOL_CURRENT": ["tool_current_ma", "leakage_current_ma"],
                    "R_DRV_CURR_AVG": ["motor_current_a", "current_a", "drive_current_a"],
                    "R_DHG_CURR_AVG": ["dhg_current_a", "gauge_current_a", "downhole_current"],
                    "R_BUS_IN_VTG_AVG": ["motor_voltage_v", "bus_voltage_v", "voltage_v"]
                }
                for alt in alt_keys.get(tag, []):
                    if alt in telemetry_payload and telemetry_payload[alt] is not None:
                        val = telemetry_payload[alt]
                        break

            # If still None, supply standard nominal default
            if val is None:
                if tag == "R_DHG_CURR_AVG":
                    val = telemetry_clean.get("R_DRV_CURR_AVG", 50.0)
                elif "PIT" in tag:
                    val = 80.0
                elif "INTAKE_P" in tag:
                    val = 1200.0
                elif "DISCH" in tag:
                    val = 2200.0
                elif "VIB" in tag:
                    val = 0.18
                elif "TOOL" in tag:
                    val = 4.0
                else:
                    val = 50.0
            
            telemetry_clean[tag] = round(float(val), 3)

        # Stage 1: Physical Limits Evaluation
        triggered_limits = self.evaluate_physical_limits(telemetry_clean)

        # Stage 2: Feature Engineering & ML Inference
        from src.features import FEATURE_COLUMNS
        import pandas as pd
        feat_df = pd.DataFrame([extract_features_from_dict(telemetry_clean)], columns=FEATURE_COLUMNS)
        feat_scaled = self.scaler.transform(feat_df)

        # Supervised Classification
        pred_class_idx = self.classifier.predict(feat_scaled)[0]
        pred_probs = self.classifier.predict_proba(feat_scaled)[0]
        fault_class_str = str(self.label_encoder.inverse_transform([pred_class_idx])[0])
        confidence_score = float(pred_probs[pred_class_idx])

        # Unsupervised Anomaly Detection
        # IsolationForest decision_function: inliers > 0.0, anomalies <= 0.0
        raw_ad_score = float(self.anomaly_detector.decision_function(feat_scaled)[0])
        is_ad_anomaly = bool(self.anomaly_detector.predict(feat_scaled)[0] == -1)
        
        # Calibrate anomaly score in [0.0, 1.0] where 0.0 = completely healthy, 1.0 = extreme anomaly
        anomaly_score = float(np.clip(0.50 - (raw_ad_score * 3.5), 0.0, 1.0))
        is_anomaly = bool(raw_ad_score < -0.03 or anomaly_score > 0.60)

        # Composite State Determination
        is_limit_breached = len(triggered_limits) > 0
        if fault_class_str != "Normal" or is_anomaly or is_limit_breached:
            overall_state = "FAULT"
            # If classifier said normal but physical limits breached, prioritize fault description
            if fault_class_str == "Normal" and is_limit_breached:
                first_breach = triggered_limits[0]
                fault_class_str = f"Limit Breach: {first_breach['tag']} {first_breach['type']}"
        else:
            overall_state = "HEALTHY"

        result = {
            "timestamp": now_ts,
            "state": overall_state,
            "fault_classification": fault_class_str,
            "confidence_score": round(confidence_score, 3),
            "is_anomaly": is_anomaly,
            "anomaly_score": round(anomaly_score, 3),
            "triggered_limits": triggered_limits,
            "telemetry_received": telemetry_clean
        }

        return result


if __name__ == "__main__":
    engine = ESPInferenceEngine()
    
    # Test Normal Operational Sample
    normal_sample = {
        "timestamp": int(time.time()),
        "R_PIT_001": 84.5,
        "R_PIT_002": 45.1,
        "R_PIT_003": 50.0,
        "R_INTAKE_PRESS": 1180.0,
        "R_INTAKE_TEMP": 68.2,
        "R_DISCH_PRESS": 2210.0,
        "R_MOTOR_TEMP": 72.5,
        "R_FREQUENCY": 50.0,
        "R_VIBRATION_X": 0.12,
        "R_TOOL_CURRENT": 3.8,
        "R_DRV_CURR_AVG": 38.5,
        "R_DHG_CURR_AVG": 38.4,
        "R_BUS_IN_VTG_AVG": 460.0
    }
    pred_normal = engine.predict(normal_sample)
    print("\n=== NORMAL PREDICTION TEST ===")
    import pprint
    pprint.pprint(pred_normal)

    # Test Fault Sample (Bearing Degradation with High Vibration)
    fault_sample = {
        "timestamp": int(time.time()),
        "R_PIT_001": 84.5,
        "R_PIT_002": 45.1,
        "R_PIT_003": 50.0,
        "R_INTAKE_PRESS": 1180.0,
        "R_INTAKE_TEMP": 74.2,
        "R_DISCH_PRESS": 2210.0,
        "R_MOTOR_TEMP": 102.5,
        "R_FREQUENCY": 50.0,
        "R_VIBRATION_X": 0.44,
        "R_TOOL_CURRENT": 12.0,
        "R_DRV_CURR_AVG": 66.2,
        "R_DHG_CURR_AVG": 65.8,
        "R_BUS_IN_VTG_AVG": 455.0
    }
    pred_fault = engine.predict(fault_sample)
    print("\n=== FAULT PREDICTION TEST ===")
    pprint.pprint(pred_fault)
