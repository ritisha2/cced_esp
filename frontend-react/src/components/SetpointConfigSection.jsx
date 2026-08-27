import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { SlidersHorizontal, Check, RefreshCw, AlertOctagon } from 'lucide-react';

export const SetpointConfigSection = () => {
  const { userSetpoints, setUserSetpoints } = useTelemetry();
  const [localSetpoints, setLocalSetpoints] = useState(userSetpoints || {
    pip_low_limit: 450,
    pdp_high_limit: 2800,
    temp_high_limit: 95,
    vib_high_limit: 0.28,
    curr_high_limit: 60
  });
  const [applied, setApplied] = useState(false);

  const handleApply = (e) => {
    e.preventDefault();
    if (setUserSetpoints) {
      setUserSetpoints(localSetpoints);
    }
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleReset = () => {
    const defaultVals = {
      pip_low_limit: 450,
      pdp_high_limit: 2800,
      temp_high_limit: 95,
      vib_high_limit: 0.28,
      curr_high_limit: 60
    };
    setLocalSetpoints(defaultVals);
    if (setUserSetpoints) setUserSetpoints(defaultVals);
  };

  return (
    <section id="section-setpoints" style={{ marginTop: '1.5rem' }}>
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <SlidersHorizontal size={16} color="var(--accent-purple)" /> Operator Setpoint Tuning & Dynamic Alarm Thresholds
          </div>
          <span className="badge badge-neutral">
            Thresholds Mark Directly On 13-Graphs
          </span>
        </div>

        <div className="scada-card-body">
          <form onSubmit={handleApply}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              {/* PIP Low Limit */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Low Intake Pressure Alarm (PIP)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="scada-input"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    value={localSetpoints.pip_low_limit}
                    onChange={(e) => setLocalSetpoints({ ...localSetpoints, pip_low_limit: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>psi</span>
                </div>
              </div>

              {/* PDP High Limit */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  High Discharge Pressure (PDP)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="scada-input"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    value={localSetpoints.pdp_high_limit}
                    onChange={(e) => setLocalSetpoints({ ...localSetpoints, pdp_high_limit: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>psi</span>
                </div>
              </div>

              {/* Temp High Limit */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  High Motor Temperature
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="scada-input"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    value={localSetpoints.temp_high_limit}
                    onChange={(e) => setLocalSetpoints({ ...localSetpoints, temp_high_limit: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>°C</span>
                </div>
              </div>

              {/* Vib High Limit */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  High Vibration Severity (ISO)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.01"
                    className="scada-input"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    value={localSetpoints.vib_high_limit}
                    onChange={(e) => setLocalSetpoints({ ...localSetpoints, vib_high_limit: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>g</span>
                </div>
              </div>

              {/* Current High Limit */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Motor Overload Current
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="scada-input"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    value={localSetpoints.curr_high_limit}
                    onChange={(e) => setLocalSetpoints({ ...localSetpoints, curr_high_limit: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>A</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={handleReset}
                className="scada-btn"
                style={{ padding: '0.35rem 0.85rem' }}
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                className="scada-btn scada-btn-primary"
                style={{ padding: '0.35rem 1rem' }}
              >
                {applied ? <Check size={14} color="#fff" /> : <RefreshCw size={14} />}
                {applied ? 'Setpoints Applied & Synced' : 'Apply & Update Graph Guides'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
