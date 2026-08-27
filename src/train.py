"""
Model Training Module.
Trains Dual-Tier Production Engine on Authentic Benchmark Telemetry:
1. Supervised Multi-Class Fault Classifier (XGBoost / LightGBM)
2. Unsupervised Anomaly Detector (IsolationForest on Healthy State Only)

Saves clean versioned artifacts in models/v2/.
"""

import os
import sys
import json
import shutil
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, accuracy_score, f1_score, confusion_matrix

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    from sklearn.ensemble import RandomForestClassifier

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.features import compute_features_dataframe, FEATURE_COLUMNS

DATA_DIR = BASE_DIR / "data"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
V2_MODELS_DIR = MODELS_DIR / "v2"
METRICS_DIR = BASE_DIR / "docs" / "metrics"

V2_MODELS_DIR.mkdir(parents=True, exist_ok=True)
METRICS_DIR.mkdir(parents=True, exist_ok=True)


class ProductionModelTrainer:
    """Trains and validates the dual-tier ESP production models."""

    def __init__(self, data_dir: Path = PROCESSED_DIR, model_out_dir: Path = V2_MODELS_DIR):
        self.data_dir = data_dir
        self.model_out_dir = model_out_dir
        self.model_out_dir.mkdir(parents=True, exist_ok=True)

    def load_datasets(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Load prepared real train and test parquet datasets."""
        train_path = self.data_dir / "train_features.parquet"
        test_path = self.data_dir / "test_features.parquet"

        if not train_path.exists() or not test_path.exists():
            print("[*] Processing datasets via data_fetcher...")
            from src.data_fetcher import DatasetFetcher
            fetcher = DatasetFetcher()
            train_df, test_df = fetcher.build_unified_dataset()
        else:
            train_df = pd.read_parquet(train_path)
            test_df = pd.read_parquet(test_path)

        print(f"[*] Loaded training dataset ({len(train_df):,} rows) and test dataset ({len(test_df):,} rows).")
        return train_df, test_df

    def train(self) -> Dict[str, Any]:
        """Train both Supervised Classifier and Unsupervised Anomaly Detector."""
        train_df, test_df = self.load_datasets()

        # Compute physics-informed invariant feature vectors
        print("[*] Extracting physics-informed invariant features...")
        X_train_raw = compute_features_dataframe(train_df)
        X_test_raw = compute_features_dataframe(test_df)
        y_train_raw = train_df["fault_classification"]
        y_test_raw = test_df["fault_classification"]

        # 1. Fit Label Encoder
        label_encoder = LabelEncoder()
        y_train = label_encoder.fit_transform(y_train_raw)
        y_test = label_encoder.transform(y_test_raw)
        classes = list(label_encoder.classes_)
        print(f"[*] Target fault classes ({len(classes)}): {classes}")

        # 2. Fit Feature Scaler
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train_raw)
        X_test_scaled = scaler.transform(X_test_raw)

        # 3. Train Supervised Multi-Class Classifier
        print("[*] Training Supervised Fault Classifier (XGBoost)...")
        if HAS_XGB:
            clf = xgb.XGBClassifier(
                n_estimators=150,
                max_depth=6,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=42,
                eval_metric="mlogloss",
                n_jobs=-1
            )
        else:
            clf = RandomForestClassifier(
                n_estimators=150,
                max_depth=12,
                random_state=42,
                n_jobs=-1
            )

        clf.fit(X_train_scaled, y_train)
        y_pred = clf.predict(X_test_scaled)
        y_proba = clf.predict_proba(X_test_scaled)

        acc = accuracy_score(y_test, y_pred)
        f1_macro = f1_score(y_test, y_pred, average="macro")
        f1_weighted = f1_score(y_test, y_pred, average="weighted")
        report = classification_report(y_test, y_pred, target_names=classes, output_dict=True)

        print(f"[OK] Classifier Accuracy: {acc * 100:.2f}% | F1 Macro: {f1_macro:.4f} | F1 Weighted: {f1_weighted:.4f}")

        # 4. Train Unsupervised Anomaly Detector (Isolation Forest on Healthy Data Only)
        print("[*] Training Unsupervised Anomaly Detector (IsolationForest on Healthy State)...")
        normal_mask = (y_train_raw == "Normal")
        X_train_normal = X_train_scaled[normal_mask]
        
        if len(X_train_normal) < 50:
            X_train_normal = X_train_scaled

        anomaly_detector = IsolationForest(
            n_estimators=120,
            contamination=0.05,
            max_samples="auto",
            random_state=42,
            n_jobs=-1
        )
        anomaly_detector.fit(X_train_normal)
        print("[OK] Isolation Forest fitted on normal operational baseline.")

        # 5. Persist All Model Artifacts to models/v2/
        print(f"[*] Saving model artifacts to {self.model_out_dir}...")
        joblib.dump(clf, self.model_out_dir / "fault_classifier.joblib")
        joblib.dump(anomaly_detector, self.model_out_dir / "anomaly_detector.joblib")
        joblib.dump(scaler, self.model_out_dir / "feature_scaler.joblib")
        joblib.dump(label_encoder, self.model_out_dir / "label_encoder.joblib")

        metrics_summary = {
            "model_family": "XGBoost + IsolationForest",
            "feature_columns": FEATURE_COLUMNS,
            "classes": classes,
            "accuracy": round(float(acc), 4),
            "f1_macro": round(float(f1_macro), 4),
            "f1_weighted": round(float(f1_weighted), 4),
            "train_samples": int(len(train_df)),
            "test_samples": int(len(test_df)),
            "per_class_metrics": {k: v for k, v in report.items() if isinstance(v, dict)}
        }

        metrics_path = self.model_out_dir / "training_metrics.json"
        with open(metrics_path, "w") as f:
            json.dump(metrics_summary, f, indent=2)

        print(f"[OK] Training complete. Artifacts successfully written to {self.model_out_dir}.")
        return metrics_summary


if __name__ == "__main__":
    trainer = ProductionModelTrainer()
    trainer.train()
