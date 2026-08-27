import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Layers, Gauge, Thermometer, Zap, Activity } from 'lucide-react';

export const WellSchematicView = () => {
  const { liveTelemetry, selectedAsset, assetDetails } = useTelemetry();

  // Dynamically resolve values from live telemetry or backend visualization payload
  const surface = assetDetails?.schematic?.surface || {};
  const pump = assetDetails?.schematic?.pump || {};
  const wellbore = assetDetails?.schematic?.wellbore || {};
  const motor = assetDetails?.schematic?.motor || {};

  const p_wh = liveTelemetry.R_PIT_001 !== undefined ? Number(liveTelemetry.R_PIT_001).toFixed(1) : (surface.wellhead_pressure_psi ? (surface.wellhead_pressure_psi * 0.0689476).toFixed(1) : '--');
  const p_fl = liveTelemetry.R_PIT_003 !== undefined ? Number(liveTelemetry.R_PIT_003).toFixed(1) : (surface.flowline_pressure_psi ? (surface.flowline_pressure_psi * 0.0689476).toFixed(1) : '--');
  const p_cas = liveTelemetry.R_PIT_002 !== undefined ? Number(liveTelemetry.R_PIT_002).toFixed(1) : (wellbore.casing_pressure_psi ? (wellbore.casing_pressure_psi * 0.0689476).toFixed(1) : '--');
  
  const p_pdp = liveTelemetry.R_DISCH_PRESS !== undefined ? Number(liveTelemetry.R_DISCH_PRESS).toFixed(1) : (pump.discharge_pressure_psi ? Number(pump.discharge_pressure_psi).toFixed(1) : '--');
  const p_pip = liveTelemetry.R_INTAKE_PRESS !== undefined ? Number(liveTelemetry.R_INTAKE_PRESS).toFixed(1) : (pump.intake_pressure_psi ? Number(pump.intake_pressure_psi).toFixed(1) : '--');
  const t_pip = liveTelemetry.R_INTAKE_TEMP !== undefined ? Number(liveTelemetry.R_INTAKE_TEMP).toFixed(1) : (surface.wellhead_temperature_c ? Number(surface.wellhead_temperature_c).toFixed(1) : '--');
  
  const t_mot = liveTelemetry.R_MOTOR_TEMP !== undefined ? Number(liveTelemetry.R_MOTOR_TEMP).toFixed(1) : (motor.winding_temperature_c ? Number(motor.winding_temperature_c).toFixed(1) : '--');
  const vib_x = liveTelemetry.R_VIBRATION_X !== undefined ? Number(liveTelemetry.R_VIBRATION_X).toFixed(3) : (motor.vibration_rms ? Number(motor.vibration_rms).toFixed(3) : '--');
  const i_drv = liveTelemetry.R_DRV_CURR_AVG !== undefined ? Number(liveTelemetry.R_DRV_CURR_AVG).toFixed(1) : (motor.motor_current_a ? Number(motor.motor_current_a).toFixed(1) : '--');
  const v_bus = liveTelemetry.R_BUS_IN_VTG_AVG !== undefined ? Number(liveTelemetry.R_BUS_IN_VTG_AVG).toFixed(1) : (motor.motor_voltage_v ? Number(motor.motor_voltage_v).toFixed(1) : '--');
  const freq = liveTelemetry.R_FREQUENCY !== undefined ? Number(liveTelemetry.R_FREQUENCY).toFixed(1) : (surface.frequency_hz ? Number(surface.frequency_hz).toFixed(1) : '--');

  const vibAlarm = vib_x !== '--' && Number(vib_x) > 0.30;
  const tempAlarm = t_mot !== '--' && Number(t_mot) > 100.0;

  const pumpModel = pump.pump_model || assetDetails?.pump_specs?.pump_model || 'ESP Multistage';
  const pumpStages = pump.stages || assetDetails?.pump_specs?.stages || '--';
  const depthM = wellbore.setting_depth_m || assetDetails?.pump_depth_m || '--';

  const diffHead = (p_pdp !== '--' && p_pip !== '--') ? (Number(p_pdp) - Number(p_pip)).toFixed(0) : '--';

  return (
    <section id="section-schematic">
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Layers size={16} color="var(--accent-purple)" /> ESP Downhole Wellbore & Equipment Digital Twin
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-purple">
              Well: {selectedAsset}
            </span>
            <span className="badge badge-neutral">
              Model: {pumpModel} {pumpStages !== '--' ? `(${pumpStages} stg)` : ''}
            </span>
            {depthM !== '--' && (
              <span className="badge badge-neutral">
                Depth: {depthM} m
              </span>
            )}
          </div>
        </div>

        <div className="scada-card-body" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 460px) 1fr',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          {/* Technical Vertical SVG Schematic */}
          <div style={{
            background: 'rgba(8, 12, 20, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <svg width="320" height="460" viewBox="0 0 320 460" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="casingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="tubingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={tempAlarm ? '#b91c1c' : '#d97706'} />
                  <stop offset="50%" stopColor={tempAlarm ? '#ef4444' : '#f59e0b'} />
                  <stop offset="100%" stopColor={tempAlarm ? '#b91c1c' : '#d97706'} />
                </linearGradient>
              </defs>

              {/* Surface Wellhead */}
              <rect x="130" y="20" width="60" height="24" rx="3" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="160" y="36" fill="#f8fafc" fontSize="10" fontWeight="700" textAnchor="middle">WELLHEAD</text>
              <line x1="80" y1="32" x2="130" y2="32" stroke="#00e5ff" strokeWidth="3" />
              <circle cx="80" cy="32" r="4" fill="#00e5ff" />
              <text x="65" y="26" fill="#00e5ff" fontSize="9" fontWeight="700" textAnchor="end">Flowline</text>

              {/* Outer Casing String */}
              <rect x="110" y="44" width="100" height="380" fill="url(#casingGrad)" opacity="0.35" stroke="#475569" strokeWidth="1" strokeDasharray="4 2" />

              {/* Production Tubing */}
              <rect x="145" y="44" width="30" height="120" fill="url(#tubingGrad)" stroke="#0284c7" strokeWidth="1.5" />

              {/* Power Cable */}
              <path d="M 140 44 L 140 320" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 3" />

              {/* Discharge Head */}
              <rect x="135" y="164" width="50" height="22" rx="2" fill="#0f766e" stroke="#14b8a6" strokeWidth="1.5" />
              <text x="160" y="178" fill="#f0fdfa" fontSize="9" fontWeight="700" textAnchor="middle">DISCHARGE</text>

              {/* Multi-Stage Pump */}
              <rect x="138" y="186" width="44" height="70" rx="3" fill="url(#pumpGrad)" stroke="#14b8a6" strokeWidth="1.5" />
              <text x="160" y="225" fill="#042f2e" fontSize="10" fontWeight="800" textAnchor="middle">PUMP</text>

              {/* Intake / Gas Handler */}
              <rect x="140" y="256" width="40" height="30" rx="2" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="160" y="274" fill="#f0f9ff" fontSize="9" fontWeight="700" textAnchor="middle">INTAKE</text>
              <polygon points="125,271 135,268 135,274" fill="#38bdf8" />
              <polygon points="195,271 185,268 185,274" fill="#38bdf8" />

              {/* Seal / Protector */}
              <rect x="142" y="286" width="36" height="25" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />
              <text x="160" y="302" fill="#f8fafc" fontSize="8" fontWeight="600" textAnchor="middle">PROTECTOR</text>

              {/* Submersible Motor */}
              <rect x="138" y="311" width="44" height="75" rx="3" fill="url(#motorGrad)" stroke={tempAlarm ? '#ef4444' : '#f59e0b'} strokeWidth="1.5" />
              <text x="160" y="352" fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">MOTOR</text>

              {/* Downhole Sensor Gauge */}
              <rect x="144" y="386" width="32" height="20" rx="2" fill="#4c1d95" stroke="#a855f7" strokeWidth="1.5" />
              <text x="160" y="399" fill="#f5f3ff" fontSize="8" fontWeight="700" textAnchor="middle">GAUGE</text>

              {/* Perforations */}
              <line x1="90" y1="410" x2="110" y2="410" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
              <line x1="90" y1="420" x2="110" y2="420" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
              <line x1="210" y1="410" x2="230" y2="410" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
              <line x1="210" y1="420" x2="230" y2="420" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />

              {/* Callout Lines */}
              <line x1="190" y1="32" x2="245" y2="32" stroke="#00e5ff" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="245" cy="32" r="3" fill="#00e5ff" />

              <line x1="188" y1="175" x2="245" y2="175" stroke="#14b8a6" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="245" cy="175" r="3" fill="#14b8a6" />

              <line x1="180" y1="271" x2="245" y2="271" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="245" cy="271" r="3" fill="#10b981" />

              <line x1="182" y1="348" x2="245" y2="348" stroke={vibAlarm ? '#ef4444' : '#f59e0b'} strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="245" cy="348" r="3" fill={vibAlarm ? '#ef4444' : '#f59e0b'} />
            </svg>
          </div>

          {/* Node Callouts Bound Strictly to Live Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Surface Node */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                  1. SURFACE WELLHEAD & FLOWLINE
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  WHP: <strong className="metric-value" style={{ color: '#00e5ff' }}>{p_wh}</strong> Barg | FLP: <strong className="metric-value">{p_fl}</strong> Barg | Casing: <strong className="metric-value">{p_cas}</strong> Barg
                </div>
              </div>
              <span className="badge badge-neutral">SURFACE</span>
            </div>

            {/* Discharge Node */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-teal)' }}>
                  2. PUMP DISCHARGE HEAD (PDP)
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Pressure: <strong className="metric-value" style={{ color: '#14b8a6' }}>{p_pdp}</strong> psi | Differential Head: <strong className="metric-value">{diffHead}</strong> psi
                </div>
              </div>
              <span className="badge badge-healthy">PUMP HEAD</span>
            </div>

            {/* Intake Node */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                  3. INTAKE & GAS SEPARATOR (PIP)
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Intake Pressure: <strong className="metric-value" style={{ color: '#10b981' }}>{p_pip}</strong> psi | Fluid Temp: <strong className="metric-value">{t_pip}</strong> °C
                </div>
              </div>
              <span className="badge badge-healthy">HYDRAULIC</span>
            </div>

            {/* Motor & Mechanical Node */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${vibAlarm || tempAlarm ? 'var(--state-fault-border)' : 'var(--border-color)'}`,
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: vibAlarm ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                  4. ESP MOTOR & BEARING ASSEMBLY
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Winding Temp: <strong className="metric-value" style={{ color: tempAlarm ? 'var(--state-fault-text)' : 'var(--accent-amber)' }}>{t_mot}</strong> °C | Vib RMS: <strong className="metric-value" style={{ color: vibAlarm ? 'var(--state-fault-text)' : '#fff' }}>{vib_x}</strong> g | Current: <strong className="metric-value">{i_drv}</strong> A | Bus: <strong className="metric-value">{v_bus}</strong> V
                </div>
              </div>
              <span className={`badge ${vibAlarm ? 'badge-fault' : (tempAlarm ? 'badge-warning' : 'badge-healthy')}`}>
                {vibAlarm ? 'HIGH VIB ALARM' : (tempAlarm ? 'HIGH TEMP' : 'NOMINAL')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
