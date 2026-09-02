"""
Production-Ready ESP Telemetry Analysis Pipeline Runner.

*** DEPRECATED — LIVE PATH DISABLED (2026-09-01) ***
This XGBoost/IsolationForest pipeline was trained on generic public datasets
(Petrobras 3W, ESPset) with an 8-class fault taxonomy that CONFLICTS with the
official, physics-calibrated 13-fault taxonomy in ESP_APM_models
(x:\\TAS\\Agentic_project\\ESP_APM_models). ESP_APM_models is the sole source
of truth for live ESP fault classification going forward — see
cced_esp/backend/services/vfd_diagnostic_service.py for the live pipeline.

`--run` and `--all` are hard-disabled below so this module can NEVER connect
to the live MQTT broker and publish conflicting predictions to
`esp/v1/predictions`. `--fetch`, `--train`, and `--test-sample` remain
available for offline reference/experimentation only — they never touch the
live broker.

Unified Entrypoint for:
  --fetch       : Fetch, extract, and clean authentic real-world sensor datasets (Petrobras 3W, ESPset, SQLite)
  --train       : Train XGBoost Fault Classifier and IsolationForest Anomaly Detector on real datasets
  --run         : [DISABLED] Previously launched Real-Time MQTT Live Subscriber & Prediction Publisher
  --all         : [RUN STEP DISABLED] fetch -> train only (live run step is skipped)
  --test-sample : Run a quick diagnostic test on sample operational states (offline, no broker contact)
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
# NOTE: RealTimeMQTTSubscriber is intentionally NOT imported at module load time.
# It is imported lazily (see the --run branch below) only to preserve the ability
# to inspect/reference it; the branch that would instantiate and run it is disabled.


def main():
    parser = argparse.ArgumentParser(
        description="Production-Ready ESP Fault Classification & Anomaly Detection Pipeline"
    )
    parser.add_argument("--fetch", action="store_true", help="Download & prepare authentic benchmark datasets")
    parser.add_argument("--train", action="store_true", help="Train dual-tier production models on real datasets")
    parser.add_argument("--run", action="store_true", help="[DISABLED] Live MQTT subscriber/publisher — see deprecation notice at top of file")
    parser.add_argument("--all", action="store_true", help="Execute fetch + train only (live run step is disabled)")
    parser.add_argument("--test-sample", action="store_true", help="Run offline diagnostic prediction check")
    parser.add_argument(
        "--force-legacy-live", action="store_true",
        help="Escape hatch to bypass the deprecation guard and actually run the legacy live "
             "MQTT subscriber. Requires explicit operator intent — will still WARN loudly and "
             "publish to esp/v1/predictions, conflicting with ESP_APM_models. Use only if you "
             "know what you are doing."
    )

    args = parser.parse_args()

    # If no flags provided, default to --help or run diagnostic
    if not any([args.fetch, args.train, args.run, args.all, args.test_sample]):
        print("================================================================================")
        print("  ESP PRODUCTION FAULT CLASSIFICATION & ANOMALY DETECTION PIPELINE")
        print("================================================================================")
        print("  *** DEPRECATED: --run / live MQTT publishing is DISABLED. ***")
        print("  ESP_APM_models is the sole source of truth for live ESP fault classification.")
        print("  See cced_esp/backend/services/vfd_diagnostic_service.py for the live pipeline.")
        print("--------------------------------------------------------------------------------")
        print("Usage:")
        print("  python pipeline_runner.py --fetch        Fetch & clean authentic real datasets")
        print("  python pipeline_runner.py --train        Train XGBoost & IsolationForest models")
        print("  python pipeline_runner.py --run          [DISABLED] see deprecation notice above")
        print("  python pipeline_runner.py --all          fetch + train only (live step disabled)")
        print("  python pipeline_runner.py --test-sample  Run offline diagnostic verification")
        print("  python pipeline_runner.py --run --force-legacy-live   Escape hatch (not recommended)")
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

    if (args.all or args.run) and not args.force_legacy_live:
        print("\n" + "=" * 80)
        print("  [DEPRECATED] LIVE MQTT SUBSCRIBER/PUBLISHER IS DISABLED")
        print("=" * 80)
        print("  This legacy XGBoost pipeline is deprecated. ESP_APM_models is now the")
        print("  sole source of truth for live ESP fault classification.")
        print("  Live inference runs via: cced_esp/backend/services/vfd_diagnostic_service.py")
        print("  (wired automatically into mqtt_collector.py — no manual launch needed).")
        print()
        print("  If you deliberately need to run this legacy path anyway, re-run with:")
        print("    python pipeline_runner.py --run --force-legacy-live")
        print("=" * 80 + "\n")

    if args.run and args.force_legacy_live:
        print("\n" + "=" * 80)
        print("  [WARNING] FORCING LEGACY LIVE PIPELINE — WILL PUBLISH CONFLICTING")
        print("  PREDICTIONS TO esp/v1/predictions ALONGSIDE ESP_APM_models OUTPUT.")
        print("=" * 80)
        from src.mqtt_subscriber import RealTimeMQTTSubscriber
        node = RealTimeMQTTSubscriber()
        node.run()


if __name__ == "__main__":
    main()
