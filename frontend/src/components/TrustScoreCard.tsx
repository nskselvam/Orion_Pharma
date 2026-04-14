import React from 'react';

interface TrustScoreCardProps {
  score: number;
}

const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ score }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'var(--success)';
    if (score >= 65) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreStatus = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 65) return 'Fair';
    return 'Poor';
  };

  const getScoreBadgeClass = (score: number): string => {
    if (score >= 85) return 'badge-success';
    if (score >= 65) return 'badge-warning';
    return 'badge-danger';
  };

  // Calculate SVG circle properties for gauge
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h3 style={{ marginBottom: '24px' }}>Trust Score</h3>
      
      <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
        {/* Background circle */}
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--background-secondary)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease',
            }}
          />
        </svg>
        
        {/* Score text in center */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: getScoreColor(score),
            letterSpacing: '-0.03em',
          }}>
            {score}
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginTop: '4px',
          }}>
            out of 100
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <span className={`badge ${getScoreBadgeClass(score)}`}>
          {getScoreStatus(score)}
        </span>
      </div>
    </div>
  );
};

export default TrustScoreCard;
