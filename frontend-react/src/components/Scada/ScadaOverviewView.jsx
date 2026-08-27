import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { PARAM_CONFIGS } from '../../constants/telemetryTags';
import { Gauge, Activity, Zap, Thermometer, Radio } from 'lucide-react';

export const ScadaOverviewView = () => {
  const { liveTelemetry, selectedAsset, isConnected, lastPacketTime } = useTelemetry();

  const heroMetrics = [
    {
      title: 'Intake Pressure (PIP)',
      tag: 'R_INTAKE_PRESS',
      unit: 'psi',
      color: '#10b981',
      icon: Gauge,
      norm: '800 - 2000'
    },
    {
      title: 'Discharge Pressure (PDP)',
      tag: 'R_DISCH_PRESS',
      unit: 'psi',
      color: '#00e5ff',
      icon: Activity,
      norm: '1500 - 3000'
    },
    {
      title: 'Motor Winding Temp',
      tag: 'R_MOTOR_TEMP',
      unit: '°C',
      color: '#f59e0b',
      icon: Thermometer,
      norm: '60 - 100'
    },
    {
      title: 'Vibration RMS (X)',
      tag: 'R_VIBRATION_X',
      unit: 'g',
      color: '#ef4444',
      icon: Radio,
      norm: '0.05 - 0.30'
    },
    {
      title: 'Drive Current',
      tag: 'R_DRV_CURR_AVG',
      unit: 'A',
      color: '#f97316',
      icon: Zap,
      norm: '30 - 90'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Hero SCADA KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {heroMetrics.map((m) => {
          const Icon = m.icon;
          const val = liveTelemetry[m.tag];
          const valStr = val !== undefined && val !== null ? Number(val).toFixed(m.tag === 'R_VIBRATION_X' ? 3 : 1) : '--';
          return (
            <div key={m.tag} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {m.title}
                </span>
                <Icon size={16} color={m.color} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.25rem 0' }}>
                <span className="metric-value" style={{ fontSize: '1.8rem', color: m.color }}>
                  {valStr}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {m.unit}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Target: {m.norm} {m.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time 13 Tag Telemetry Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Activity size={14} color="var(--accent-cyan)" /> Real-Time Telemetry Data Point Matrix
          </span>
          <span className="badge badge-neutral">
            Asset: {selectedAsset}
          </span>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(10, 13, 20, 0.6)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem 1rem' }}>Tag</th>
                <th style={{ padding: '0.65rem 1rem' }}>Parameter Description</th>
                <th style={{ padding: '0.65rem 1rem' }}>Domain</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Live Reading</th>
                <th style={{ padding: '0.65rem 1rem' }}>Unit</th>
                <th style={{ padding: '0.65rem 1rem' }}>Normal Range</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Condition</th>
              </tr>
            </thead>
            <tbody>
              {PARAM_CONFIGS.map((p) => {
                const val = liveTelemetry[p.tag];
                const hasVal = val !== undefined && val !== null;
                const numVal = Number(val);
                const isOutOfRange = hasVal && (numVal < p.normalMin || numVal > p.normalMax);

                return (
                  <tr key={p.tag} style={{ borderBottom: '1px solid rgba(45, 60, 90, 0.25)' }}>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: '600', color: p.color }}>
                      {p.tag}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-primary)' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isOutOfRange ? 'var(--status-fault-text)' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {hasVal ? numVal.toFixed(p.decimals) : '--'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {p.unit}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {p.normalMin} – {p.normalMax} {p.unit}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span className={`badge ${isOutOfRange ? 'badge-fault' : (hasVal ? 'badge-healthy' : 'badge-neutral')}`} style={{ fontSize: '0.68rem' }}>
                        {isOutOfRange ? 'OUT OF SPEC' : (hasVal ? 'NOMINAL' : 'WAITING')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
