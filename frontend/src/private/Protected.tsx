import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

const Protected = () => {
  const userInfo = useAppSelector((state) => state.auth.userInfo);

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default Protected;
