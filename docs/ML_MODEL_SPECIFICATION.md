# ML Model Specification & Technical Architecture

## 1. Multi-Model Architecture Overview

The ESP Intelligence Platform combines five specialized model systems:

```
[Telemetry Window] ──► [Feature Pipeline]
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
[Model 1: Rules]     [Model 2: Classifier]  [Model 5: Anomaly]
       │                     │                     │
       └──────────────┬──────┴─────────────────────┘
                      ▼
             [Model 3: Predictor]
                      │
                      ▼
             [Model 4: RUL Engine]
```

---

## 2. Model 1: Deterministic Rule & Operating Envelope Engine

- **Mathematical Formulation**:
  For parameter $x_i$ at time $t$, given lower limit $L_i$ and upper limit $U_i$:
  $$\delta_i(t) = \begin{cases} L_i - x_i(t) & \text{if } x_i(t) < L_i \\ x_i(t) - U_i & \text{if } x_i(t) > U_i \\ 0 & \text{otherwise} \end{cases}$$
  Normalized Deviation:
  $$\Delta_i(t) = \frac{\delta_i(t)}{U_i - L_i} \times 100\%$$
- **Temporal Operators**:
  - Persistence: $\mathbb{I}\left(\forall \tau \in [t - \Delta t, t], \delta_i(\tau) > 0\right)$
  - Rate of Change: $\frac{dx_i}{dt} \approx \frac{x_i(t) - x_i(t - \Delta t)}{\Delta t}$
  - Moving Average Crossover: $SMA_{short}(x_i) - SMA_{long}(x_i)$

---

## 3. Model 2: Multiclass Fault Classifier

- **Target Classes**: 13 fault classes + `HEALTHY` + `UNKNOWN_UNSEEN`.
- **Model Candidates**: Gradient Boosted Trees (LightGBM, XGBoost, CatBoost), Random Forest, and calibrated logistic baselines.
- **Feature Space**: Rolling time-series statistics (mean, std, min, max, slope, kurtosis, skewness) across windows $[1m, 5m, 15m, 30m, 1h, 6h, 24h]$ plus domain ratios (differential pressure, PIP/PDP ratio, $V/I$ impedance proxy).
- **Probability Calibration**: Platt Scaling / Isotonic Regression to ensure output confidence reflects true posterior probability.
- **Unseen Pattern Rejection**:
  $$\text{If } \max_{c \in \mathcal{C}} P(y = c | \mathbf{x}) < \theta_{\text{confidence}} \implies \text{Class} = \text{UNKNOWN\_UNSEEN}$$

---

## 4. Model 3: Future Fault Risk Predictor

- **Objective**: Multi-horizon binary and multinomial risk estimation:
  $$P(\text{Fault } c \text{ occurs in } [t, t + H] | \mathcal{H}_t)$$
- **Horizons $H$**: 1 hour, 6 hours, 12 hours, 24 hours, 3 days, 7 days, 14 days, 30 days.
- **Trajectory Integration**: Uses acceleration $\frac{d^2x}{dt^2}$ and cumulative drift vectors to anticipate limit crossings before they trigger safety trips.

---

## 5. Model 4: Remaining Useful Life (RUL) Engine

- **Formulation**: Semi-parametric Cox Proportional Hazards and Survival Random Forests / Gradient Boosting:
  $$S(t | \mathbf{x}) = \exp\left(-\Lambda_0(t) \exp(\mathbf{\beta}^T \mathbf{x})\right)$$
  Expected RUL:
  $$\mathbb{E}[\text{RUL} | T > t, \mathbf{x}] = \int_t^\infty \frac{S(u | \mathbf{x})}{S(t | \mathbf{x})} du$$
- **Rigorous Gating**: If no verified run-to-failure degradation trajectories exist in the training corpus, the RUL engine returns `{"status": "UNAVAILABLE", "reason": "Insufficient run-to-failure history"}`.

---

## 6. Model 5: Healthy-State Anomaly Detector

- **Objective**: Detect novel or out-of-distribution operating states without relying on labeled fault instances.
- **Candidate Models**: Isolation Forest, One-Class SVM, Robust PCA Reconstruction Error, and Autoencoder reconstruction loss:
  $$\text{Score}(\mathbf{x}) = \|\mathbf{x} - \hat{\mathbf{x}}\|_2^2$$
- **Decoupled Operation**: Runs concurrently with the Fault Classifier. If Fault Classifier predicts `HEALTHY` (98%) but Anomaly Score is elevated (>0.85), the platform alerts: *"Healthy according to known fault library, but statistically unusual operating behavior detected"*.
