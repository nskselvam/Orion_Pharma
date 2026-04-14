import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAllBatchesQuery } from '../redux-slice/pharmaApiSlice';

const Inventory: React.FC = () => {
  const { data: batchesResponse, isLoading } = useGetAllBatchesQuery();

  // Unwrap API response
  const batches = (batchesResponse as any)?.data || [];

  const inventoryBatches = batches.filter((batch: any) =>
    batch.status === 'delivered' || batch.currentStage === 'pharmacy'
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
              <Link to="/inventory" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', textDecoration: 'none' }}>Inventory</Link>
              <Link to="/cold-chain" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Cold Chain</Link>
              <Link to="/verify" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Verify</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <h1 className="section-title">Inventory</h1>
          <p className="section-subtitle">Batches currently available at the pharmacy, including quarantined shipments.</p>
        </div>
      </section>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Summary Card */}
        <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Pharmacy batches
            </p>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '4px' }}>{inventoryBatches.length}</h2>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Showing batches that have reached <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>pharmacy</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="card empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : inventoryBatches.length === 0 ? (
          /* Empty State */
          <div className="card empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-title">No pharmacy batches yet</p>
            <p className="empty-state-text">Once a batch reaches the pharmacy it will appear here.</p>
          </div>
        ) : (
          /* Batch List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {inventoryBatches.map((batch: any) => (
              <div key={batch.batchId} className="card card-hover">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>{batch.batchId}</h3>
                        <span className={`badge ${batch.status === 'compromised' ? 'badge-danger' : 'badge-success'}`}>
                          {batch.status === 'compromised' ? 'Quarantined' : 'Delivered'}
                        </span>
                        <span className={`badge ${
                          batch.trustScore >= 85 ? 'badge-success' : 
                          batch.trustScore >= 65 ? 'badge-warning' : 'badge-danger'
                        }`}>
                          Trust Score: {batch.trustScore}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{batch.medicineName}</p>
                    </div>
                    <Link to={`/batch/${batch.batchId}`} className="btn-secondary" style={{ textDecoration: 'none', fontSize: '13px', padding: '8px 16px' }}>
                      View Details
                    </Link>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Origin
                      </p>
                      <p style={{ fontWeight: '500', marginTop: '4px' }}>{batch.origin}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Quantity
                      </p>
                      <p style={{ fontWeight: '500', marginTop: '4px' }}>{batch.quantityInStock ? batch.quantityInStock.toLocaleString() : 'N/A'} units</p>
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
                          fontWeight: '500',
                          marginTop: '4px',
                          color: batch.temperature && (batch.temperature < batch.targetTempMin || batch.temperature > batch.targetTempMax) 
                            ? 'var(--danger)' 
                            : 'var(--success)',
                        }}
                      >
                        {batch.temperature ? `${batch.temperature}°C` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Manufacturing Date
                      </p>
                      <p style={{ fontWeight: '500', marginTop: '4px' }}>{batch.manufacturingDate ? formatDate(batch.manufacturingDate) : 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Expiry Date
                      </p>
                      <p style={{ fontWeight: '500', marginTop: '4px' }}>{batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Inventory;
