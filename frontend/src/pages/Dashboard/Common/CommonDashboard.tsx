import React from 'react';
import { useAppSelector } from '../../../store/hooks';

const CommonDashboard: React.FC = () => {
  const userInfo = useAppSelector((state) => state.auth.userInfo);

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '2rem',
        borderRadius: '0.5rem',
        marginTop: '1rem',
      }}>
        <h2>Welcome, {userInfo?.name || userInfo?.email}!</h2>
        <p>Role: {userInfo?.role || 'User'}</p>
        <p>Status: Active</p>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>Quick Stats</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <h4>Total Users</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</p>
            </div>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <h4>Active Sessions</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>1</p>
            </div>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <h4>Pending Tasks</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonDashboard;
