import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Play, Pause, RotateCcw, Film, Database, RefreshCw } from 'lucide-react';

export const ReplaySection = () => {
  const { historyData, setHistoryData, selectedAsset, setLiveTelemetry } = useTelemetry();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState('ALL');
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    if (historyData.length > 0) {
      setCurrentIndex(0);
    }
  }, [historyData]);

  // Robust Timestamp Formatter (Fixes "Invalid Date")
  const formatTimestamp = (ts) => {
    if (!ts) return 'No active frame';
    if (typeof ts === 'number') {
      const ms = ts < 1e11 ? ts * 1000 : ts;
      return new Date(ms).toLocaleString();
    }
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  };

  // Load genuine SQLite DB Historian Records
  const loadDbHistorian = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch(`/api/esp/assets/${selectedAsset}/history?range=all&limit=500`);
      if (res.ok) {
        const data = await res.json();
        const points = data.points || [];
        if (points.length > 0) {
          const mapped = points.map(r => ({
            timestamp: r.timestamp,
            R_PIT_001: r.wellhead_pressure_psi ? r.wellhead_pressure_psi * 0.0689476 : (r.R_PIT_001 || 0),
            R_PIT_002: r.casing_pressure_psi ? r.casing_pressure_psi * 0.0689476 : (r.R_PIT_002 || 0),
            R_PIT_003: r.flowline_pressure_psi ? r.flowline_pressure_psi * 0.0689476 : (r.R_PIT_003 || 0),
            R_INTAKE_PRESS: r.intake_pressure_psi !== undefined ? r.intake_pressure_psi : (r.R_INTAKE_PRESS || 0),
            R_DISCH_PRESS: r.discharge_pressure_psi !== undefined ? r.discharge_pressure_psi : (r.R_DISCH_PRESS || 0),
            R_INTAKE_TEMP: r.intake_temperature_c !== undefined ? r.intake_temperature_c : (r.R_INTAKE_TEMP || 0),
            R_MOTOR_TEMP: r.motor_temperature_c !== undefined ? r.motor_temperature_c : (r.R_MOTOR_TEMP || 0),
            R_FREQUENCY: r.frequency_hz !== undefined ? r.frequency_hz : (r.R_FREQUENCY || 0),
            R_VIBRATION_X: r.vibration_rms !== undefined ? r.vibration_rms : (r.R_VIBRATION_X || 0),
            R_DRV_CURR_AVG: r.motor_current_a !== undefined ? r.motor_current_a : (r.R_DRV_CURR_AVG || 0),
            R_DHG_CURR_AVG: r.motor_current_a !== undefined ? r.motor_current_a : (r.R_DHG_CURR_AVG || 0),
            R_BUS_IN_VTG_AVG: r.motor_voltage_v !== undefined ? r.motor_voltage_v : (r.R_BUS_IN_VTG_AVG || 0),
            R_TOOL_CURRENT: r.R_TOOL_CURRENT !== undefined ? r.R_TOOL_CURRENT : 4.5,
            scenario: r.scenario || r.fault_classification || 'normal'
          }));
          setHistoryData(mapped);
          setCurrentIndex(0);
        }
      }
    } catch (err) {
      console.warn('[ReplaySection] Error loading DB historian:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  // Live Real-Time UI Mimic Driver Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying && historyData.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIdx = prev >= historyData.length - 1 ? 0 : prev + 1;
          const nextFrame = historyData[nextIdx];
          
          // Drive live telemetry context so all SCADA components mimic the historical frame in real time
          if (nextFrame) {
            setLiveTelemetry(prevLive => ({
              ...prevLive,
              ...nextFrame
            }));
          }

          if (nextIdx === historyData.length - 1) {
            setIsPlaying(false);
          }
          return nextIdx;
        });
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, historyData, setLiveTelemetry]);

  const currentRecord = historyData[currentIndex] || {};
  const currentTs = formatTimestamp(currentRecord.timestamp);

  // Sync manual scrubber drag to live telemetry mimic
  const handleScrubberChange = (e) => {
    setIsPlaying(false);
    const newIdx = Number(e.target.value);
    setCurrentIndex(newIdx);
    const frame = historyData[newIdx];
    if (frame) {
      setLiveTelemetry(prev => ({
        ...prev,
        ...frame
      }));
    }
  };

  return (
    <section id="section-replay">
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Film size={16} color="var(--accent-purple)" /> Historical Event & Failure Scenario Replay Engine
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={loadDbHistorian}
              disabled={loadingDb}
              className="scada-btn"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
              title="Load genuine historical telemetry stored in SQLite DB"
            >
              {loadingDb ? <RefreshCw size={12} className="live-pulse" /> : <Database size={12} color="var(--accent-purple)" />}
              {loadingDb ? 'Loading DB...' : 'Load DB Historian'}
            </button>
            <span className="badge badge-neutral">
              {historyData.length} Timesteps In Memory
            </span>
          </div>
        </div>

        <div className="scada-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Control Strip */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'var(--bg-secondary)',
            padding: '0.75rem 1rem',
            borderRadius: '6px'
          }}>
            {/* Scenario Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sequence:</span>
              <select
                className="scada-input"
                style={{ fontSize: '0.75rem' }}
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                <option value="ALL">Active Asset Sequence ({selectedAsset})</option>
                <option value="NORMAL">Normal Steady State Baseline</option>
                <option value="BEARING">Bearing Degradation Sequence</option>
                <option value="OVERLOAD">Motor Overload Trip Event</option>
                <option value="PUMP_OFF">Dry-Well Pump Off Incident</option>
                <option value="UNDERVOLT">Undervoltage Transient</option>
              </select>
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="scada-btn scada-btn-primary"
                style={{ padding: '0.35rem 0.85rem' }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Pause Replay' : 'Play Sequence'}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(0);
                  if (historyData[0]) setLiveTelemetry(prev => ({ ...prev, ...historyData[0] }));
                }}
                className="scada-btn"
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <RotateCcw size={13} /> Reset
              </button>

              {/* Speed Multipliers */}
              <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg-primary)', padding: '0.2rem', borderRadius: '4px' }}>
                {[1, 2, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    style={{
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '600',
                      color: speed === s ? '#fff' : 'var(--text-muted)',
                      background: speed === s ? 'var(--accent-purple)' : 'transparent',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <input
              type="range"
              min="0"
              max={Math.max(0, historyData.length - 1)}
              value={currentIndex}
              onChange={handleScrubberChange}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>Frame: {currentIndex + 1} / {historyData.length}</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{currentTs}</span>
            </div>
          </div>

          {/* Snapshot Telemetry Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
              Replay Frame Telemetry Snapshot (Asset: {selectedAsset})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.65rem'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WHP:</span>{' '}
                <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                  {Number(currentRecord.R_PIT_001 || 0).toFixed(1)} Barg
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Intake P:</span>{' '}
                <span className="metric-value" style={{ color: 'var(--accent-emerald)' }}>
                  {Number(currentRecord.R_INTAKE_PRESS || 0).toFixed(1)} psi
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Discharge P:</span>{' '}
                <span className="metric-value" style={{ color: 'var(--accent-teal)' }}>
                  {Number(currentRecord.R_DISCH_PRESS || 0).toFixed(1)} psi
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Motor Temp:</span>{' '}
                <span className="metric-value" style={{ color: 'var(--accent-amber)' }}>
                  {Number(currentRecord.R_MOTOR_TEMP || 0).toFixed(1)} °C
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vibration:</span>{' '}
                <span className="metric-value" style={{ color: Number(currentRecord.R_VIBRATION_X || 0) > 0.30 ? 'var(--state-fault-text)' : 'var(--text-primary)' }}>
                  {Number(currentRecord.R_VIBRATION_X || 0).toFixed(3)} g
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drive Current:</span>{' '}
                <span className="metric-value" style={{ color: 'var(--accent-orange)' }}>
                  {Number(currentRecord.R_DRV_CURR_AVG || 0).toFixed(1)} A
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
