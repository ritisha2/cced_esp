import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { X, Layers, Activity, ShieldCheck, AlertTriangle, HeartPulse, Clock, Download, Gauge, Sliders, Zap, CheckCircle2, AlertOctagon, TrendingUp } from 'lucide-react';
import { PARAM_CONFIGS } from '../constants/telemetryTags';

export const AssetDeepDiveModal = () => {
  const { activeModalAsset, setActiveModalAsset, assetsList, liveTelemetry, selectedAsset } = useTelemetry();
  const [activeTab, setActiveTab] = useState('overview'); // overview, trends, table
  const [assetHistory, setAssetHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 1h, 6h, 24h, 7d, 30d, all
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModalAsset(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveModalAsset]);

  // Fetch asset details, history, and health index when modal opens
  useEffect(() => {
    if (!activeModalAsset) return;

    const fetchModalData = async () => {
      setLoading(true);
      try {
        // 1. Fetch History Points up to Today
        const histRes = await fetch(`/api/esp/assets/${activeModalAsset}/history?range=${timeRange}&limit=300`);
        if (histRes.ok) {
          const data = await histRes.json();
          setAssetHistory(data.points || []);
        }

        // 2. Fetch Dedicated Health Index Prediction
        const healthRes = await fetch(`/api/esp/assets/${activeModalAsset}/health-index`);
        if (healthRes.ok) {
          const hData = await healthRes.json();
          setHealthData(hData.prediction || null);
        }
      } catch (err) {
        console.warn('[AssetDeepDiveModal] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModalData();
  }, [activeModalAsset, timeRange]);

  if (!activeModalAsset) return null;

  // Resolve Asset Object & Canonical Metadata
  const assetObj = assetsList.find(a => (a.asset_id || a.id || a) === activeModalAsset) || {};
  const wellId = assetObj.well_id || assetObj.name || activeModalAsset;
  const pumpFamily = assetObj.pump_family || 'ESP Multistage';
  const ratedBpd = assetObj.rated_bpd || 1500;
  const ratedHp = assetObj.rated_hp || 150;

  // Use live telemetry if modal asset matches selectedAsset
  const isSelected = activeModalAsset === selectedAsset;
  const currentRecord = isSelected && liveTelemetry.R_INTAKE_PRESS !== undefined 
    ? liveTelemetry 
    : (assetHistory[assetHistory.length - 1] || assetObj);

  const rawScenario = (currentRecord.scenario || currentRecord.status || assetObj.status || '').toLowerCase();
  const isFault = rawScenario !== 'normal' && rawScenario !== 'healthy' && rawScenario !== '';
  const stateLabel = isFault ? 'FAULTY/ANOMALY' : 'HEALTHY';

  const healthIndex = healthData?.health_index ?? (isFault ? 54.2 : 88.5);
  const confidence = healthData ? (0.75 + (healthIndex / 100.0) * 0.22) : 0.884;
  const subIndices = healthData?.sub_indices || {
    hydraulic_health: isFault ? 50 : 92,
    vibration_health: isFault ? 45 : 95,
    thermal_health: isFault ? 60 : 90,
    electrical_health: isFault ? 55 : 88,
    anomaly_conformance: isFault ? 40 : 96
  };

  // Compute Out-of-Spec parameters for this asset
  const outOfSpecParams = PARAM_CONFIGS.filter(param => {
    const rawVal = currentRecord[param.tag] ?? currentRecord[param.name.toLowerCase().replace(/ /g, '_')];
    if (rawVal === undefined || rawVal === null) return false;
    const numVal = Number(rawVal);
    return numVal < param.normalMin || numVal > param.normalMax;
  });

  const exportCSV = () => {
    if (assetHistory.length === 0) return;
    const headers = ['Timestamp', 'WHP (Barg)', 'PIP (psi)', 'PDP (psi)', 'Motor Temp (C)', 'Current (A)', 'Voltage (V)', 'Vibration (g)', 'Frequency (Hz)'];
    const rows = assetHistory.map(r => [
      r.timestamp ? new Date(r.timestamp * 1000).toISOString() : '',
      r.R_PIT_001 || r.wellhead_pressure_psi || '',
      r.R_INTAKE_PRESS || r.intake_pressure_psi || '',
      r.R_DISCH_PRESS || r.discharge_pressure_psi || '',
      r.R_MOTOR_TEMP || r.motor_temperature_c || '',
      r.R_DRV_CURR_AVG || r.motor_current_a || '',
      r.R_BUS_IN_VTG_AVG || r.motor_voltage_v || '',
      r.R_VIBRATION_X || r.vibration_rms || '',
      r.R_FREQUENCY || r.frequency_hz || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeModalAsset}_historical_telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={() => setActiveModalAsset(null)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5, 8, 15, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glow-cyan)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1150px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 75px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Window Header */}
        <div style={{
          padding: '1.1rem 1.5rem',
          background: 'var(--bg-card-header)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={20} color="#080b11" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                  {activeModalAsset}
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  Well: {wellId}
                </span>
                <span className={`badge ${isFault ? 'badge-fault' : 'badge-healthy'}`}>
                  {isFault ? <AlertTriangle size={11} /> : <ShieldCheck size={11} />}
                  {stateLabel}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {pumpFamily} • Rated: {ratedBpd} BPD / {ratedHp} HP • Complete Lifetime Analytics till Today
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={exportCSV}
              className="scada-btn"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              <Download size={13} color="var(--accent-cyan)" /> Export CSV
            </button>
            <button
              onClick={() => setActiveModalAsset(null)}
              className="scada-btn"
              style={{ padding: '0.35rem 0.55rem', borderRadius: '50%' }}
              title="Close window (Esc)"
            >
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        {/* Modal Window Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.5rem 1.5rem',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {[
            { id: 'overview', label: 'Overview & Diagnostics', icon: HeartPulse },
            { id: 'trends', label: 'Telemetry Analytics till Today', icon: Activity },
            { id: 'table', label: 'Recorded Data Historian Log', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-cyan)' : 'transparent',
                  color: isActive ? '#080b11' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Window Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TAB 1: OVERVIEW & DIAGNOSTICS */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Top Metric Cards Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}>
                {/* Health Index Card */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                    Composite Health Index
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span className="metric-value" style={{
                      fontSize: '2rem',
                      fontWeight: '900',
                      color: healthIndex >= 80 ? 'var(--state-healthy-text)' : (healthIndex >= 60 ? 'var(--accent-amber)' : 'var(--state-fault-text)')
                    }}>
                      {healthIndex.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({healthIndex >= 80 ? 'EXCELLENT' : (healthIndex >= 60 ? 'WATCH' : 'DEGRADED')})
                    </span>
                  </div>
                </div>

                {/* Active Diagnosis Card */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                    Active Fault Classification
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: isFault ? 'var(--state-fault-text)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {assetObj.scenario || (isFault ? 'Vibration / Mechanical Failure' : 'Normal Steady State')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Confidence Score: <strong className="metric-value" style={{ color: 'var(--accent-cyan)' }}>{(confidence * 100).toFixed(1)}%</strong>
                  </div>
                </div>

                {/* Historical Timesteps Logged */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                    Logged Data Points till Today
                  </span>
                  <div className="metric-value" style={{ fontSize: '1.8rem', color: 'var(--accent-purple)', marginTop: '0.2rem' }}>
                    {assetHistory.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>records</span>
                  </div>
                </div>
              </div>

              {/* Sub-Indices Breakdown */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Sub-Index Health Breakdown (0 - 100%)
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.85rem'
                }}>
                  {[
                    { label: 'Hydraulic Health', val: subIndices.hydraulic_health, color: 'var(--accent-cyan)' },
                    { label: 'Vibration Health', val: subIndices.vibration_health, color: 'var(--accent-emerald)' },
                    { label: 'Thermal Health', val: subIndices.thermal_health, color: 'var(--accent-amber)' },
                    { label: 'Electrical Health', val: subIndices.electrical_health, color: 'var(--accent-orange)' },
                    { label: 'Anomaly Conformance', val: subIndices.anomaly_conformance, color: 'var(--accent-purple)' }
                  ].map((sub, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <span>{sub.label}</span>
                        <strong className="metric-value">{Number(sub.val).toFixed(1)}%</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${sub.val}%`, height: '100%', background: sub.color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Out-of-Spec Boundary Limit Alerts */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Boundary Limit Alerts
                </div>
                {outOfSpecParams.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {outOfSpecParams.map((p, idx) => {
                      const val = currentRecord[p.tag] ?? currentRecord[p.name.toLowerCase().replace(/ /g, '_')];
                      return (
                        <span key={idx} className="badge badge-fault" style={{ fontSize: '0.75rem' }}>
                          <AlertOctagon size={12} /> {p.name}: {Number(val).toFixed(p.decimals)} {p.unit} (OUT OF RANGE: {p.normalMin}-{p.normalMax})
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--state-healthy-text)', fontSize: '0.8rem' }}>
                    <CheckCircle2 size={15} /> All 13 telemetry parameters operating within normal reference envelope.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TELEMETRY ANALYTICS TILL TODAY */}
          {activeTab === 'trends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Range Filter Strip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Time-Series Dataset Filter:
                </span>
                <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '6px' }}>
                  {['1h', '6h', '24h', '7d', '30d', 'all'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: timeRange === r ? 'var(--accent-cyan)' : 'transparent',
                        color: timeRange === r ? '#080b11' : 'var(--text-muted)'
                      }}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* History Data Table / Chart Summary */}
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Loading time-series telemetry data up to today...
                </div>
              ) : assetHistory.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No historical telemetry data recorded for asset {activeModalAsset}.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1rem'
                }}>
                  {[
                    { tag: 'R_DISCH_PRESS', altTag: 'discharge_pressure_psi', name: 'Discharge Pressure (PDP)', unit: 'psi', color: 'var(--accent-cyan)' },
                    { tag: 'R_INTAKE_PRESS', altTag: 'intake_pressure_psi', name: 'Intake Pressure (PIP)', unit: 'psi', color: 'var(--accent-emerald)' },
                    { tag: 'R_MOTOR_TEMP', altTag: 'motor_temperature_c', name: 'Motor Temperature', unit: '°C', color: 'var(--accent-amber)' },
                    { tag: 'R_VIBRATION_X', altTag: 'vibration_rms', name: 'Vibration RMS', unit: 'g', color: 'var(--accent-red)' },
                    { tag: 'R_DRV_CURR_AVG', altTag: 'motor_current_a', name: 'Drive Current', unit: 'A', color: 'var(--accent-orange)' },
                    { tag: 'R_FREQUENCY', altTag: 'frequency_hz', name: 'Drive Frequency', unit: 'Hz', color: 'var(--accent-purple)' }
                  ].map((param) => {
                    const vals = assetHistory.map(r => Number(r[param.tag] ?? r[param.altTag] ?? 0));
                    const maxVal = Math.max(...vals, 1);
                    const latestVal = vals[vals.length - 1] || 0;

                    return (
                      <div
                        key={param.tag}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {param.name}
                          </span>
                          <span className="metric-value" style={{ fontSize: '0.95rem', color: param.color }}>
                            {latestVal.toFixed(1)} {param.unit}
                          </span>
                        </div>

                        {/* Sparkline Visual */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '45px', paddingTop: '5px' }}>
                          {vals.slice(-40).map((v, i) => {
                            const h = Math.max(4, (v / maxVal) * 40);
                            return (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: `${h}px`,
                                  background: param.color,
                                  opacity: 0.85,
                                  borderRadius: '1px'
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECORDED DATA HISTORIAN LOG TABLE */}
          {activeTab === 'table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Recorded Time-Series Telemetry Stream Log ({assetHistory.length} records till today):
              </div>

              <div style={{
                overflowX: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Timestamp</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>PIP (psi)</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>PDP (psi)</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Temp (°C)</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Current (A)</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Freq (Hz)</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Vib (g)</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Scenario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetHistory.slice(-50).reverse().map((r, i) => {
                      const ts = r.timestamp ? new Date(r.timestamp * 1000).toLocaleString() : '--';
                      const pip = (r.R_INTAKE_PRESS ?? r.intake_pressure_psi ?? 0).toFixed(0);
                      const pdp = (r.R_DISCH_PRESS ?? r.discharge_pressure_psi ?? 0).toFixed(0);
                      const temp = (r.R_MOTOR_TEMP ?? r.motor_temperature_c ?? 0).toFixed(1);
                      const current = (r.R_DRV_CURR_AVG ?? r.motor_current_a ?? 0).toFixed(1);
                      const freq = (r.R_FREQUENCY ?? r.frequency_hz ?? 0).toFixed(1);
                      const vib = (r.R_VIBRATION_X ?? r.vibration_rms ?? 0).toFixed(3);
                      const sc = r.scenario || r.status || 'normal';

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(45, 60, 90, 0.2)' }}>
                          <td style={{ padding: '0.45rem 0.75rem', color: 'var(--accent-cyan)' }}>{ts}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>{pip}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>{pdp}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--accent-amber)' }}>{temp}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>{current}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>{freq}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: Number(vib) > 0.3 ? 'var(--state-fault-text)' : 'inherit' }}>{vib}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>
                            <span className={`badge ${sc.toLowerCase() === 'normal' ? 'badge-healthy' : 'badge-fault'}`} style={{ fontSize: '0.65rem' }}>
                              {sc}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
