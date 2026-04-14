import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useGetBatchDetailsQuery,
  useDeleteBatchMutation,
} from '../redux-slice/pharmaApiSlice';
import MapView from '../components/MapView';
import TemperatureChart from '../components/TemperatureChart';
import TrustScoreCard from '../components/TrustScoreCard';
import AlertPanel from '../components/AlertPanel';
import Timeline from '../components/Timeline';
import SimulationControls from '../components/SimulationControls';
import type { TemperatureDataPoint } from '../components/types';

const BatchDetails: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  
  // Get batch details with stages, alerts, and temperature history
  const { data: batchResponse, isLoading, refetch } = useGetBatchDetailsQuery(batchId || '', {
    skip: !batchId,
    pollingInterval: 5000, // Poll every 5 seconds
  });
  const [deleteBatch] = useDeleteBatchMutation();
  
  // Unwrap batch data
  const batchData = (batchResponse as any)?.data;

  const handleSimulationUpdate = () => {
    refetch();
  };

  const handleDeleteBatch = async () => {
    const confirmed = window.confirm(`Delete batch ${batchData?.batchId}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteBatch(batchData!.batchId).unwrap();
      navigate('/');
    } catch (error: any) {
      alert(error?.data?.error || 'Failed to delete batch');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batchData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>❌</p>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Batch Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>The batch you're looking for doesn't exist</p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Transform stages data from API format to component format
  const transformedStages = batchData?.stages
    ? batchData.stages.map((stage: any, index: number) => ({
        stage: stage.name || stage.stage || stage.location,
        location: stage.location,
        timestamp: stage.timestamp,
        temperature: stage.temperature,
        status: index === batchData.stages.length - 1 ? 'current' as const : 'completed' as const,
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
    .filter((s: any) => s.status !== 'pending' && s.temperature)
    .map((stage: any) => ({
      timestamp: stage.timestamp,
      temperature: stage.temperature,
      breach: batchData ? (stage.temperature < batchData.targetTempMin || stage.temperature > batchData.targetTempMax) : false,
    }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Navigation */}
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
                ← Back
              </Link>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.2' }}>{batchData.batchId}</h1>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{batchData.medicineName}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={handleDeleteBatch} className="btn-danger">
                Delete
              </button>
              <span className={`badge ${batchData.trustScore >= 85 ? 'badge-success' : batchData.trustScore >= 65 ? 'badge-warning' : 'badge-danger'}`}>
                Score: {batchData.trustScore}
              </span>
              <span className={`badge ${batchData.status === 'delivered' ? 'badge-success' : batchData.status === 'compromised' ? 'badge-danger' : 'badge-info'}`}>
                {batchData.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column - Map & Timeline & Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Map */}
            {transformedStages.length > 0 && (
              <div>
                <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Live Location Tracking
                </h3>
                <MapView stages={transformedStages} height="400px" />
              </div>
            )}

            {/* Timeline */}
            {transformedStages.length > 0 && (
              <Timeline stages={transformedStages} />
            )}

            {/* Temperature Chart */}
            {temperatureData.length > 0 && (
              <TemperatureChart data={temperatureData} minTemp={batchData.targetTempMin} maxTemp={batchData.targetTempMax} />
            )}
          </div>

          {/* Right Column - Trust Score, Simulation, Alerts, Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Trust Score */}
            <TrustScoreCard score={batchData.trustScore} />

            {/* Batch Info */}
            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Batch Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Medicine</span>
                  <span style={{ fontWeight: '500' }}>{batchData.medicineName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Quantity</span>
                  <span style={{ fontWeight: '500' }}>{batchData.quantityInStock?.toLocaleString() || 'N/A'} units</span>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Origin</span>
                  <span style={{ fontWeight: '500', textAlign: 'right' }}>{batchData.origin}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Destination</span>
                  <span style={{ fontWeight: '500', textAlign: 'right' }}>{batchData.destination}</span>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Stage</span>
                  <span style={{ fontWeight: '500' }}>{batchData.currentStage}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Temperature</span>
                  <span style={{ fontWeight: '500', color: batchData.temperature && (batchData.temperature < batchData.targetTempMin || batchData.temperature > batchData.targetTempMax) ? 'var(--danger)' : 'var(--success)' }}>
                    {batchData.temperature ? `${batchData.temperature}°C` : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Range</span>
                  <span style={{ fontWeight: '500' }}>
                    {batchData.targetTempMin}°C - {batchData.targetTempMax}°C
                  </span>
                </div>
                {batchData.blockchainHash && (
                  <>
                    <div className="divider" />
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Blockchain Hash</span>
                      <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent)', marginTop: '4px', wordBreak: 'break-all' }}>
                        {batchData.blockchainHash}
                      </p>
                    </div>
                  </>
                )}
                {batchData.createdAt && (
                  <>
                    <div className="divider" />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Created</span>
                      <span style={{ fontWeight: '500' }}>{formatDate(batchData.createdAt)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Simulation Controls */}
            <SimulationControls batchId={batchData.batchId} onSimulationComplete={handleSimulationUpdate} />

            {/* Alerts */}
            {batchData.alerts && batchData.alerts.length > 0 && (
              <AlertPanel alerts={batchData.alerts} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BatchDetails;
