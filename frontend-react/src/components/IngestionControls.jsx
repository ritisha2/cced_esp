import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Sliders, Play, Pause, RefreshCw, Check, Wifi, Filter, LogOut, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const IngestionControls = () => {
  const { mqttConfig, applyMqttConfig, disconnectMqtt, systemStatus, controlIngestion, isConnected, faultRegistry } = useTelemetry();
  
  const [localBroker, setLocalBroker] = useState(mqttConfig.broker_host || '');
  const [localPort, setLocalPort] = useState(mqttConfig.broker_port || 1883);
  const [localUsername, setLocalUsername] = useState(mqttConfig.username || '');
  const [localPassword, setLocalPassword] = useState(mqttConfig.password || '');
  const [localTopics, setLocalTopics] = useState(mqttConfig.topics?.join(', ') || 'esp/#, wells/#, opg/#');
  const [selectedFaultFilter, setSelectedFaultFilter] = useState('ALL');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Synchronize from backend config ONLY when user is NOT actively typing
  useEffect(() => {
    if (!isDirty) {
      setLocalBroker(mqttConfig.broker_host || '');
      if (mqttConfig.broker_port) setLocalPort(mqttConfig.broker_port);
      if (mqttConfig.username !== undefined) setLocalUsername(mqttConfig.username || '');
      if (mqttConfig.password !== undefined) setLocalPassword(mqttConfig.password || '');
      if (mqttConfig.topics && mqttConfig.topics.length > 0) setLocalTopics(mqttConfig.topics.join(', '));
    }
  }, [mqttConfig, isDirty]);

  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    if (!localBroker.trim()) {
      setConnectionNotice({ type: 'error', text: 'Please enter a valid MQTT Broker Host address (e.g. localhost, broker.emqx.io, or your broker IP).' });
      return;
    }

    setIsConnecting(true);
    setConnectionNotice({ type: 'connecting', text: `Attempting connection to MQTT Broker at ${localBroker.trim()}:${localPort}...` });

    const topicsArr = localTopics.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await applyMqttConfig({
        broker_host: localBroker.trim(),
        broker_port: Number(localPort),
        username: localUsername.trim() || null,
        password: localPassword.trim() || null,
        topics: topicsArr
      });
      setIsDirty(false);

      // Allow backend Paho client up to 2.5s to establish socket, then update UI from real status
      setTimeout(() => {
        setIsConnecting(false);
        setConnectionNotice(null); // real state is shown via isConnected badge
      }, 2500);
    } catch (err) {
      setIsConnecting(false);
      setConnectionNotice({ type: 'error', text: `Failed to initiate connection: ${err.message || err}` });
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    await disconnectMqtt();
    setIsDirty(false);
    setIsConnecting(false);
    setConnectionNotice({ type: 'info', text: 'Disconnected from MQTT Broker.' });
    setTimeout(() => setConnectionNotice(null), 3000);
  };

  const handlePlayStream = async () => {
    await controlIngestion('play');
  };

  const handlePauseStream = async () => {
    await controlIngestion('pause');
  };

  const isRunning = systemStatus?.collector?.is_running ?? true;
  const statusText = systemStatus?.collector?.connection_status_text || (isConnected ? 'Connected' : 'Disconnected');
  const lastError = systemStatus?.collector?.last_error;

  return (
    <section id="section-controls">
      <div className="scada-card">
        {/* Header */}
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Sliders size={16} color="var(--accent-cyan)" /> MQTT Live Connection & Ingestion Controls
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${isConnected ? 'badge-healthy' : 'badge-fault'}`}>
              <Wifi size={11} /> {isConnected ? `ONLINE: ${localBroker || 'BROKER'}` : 'BROKER OFFLINE'}
            </span>
            <span className="badge badge-neutral">
              MODE: {systemStatus?.collector?.storage_category_mode || 'BOTH'}
            </span>
          </div>
        </div>

        <div className="scada-card-body">
          {/* Explicit Unambiguous Connection Status Banner */}
          {connectionNotice ? (
            <div style={{
              background: connectionNotice.type === 'error' ? 'var(--state-fault-bg)' : (connectionNotice.type === 'success' ? 'var(--state-healthy-bg)' : 'rgba(59, 130, 246, 0.1)'),
              border: `1px solid ${connectionNotice.type === 'error' ? 'var(--state-fault-border)' : (connectionNotice.type === 'success' ? 'var(--state-healthy-border)' : 'var(--accent-blue)')}`,
              borderRadius: '6px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              fontSize: '0.78rem',
              color: connectionNotice.type === 'error' ? 'var(--state-fault-text)' : (connectionNotice.type === 'success' ? 'var(--state-healthy-text)' : 'var(--text-primary)'),
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {connectionNotice.type === 'connecting' && <Loader2 size={15} className="live-pulse" color="var(--accent-cyan)" />}
              {connectionNotice.type === 'success' && <CheckCircle2 size={15} color="var(--state-healthy-text)" />}
              {connectionNotice.type === 'error' && <AlertCircle size={15} color="var(--state-fault-text)" />}
              <span>{connectionNotice.text}</span>
            </div>
          ) : isConnected ? (
            <div style={{
              background: 'var(--state-healthy-bg)',
              border: '1px solid var(--state-healthy-border)',
              borderRadius: '6px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              fontSize: '0.78rem',
              color: 'var(--state-healthy-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={15} color="var(--state-healthy-text)" />
              <span>
                <strong>MQTT Connected & Active:</strong> Ingesting live telemetry from <strong>{mqttConfig.broker_host}:{mqttConfig.broker_port || 1883}</strong>.
              </span>
            </div>
          ) : lastError ? (
            <div style={{
              background: 'var(--state-fault-bg)',
              border: '1px solid var(--state-fault-border)',
              borderRadius: '6px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              fontSize: '0.78rem',
              color: 'var(--state-fault-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={15} color="var(--state-fault-text)" />
              <span>
                <strong>Broker Connection Error:</strong> {lastError} — Please check host address, port, and credentials below.
              </span>
            </div>
          ) : (
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '6px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Wifi size={14} color="var(--accent-blue)" />
              <span>
                <strong>MQTT Not Configured:</strong> Enter your broker host address below and click <strong>Connect to Broker</strong> to establish live telemetry stream.
              </span>
            </div>
          )}

          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Connection Input Fields */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem'
            }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  MQTT Broker Host
                </label>
                <input
                  type="text"
                  className="scada-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. localhost, broker.emqx.io, or 192.168.1.50"
                  value={localBroker}
                  onChange={(e) => {
                    setIsDirty(true);
                    setLocalBroker(e.target.value);
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Port
                </label>
                <input
                  type="number"
                  className="scada-input"
                  style={{ width: '100%' }}
                  placeholder="1883"
                  value={localPort}
                  onChange={(e) => {
                    setIsDirty(true);
                    setLocalPort(Number(e.target.value));
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Username (Optional)
                </label>
                <input
                  type="text"
                  className="scada-input"
                  style={{ width: '100%' }}
                  placeholder="MQTT Username"
                  value={localUsername}
                  onChange={(e) => {
                    setIsDirty(true);
                    setLocalUsername(e.target.value);
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Password (Optional)
                </label>
                <input
                  type="password"
                  className="scada-input"
                  style={{ width: '100%' }}
                  placeholder="••••••••"
                  value={localPassword}
                  onChange={(e) => {
                    setIsDirty(true);
                    setLocalPassword(e.target.value);
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Subscription Topic Pattern(s)
                </label>
                <input
                  type="text"
                  className="scada-input"
                  style={{ width: '100%' }}
                  placeholder="esp/#, wells/#, opg/#"
                  value={localTopics}
                  onChange={(e) => {
                    setIsDirty(true);
                    setLocalTopics(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Action Bar: Filters & Side-by-Side Play/Pause/Connect/Disconnect Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              {/* Fault Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fault Filter:</span>
                <select
                  className="scada-input"
                  value={selectedFaultFilter}
                  onChange={(e) => setSelectedFaultFilter(e.target.value)}
                >
                  <option value="ALL">All Events / Faults</option>
                  <option value="Normal">Normal Runs Only</option>
                  {faultRegistry.map((f, i) => {
                    const name = typeof f === 'string' ? f : (f.name || f.fault_name || f.code);
                    if (name.toLowerCase() === 'normal') return null;
                    return (
                      <option key={i} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Action Buttons: Play beside Pause AND Disconnect beside Connect */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                {/* Play Stream Button */}
                <button
                  type="button"
                  onClick={handlePlayStream}
                  disabled={isRunning}
                  className="scada-btn scada-btn-primary"
                  style={{ opacity: isRunning ? 0.5 : 1, cursor: isRunning ? 'not-allowed' : 'pointer' }}
                  title="Resume live telemetry stream ingestion"
                >
                  <Play size={14} /> Play Stream
                </button>

                {/* Pause Stream Button */}
                <button
                  type="button"
                  onClick={handlePauseStream}
                  disabled={!isRunning}
                  className="scada-btn scada-btn-warning"
                  style={{ opacity: !isRunning ? 0.5 : 1, cursor: !isRunning ? 'not-allowed' : 'pointer' }}
                  title="Pause live telemetry stream ingestion"
                >
                  <Pause size={14} /> Pause Stream
                </button>

                {/* Connect to Broker Button */}
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="scada-btn scada-btn-primary"
                >
                  {isConnecting ? <Loader2 size={14} className="live-pulse" /> : <Wifi size={14} />}
                  {isConnecting ? 'Connecting...' : (isConnected ? 'Update Connection' : 'Connect to Broker')}
                </button>

                {/* Disconnect Button (Beside Connect) */}
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={!isConnected && !mqttConfig.broker_host}
                  className="scada-btn scada-btn-danger"
                  style={{ opacity: (!isConnected && !mqttConfig.broker_host) ? 0.5 : 1 }}
                  title="Disconnect from current MQTT Broker"
                >
                  <LogOut size={14} /> Disconnect
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
