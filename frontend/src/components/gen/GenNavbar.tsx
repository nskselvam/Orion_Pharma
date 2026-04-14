import React from 'react';

const GenNavbar: React.FC = () => {
  return (
    <nav style={{
      backgroundColor: '#1e3a8a',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        Orion-PharmaTics
      </div>
      <div>
        <a href="/login" style={{ color: 'white', textDecoration: 'none' }}>
          Login
        </a>
      </div>
    </nav>
  );
};

export default GenNavbar;
