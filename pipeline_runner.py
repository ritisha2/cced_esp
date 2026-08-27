"""
Production-Ready ESP Telemetry Analysis Pipeline Runner.
Unified Entrypoint for:
  --fetch       : Fetch, extract, and clean authentic real-world sensor datasets (Petrobras 3W, ESPset, SQLite)
  --train       : Train XGBoost Fault Classifier and IsolationForest Anomaly Detector on real datasets
  --run         : Launch Real-Time MQTT Live Subscriber & Prediction Publisher (192.168.1.155:1883)
  --all         : End-to-end execution (fetch -> train -> run live)
  --test-sample : Run a quick diagnostic test on sample operational states
"""

import os
import sys
import argparse
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.data_fetcher import DatasetFetcher
from src.train import ProductionModelTrainer
from src.inference_engine import ESPInferenceEngine
from src.mqtt_subscriber import RealTimeMQTTSubscriber


def main():
    parser = argparse.ArgumentParser(
        description="Production-Ready ESP Fault Classification & Anomaly Detection Pipeline"
    )
    parser.add_argument("--fetch", action="store_true", help="Download & prepare authentic benchmark datasets")
    parser.add_argument("--train", action="store_true", help="Train dual-tier production models on real datasets")
    parser.add_argument("--run", action="store_true", help="Run live real-time MQTT subscriber and publisher")
    parser.add_argument("--all", action="store_true", help="Execute complete pipeline: fetch, train, and run live")
    parser.add_argument("--test-sample", action="store_true", help="Run offline diagnostic prediction check")

    args = parser.parse_args()

    # If no flags provided, default to --help or run diagnostic
    if not any([args.fetch, args.train, args.run, args.all, args.test_sample]):
        print("================================================================================")
        print("  ESP PRODUCTION FAULT CLASSIFICATION & ANOMALY DETECTION PIPELINE")
        print("================================================================================")
        print("Usage:")
        print("  python pipeline_runner.py --fetch        Fetch & clean authentic real datasets")
        print("  python pipeline_runner.py --train        Train XGBoost & IsolationForest models")
        print("  python pipeline_runner.py --run          Start real-time MQTT live streamer")
        print("  python pipeline_runner.py --all          Complete end-to-end pipeline execution")
        print("  python pipeline_runner.py --test-sample  Run offline diagnostic verification")
        print("================================================================================\n")
        return

    if args.all or args.fetch:
        print("\n" + "=" * 80)
        print("  STEP 1: REAL DATASET ACQUISITION & INGESTION (ZERO SYNTHETICS)")
        print("=" * 80)
        fetcher = DatasetFetcher()
        fetcher.build_unified_dataset()

    if args.all or args.train:
        print("\n" + "=" * 80)
        print("  STEP 2: PRODUCTION MODEL TRAINING & CALIBRATION (DUAL TIER)")
        print("=" * 80)
        trainer = ProductionModelTrainer()
        metrics = trainer.train()
        print(f"\n[OK] Model training verified with {metrics['accuracy']*100:.2f}% accuracy across {len(metrics['classes'])} classes.")

    if args.test_sample:
        print("\n" + "=" * 80)
        print("  DIAGNOSTIC TEST: TWO-TIER INFERENCE VERIFICATION")
        print("=" * 80)
        engine = ESPInferenceEngine()
        
        # Test Normal Sample
        sample_normal = {
            "timestamp": int(time.time()),
            "R_PIT_001": 95.0,
            "R_PIT_002": 48.0,
            "R_PIT_003": 78.0,
            "R_INTAKE_PRESS": 1650.0,
            "R_INTAKE_TEMP": 72.0,
            "R_DISCH_PRESS": 2400.0,
            "R_MOTOR_TEMP": 82.0,
            "R_FREQUENCY": 50.0,
            "R_VIBRATION_X": 0.14,
            "R_TOOL_CURRENT": 4.5,
            "R_DRV_CURR_AVG": 42.0,
            "R_DHG_CURR_AVG": 42.0,
            "R_BUS_IN_VTG_AVG": 460.0
        }
        res_norm = engine.predict(sample_normal)
        print("\n[NORMAL SAMPLE RESULT]:")
        import pprint
        pprint.pprint(res_norm)

        # Test Bearing Degradation Fault Sample
        sample_bearing = {
            "timestamp": int(time.time()),
            "R_PIT_001": 95.0,
            "R_PIT_002": 48.0,
            "R_PIT_003": 78.0,
            "R_INTAKE_PRESS": 1650.0,
            "R_INTAKE_TEMP": 72.0,
            "R_DISCH_PRESS": 2400.0,
            "R_MOTOR_TEMP": 115.0,
            "R_FREQUENCY": 50.0,
            "R_VIBRATION_X": 0.48, # ISO Limit Alarm > 0.30g
            "R_TOOL_CURRENT": 8.5,
            "R_DRV_CURR_AVG": 45.0,
            "R_DHG_CURR_AVG": 45.0,
            "R_BUS_IN_VTG_AVG": 460.0
        }
        res_bearing = engine.predict(sample_bearing)
        print("\n[BEARING DEGRADATION FAULT SAMPLE RESULT]:")
        pprint.pprint(res_bearing)

    if args.all or args.run:
        print("\n" + "=" * 80)
        print("  STEP 3: LIVE MQTT REAL-TIME TELEMETRY SUBSCRIBER & PUBLISHER")
        print("=" * 80)
        node = RealTimeMQTTSubscriber()
        node.run()


if __name__ == "__main__":
    main()
