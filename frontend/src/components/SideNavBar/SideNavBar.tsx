import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SideNavBarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();

  const navItems = [
    { path: '/common/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/userMaster', label: 'User Master', icon: '👥' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/change-password', label: 'Change Password', icon: '🔒' },
  ];

  return (
    <div
      style={{
        width: isCollapsed ? '60px' : '250px',
        backgroundColor: '#1f2937',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        transition: 'width 0.3s ease',
        zIndex: 100,
      }}
    >
      <div style={{ padding: '1rem' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1.5rem',
          }}
        >
          {isCollapsed ? '☰' : '✕'}
        </button>
      </div>

      <nav style={{ marginTop: '1rem' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'block',
              padding: '1rem',
              color: 'white',
              textDecoration: 'none',
              backgroundColor: location.pathname === item.path ? '#374151' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ marginRight: isCollapsed ? '0' : '0.5rem' }}>{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default SideNavBar;
