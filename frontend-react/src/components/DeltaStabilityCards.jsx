import React, { useRef, useEffect, useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';

export const DeltaStabilityCards = () => {
  const { liveTelemetry, selectedAsset } = useTelemetry();
  const [prevValues, setPrevValues] = useState({});
  const [deltas, setDeltas] = useState({});

  useEffect(() => {
    // Calculate delta against previous live sample
    const newDeltas = {};
    Object.keys(liveTelemetry).forEach((key) => {
      const current = Number(liveTelemetry[key]);
      const prev = Number(prevValues[key]);
      if (!isNaN(current) && !isNaN(prev) && prev !== 0) {
        const diff = current - prev;
        newDeltas[key] = diff;
      }
    });

    setDeltas(newDeltas);
    setPrevValues(liveTelemetry);
  }, [liveTelemetry]);

  // Map 13 parameters with units and tag lookups
  const cards = [
    {
      title: 'LIQUID RATE',
      unit: 'BPD',
      val: liveTelemetry.flow_rate_bpd !== undefined ? Number(liveTelemetry.flow_rate_bpd).toFixed(0) : (liveTelemetry.R_LIQ_RATE !== undefined ? Number(liveTelemetry.R_LIQ_RATE).toFixed(0) : '0'),
      deltaKey: 'flow_rate_bpd',
      decimals: 0
    },
    {
      title: 'INTAKE PRESSURE',
      unit: 'PSI',
      val: liveTelemetry.R_INTAKE_PRESS !== undefined ? Number(liveTelemetry.R_INTAKE_PRESS).toFixed(0) : (liveTelemetry.intake_pressure_psi !== undefined ? Number(liveTelemetry.intake_pressure_psi).toFixed(0) : '348'),
      deltaKey: 'R_INTAKE_PRESS',
      decimals: 0
    },
    {
      title: 'MOTOR CURRENT',
      unit: 'A',
      val: liveTelemetry.R_DRV_CURR_AVG !== undefined ? Number(liveTelemetry.R_DRV_CURR_AVG).toFixed(1) : (liveTelemetry.motor_current_a !== undefined ? Number(liveTelemetry.motor_current_a).toFixed(1) : '0.0'),
      deltaKey: 'R_DRV_CURR_AVG',
      decimals: 1
    },
    {
      title: 'MOTOR LOAD',
      unit: '%',
      val: liveTelemetry.R_DRV_CURR_AVG !== undefined ? (Math.min(100, (Number(liveTelemetry.R_DRV_CURR_AVG) / 55.0) * 100)).toFixed(1) : '0.0',
      deltaKey: 'motor_load',
      decimals: 1
    },
    {
      title: 'MOTOR TEMPERATURE',
      unit: '°C',
      val: liveTelemetry.R_MOTOR_TEMP !== undefined ? Number(liveTelemetry.R_MOTOR_TEMP).toFixed(1) : (liveTelemetry.motor_temperature_c !== undefined ? Number(liveTelemetry.motor_temperature_c).toFixed(1) : '80.1'),
      deltaKey: 'R_MOTOR_TEMP',
      decimals: 1
    },
    {
      title: 'VIBRATION',
      unit: 'G RMS',
      val: liveTelemetry.R_VIBRATION_X !== undefined ? Number(liveTelemetry.R_VIBRATION_X).toFixed(2) : (liveTelemetry.vibration_g !== undefined ? Number(liveTelemetry.vibration_g).toFixed(2) : '0.17'),
      deltaKey: 'R_VIBRATION_X',
      decimals: 2
    },
    {
      title: 'DISCHARGE PRESSURE',
      unit: 'PSI',
      val: liveTelemetry.R_DISCH_PRESS !== undefined ? Number(liveTelemetry.R_DISCH_PRESS).toFixed(0) : (liveTelemetry.pressure_psi !== undefined ? Number(liveTelemetry.pressure_psi).toFixed(0) : '350'),
      deltaKey: 'R_DISCH_PRESS',
      decimals: 0
    },
    {
      title: 'MOTOR VOLTAGE',
      unit: 'V',
      val: liveTelemetry.R_BUS_IN_VTG_AVG !== undefined ? Number(liveTelemetry.R_BUS_IN_VTG_AVG).toFixed(0) : (liveTelemetry.motor_voltage_v !== undefined ? Number(liveTelemetry.motor_voltage_v).toFixed(0) : '0'),
      deltaKey: 'R_BUS_IN_VTG_AVG',
      decimals: 0
    },
    {
      title: 'INTAKE TEMPERATURE',
      unit: '°C',
      val: liveTelemetry.R_INTAKE_TEMP !== undefined ? Number(liveTelemetry.R_INTAKE_TEMP).toFixed(1) : (liveTelemetry.intake_temperature_c !== undefined ? Number(liveTelemetry.intake_temperature_c).toFixed(1) : '52.9'),
      deltaKey: 'R_INTAKE_TEMP',
      decimals: 1
    },
    {
      title: 'FLOWLINE PRESSURE',
      unit: 'PSI',
      val: liveTelemetry.R_PIT_003 !== undefined ? (Number(liveTelemetry.R_PIT_003) * 14.5038).toFixed(0) : (liveTelemetry.flowline_pressure_psi !== undefined ? Number(liveTelemetry.flowline_pressure_psi).toFixed(0) : '160'),
      deltaKey: 'R_PIT_003',
      decimals: 0
    },
    {
      title: 'WELLHEAD PRESSURE',
      unit: 'PSI',
      val: liveTelemetry.R_PIT_001 !== undefined ? (Number(liveTelemetry.R_PIT_001) * 14.5038).toFixed(0) : (liveTelemetry.wellhead_pressure_psi !== undefined ? Number(liveTelemetry.wellhead_pressure_psi).toFixed(0) : '201'),
      deltaKey: 'R_PIT_001',
      decimals: 0
    },
    {
      title: 'CASING PRESSURE',
      unit: 'PSI',
      val: liveTelemetry.R_PIT_002 !== undefined ? (Number(liveTelemetry.R_PIT_002) * 14.5038).toFixed(0) : (liveTelemetry.casing_pressure_psi !== undefined ? Number(liveTelemetry.casing_pressure_psi).toFixed(0) : '0'),
      deltaKey: 'R_PIT_002',
      decimals: 0
    },
    {
      title: 'CHOKE SIZE',
      unit: '/64 IN',
      val: liveTelemetry.choke_size_64in !== undefined ? Number(liveTelemetry.choke_size_64in).toFixed(0) : '32',
      deltaKey: 'choke_size',
      decimals: 0
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
      gap: '0.75rem',
      marginBottom: '1.25rem'
    }}>
      {cards.map((c, idx) => {
        const delta = deltas[c.deltaKey];
        const hasDelta = delta !== undefined && Math.abs(delta) > 0.01;
        const isUp = hasDelta && delta > 0;
        const isDown = hasDelta && delta < 0;

        return (
          <div
            key={idx}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Header: Title & Unit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                {c.title}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {c.unit}
              </span>
            </div>

            {/* Main Value */}
            <div className="metric-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0.2rem 0' }}>
              {c.val}
            </div>

            {/* Delta / Stability Text */}
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {hasDelta ? (
                isUp ? (
                  <span style={{ color: 'var(--state-healthy-text)' }}>
                    ↑ {Math.abs(delta).toFixed(c.decimals)} last second
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-orange)' }}>
                    ↓ {Math.abs(delta).toFixed(c.decimals)} last second
                  </span>
                )
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Stable in last sample
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
