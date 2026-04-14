import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface RoleProtectedProps {
  allowedRoles: string[];
}

const RoleProtected: React.FC<RoleProtectedProps> = ({ allowedRoles }) => {
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const role = (userInfo?.role || '').toLowerCase();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
    return <Navigate to="/role-dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleProtected;
