# Model Validation Protocol & Anti-Leakage Specification

## 1. Zero-Leakage Time-Series Validation Rules

Time-series predictive models require strict chronological integrity. Shuffling rows or using standard K-Fold cross-validation causes **catastrophic temporal leakage** and yields overly optimistic, unreplicable metrics.

### Non-Negotiable Rules:
1. **No Random Shuffling**: Telemetry rows are never randomly partitioned.
2. **Temporal Holdout (Walk-Forward)**:
   - Train on $[t_0, t_1]$
   - Validate on $[t_1 + \text{gap}, t_2]$
   - Test on $[t_2 + \text{gap}, t_3]$
   - A temporal buffer gap is enforced between splits to prevent overlapping rolling feature windows.
3. **Group-Aware Splitting (Multi-Well)**: When multiple wells exist, models must also be validated using **Leave-One-Well-Out (LOGO)** or **GroupKFold** across asset clusters to measure cross-well generalization.
4. **Leakage Audit Checklist**:
   - Zero future lookahead in rolling aggregations.
   - Zero target labels leaked into feature vectors.
   - Zero post-trip / post-maintenance data leaked into pre-fault degradation models.

---

## 2. Evaluation Metrics

| Model System | Primary Metrics | Secondary Metrics | Target Acceptance Threshold |
|---|---|---|---|
| **Rule Engine** | Deterministic Precision (1.00) | Latency (<5ms), False Alarm Rate | Zero rule evaluation errors |
| **Fault Classifier** | Macro F1-Score | Per-Class Recall, PR-AUC, ECE (Calibration) | Macro F1 $\ge 0.85$ (on validated classes) |
| **Fault Predictor** | PR-AUC, Warning Lead Time | Brier Score, ROC-AUC, False Alarms/Month | PR-AUC significantly above class prevalence |
| **RUL Engine** | MAE, 95% Coverage Rate | RMSE, Median Absolute Error | Coverage $\ge 90\%$, MAE within operating window |
| **Anomaly Detector** | Low False Positive Rate | Detection Latency, Event Recall | FPR $< 5\%$ on verified healthy baseline |
