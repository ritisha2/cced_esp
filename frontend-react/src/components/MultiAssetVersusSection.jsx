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
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { GitCompare, Layers, Plus, X, RefreshCw, Check } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ASSET_COLORS = [
  '#00e5ff', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f97316', // Orange
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#14b8a6'  // Teal
];

export const MultiAssetVersusSection = () => {
  const { assetsList } = useTelemetry();
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [activeParameter, setActiveParameter] = useState('pressure_psi');
  const [assetHistories, setAssetHistories] = useState({});
  const [loading, setLoading] = useState(false);

  // Dynamically initialize selected asset comparison pool from assetsList
  useEffect(() => {
    if (assetsList.length > 0 && selectedAssetIds.length === 0) {
      const initial = assetsList.slice(0, 3).map(a => a.asset_id || a.id || a);
      setSelectedAssetIds(initial);
    }
  }, [assetsList, selectedAssetIds]);

  // Fetch histories for all selected assets
  const fetchAllSelectedHistories = async () => {
    if (selectedAssetIds.length === 0) return;
    setLoading(true);
    const newHist = {};
    for (const id of selectedAssetIds) {
      try {
        const res = await fetch(`/api/esp/assets/${id}/history?range=6h&limit=50`);
        if (res.ok) {
          const data = await res.json();
          // API returns records in 'points' or 'records' array
          newHist[id] = Array.isArray(data) ? data : (data.points || data.records || []);
        }
      } catch (err) {
        console.warn(`[MultiAssetVersus] Error fetching ${id}:`, err);
      }
    }
    setAssetHistories(newHist);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllSelectedHistories();
  }, [selectedAssetIds]);

  const toggleAsset = (id) => {
    if (selectedAssetIds.includes(id)) {
      if (selectedAssetIds.length > 1) {
        setSelectedAssetIds(selectedAssetIds.filter((a) => a !== id));
      }
    } else {
      if (selectedAssetIds.length < 8) {
        setSelectedAssetIds([...selectedAssetIds, id]);
      }
    }
  };

  // Build Versus Chart Data
  const chartData = useMemo(() => {
    const primaryId = selectedAssetIds[0];
    const primaryPts = assetHistories[primaryId] || [];
    const labels = primaryPts.map((p) => {
      let ts;
      if (!p.timestamp) {
        ts = new Date();
      } else if (typeof p.timestamp === 'number') {
        ts = new Date(p.timestamp < 1e11 ? p.timestamp * 1000 : p.timestamp);
      } else {
        ts = new Date(p.timestamp);
      }
      if (isNaN(ts.getTime())) ts = new Date();
      return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });

    const paramMap = {
      pressure_psi: 'discharge_pressure_psi',
      intake_pressure_psi: 'intake_pressure_psi',
      temperature_c: 'motor_temperature_c',
      motor_current_a: 'motor_current_a',
      vibration_rms: 'vibration_rms',
      liquid_rate_bpd: 'liquid_rate_bpd'
    };

    const targetField = paramMap[activeParameter] || 'discharge_pressure_psi';

    const datasets = selectedAssetIds.map((id, idx) => {
      const pts = assetHistories[id] || [];
      const color = ASSET_COLORS[idx % ASSET_COLORS.length];
      return {
        label: `${id} (${targetField.replace(/_/g, ' ')})`,
        data: pts.map((p) => (p[targetField] !== undefined ? p[targetField] : (p[activeParameter] || null))),
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.2
      };
    });

    return { labels, datasets };
  }, [selectedAssetIds, assetHistories, activeParameter]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter, sans-serif', size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 15, 25, 0.95)',
        borderColor: 'rgba(45, 60, 90, 0.6)',
        borderWidth: 1,
        bodyFont: { family: 'JetBrains Mono', weight: '600' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(45, 60, 90, 0.2)' },
        ticks: { color: '#64748b', maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(45, 60, 90, 0.25)' },
        ticks: { color: '#00e5ff', font: { family: 'JetBrains Mono', size: 10 } }
      }
    }
  };

  const paramOptions = [
    { key: 'pressure_psi', label: 'Discharge Pressure (PDP)' },
    { key: 'intake_pressure_psi', label: 'Intake Pressure (PIP)' },
    { key: 'temperature_c', label: 'Motor Temperature (°C)' },
    { key: 'motor_current_a', label: 'Motor Current (A)' },
    { key: 'vibration_rms', label: 'Vibration RMS (g)' },
    { key: 'liquid_rate_bpd', label: 'Liquid Rate (BPD)' }
  ];

  return (
    <section id="section-versus" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
      <div className="scada-card">
        {/* Header */}
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <GitCompare size={16} color="var(--accent-cyan)" /> Multi-Asset Orchestration & Live Versus Comparative Trends
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-neutral">
              {selectedAssetIds.length} Assets Compared
            </span>
            <button
              onClick={fetchAllSelectedHistories}
              className="scada-btn"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Sync
            </button>
          </div>
        </div>

        <div className="scada-card-body">
          {/* Asset Selection Pool */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>
              SELECT ESP ASSETS TO ORCHESTRATE ON VERSUS TIMELINE (CLICK TO TOGGLE):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '100px', overflowY: 'auto', padding: '0.4rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {assetsList.map((asset) => {
                const id = asset.asset_id || asset.id || asset;
                const isSelected = selectedAssetIds.includes(id);
                const colorIdx = selectedAssetIds.indexOf(id);
                const assignedColor = colorIdx >= 0 ? ASSET_COLORS[colorIdx % ASSET_COLORS.length] : null;

                return (
                  <button
                    key={id}
                    onClick={() => toggleAsset(id)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: '1px solid',
                      background: isSelected ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-primary)',
                      borderColor: isSelected ? (assignedColor || 'var(--accent-cyan)') : 'var(--border-color)',
                      color: isSelected ? (assignedColor || 'var(--accent-cyan)') : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {isSelected ? <Check size={12} color={assignedColor} /> : <Plus size={12} />}
                    {id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameter Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Comparison Channel:</span>
            {paramOptions.map((p) => (
              <button
                key={p.key}
                onClick={() => setActiveParameter(p.key)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: '1px solid',
                  background: activeParameter === p.key ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                  borderColor: activeParameter === p.key ? 'var(--accent-blue)' : 'var(--border-color)',
                  color: activeParameter === p.key ? '#fff' : 'var(--text-muted)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Canvas Chart */}
          <div style={{ height: '360px' }}>
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>
    </section>
  );
};
