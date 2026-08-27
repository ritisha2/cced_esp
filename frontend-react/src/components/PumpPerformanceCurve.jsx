import React, { useState, useEffect, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity, Gauge, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const PumpPerformanceCurve = () => {
  const { selectedAsset } = useTelemetry();
  const [curveData, setCurveData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedAsset) return;
    const fetchCurve = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/esp/assets/${selectedAsset}/pump-curve-data`);
        if (res.ok) {
          const data = await res.json();
          setCurveData(data);
        }
      } catch (err) {
        console.warn('[PumpPerformanceCurve] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurve();
  }, [selectedAsset]);

  const chartConfig = useMemo(() => {
    if (!curveData || !curveData.curve) return null;

    const labels = curveData.curve.map((pt) => `${pt.flow_bpd} BPD`);
    const headFtValues = curveData.curve.map((pt) => pt.head_ft);
    const powerHpValues = curveData.curve.map((pt) => pt.power_bhp);
    const effValues = curveData.curve.map((pt) => pt.efficiency_pct);

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Head Curve H(Q) [ft]',
            data: headFtValues,
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
            borderWidth: 2.5,
            yAxisID: 'y_head',
            fill: true,
            tension: 0.3
          },
          {
            label: 'BHP Power Curve [HP]',
            data: powerHpValues,
            borderColor: '#f97316',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [4, 4],
            yAxisID: 'y_power',
            tension: 0.1
          },
          {
            label: 'Pump Efficiency [%]',
            data: effValues,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            yAxisID: 'y_eff',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter, sans-serif', size: 11, weight: '600' },
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 25, 0.95)',
            borderColor: 'rgba(45, 60, 90, 0.6)',
            borderWidth: 1,
            titleColor: '#00e5ff',
            bodyFont: { family: 'JetBrains Mono', weight: '600' }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(45, 60, 90, 0.2)' },
            ticks: { color: '#64748b', maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 10 } }
          },
          y_head: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(45, 60, 90, 0.25)' },
            ticks: { color: '#00e5ff', font: { family: 'JetBrains Mono', size: 10 } },
            title: { display: true, text: 'Total Dynamic Head (ft)', color: '#00e5ff', font: { size: 11 } }
          },
          y_power: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#f97316', font: { family: 'JetBrains Mono', size: 10 } },
            title: { display: true, text: 'Brake Horsepower (HP)', color: '#f97316', font: { size: 11 } }
          },
          y_eff: {
            type: 'linear',
            position: 'right',
            display: false,
            min: 0,
            max: 100
          }
        }
      }
    };
  }, [curveData]);

  const op = curveData?.operating_point || {};
  const bep = curveData?.bep_range || {};
  const inBep = op.in_bep_range;

  return (
    <section id="section-pump-curve" style={{ marginTop: '1.5rem' }}>
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Gauge size={16} color="var(--accent-cyan)" /> ESP Pump Performance Curve & Operating Envelope (H-Q & Power)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-purple">
              Pump: {curveData?.pump_model || 'ESP Centrifugal'}
            </span>
            <span className={`badge ${inBep ? 'badge-healthy' : 'badge-warning'}`}>
              {inBep ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {inBep ? 'IN BEP ENVELOPE' : 'OFF-DESIGN POINT'}
            </span>
          </div>
        </div>

        <div className="scada-card-body">
          {/* Engineering Envelope KPI Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT OPERATING FLOW</div>
              <div className="metric-value" style={{ fontSize: '1.3rem', color: inBep ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}>
                {op.flow_bpd || '--'} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BPD</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                BEP Nominal: {bep.optimal_bpd || '--'} BPD
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DYNAMIC HEAD (TDH)</div>
              <div className="metric-value" style={{ fontSize: '1.3rem', color: '#00e5ff' }}>
                {op.head_ft || '--'} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ft</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                Differential Head: {op.head_psi || '--'} psi
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RECOMMENDED BEP WINDOW</div>
              <div className="metric-value" style={{ fontSize: '1.3rem', color: 'var(--state-healthy-text)' }}>
                {bep.min_flow_bpd || '--'} – {bep.max_flow_bpd || '--'} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BPD</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                70% to 120% of Best Efficiency Flow
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FLOW STABILITY LIMITS</div>
              <div className="metric-value" style={{ fontSize: '1.1rem', color: 'var(--accent-orange)' }}>
                Min: {curveData?.minimum_continuous_flow_bpd || '--'} BPD
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                Max Runout: {curveData?.maximum_runout_flow_bpd || '--'} BPD
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div style={{ height: '360px' }}>
            {chartConfig ? (
              <Line data={chartConfig.data} options={chartConfig.options} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Loading Pump Performance Curve...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
