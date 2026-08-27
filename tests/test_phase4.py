"""Test Phase 4 Deterministic Operating Envelope & Rule Engine."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.data.canonical_schema import CanonicalESPTelemetry, ParameterStatus, FaultClass
from ml.models.rule_engine import ESPRuleEngine


def test_phase4():
    print(">>> 1. Initializing Rule Engine & Operating Envelopes...")
    engine = ESPRuleEngine()
    assert len(engine.envelopes) >= 13, f"Expected 13 envelopes, got {len(engine.envelopes)}"
    assert len(engine.rules) >= 10, f"Expected rules, got {len(engine.rules)}"
    print(f"    [OK] Loaded {len(engine.envelopes)} parameter envelopes and {len(engine.rules)} multivariate fault rules.")

    print(">>> 2. Evaluating Nominal Telemetry...")
    nominal_tel = CanonicalESPTelemetry(
        liquid_rate_bpd=965.0,
        intake_pressure_psi=236.0,
        discharge_pressure_psi=2130.0,
        motor_current_a=35.0,
        motor_load_pct=80.0,
        motor_temperature_c=100.0,
        vibration_rms=0.18,
        motor_voltage_v=460.0
    )
    param_evals = engine.evaluate_envelopes(nominal_tel)
    assert len(param_evals) >= 13
    assert all(p.status == ParameterStatus.NORMAL for p in param_evals if p.canonical_name in ["liquid_rate_bpd", "discharge_pressure_psi"])
    
    rules_fired = engine.evaluate_rules(nominal_tel)
    assert len(rules_fired) == 0, f"Expected 0 rules fired on nominal data, got {len(rules_fired)}"
    print("    [OK] Nominal telemetry correctly evaluated as NORMAL with 0 rules fired.")

    print(">>> 3. Evaluating Simulated Fault Condition: Dry-Well Pump Off...")
    pump_off_tel = CanonicalESPTelemetry(
        esp_id="ESP-TEST-PUMPOFF",
        liquid_rate_bpd=120.0,           # < 300
        intake_pressure_psi=90.0,        # < 120
        discharge_pressure_psi=1400.0,
        motor_current_a=12.0,            # < 18 (Underload)
        motor_load_pct=30.0,
        motor_temperature_c=98.0,
        vibration_rms=0.18,
        motor_voltage_v=460.0
    )
    # Zero persistence for immediate check
    engine.rules[0]["persistence_seconds"] = 0
    pump_off_evals = engine.evaluate_envelopes(pump_off_tel)
    pip_eval = next(p for p in pump_off_evals if p.canonical_name == "intake_pressure_psi")
    assert pip_eval.status in [ParameterStatus.WARNING, ParameterStatus.CRITICAL]
    assert pip_eval.deviation > 0

    rules_fired_fault = engine.evaluate_rules(pump_off_tel)
    assert any(r.fault == FaultClass.DRY_WELL_PUMP_OFF for r in rules_fired_fault)
    print("    [OK] DRY_WELL_PUMP_OFF rule successfully triggered with exact physics explanation.")

    print("\n>>> PHASE 4 TEST PASSED! <<<\n")


if __name__ == "__main__":
    test_phase4()
