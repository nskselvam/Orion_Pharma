import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetAllBatchesQuery,
  useGetAllAlertsQuery,
  useCreateBatchMutation,
} from '../redux-slice/pharmaApiSlice';
import MapView from '../components/MapView';
import TrustScoreCard from '../components/TrustScoreCard';
import AlertPanel from '../components/AlertPanel';
import SimulationControls from '../components/SimulationControls';
import LocationAutocomplete from '../components/LocationAutocomplete';
import type { Batch } from '../components/types';

const Dashboard: React.FC = () => {
  const { data: batchesResponse, isLoading: batchesLoading, refetch: refetchBatches } = useGetAllBatchesQuery(undefined);
  const { data: alertsResponse, isLoading: alertsLoading } = useGetAllAlertsQuery({});
  const [createBatch, { isLoading: creating }] = useCreateBatchMutation();

  // Unwrap API responses
  const batches = (batchesResponse as any)?.data || [];
  const alerts = (alertsResponse as any)?.data || [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alerts' | 'in_transit' | 'delivered'>('all');
  
  const [formData, setFormData] = useState({
    batch_id: '',
    product_name: '',
    manufacturer: '',
    quantity: '',
    origin: '',
    destination: '',
    originCoordinates: null as { lat: number; lng: number } | null,
    destinationCoordinates: null as { lat: number; lng: number } | null,
  });

  const activeAlertBatchIds = useMemo(
    () => new Set(alerts.filter((alert: any) => !alert.resolved).map((alert: any) => alert.batchId)),
    [alerts]
  );

  const filteredBatches = useMemo(() => {
    if (activeFilter === 'all') return batches;
    if (activeFilter === 'alerts') {
      return batches.filter((batch: any) => activeAlertBatchIds.has(batch.batchId));
    }
    if (activeFilter === 'in_transit') {
      return batches.filter((batch: any) => batch.status === 'in-transit');
    }
    if (activeFilter === 'delivered') {
      return batches.filter((batch: any) => batch.status === 'delivered');
    }
    return batches;
  }, [activeFilter, batches, activeAlertBatchIds]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.originCoordinates || !formData.destinationCoordinates) {
      alert('Please choose origin and destination from search suggestions.');
      return;
    }

    try {
      await createBatch({
        batchId: formData.batch_id.toUpperCase(),
        medicineName: formData.product_name,
        origin: formData.origin,
        destination: formData.destination,
        originCoordinates: formData.originCoordinates,
        destinationCoordinates: formData.destinationCoordinates,
        quantityInStock: parseInt(formData.quantity),
      }).unwrap();

      setShowCreateForm(false);
      setFormData({
        batch_id: '',
        product_name: '',
        manufacturer: '',
        quantity: '',
        origin: '',
        destination: '',
        originCoordinates: null,
        destinationCoordinates: null,
      });
      refetchBatches();
    } catch (error: any) {
      alert(error?.data?.error || 'Failed to create batch');
    }
  };

  const handleBatchSelect = (batch: Batch) => {
    setSelectedBatch(batch);
  };

  const handleSimulationUpdate = () => {
    refetchBatches();
  };

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
              <Link to="/" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', textDecoration: 'none' }}>Dashboard</Link>
              <Link to="/inventory" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Inventory</Link>
              <Link to="/cold-chain" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Cold Chain</Link>
              <Link to="/verify" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Verify</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <h1 className="section-title">Supply Chain Intelligence</h1>
          <p className="section-subtitle">Real-time monitoring, predictive analytics, and blockchain verification for pharmaceutical shipments.</p>
        </div>
      </section>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={() => setActiveFilter('all')}
            className={`stat-card ${activeFilter === 'all' ? 'card-hover' : ''}`}
            style={{ textAlign: 'left', border: activeFilter === 'all' ? '2px solid var(--accent)' : '2px solid transparent' }}
          >
            <p className="stat-label">Total Batches</p>
            <p className="stat-value" style={{ marginTop: '8px' }}>{batches.length}</p>
          </button>
          <button
            onClick={() => setActiveFilter('alerts')}
            className={`stat-card ${activeFilter === 'alerts' ? 'card-hover' : ''}`}
            style={{ textAlign: 'left', border: activeFilter === 'alerts' ? '2px solid var(--danger)' : '2px solid transparent' }}
          >
            <p className="stat-label">Active Alerts</p>
            <p className="stat-value" style={{ marginTop: '8px', color: 'var(--danger)' }}>{alerts.filter((a: any) => !a.resolved).length}</p>
          </button>
          <button
            onClick={() => setActiveFilter('in_transit')}
            className={`stat-card ${activeFilter === 'in_transit' ? 'card-hover' : ''}`}
            style={{ textAlign: 'left', border: activeFilter === 'in_transit' ? '2px solid var(--accent)' : '2px solid transparent' }}
          >
            <p className="stat-label">In Transit</p>
            <p className="stat-value" style={{ marginTop: '8px', color: 'var(--accent)' }}>{batches.filter((b: any) => b.status === 'in-transit').length}</p>
          </button>
          <button
            onClick={() => setActiveFilter('delivered')}
            className={`stat-card ${activeFilter === 'delivered' ? 'card-hover' : ''}`}
            style={{ textAlign: 'left', border: activeFilter === 'delivered' ? '2px solid var(--success)' : '2px solid transparent' }}
          >
            <p className="stat-label">Delivered</p>
            <p className="stat-value" style={{ marginTop: '8px', color: 'var(--success)' }}>{batches.filter((b: any) => b.status === 'delivered').length}</p>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Left Column - Batches */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Batches</h2>
              <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                New Batch
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <form onSubmit={handleCreate} className="card" style={{ background: 'var(--background-secondary)', marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '16px' }}>Create New Batch</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Batch ID (e.g., MED001)"
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value.toUpperCase() })}
                    className="input-field"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-field"
                    required
                  />
                  <LocationAutocomplete
                    label="Origin"
                    placeholder="Search origin location"
                    value={formData.origin}
                    onChange={(value, coords) => setFormData(prev => ({ ...prev, origin: value, originCoordinates: coords || null }))}
                  />
                  <LocationAutocomplete
                    label="Destination"
                    placeholder="Search destination location"
                    value={formData.destination}
                    onChange={(value, coords) => setFormData(prev => ({ ...prev, destination: value, destinationCoordinates: coords || null }))}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 1 }}>
                      {creating ? 'Creating...' : 'Create Batch'}
                    </button>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary" style={{ flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Batch List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : filteredBatches.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-title">No Batches Found</div>
                  <div className="empty-state-text">Create your first batch to get started</div>
                </div>
              ) : (
                filteredBatches.map((batch: any) => (
                  <Link
                    key={batch.batchId}
                    to={`/batch/${batch.batchId}`}
                    onClick={() => handleBatchSelect(batch)}
                    className="card card-hover"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      border: selectedBatch?.batchId === batch.batchId ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{batch.batchId}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{batch.medicineName}</p>
                      </div>
                      <span className={`badge ${batch.trustScore >= 85 ? 'badge-success' : batch.trustScore >= 65 ? 'badge-warning' : 'badge-danger'}`}>
                        {batch.trustScore}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>📍 {batch.currentStage}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>🌡️ {batch.temperature || 'N/A'}°C</span>
                        <span className={`badge ${batch.status === 'delivered' ? 'badge-success' : 'badge-info'}`} style={{ padding: '2px 8px' }}>
                          {batch.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedBatch ? (
              <>
                <TrustScoreCard score={selectedBatch.trustScore} />
                {selectedBatch.stages && selectedBatch.stages.length > 0 && (
                  <MapView stages={selectedBatch.stages} height="400px" />
                )}
                <SimulationControls batchId={selectedBatch.batchId} onSimulationComplete={handleSimulationUpdate} />
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
                <h3 style={{ marginBottom: '8px' }}>Select a Batch</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Choose a batch from the list to view details</p>
              </div>
            )}
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
