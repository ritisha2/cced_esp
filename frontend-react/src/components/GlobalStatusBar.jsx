import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Wifi, Database, Clock, Zap, Shield } from 'lucide-react';

export const GlobalStatusBar = () => {
  const { isConnected, mqttStatus, mqttConfig, ingestionState, lastPacketTime } = useTelemetry();

  const lastTimeStr = lastPacketTime 
    ? lastPacketTime.toTimeString().split(' ')[0]
    : 'Awaiting first packet';

  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      padding: '0.65rem 1.75rem',
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)'
    }}>
      <div style={{
        maxWidth: '1920px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Left: Stream & Broker Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wifi size={13} color={isConnected ? 'var(--state-healthy-text)' : 'var(--state-fault-text)'} />
            <span>MQTT Broker:</span>
            <strong style={{ color: isConnected ? 'var(--state-healthy-text)' : 'var(--state-fault-text)' }}>
              {mqttConfig?.broker_host ? `${mqttConfig.broker_host}:${mqttConfig.broker_port || 1883}` : 'Not Configured'} ({mqttStatus})
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={13} color="var(--accent-cyan)" />
            <span>Ingestion:</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {ingestionState.isRunning ? 'RUNNING' : 'PAUSED'} ({ingestionState.ingestionRate.toFixed(1)} rec/s)
            </strong>
          </div>
        </div>

        {/* Right: Storage & Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={13} color="var(--accent-purple)" />
            <span>Historian:</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {ingestionState.totalRecords.toLocaleString()} Records
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={13} color="var(--text-muted)" />
            <span>Last Telemetry Sync:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>
              {lastTimeStr}
            </strong>
          </div>
        </div>
      </div>
    </footer>
  );
};
