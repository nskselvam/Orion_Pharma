import React, { useState } from 'react';
import type { Alert } from './types';

interface AlertPanelProps {
  alerts: Alert[];
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getSeverityIcon = (severity: Alert['severity']): string => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getAlertClass = (severity: Alert['severity']): string => {
    switch (severity) {
      case 'critical':
        return 'alert-critical';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Alerts</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={filter === 'critical' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={filter === 'warning' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            Warning ({warningCount})
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">No alerts</div>
            <div className="empty-state-text">Everything is running smoothly</div>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <div key={idx} className={`alert ${getAlertClass(alert.severity)}`}>
              <div style={{ fontSize: '20px', lineHeight: '1' }}>
                {getSeverityIcon(alert.severity)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}>
                  <strong style={{ fontSize: '14px' }}>{alert.type}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatTimestamp(alert.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  {alert.message}
                </p>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Batch ID: <code style={{ 
                    background: 'rgba(0,0,0,0.05)', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '11px' 
                  }}>{alert.batchId}</code>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertPanel;
