import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutSuccess } from '../../redux-slice/authSlice';

interface LogNavBarProps {
  data?: (string | null)[];
}

const LogNavBar: React.FC<LogNavBarProps> = ({ data }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.auth.userInfo);

  const handleLogout = () => {
    dispatch(logoutSuccess());
    navigate('/login');
  };

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
        Orion-PharmaTics {data?.[0] && `- ${data[0]}`}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span>Welcome, {userInfo?.name || userInfo?.email}</span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default LogNavBar;
