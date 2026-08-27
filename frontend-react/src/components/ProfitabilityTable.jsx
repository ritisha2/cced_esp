import React, { useState, useEffect } from 'react';
import { DollarSign, Filter, Clock, TrendingUp, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

export const ProfitabilityTable = () => {
  const [profitData, setProfitData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const fetchProfitability = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/esp/fleet/profitability?time_filter=${timeFilter}`);
      if (res.ok) {
        const data = await res.json();
        setProfitData(data);
      }
    } catch (err) {
      console.warn('[ProfitabilityTable] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitability();
  }, [timeFilter]);

  const rawPumps = profitData?.pumps || [];

  // Filter & Sort
  let filteredPumps = [...rawPumps];
  if (statusFilter === 'TRIPPED') {
    filteredPumps = filteredPumps.filter((p) => p.is_tripped);
  } else if (statusFilter === 'WATCH') {
    filteredPumps = filteredPumps.filter((p) => p.status_category === 'WATCH');
  } else if (statusFilter === 'HEALTHY') {
    filteredPumps = filteredPumps.filter((p) => p.status_category === 'HEALTHY');
  } else if (statusFilter === 'FAULT') {
    filteredPumps = filteredPumps.filter((p) => p.is_fault || p.is_tripped);
  } else if (statusFilter === 'MAX') {
    filteredPumps.sort((a, b) => b.daily_profit_usd - a.daily_profit_usd);
  } else if (statusFilter === 'MIN') {
    filteredPumps.sort((a, b) => a.daily_profit_usd - b.daily_profit_usd);
  }

  const timeRanges = ['1h', '6h', '24h', '7d', '30d', '365d'];
  const filterPills = ['ALL', 'TRIPPED', 'WATCH', 'MAX', 'MIN', 'FAULT', 'HEALTHY'];

  return (
    <section id="section-economics" style={{ marginTop: '1.5rem' }}>
      <div className="scada-card">
        {/* Header */}
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <DollarSign size={16} color="var(--accent-emerald)" /> ESP Fleet Production Economics & Daily Profitability ($/day)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Time Filter */}
            <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {timeRanges.map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeFilter(r)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    fontFamily: 'var(--font-mono)',
                    color: timeFilter === r ? '#fff' : 'var(--text-muted)',
                    background: timeFilter === r ? 'var(--accent-blue)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Pills & Summary KPIs */}
        <div className="scada-card-body" style={{ paddingBottom: '0.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                Filter Category:
              </span>
              {filterPills.map((pill) => (
                <button
                  key={pill}
                  onClick={() => setStatusFilter(pill)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid',
                    background: statusFilter === pill ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-secondary)',
                    borderColor: statusFilter === pill ? 'var(--accent-cyan)' : 'var(--border-color)',
                    color: statusFilter === pill ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Total Fleet KPI */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL NET PRODUCTION:</span>{' '}
                <strong className="metric-value" style={{ color: 'var(--accent-cyan)', fontSize: '1rem' }}>
                  {profitData?.fleet_total_oil_bpd?.toLocaleString() || 0} BPD
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NET FLEET PROFIT ({timeFilter}):</span>{' '}
                <strong className="metric-value" style={{ color: 'var(--state-healthy-text)', fontSize: '1.1rem' }}>
                  ${profitData?.fleet_total_net_profit_usd?.toLocaleString() || 0}
                </strong>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '380px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.55rem 0.75rem' }}>Well / Asset ID</th>
                  <th style={{ padding: '0.55rem 0.75rem' }}>Pump Spec</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Gross Liquid (BPD)</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Net Oil (BPD)</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Power (kW)</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Revenue ($)</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Power Cost ($)</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Net Profit ($/{timeFilter})</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Est. Daily Profit ($/day)</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPumps.length > 0 ? (
                  filteredPumps.map((p, idx) => {
                    const isTripped = p.is_tripped;
                    const isWatch = p.status_category === 'WATCH';
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid rgba(45, 60, 90, 0.25)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {p.asset_id}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                          {p.pump_family}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {p.gross_liquid_bpd?.toFixed(0)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                          {p.net_oil_bpd?.toFixed(0)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {p.power_draw_kw?.toFixed(1)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--state-healthy-text)' }}>
                          ${p.revenue_usd?.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>
                          ${p.power_cost_usd?.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: p.net_profit_usd > 0 ? 'var(--state-healthy-text)' : 'var(--state-fault-text)' }}>
                          ${p.net_profit_usd?.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: p.daily_profit_usd > 0 ? 'var(--state-healthy-text)' : 'var(--state-fault-text)' }}>
                          ${p.daily_profit_usd?.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          <span className={`badge ${isTripped ? 'badge-fault' : (isWatch ? 'badge-warning' : 'badge-healthy')}`} style={{ fontSize: '0.65rem' }}>
                            {p.status_category}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Calculating fleet economics...' : 'No pumps match the selected filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
