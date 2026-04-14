import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAllBatchesQuery, useGetActiveAlertsQuery } from '../redux-slice/pharmaApiSlice';
import AlertPanel from '../components/AlertPanel';

const COLD_CHAIN_RANGE = { min: 2, max: 8 };

const ColdChain: React.FC = () => {
  const { data: batchesResponse, isLoading: batchesLoading } = useGetAllBatchesQuery();
  const { data: alertsResponse, isLoading: alertsLoading } = useGetActiveAlertsQuery();

  // Unwrap API responses
  const batches = (batchesResponse as any)?.data || [];
  const alerts = (alertsResponse as any)?.data || [];

  const getTemperatureStatus = (
    temperature?: number, 
    minTemp: number = COLD_CHAIN_RANGE.min, 
    maxTemp: number = COLD_CHAIN_RANGE.max
  ): { label: string; color: string; tone: string } => {
    if (!temperature || !Number.isFinite(temperature)) {
      return { label: 'No data', tone: 'warning', color: 'var(--text-secondary)' };
    }

    if (temperature < minTemp || temperature > maxTemp) {
      if (
        temperature >= minTemp - 0.5 &&
        temperature <= maxTemp + 0.5
      ) {
        return { label: 'Warning', tone: 'warning', color: 'var(--warning)' };
      }
      return { label: 'Excursion', tone: 'critical', color: 'var(--danger)' };
    }

    if (
      temperature <= minTemp + 0.5 ||
      temperature >= maxTemp - 0.5
    ) {
      return { label: 'Warning', tone: 'warning', color: 'var(--warning)' };
    }

    return { label: 'Safe', tone: 'safe', color: 'var(--success)' };
  };

  const criticalBatches = batches.filter((b: any) => {
    const status = getTemperatureStatus(b.temperature, b.targetTempMin, b.targetTempMax);
    return status.tone === 'critical' || (b.temperatureBreaches && b.temperatureBreaches > 0);
  });

  const warningBatches = batches.filter((b: any) => {
    const status = getTemperatureStatus(b.temperature, b.targetTempMin, b.targetTempMax);
    return status.tone === 'warning';
  });

  const safeBatches = batches.filter((b: any) => {
    const status = getTemperatureStatus(b.temperature, b.targetTempMin, b.targetTempMax);
    return status.tone === 'safe';
  });

  const loading = batchesLoading || alertsLoading;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Navigation */}
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <div style={{ fontSize: '24px' }}>💊</div>
              <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Orion-PharmaChain</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Link to="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
              <Link to="/inventory" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Inventory</Link>
              <Link to="/cold-chain" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', textDecoration: 'none' }}>Cold Chain</Link>
              <Link to="/verify" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Verify</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <h1 className="section-title">Cold Chain Monitoring</h1>
          <p className="section-subtitle">Real-time temperature monitoring and compliance tracking for pharmaceutical shipments.</p>
        </div>
      </section>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="stat-card">
            <p className="stat-label">Total Batches</p>
            <p className="stat-value" style={{ marginTop: '8px' }}>{batches.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Safe</p>
            <p className="stat-value" style={{ marginTop: '8px', color: 'var(--success)' }}>{safeBatches.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Warning</p>
            <p className="stat-value" style={{ marginTop: '8px', color: 'var(--warning)' }}>{warningBatches.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Critical</p>
            <p className="stat-value" style={{ marginTop: '8px', color: 'var(--danger)' }}>{criticalBatches.length}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
          {/* Batch List */}
          <div style={{ minHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Temperature Status</h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Cold Chain Standard: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{COLD_CHAIN_RANGE.min}°C - {COLD_CHAIN_RANGE.max}°C</span>
              </div>
            </div>
            
            {loading ? (
              <div className="card empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : batches.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-state-icon">🌡️</div>
                <p className="empty-state-title">No Batches Found</p>
                <p className="empty-state-text">Create batches to monitor cold chain compliance</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Critical Batches */}
                {criticalBatches.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(255, 59, 48, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '18px' }}>🚨</span>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--danger)', margin: 0 }}>
                        Critical Temperature Excursions
                      </h3>
                      <span style={{ 
                        marginLeft: 'auto',
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: 'var(--danger)',
                        background: 'rgba(255, 59, 48, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}>
                        {criticalBatches.length}
                      </span>
                    </div>
                    {criticalBatches.map((batch: any) => {
                      const status = getTemperatureStatus(batch.temperature, batch.targetTempMin, batch.targetTempMax);
                      return (
                        <Link
                          key={batch.batchId}
                          to={`/batch/${batch.batchId}`}
                          className="card card-hover"
                          style={{ display: 'block', textDecoration: 'none', color: 'inherit', borderLeft: `4px solid var(--danger)` }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{batch.batchId}</h4>
                                <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                                  {batch.temperatureBreaches || 0} {batch.temperatureBreaches === 1 ? 'Breach' : 'Breaches'}
                                </span>
                              </div>
                              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{batch.medicineName}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  📍 {batch.currentStage}
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  Range: {batch.targetTempMin || COLD_CHAIN_RANGE.min}°C - {batch.targetTempMax || COLD_CHAIN_RANGE.max}°C
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                              <div style={{ fontSize: '32px', fontWeight: '700', color: status.color, lineHeight: 1 }}>
                                {batch.temperature ? `${batch.temperature}°C` : 'N/A'}
                              </div>
                              <div style={{ fontSize: '11px', color: status.color, marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {status.label}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Warning Batches */}
                {warningBatches.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(255, 149, 0, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '18px' }}>⚠️</span>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--warning)', margin: 0 }}>
                        Warning - Near Threshold
                      </h3>
                      <span style={{ 
                        marginLeft: 'auto',
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: 'var(--warning)',
                        background: 'rgba(255, 149, 0, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}>
                        {warningBatches.length}
                      </span>
                    </div>
                    {warningBatches.map((batch: any) => {
                      const status = getTemperatureStatus(batch.temperature, batch.targetTempMin, batch.targetTempMax);
                      return (
                        <Link
                          key={batch.batchId}
                          to={`/batch/${batch.batchId}`}
                          className="card card-hover"
                          style={{ display: 'block', textDecoration: 'none', color: 'inherit', borderLeft: `4px solid var(--warning)` }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{batch.batchId}</h4>
                              </div>
                              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{batch.medicineName}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  📍 {batch.currentStage}
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  Range: {batch.targetTempMin || COLD_CHAIN_RANGE.min}°C - {batch.targetTempMax || COLD_CHAIN_RANGE.max}°C
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                              <div style={{ fontSize: '32px', fontWeight: '700', color: status.color, lineHeight: 1 }}>
                                {batch.temperature ? `${batch.temperature}°C` : 'N/A'}
                              </div>
                              <div style={{ fontSize: '11px', color: status.color, marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {status.label}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Safe Batches */}
                {safeBatches.length > 0 && (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(52, 199, 89, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '18px' }}>✅</span>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)', margin: 0 }}>
                        Compliant - Within Range
                      </h3>
                      <span style={{ 
                        marginLeft: 'auto',
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: 'var(--success)',
                        background: 'rgba(52, 199, 89, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}>
                        {safeBatches.length}
                      </span>
                    </div>
                    {safeBatches.map((batch: any) => {
                      const status = getTemperatureStatus(batch.temperature, batch.targetTempMin, batch.targetTempMax);
                      return (
                        <Link
                          key={batch.batchId}
                          to={`/batch/${batch.batchId}`}
                          className="card card-hover"
                          style={{ display: 'block', textDecoration: 'none', color: 'inherit', borderLeft: `4px solid var(--success)` }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{batch.batchId}</h4>
                                <span className="badge badge-success" style={{ fontSize: '11px' }}>Compliant</span>
                              </div>
                              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{batch.medicineName}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  📍 {batch.currentStage}
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  Range: {batch.targetTempMin || COLD_CHAIN_RANGE.min}°C - {batch.targetTempMax || COLD_CHAIN_RANGE.max}°C
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                              <div style={{ fontSize: '32px', fontWeight: '700', color: status.color, lineHeight: 1 }}>
                                {batch.temperature ? `${batch.temperature}°C` : 'N/A'}
                              </div>
                              <div style={{ fontSize: '11px', color: status.color, marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {status.label}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alerts Panel */}
          <div>
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ColdChain;
