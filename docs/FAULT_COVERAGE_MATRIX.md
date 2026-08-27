# ESP Fault Coverage & Verification Matrix

This matrix documents the exact scientific coverage across all 13 required ESP fault modes, Healthy state, and Unknown patterns.

---

### Fault Coverage Matrix

| # | Fault Class | Present in Training Data? | Total Samples | Independent Events | Wells | Train Samples | Val Samples | Test Samples | Classifier Support | Rule Engine Support | Future Risk Support | RUL Support | Site Validation Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | **Healthy Operation** | **YES** | 15,256 | 1,066 | 28 | 10,679 | 2,288 | 2,289 | **ML Trained** | Supported (Envelopes) | Baseline | N/A (Nominal) | Validated on Historian |
| 1 | **Dry-Well Pump Off** | **YES** (includes Gas Lock) | 6,091 | 609 | 6 | 4,263 | 915 | 913 | **ML Trained** | Supported (PIP < 150, I < 20) | Active | Disabled (Uncertain) | Validated on Historian |
| 2 | **Blocked Intake** | **YES** | 1,015 | 152 | 1 | 711 | 152 | 152 | **ML Trained** | Supported (PIP drop, DP drop) | Active | Disabled (Uncertain) | Validated on Historian |
| 3 | **Scale or Pump Wear** | **NO** | 0 | 0 | 0 | 0 | 0 | 0 | *Rule Fallback* | Supported (DP/Power ratio) | Trajectory only | Disabled (No Data) | **UNVALIDATED (No Data)** |
| 4 | **Sand Ingestion** | **YES** | 1,016 | 153 | 1 | 711 | 152 | 153 | **ML Trained** | Supported (Vib > 0.45g, erratic I)| Active | Disabled (Uncertain) | Validated on Historian |
| 5 | **Bearing Degradation** | **YES** | 1,016 | 152 | 1 | 712 | 152 | 152 | **ML Trained** | Supported (Vib > 0.50g, Temp ramp)| Active | Disabled (Uncertain) | Validated on Historian |
| 6 | **High Viscosity Cold Start**| **NO** | 0 | 0 | 0 | 0 | 0 | 0 | *Rule Fallback* | Supported (Cold PIP/Temp, High I) | Trajectory only | Disabled (No Data) | **UNVALIDATED (No Data)** |
| 7 | **High Backpressure** | **NO** | 0 | 0 | 0 | 0 | 0 | 0 | *Rule Fallback* | Supported (PDP > 2200, low rate) | Trajectory only | Disabled (No Data) | **UNVALIDATED (No Data)** |
| 8 | **Open Choke** | **NO** | 0 | 0 | 0 | 0 | 0 | 0 | *Rule Fallback* | Supported (Rate > 1500, low PDP) | Trajectory only | Disabled (No Data) | **UNVALIDATED (No Data)** |
| 9 | **Undervoltage** | **YES** | 2,031 | 305 | 2 | 1,421 | 305 | 305 | **ML Trained** | Supported (V < 380V) | Active | Disabled (Uncertain) | Validated on Historian |
| 10 | **Phase Imbalance** | **YES** | 1,015 | 152 | 1 | 711 | 152 | 152 | **ML Trained** | Supported (I diff, Temp ramp) | Active | Disabled (Uncertain) | Validated on Historian |
| 11 | **Motor Overload** | **NO** | 0 | 0 | 0 | 0 | 0 | 0 | *Rule Fallback* | Supported (I > 40A, Temp > 115°C)| Trajectory only | Disabled (No Data) | **UNVALIDATED (No Data)** |
| 12 | **Power Loss** | **NO** | 0 | 0 | 0 | 0 | 0 | 0 | *Rule Fallback* | Supported (V < 50V, I < 2A) | Instantaneous | Disabled (No Data) | **UNVALIDATED (No Data)** |
| 13 | **Sensor Drift** | **NO** | 0 | 0 | 0 | 0 | 0 | 0 | *Rule Fallback* | Supported (Hydraulic mismatch) | Trajectory only | Disabled (No Data) | **UNVALIDATED (No Data)** |
| - | **Unknown / Unseen** | **YES** (Manifold) | N/A | N/A | 28 | N/A | N/A | N/A | **Isolation Forest**| N/A | Anomaly Score | Disabled | Unsupervised Gating |

---

### Key Takeaway for Engineering & Management

- **ML Multiclass Classifier**: Directly trained on **6 fault classes + Healthy** (7 total classes).
- **Rule Engine**: Provides 100% deterministic coverage for all **13 fault classes**.
- **Scientific Honesty Rule**: The 7 faults without historical training samples are evaluated strictly via physics rule thresholds, never falsely claimed as ML-trained classes.
