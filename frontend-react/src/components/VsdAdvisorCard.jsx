import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Cpu, Zap, TrendingUp, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';

export const VsdAdvisorCard = () => {
  const { selectedAsset } = useTelemetry();
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedAsset) return;
    const fetchAdvisor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/esp/assets/${selectedAsset}/vsd-advisor`);
        if (res.ok) {
          const data = await res.json();
          setAdvice(data);
        }
      } catch (err) {
        console.warn('[VsdAdvisorCard] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvisor();
  }, [selectedAsset]);

  if (!advice) return null;

  const isIncrease = advice.advice_type === 'OPTIMIZE_INCREASE';
  const isProtect = advice.advice_type === 'PROTECT_REDUCE';

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${isIncrease ? 'rgba(0, 229, 255, 0.4)' : (isProtect ? 'var(--state-fault-border)' : 'var(--border-color)')}`,
      borderRadius: '8px',
      padding: '1rem',
      marginTop: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      boxShadow: isIncrease ? '0 0 16px rgba(0, 229, 255, 0.1)' : 'none'
    }}>
      {/* Left: AI Advisor Icon & Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: isIncrease ? 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)' : (isProtect ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#080b11'
        }}>
          <Cpu size={20} strokeWidth={2.5} color={isIncrease ? '#080b11' : '#fff'} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              AI VSD FREQUENCY & OPTIMIZATION ADVISOR
            </span>
            <span className={`badge ${isIncrease ? 'badge-healthy' : (isProtect ? 'badge-fault' : 'badge-neutral')}`} style={{ fontSize: '0.65rem' }}>
              {isIncrease ? 'PROFIT OPPORTUNITY' : (isProtect ? 'THERMAL PROTECTION' : 'OPTIMAL')}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {advice.action_summary}
          </div>
        </div>
      </div>

      {/* Right: Frequency Comparer & Margins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CURRENT FREQ</div>
          <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            {advice.current_frequency_hz} <span style={{ fontSize: '0.75rem' }}>Hz</span>
          </div>
        </div>

        <ArrowUpRight size={18} color="var(--accent-cyan)" />

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SUGGESTED VSD</div>
          <div className="metric-value" style={{ fontSize: '1.3rem', fontWeight: '800', color: isIncrease ? 'var(--accent-cyan)' : (isProtect ? 'var(--state-fault-text)' : 'var(--state-healthy-text)') }}>
            {advice.suggested_frequency_hz} <span style={{ fontSize: '0.75rem' }}>Hz</span>
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div>Thermal Margin: <strong style={{ color: 'var(--text-primary)' }}>{advice.margins?.temp_margin_c}°C</strong></div>
          <div>Current Margin: <strong style={{ color: 'var(--text-primary)' }}>{advice.margins?.current_margin_a} A</strong></div>
        </div>
      </div>
    </div>
  );
};
