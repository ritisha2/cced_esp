import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Table, Search, Wifi, WifiOff, Play, Pause, RefreshCw } from 'lucide-react';

export const LiveTelemetryTable = () => {
  const { recentRecords, selectedAsset, isConnected, systemStatus, toggleIngestion, applyMqttConfig, mqttConfig } = useTelemetry();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('ALL');

  const isRunning = systemStatus?.collector?.is_running ?? true;

  const handleToggleConnect = () => {
    // Reconnect or apply current settings
    applyMqttConfig({ ...mqttConfig });
  };

  const filteredRecords = recentRecords.filter((rec) => {
    const well = (rec.well_id || '').toLowerCase();
    const scenario = (rec.scenario || rec.fault_classification || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || well.includes(search) || scenario.includes(search);
    
    if (filterState === 'FAULTY_ONLY') {
      const isFault = scenario !== 'normal' && scenario !== 'unlabelled' && scenario !== '';
      return matchesSearch && isFault;
    }
    if (filterState === 'HEALTHY_ONLY') {
      const isHealthy = scenario === 'normal' || scenario === 'unlabelled' || scenario === '';
      return matchesSearch && isHealthy;
    }
    return matchesSearch;
  });

  return (
    <section id="section-telemetry">
      <div className="scada-card">
        {/* Card Header with Ingestion & Connection Controls */}
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Table size={16} color="var(--accent-cyan)" /> Real-Time Telemetry Data Stream Matrix
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Quick Ingestion Controls at Top of Table */}
            <button
              onClick={toggleIngestion}
              className={`scada-btn ${isRunning ? 'scada-btn-danger' : 'scada-btn-primary'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
            >
              {isRunning ? <><Pause size={12} /> Pause Ingestion</> : <><Play size={12} /> Play Ingestion</>}
            </button>

            <button
              onClick={handleToggleConnect}
              className="scada-btn"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
            >
              {isConnected ? <Wifi size={12} color="var(--state-healthy-text)" /> : <WifiOff size={12} color="var(--state-fault-text)" />}
              {isConnected ? 'Connected' : 'Reconnect Broker'}
            </button>

            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '8px' }} />
              <input
                type="text"
                placeholder="Filter well or fault..."
                className="scada-input"
                style={{ paddingLeft: '1.6rem', width: '160px', fontSize: '0.72rem', padding: '0.25rem 0.5rem 0.25rem 1.6rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* State Filter */}
            <select
              className="scada-input"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
            >
              <option value="ALL">All States</option>
              <option value="HEALTHY_ONLY">HEALTHY Only</option>
              <option value="FAULTY_ONLY">FAULTY/ANOMALY Only</option>
            </select>

            <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
              {filteredRecords.length} / {recentRecords.length}
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="scada-card-body" style={{ padding: 0, overflowX: 'auto', maxHeight: '380px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.6rem 0.8rem' }}>ID</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Time (UTC)</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Category</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Well / Asset</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Diagnosis / Fault</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Flow [BPD]</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Discharge P</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Intake P</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Freq (Hz)</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Current (A)</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Temp (°C)</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Vib (g)</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>State</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row, idx) => {
                  const rawFault = row.scenario || row.fault_classification || 'normal';
                  const isHealthy = rawFault.toLowerCase() === 'normal' || rawFault.toLowerCase() === 'unlabelled';
                  const stateLabel = isHealthy ? 'HEALTHY' : 'FAULTY/ANOMALY';
                  
                  // Robust timestamp parser (handles string, ISO dates, and Unix timestamps)
                  let ts = '--:--:--';
                  if (row.timestamp) {
                    if (typeof row.timestamp === 'number') {
                      const ms = row.timestamp < 1e11 ? row.timestamp * 1000 : row.timestamp;
                      ts = new Date(ms).toTimeString().split(' ')[0];
                    } else {
                      const d = new Date(row.timestamp);
                      ts = !isNaN(d.getTime()) ? d.toTimeString().split(' ')[0] : String(row.timestamp).slice(11, 19);
                    }
                  }

                  const isNewest = idx === 0;

                  const flowVal = row.flow_rate_bpd !== undefined ? Number(row.flow_rate_bpd).toFixed(0) : (row.R_LIQ_RATE !== undefined ? Number(row.R_LIQ_RATE).toFixed(0) : '--');

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(45, 60, 90, 0.25)',
                        background: isNewest 
                          ? 'rgba(0, 229, 255, 0.08)' 
                          : (row.well_id === selectedAsset ? 'rgba(0, 229, 255, 0.03)' : 'transparent'),
                        transition: 'background 0.3s ease'
                      }}
                    >
                      <td style={{ padding: '0.5rem 0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        #{row.id || (idx + 1)}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {ts}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                          {row.category || 'LIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', fontWeight: '700', color: row.well_id === selectedAsset ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {row.well_id || selectedAsset}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', color: isHealthy ? 'var(--text-secondary)' : 'var(--state-fault-text)', fontWeight: isHealthy ? '400' : '600' }}>
                        {rawFault}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                        {flowVal}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {row.R_DISCH_PRESS !== undefined ? Number(row.R_DISCH_PRESS).toFixed(1) : (row.pressure_psi ? Number(row.pressure_psi).toFixed(1) : '--')}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {row.R_INTAKE_PRESS !== undefined ? Number(row.R_INTAKE_PRESS).toFixed(1) : (row.intake_pressure_psi ? Number(row.intake_pressure_psi).toFixed(1) : '--')}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {row.R_FREQUENCY !== undefined ? Number(row.R_FREQUENCY).toFixed(1) : (row.frequency_hz ? Number(row.frequency_hz).toFixed(1) : '50.0')}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>
                        {row.R_DRV_CURR_AVG !== undefined ? Number(row.R_DRV_CURR_AVG).toFixed(1) : (row.motor_current_a ? Number(row.motor_current_a).toFixed(1) : '--')}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                        {row.R_MOTOR_TEMP !== undefined ? Number(row.R_MOTOR_TEMP).toFixed(1) : (row.temperature_c ? Number(row.temperature_c).toFixed(1) : '--')}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: Number(row.R_VIBRATION_X || row.vibration_g || 0) > 0.30 ? 'var(--state-fault-text)' : 'var(--text-secondary)' }}>
                        {row.R_VIBRATION_X !== undefined ? Number(row.R_VIBRATION_X).toFixed(3) : (row.vibration_g ? Number(row.vibration_g).toFixed(3) : '--')}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center' }}>
                        <span className={`badge ${isHealthy ? 'badge-healthy' : 'badge-fault'}`} style={{ fontSize: '0.65rem' }}>
                          {stateLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Waiting for real telemetry packets from backend...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
