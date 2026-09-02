import React from 'react';
import { Table as TableIcon } from 'lucide-react';

/**
 * DataTable (Plan.md Phase F1.3.T3)
 * Generic table block renderer. Dormant until backend emits table payload.
 */
export const DataTable = ({ block }) => {
  if (!block || !Array.isArray(block.rows) || block.rows.length === 0) {
    return null;
  }

  const columns =
    block.columns && block.columns.length > 0
      ? block.columns
      : Object.keys(block.rows[0] || {});

  return (
    <div
      style={{
        marginTop: '10px',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        overflowX: 'auto'
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.74rem',
          textAlign: 'left'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-secondary, #f8fafc)' }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  fontWeight: '700',
                  color: 'var(--text-muted, #475569)',
                  textTransform: 'capitalize'
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              style={{
                borderBottom:
                  rIdx === block.rows.length - 1 ? 'none' : '1px solid var(--border-color, #f1f5f9)'
              }}
            >
              {columns.map((col, cIdx) => (
                <td
                  key={cIdx}
                  style={{
                    padding: '8px 12px',
                    color: 'var(--text-primary, #0f172a)'
                  }}
                >
                  {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
