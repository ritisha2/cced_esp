# 13 Fault Coverage from Site Database (`opg_wells.db`)

**Document Purpose**: Forensic audit of the manager's required 13 fault modes against the actual records in the site database.

---

### Coverage Matrix

| # | Fault Mode (Required Taxonomy) | Exact Raw Label(s) in DB | Present in Site DB? | Number of Labelled Rows | Number of Independent Events | Number of Affected Wells | First Occurrence | Last Occurrence | Duration Statistics | Ground Truth Available? | Can Train Classifier? | Can Train Predictor? | Can Estimate RUL? | Can Build Rule? | Confidence in Mapping | Evidence / Source Table |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | **Healthy Operation** | `normal` | **YES** | 15,258 | 16 | 16 | 2026-08-25 04:32:30 | 2026-08-25 09:44:43 | 44.07 min avg | **YES** | **YES** | Baseline | N/A (Nominal) | **YES** | High (100%) | `opg_well_telemetry` |
| 1 | **Dry-Well Pump Off** | `dry_well_pump_off`, `gas_interference_to_lock` | **YES** | 6,091 | 6 | 6 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min avg | **YES** | **YES** | **YES** | Disabled | **YES** | High (100%) | `opg_well_telemetry` |
| 2 | **Blocked Intake** | `blocked_intake` | **YES** | 1,015 | 1 | 1 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min avg | **YES** | **YES** | **YES** | Disabled | **YES** | High (100%) | `opg_well_telemetry` |
| 3 | **Scale or Pump Wear** | *(None)* | **NO** | 0 | 0 | 0 | None | None | None | **NO** | **NO** | **NO** | **NO** | **YES** | Rule-Only | Rule engine logic |
| 4 | **Sand Ingestion** | `sand_ingestion` | **YES** | 1,016 | 1 | 1 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min avg | **YES** | **YES** | **YES** | Disabled | **YES** | High (100%) | `opg_well_telemetry` |
| 5 | **Bearing Degradation** | `bearing_degradation` | **YES** | 1,016 | 1 | 1 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min avg | **YES** | **YES** | **YES** | Disabled | **YES** | High (100%) | `opg_well_telemetry` |
| 6 | **High Viscosity Cold Start** | *(None)* | **NO** | 0 | 0 | 0 | None | None | None | **NO** | **NO** | **NO** | **NO** | **YES** | Rule-Only | Rule engine logic |
| 7 | **High Backpressure** | *(None)* | **NO** | 0 | 0 | 0 | None | None | None | **NO** | **NO** | **NO** | **NO** | **YES** | Rule-Only | Rule engine logic |
| 8 | **Open Choke** | *(None)* | **NO** | 0 | 0 | 0 | None | None | None | **NO** | **NO** | **NO** | **NO** | **YES** | Rule-Only | Rule engine logic |
| 9 | **Undervoltage** | `undervoltage` | **YES** | 2,031 | 2 | 2 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min avg | **YES** | **YES** | **YES** | Disabled | **YES** | High (100%) | `opg_well_telemetry` |
| 10 | **Phase Imbalance** | `phase_imbalance` | **YES** | 1,015 | 1 | 1 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min avg | **YES** | **YES** | **YES** | Disabled | **YES** | High (100%) | `opg_well_telemetry` |
| 11 | **Motor Overload** | *(None)* | **NO** | 0 | 0 | 0 | None | None | None | **NO** | **NO** | **NO** | **NO** | **YES** | Rule-Only | Rule engine logic |
| 12 | **Power Loss** | *(None)* | **NO** | 0 | 0 | 0 | None | None | None | **NO** | **NO** | **NO** | **NO** | **YES** | Rule-Only | Rule engine logic |
| 13 | **Sensor Drift** | *(None)* | **NO** | 0 | 0 | 0 | None | None | None | **NO** | **NO** | **NO** | **NO** | **YES** | Rule-Only | Rule engine logic |

---

### Key Summary

- **Present in Site DB with Ground Truth**: 6 Faults + Healthy State (**7 Classes Total**).
- **Missing from Site DB**: 7 Faults (`Scale`, `Cold Start`, `High Backpressure`, `Open Choke`, `Motor Overload`, `Power Loss`, `Sensor Drift`).
- **Detection Method for Missing 7 Faults**: Deterministic Physics-Based Rule Engine.
