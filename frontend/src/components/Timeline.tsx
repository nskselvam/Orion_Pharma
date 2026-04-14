import React from 'react';
import type { BatchStage } from './types';

interface TimelineProps {
  stages: BatchStage[];
}

const Timeline: React.FC<TimelineProps> = ({ stages }) => {
  const getStageIcon = (status: BatchStage['status']): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'current':
        return '→';
      case 'pending':
        return '○';
      default:
        return '○';
    }
  };

  const getNodeClass = (status: BatchStage['status']): string => {
    switch (status) {
      case 'completed':
        return 'timeline-node timeline-node-completed';
      case 'current':
        return 'timeline-node timeline-node-active';
      case 'pending':
        return 'timeline-node timeline-node-pending';
      default:
        return 'timeline-node timeline-node-pending';
    }
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '28px' }}>Journey Timeline</h3>
      
      <div style={{ position: 'relative' }}>
        {stages.map((stage, index) => (
          <div key={index} style={{ position: 'relative', paddingBottom: index < stages.length - 1 ? '48px' : '0' }}>
            {/* Connector line */}
            {index < stages.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: '22px',
                  top: '44px',
                  width: '2px',
                  height: '48px',
                  background: stage.status === 'completed' 
                    ? 'var(--success)' 
                    : 'var(--border)',
                }}
              />
            )}
            
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Node */}
              <div className={getNodeClass(stage.status)}>
                {getStageIcon(stage.status)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '17px', fontWeight: '600', margin: 0 }}>
                    {stage.stage}
                  </h4>
                  {stage.status !== 'pending' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {formatDate(stage.timestamp)}
                    </span>
                  )}
                </div>
                
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  📍 {stage.location}
                </div>
                
                {stage.status !== 'pending' && (
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      🌡️ {stage.temperature}°C
                    </span>
                    {stage.status === 'current' && (
                      <span className="badge badge-info" style={{ padding: '4px 10px' }}>
                        Current Location
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {stages.every(s => s.status === 'pending') && (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No Journey Started</div>
          <div className="empty-state-text">This batch hasn't begun its journey yet</div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
