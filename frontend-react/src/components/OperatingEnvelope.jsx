import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { PARAM_CONFIGS } from '../constants/telemetryTags';
import { Gauge, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export const OperatingEnvelope = () => {
  const { liveTelemetry, selectedAsset, envelopeEvaluations } = useTelemetry();

  // Create lookup map from backend envelope evaluations if available
  const evalMap = {};
  if (Array.isArray(envelopeEvaluations)) {
    envelopeEvaluations.forEach(ev => {
      const key = (ev.parameter || ev.tag || '').toUpperCase();
      evalMap[key] = ev;
    });
  }

  return (
    <section id="section-envelope">
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Gauge size={16} color="var(--accent-teal)" /> ESP Operating Envelope & Boundary Monitoring
          </div>
          <span className="badge badge-neutral">
            Asset: {selectedAsset}
          </span>
        </div>

        <div className="scada-card-body" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem'
        }}>
          {PARAM_CONFIGS.map((param) => {
            const rawVal = liveTelemetry[param.tag];
            const hasVal = rawVal !== undefined && rawVal !== null;
            const numVal = Number(rawVal);

            // Check if backend provided specific evaluation
            const backendEval = evalMap[param.tag.toUpperCase()] || evalMap[param.name.toUpperCase()];
            const minNorm = backendEval?.normal_min !== undefined ? backendEval.normal_min : param.normalMin;
            const maxNorm = backendEval?.normal_max !== undefined ? backendEval.normal_max : param.normalMax;
            
            const isOutOfRange = hasVal && (numVal < minNorm || numVal > maxNorm);
            
            // Calculate percentage inside gauge bounds
            const span = Math.max(1, param.max - param.min);
            const pct = hasVal ? Math.max(0, Math.min(100, ((numVal - param.min) / span) * 100)) : 50;
            const normalStartPct = ((minNorm - param.min) / span) * 100;
            const normalWidthPct = ((maxNorm - minNorm) / span) * 100;

            const statusLabel = isOutOfRange ? 'OUT OF SPEC' : (hasVal ? 'NORMAL' : 'AWAITING');

            return (
              <div
                key={param.tag}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${isOutOfRange ? 'var(--state-fault-border)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                {/* Top Row: Name, Live Value, Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {param.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                      ({param.tag})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="metric-value" style={{ fontSize: '1rem', color: isOutOfRange ? 'var(--state-fault-text)' : param.color }}>
                      {hasVal ? numVal.toFixed(param.decimals) : '--'} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>{param.unit}</span>
                    </span>
                    <span className={`badge ${isOutOfRange ? 'badge-fault' : (hasVal ? 'badge-healthy' : 'badge-neutral')}`} style={{ fontSize: '0.65rem' }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Operating Range Bar */}
                <div style={{
                  position: 'relative',
                  height: '10px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  margin: '0.35rem 0'
                }}>
                  {/* Normal Zone Highlight */}
                  <div style={{
                    position: 'absolute',
                    left: `${Math.max(0, Math.min(100, normalStartPct))}%`,
                    width: `${Math.max(0, Math.min(100, normalWidthPct))}%`,
                    height: '100%',
                    background: 'rgba(16, 185, 129, 0.25)',
                    borderLeft: '1px solid rgba(16, 185, 129, 0.6)',
                    borderRight: '1px solid rgba(16, 185, 129, 0.6)'
                  }} />

                  {/* Live Value Indicator Bar */}
                  {hasVal && (
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isOutOfRange ? 'var(--accent-red)' : param.color,
                      borderRadius: '5px',
                      transition: 'width 0.3s ease'
                    }} />
                  )}
                </div>

                {/* Bottom Min / Max Reference Labels */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span>Min: {param.min} {param.unit}</span>
                  <span style={{ color: 'var(--state-healthy-text)' }}>Norm: {minNorm} – {maxNorm}</span>
                  <span>Max: {param.max} {param.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
