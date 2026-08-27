import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Layers, Activity, ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';

export const FleetHealthGrid = () => {
  const { assetsList, selectedAsset, setSelectedAsset, setActiveModalAsset, liveTelemetry, assessment } = useTelemetry();

  return (
    <section id="section-fleet">
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Layers size={16} color="var(--accent-purple)" /> ESP Fleet Well Health Overview & Asset Registry
          </div>
          <span className="badge badge-neutral">
            {assetsList.length} Monitored ESP Units
          </span>
        </div>

        <div className="scada-card-body" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {assetsList.map((asset) => {
            const id = asset.asset_id || asset.id || asset;
            const name = asset.well_id || asset.name || id;
            const isSelected = id === selectedAsset;

            // Granular State mapping
            const rawScenario = (asset.scenario || asset.status || '').toLowerCase();
            const isFault = isSelected 
              ? (assessment?.state === 'FAULTY/ANOMALY')
              : (rawScenario !== 'normal' && rawScenario !== 'healthy' && rawScenario !== '');

            const stateLabel = isFault ? 'FAULTY/ANOMALY' : 'HEALTHY';

            // Granular values: for selected well use live telemetry, otherwise use asset's real latest values
            const pipVal = isSelected 
              ? (liveTelemetry.R_INTAKE_PRESS !== undefined ? Number(liveTelemetry.R_INTAKE_PRESS).toFixed(0) : (asset.intake_p ? asset.intake_p.toFixed(0) : '--'))
              : (asset.intake_p ? Number(asset.intake_p).toFixed(0) : '--');

            const pdpVal = isSelected 
              ? (liveTelemetry.R_DISCH_PRESS !== undefined ? Number(liveTelemetry.R_DISCH_PRESS).toFixed(0) : (asset.disch_p ? asset.disch_p.toFixed(0) : '--'))
              : (asset.disch_p ? Number(asset.disch_p).toFixed(0) : '--');

            const tempVal = isSelected 
              ? (liveTelemetry.R_MOTOR_TEMP !== undefined ? Number(liveTelemetry.R_MOTOR_TEMP).toFixed(1) : (asset.motor_t ? asset.motor_t.toFixed(1) : '--'))
              : (asset.motor_t ? Number(asset.motor_t).toFixed(1) : '--');

            const vibVal = isSelected 
              ? (liveTelemetry.R_VIBRATION_X !== undefined ? Number(liveTelemetry.R_VIBRATION_X).toFixed(3) : (asset.vib_x ? asset.vib_x.toFixed(3) : '--'))
              : (asset.vib_x ? Number(asset.vib_x).toFixed(3) : '--');

            return (
              <div
                key={id}
                onClick={() => {
                  setSelectedAsset(id);
                  setActiveModalAsset(id);
                }}
                style={{
                  background: isSelected ? 'rgba(0, 229, 255, 0.05)' : 'var(--bg-secondary)',
                  border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                  boxShadow: isSelected ? '0 0 12px rgba(0, 229, 255, 0.2)' : 'none',
                  borderRadius: '6px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Header: Name, ID, State Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      {id}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {name} • {asset.pump_family || 'ESP'}
                    </div>
                  </div>
                  <span className={`badge ${isFault ? 'badge-fault' : 'badge-healthy'}`} style={{ fontSize: '0.68rem' }}>
                    {isFault ? <AlertTriangle size={11} /> : <ShieldCheck size={11} />}
                    {stateLabel}
                  </span>
                </div>

                {/* Metrics Summary */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.4rem',
                  fontSize: '0.72rem',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid rgba(45, 60, 90, 0.25)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>PIP:</span>{' '}
                    <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
                      {pipVal} {pipVal !== '--' ? 'psi' : ''}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>PDP:</span>{' '}
                    <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
                      {pdpVal} {pdpVal !== '--' ? 'psi' : ''}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Motor T:</span>{' '}
                    <span className="metric-value" style={{ color: 'var(--accent-amber)' }}>
                      {tempVal} {tempVal !== '--' ? '°C' : ''}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vib RMS:</span>{' '}
                    <span className="metric-value" style={{ color: vibVal !== '--' && Number(vibVal) > 0.3 ? 'var(--state-fault-text)' : 'var(--text-primary)' }}>
                      {vibVal} {vibVal !== '--' ? 'g' : ''}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.7rem',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontWeight: '600'
                }}>
                  <span>{isSelected ? '● ACTIVE MONITORING' : 'Click to inspect well'}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
