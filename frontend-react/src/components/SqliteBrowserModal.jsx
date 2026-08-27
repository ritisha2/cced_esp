import React, { useState, useEffect } from 'react';
import { Database, X, Filter, RefreshCw, ChevronLeft, ChevronRight, HardDrive, Download } from 'lucide-react';

export const SqliteBrowserModal = ({ isOpen, onClose }) => {
  const [dbName, setDbName] = useState('unlabelled');
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = `/api/database/browse?db_name=${dbName}&limit=${limit}&offset=${offset}`;
      if (filterStatus !== 'ALL') {
        url += `&status=${filterStatus}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotal(data.total || 0);
        setStats({
          fileSize: data.db_file_size,
          assets: data.total_assets,
          wells: data.total_wells
        });
      }
    } catch (err) {
      console.warn('[SqliteBrowser] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen, dbName, limit, offset, filterStatus]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: 'rgba(5, 8, 15, 0.75)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '1280px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(14, 19, 31, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(0, 229, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={18} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                SQLite Dual Database Explorer & Historian
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Inspect raw persistent database records for labelled.db and unlabelled.db
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* DB Switcher Pills */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-primary)',
              padding: '0.2rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => { setDbName('unlabelled'); setOffset(0); }}
                style={{
                  padding: '0.3rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: dbName === 'unlabelled' ? 'var(--accent-cyan)' : 'transparent',
                  color: dbName === 'unlabelled' ? '#080b11' : 'var(--text-muted)'
                }}
              >
                unlabelled.db (Ground Truth)
              </button>
              <button
                onClick={() => { setDbName('labelled'); setOffset(0); }}
                style={{
                  padding: '0.3rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: dbName === 'labelled' ? 'var(--accent-purple)' : 'transparent',
                  color: dbName === 'labelled' ? '#fff' : 'var(--text-muted)'
                }}
              >
                labelled.db (Raw Metadata)
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.3rem',
                borderRadius: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Controls & Stats Strip */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(10, 15, 25, 0.8)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.75rem'
        }}>
          {/* Left Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-secondary)' }}>
            <span>Database: <strong style={{ color: 'var(--text-primary)' }}>{dbName}.db</strong></span>
            <span>Total Records: <strong className="metric-value" style={{ color: 'var(--accent-cyan)' }}>{total.toLocaleString()}</strong></span>
            <span>Size: <strong style={{ color: 'var(--text-primary)' }}>{stats.fileSize || '0 KB'}</strong></span>
          </div>

          {/* Right Filter & Pagination Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={13} color="var(--text-muted)" />
              <select
                className="scada-input"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setOffset(0); }}
              >
                <option value="ALL">All Statuses</option>
                <option value="NORMAL">NORMAL</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="UNLABELLED">UNLABELLED</option>
              </select>
            </div>

            <button
              onClick={fetchRecords}
              className="scada-btn"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="scada-btn"
                style={{ padding: '0.25rem 0.45rem' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setOffset(offset + limit)}
                className="scada-btn"
                style={{ padding: '0.25rem 0.45rem' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Table Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem 1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 0.65rem' }}>ID</th>
                <th style={{ padding: '0.5rem 0.65rem' }}>Timestamp</th>
                <th style={{ padding: '0.5rem 0.65rem' }}>Asset ID</th>
                <th style={{ padding: '0.5rem 0.65rem' }}>Category</th>
                <th style={{ padding: '0.5rem 0.65rem' }}>Scenario</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>PDP (psi)</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>PIP (psi)</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Flow (BPD)</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Freq (Hz)</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Current (A)</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Temp (°C)</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Vib (g)</th>
                <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((r, idx) => {
                  const isHealthy = (r.status === 'NORMAL' || r.status === 'UNLABELLED') && (r.scenario === 'normal' || r.scenario === 'unlabelled');
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(45, 60, 90, 0.2)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                    >
                      <td style={{ padding: '0.45rem 0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        #{r.id}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {r.timestamp ? r.timestamp.replace('T', ' ').split('.')[0] : '--'}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {r.asset_id}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                          {r.data_category}
                        </span>
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', color: isHealthy ? 'var(--text-secondary)' : 'var(--state-fault-text)' }}>
                        {r.scenario}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Number(r.pressure_psi || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Number(r.intake_pressure_psi || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {Number(r.flow_rate_bpd || 0).toFixed(0)}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Number(r.frequency_hz || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>
                        {Number(r.motor_current_a || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                        {Number(r.temperature_c || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Number(r.vibration_g || 0).toFixed(3)}
                      </td>
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'center' }}>
                        <span className={`badge ${isHealthy ? 'badge-healthy' : 'badge-fault'}`} style={{ fontSize: '0.65rem' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading database records...' : 'No records found in database.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
