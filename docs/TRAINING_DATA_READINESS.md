# Training Data Readiness & Feasibility Matrix

**Document Purpose**: Evaluates data readiness, quality, risk of leakage, and feasibility for each of the 5 model systems.

---

### Model Training Feasibility

| Model System | Required Data | Available Data in Site DB | Missing Data | Number of Events | Number of Wells | Time Span | Can Train? | Can Validate? | Risk of Temporal Leakage | Recommended Approach |
|---|---|---|---|---|---|---|---|---|---|---|
| **Model 1: Rule & Envelope Engine** | Physics specifications, reference ranges | Physics parameters (`PDP`, `PIP`, `I`, `V`, `T`, `Vib`) | Surface gauge links | N/A (Rule thresholds) | 28 | 44 min runs | **YES** | **YES** | None (Deterministic) | Deploy with calibrated engineering envelopes & hysteresis timers. |
| **Model 2: Multiclass Fault Classifier** | Multi-class labeled time-series rows | 27,440 rows across 6 faults + Healthy | 7 unrecorded fault modes | 28 events (12 fault, 16 healthy) | 28 | 44 min runs | **YES** (for 7 classes) | **YES** (Group-well holdout) | High if random split; **Zero if chronological split** | Train on 7 available classes; route unrecorded classes to Rule Engine; flag low confidence as `UNKNOWN_UNSEEN`. |
| **Model 3: Future Fault Risk Forecaster** | Long healthy baseline transitioning into degradation | 44-minute recorded intervals | Multi-hour steady-state pre-fault history | 12 fault transitions | 12 | 44 min runs | **PARTIAL** | **RESEARCH ONLY** | High if positive prevalence skewed | Treat as **Research / Experimental** until continuous 24h+ baseline runs are logged. |
| **Model 4: RUL Survival Engine** | Multi-week run-to-failure lifecycles | 12 tripped sequence snapshots | Continuous degradation from nominal to mechanical failure | 12 well runs | 12 | 44 min runs | **NO** | **NO** | Severe (Overfitting to step offsets) | **Disable numeric RUL**. Output: *"RUL unavailable — insufficient run-to-failure history"*. |
| **Model 5: Healthy Anomaly Detector** | Pure nominal baseline operating data | 15,258 healthy samples across 16 wells | Multi-season operating envelope shifts | 16 healthy runs | 16 | 44 min runs | **YES** | **YES** (Unsupervised) | None | Train Isolation Forest + PCA on verified healthy subset; output 0–1 score and parameter attributions. |
