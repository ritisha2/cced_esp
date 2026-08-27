# Site Asset & Well Fleet Forensic Inventory

**Source Database**: `data/opg_wells.db` (`opg_well_telemetry`)  
**Total Discovered Wells**: 28 distinct wells  
**Total Discovered ESPs / Assets**: 28 distinct assets  

---

## 1. Fleet Inventory Table

| Well ID | Asset ID | Total Records | First Timestamp | Last Timestamp | Duration (min) | Sampling Interval | Dominant Scenario | Operating State | Ground Truth Status |
|---|---|---|---|---|---|---|---|---|---|
| `FSWS-001-A` | `ESP-FSWS-001-A` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `dry_well_pump_off` | tripped | Labelled Fault |
| `FSWS-003` | `ESP-FSWS-003` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `gas_interference_to_lock` | tripped | Labelled Fault |
| `FSWS-005` | `ESP-FSWS-005` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `dry_well_pump_off` | tripped | Labelled Fault |
| `FSWS-008` | `ESP-FSWS-008` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `blocked_intake` | tripped | Labelled Fault |
| `FSWS-011` | `ESP-FSWS-011` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FSWS-012` | `ESP-FSWS-012` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `gas_interference_to_lock` | tripped | Labelled Fault |
| `FS-010` | `ESP-FS-010` | 1,033 | 2026-08-25 04:32:30 | 2026-08-25 05:17:15 | 44.75 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-011` | `ESP-FS-011` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-013` | `ESP-FS-013` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `undervoltage` | tripped | Labelled Fault |
| `FS-014` | `ESP-FS-014` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-016` | `ESP-FS-016` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-017` | `ESP-FS-017` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `gas_interference_to_lock` | tripped | Labelled Fault |
| `FS-018` | `ESP-FS-018` | 1,015 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `phase_imbalance` | tripped | Labelled Fault |
| `FS-020` | `ESP-FS-020` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-021` | `ESP-FS-021` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-022` | `ESP-FS-022` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-023` | `ESP-FS-023` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `bearing_degradation` | tripped | Labelled Fault |
| `FS-024` | `ESP-FS-024` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-028` | `ESP-FS-028` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `gas_interference_to_lock` | tripped | Labelled Fault |
| `FS-030` | `ESP-FS-030` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-031` | `ESP-FS-031` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-038` | `ESP-FS-038` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `sand_ingestion` | tripped | Labelled Fault |
| `FS-042` | `ESP-FS-042` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `undervoltage` | tripped | Labelled Fault |
| `FS-043` | `ESP-FS-043` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-045` | `ESP-FS-045` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-046` | `ESP-FS-046` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `FS-047` | `ESP-FS-047` | 1,016 | 2026-08-25 04:32:30 | 2026-08-25 05:16:34 | 44.07 min | 2.60 s | `normal` | running | Labelled Healthy |
| `WELL-TEST-101` | `ASSET-TEST-TX01` | 3 | 2026-08-25 09:44:43 | 2026-08-25 09:44:43 | 0.00 min | 0.00 s | `normal` | running | System Verification |
