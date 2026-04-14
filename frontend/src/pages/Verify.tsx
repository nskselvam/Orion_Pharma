import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVerifyBatchQuery, useGetBlockchainProofQuery } from '../redux-slice/pharmaApiSlice';
import TrustScoreCard from '../components/TrustScoreCard';
import Timeline from '../components/Timeline';
import TemperatureChart from '../components/TemperatureChart';
import type { TemperatureDataPoint } from '../components/types';

const Verify: React.FC = () => {
  const [batchId, setBatchId] = useState('');
  const [queryBatchId, setQueryBatchId] = useState<string | null>(null);
  
  const { data: verificationResponse, isLoading, error, isSuccess } = useVerifyBatchQuery(
    queryBatchId || '',
    { skip: !queryBatchId }
  );
  const { data: proofResponse } = useGetBlockchainProofQuery(queryBatchId || '', {
    skip: !queryBatchId
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) return;
    setQueryBatchId(batchId.trim());
  };

  const batch = isSuccess ? (verificationResponse as any)?.data : undefined;
  const proof = (proofResponse as any)?.data;
  
  // Transform stages data from API format to component format
  const transformedStages = batch?.stages
    ? batch.stages.map((stage: any, index: number) => ({
        stage: stage.name || stage.stage || stage.location,
        location: stage.location,
        timestamp: stage.timestamp,
        temperature: stage.temperature,
        status: index === batch.stages.length - 1 ? 'current' as const : 'completed' as const,
        coordinates: stage.coordinates ? {
          lat: typeof stage.coordinates.lat === 'string' 
            ? parseFloat(stage.coordinates.lat) 
            : stage.coordinates.lat,
          lng: typeof stage.coordinates.lng === 'string' 
            ? parseFloat(stage.coordinates.lng) 
            : stage.coordinates.lng,
        } : undefined
      }))
    : [];
  
  // Convert temperature data for chart
  const temperatureData: TemperatureDataPoint[] = transformedStages
    .filter((s: any) => s.status !== 'pending')
    .map((stage: any) => ({
      timestamp: stage.timestamp,
      temperature: stage.temperature,
      breach: batch ? (stage.temperature < batch.targetTempMin || stage.temperature > batch.targetTempMax) : false,
    }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Navigation */}
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <div style={{ fontSize: '24px' }}>💊</div>
              <div>
                <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'block' }}>PharmaChain</span>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Verification Portal</p>
              </div>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Link to="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
              <Link to="/cold-chain" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Cold Chain</Link>
              <Link to="/verify" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', textDecoration: 'none' }}>Verify</Link>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="section-title" style={{ fontSize: '32px' }}>Verify Medicine Authenticity</h1>
          <p className="section-subtitle" style={{ marginTop: '12px' }}>
            Enter a batch ID to verify the authenticity and safety of your pharmaceutical product
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleVerify} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value.toUpperCase())}
              placeholder="Enter Batch ID (e.g., BATCH001)"
              className="input-field"
              style={{ flex: 1, fontSize: '15px' }}
            />
            <button
              type="submit"
              disabled={isLoading || !batchId.trim()}
              className="btn-primary"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="alert alert-critical" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <span style={{ fontSize: '20px' }}>❌</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--danger)' }}>
                {(error as any)?.data?.error || 'Batch not found'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Please check the batch ID and try again
              </p>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {batch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            {/* Status Banner */}
            <div
              className="card"
              style={{
                border: `2px solid ${batch.trustScore >= 85 ? 'var(--success)' : batch.trustScore >= 65 ? 'var(--warning)' : 'var(--danger)'}`,
                background: batch.trustScore >= 85 ? 'rgba(52, 199, 89, 0.05)' : batch.trustScore >= 65 ? 'rgba(255, 149, 0, 0.05)' : 'rgba(255, 59, 48, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Verification Status
                  </p>
                  <p
                    style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      marginTop: '4px',
                      color: batch.trustScore >= 85 ? 'var(--success)' : batch.trustScore >= 65 ? 'var(--warning)' : 'var(--danger)',
                    }}
                  >
                    {batch.trustScore >= 85 ? '✅ Verified Safe' : batch.trustScore >= 65 ? '⚠️ Use Caution' : '🚨 Potentially Compromised'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Trust Score
                  </p>
                  <p
                    style={{
                      fontSize: '40px',
                      fontWeight: '700',
                      marginTop: '4px',
                      color: batch.trustScore >= 85 ? 'var(--success)' : batch.trustScore >= 65 ? 'var(--warning)' : 'var(--danger)',
                    }}
                  >
                    {batch.trustScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Product Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Batch ID
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: '15px', marginTop: '4px' }}>{batch.batchId}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Medicine
                  </p>
                  <p style={{ fontWeight: '500', marginTop: '4px' }}>{batch.medicineName}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Origin
                  </p>
                  <p style={{ fontWeight: '500', marginTop: '4px' }}>{batch.origin}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Current Stage
                  </p>
                  <p style={{ fontWeight: '500', marginTop: '4px' }}>{batch.currentStage}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Current Temperature
                  </p>
                  <p
                    style={{
                      fontWeight: '600',
                      marginTop: '4px',
                      color: batch.temperature && (batch.temperature < batch.targetTempMin || batch.temperature > batch.targetTempMax) ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {batch.temperature ? `${batch.temperature}°C` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </p>
                  <span className={`badge ${batch.status === 'delivered' ? 'badge-success' : 'badge-info'}`} style={{ marginTop: '4px' }}>
                    {batch.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Blockchain Verification */}
            <div className="card" style={{ background: 'rgba(0, 113, 227, 0.05)', border: '1px solid rgba(0, 113, 227, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔗</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent)' }}>Blockchain Verified</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    This batch has been recorded on the blockchain for tamper-proof verification
                  </p>
                  <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent)', marginTop: '8px', wordBreak: 'break-all' }}>
                    Hash: {batch.blockchainHash}
                  </p>

                  {proof?.available && proof?.exists && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 113, 227, 0.2)' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Blockchain Proof Viewer
                      </p>
                      <p style={{ fontSize: '11px', marginTop: '6px' }}>
                        <strong>Transaction Hash:</strong>{' '}
                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{proof.transactionHash || 'N/A'}</span>
                      </p>
                      <p style={{ fontSize: '11px', marginTop: '4px' }}>
                        <strong>Timestamp:</strong>{' '}
                        <span>{proof.timestamp ? new Date(proof.timestamp).toLocaleString() : 'N/A'}</span>
                      </p>

                      <div style={{ marginTop: '8px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '600' }}>Smart Contract Events</p>
                        {(proof.events || []).length === 0 ? (
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>No events found</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                            {(proof.events || []).map((event: any, idx: number) => (
                              <div key={idx} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '8px' }}>
                                <p style={{ fontSize: '11px', fontWeight: '600' }}>{event.event}</p>
                                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Block #{event.blockNumber} • {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Journey Timeline */}
            {transformedStages && transformedStages.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Journey History</h3>
                <Timeline stages={transformedStages} />
              </div>
            )}

            {/* Temperature History */}
            {temperatureData.length > 0 && (
              <TemperatureChart data={temperatureData} minTemp={2} maxTemp={8} />
            )}

            {/* Trust Score Card */}
            <TrustScoreCard score={batch.trustScore} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Verify;
