import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Play, Pause, RotateCcw, FastForward, Film } from 'lucide-react';

export const ReplayController = () => {
  const { historyData, selectedAsset } = useTelemetry();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (historyData.length > 0) {
      setCurrentIndex(historyData.length - 1);
    }
  }, [historyData]);

  useEffect(() => {
    let interval = null;
    if (isPlaying && historyData.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= historyData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, historyData]);

  const currentRecord = historyData[currentIndex] || {};
  const currentTs = currentRecord.timestamp 
    ? new Date(currentRecord.timestamp * 1000).toLocaleString() 
    : 'No active replay record';

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div className="card-header" style={{ margin: '-1.25rem -1.25rem 1.25rem -1.25rem' }}>
        <span className="card-title">
          <Film size={14} color="var(--accent-purple)" /> Historical Event & Scenario Replay Controller
        </span>
        <span className="badge badge-neutral">
          {historyData.length} Timesteps Available
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Playback Controls & Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--accent-blue)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem'
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>

          {/* Scrubber slider */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <input
              type="range"
              min="0"
              max={Math.max(0, historyData.length - 1)}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(Number(e.target.value));
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>Frame {currentIndex + 1} / {historyData.length}</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{currentTs}</span>
            </div>
          </div>

          {/* Speed Multipliers */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-primary)', padding: '0.2rem', borderRadius: '6px' }}>
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '600',
                  color: speed === s ? '#fff' : 'var(--text-muted)',
                  background: speed === s ? 'var(--accent-purple)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Snapshot Readings Card */}
        <div style={{
          background: 'rgba(10, 13, 20, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Replay Frame Telemetry Snapshot (Asset: {selectedAsset})
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WHP:</span>{' '}
              <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>{Number(currentRecord.R_PIT_001 || 0).toFixed(1)} Barg</span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Intake P:</span>{' '}
              <span className="metric-value" style={{ color: 'var(--accent-emerald)' }}>{Number(currentRecord.R_INTAKE_PRESS || 0).toFixed(1)} psi</span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Discharge P:</span>{' '}
              <span className="metric-value" style={{ color: '#14b8a6' }}>{Number(currentRecord.R_DISCH_PRESS || 0).toFixed(1)} psi</span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Motor Temp:</span>{' '}
              <span className="metric-value" style={{ color: 'var(--accent-amber)' }}>{Number(currentRecord.R_MOTOR_TEMP || 0).toFixed(1)} °C</span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vibration:</span>{' '}
              <span className="metric-value" style={{ color: 'var(--accent-red)' }}>{Number(currentRecord.R_VIBRATION_X || 0).toFixed(3)} g</span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drive Current:</span>{' '}
              <span className="metric-value" style={{ color: 'var(--accent-orange)' }}>{Number(currentRecord.R_DRV_CURR_AVG || 0).toFixed(1)} A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
