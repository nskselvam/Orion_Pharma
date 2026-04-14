import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

const roleDescriptions: Record<string, string> = {
  manufacturer: 'Create batches, initialize shipment records, and anchor first proofs on chain.',
  distributor: 'Track in-transit batches, monitor excursions, and update movement checkpoints.',
  pharmacy: 'Receive batches, verify authenticity, and move compromised stock to quarantine.',
  admin: 'View full system health, alerts, and cross-role operational metrics.'
};

const RoleDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.userInfo);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || 'admin').toLowerCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Role-Based Access Control
          </p>
          <h1 style={{ fontSize: '30px', marginTop: '8px' }}>Welcome, {user.name || user.email}</h1>
          <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
            Current role: <strong style={{ color: 'var(--text-primary)' }}>{role}</strong>
          </p>
          <p style={{ marginTop: '10px' }}>{roleDescriptions[role] || roleDescriptions.admin}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <Link to="/" className="card card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '18px' }}>Operations Dashboard</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
              Shipment overview and batch management.
            </p>
          </Link>

          <Link to="/cold-chain" className="card card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '18px' }}>Cold Chain</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
              Temperature compliance and active breaches.
            </p>
          </Link>

          <Link to="/inventory" className="card card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '18px' }}>Inventory</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
              Pharmacy-available and quarantined stock.
            </p>
          </Link>

          <Link to="/verify" className="card card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '18px' }}>Public Verify</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
              Batch authenticity and blockchain proof viewer.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default RoleDashboard;
