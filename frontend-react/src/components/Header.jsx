import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Activity, Wifi, WifiOff, Clock, Layers, ChevronDown, Database, Sun, Moon, Zap, ShieldCheck } from 'lucide-react';

export const Header = ({ onOpenSqliteModal }) => {
  const { assetsList, selectedAsset, setSelectedAsset, isConnected, mqttStatus, systemStatus } = useTelemetry();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const isIngestionRunning = systemStatus?.collector?.is_running ?? true;

  const navLinks = [
    { label: 'Summary', href: '#section-summary' },
    { label: 'Controls', href: '#section-controls' },
    { label: 'Live Telemetry', href: '#section-telemetry' },
    { label: 'Diagnosis', href: '#section-diagnosis' },
    { label: 'Wellbore View', href: '#section-schematic' },
    { label: 'Envelope', href: '#section-envelope' },
    { label: 'Trends', href: '#section-trends' },
    { label: '13-Graphs', href: '#section-graphs' },
    { label: 'Pump Curve', href: '#section-pump-curve' },
    { label: 'Fleet Grid', href: '#section-fleet' },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-card-header)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.65rem 1.75rem',
      boxShadow: 'var(--shadow-card)'
    }}>
      <div style={{
        maxWidth: '1920px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Brand & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(0,229,255,0.4)'
          }}>
            <Activity size={20} color="#080b11" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                ESP OPERATIONS CENTER
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                SCADA • APM v2.0
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Real-Time Electric Submersible Pump Surveillance & Dual-Tier Diagnostics
            </p>
          </div>
        </div>

        {/* Navigation Anchors */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--accent-cyan)';
                e.target.style.background = 'rgba(0,229,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--text-secondary)';
                e.target.style.background = 'transparent';
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Controls, Indicators & Modals */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Asset Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.35rem 0.75rem'
          }}>
            <Layers size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Well:</span>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--accent-cyan)',
                  border: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer',
                  paddingRight: '1.1rem',
                  appearance: 'none'
                }}
              >
                {assetsList.map((asset) => {
                  const id = asset.asset_id || asset.id || asset;
                  const name = asset.well_id || asset.name || id;
                  return (
                    <option key={id} value={id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {id} {name !== id ? `(${name})` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={12} color="var(--accent-cyan)" style={{ position: 'absolute', right: 0, top: '4px', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* SQLite Modal Trigger */}
          <button
            onClick={onOpenSqliteModal}
            className="scada-btn"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
            title="Open SQLite Dual DB Explorer"
          >
            <Database size={13} color="var(--accent-cyan)" /> DB Modal
          </button>

          {/* Real-time Indicators at Top Right */}
          {/* Indicator 1: MQTT Broker */}
          <span className={`badge ${isConnected ? 'badge-healthy' : 'badge-fault'}`} style={{ fontSize: '0.7rem' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isConnected ? 'var(--state-healthy-border)' : 'var(--state-fault-border)',
              boxShadow: isConnected ? '0 0 6px var(--state-healthy-border)' : 'none'
            }} className={isConnected ? 'live-pulse' : ''} />
            <Wifi size={11} /> {isConnected ? 'MQTT CONNECTED' : 'MQTT DISCONNECTED'}
          </span>

          {/* Indicator 2: Ingestion Pipeline */}
          <span className={`badge ${isConnected && isIngestionRunning ? 'badge-healthy' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
            <Zap size={11} /> {isConnected && isIngestionRunning ? 'DATA INGESTION ACTIVE' : 'DATA INGESTION IDLE'}
          </span>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="scada-btn"
            style={{ padding: '0.35rem 0.55rem' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#3b82f6" />}
          </button>

          {/* Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}>
            <Clock size={13} color="var(--text-muted)" />
            {currentTime.toTimeString().split(' ')[0]}
          </div>
        </div>
      </div>
    </header>
  );
};
