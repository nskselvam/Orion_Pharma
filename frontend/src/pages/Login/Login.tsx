import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useLoginMutation } from '../../redux-slice/authApiSlice';
import { loginSuccess } from '../../redux-slice/authSlice';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await loginMutation({ email, password }).unwrap();

      const userData = {
        ...response,
      };

      if (userData.user_status === 0) {
        dispatch(loginSuccess({ ...userData }));
        toast.info(userData.message || 'Please reset your password');
        navigate(`/reset-password`);
      } else if (userData.user_status === 1 && userData.user_Success) {
        dispatch(loginSuccess({ ...userData }));
        toast.success(userData.message || 'Login successful');
        navigate('/role-dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err.error || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="admin@example.com"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="password123"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Remember me
          </label>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Test credentials:</strong>
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Admin: admin@example.com / password123</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Manufacturer: manufacturer@example.com / manufacturer123</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Distributor: distributor@example.com / distributor123</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Pharmacy: pharmacy@example.com / pharmacy123</p>
      </div>
    </div>
  );
};

export default Login;
