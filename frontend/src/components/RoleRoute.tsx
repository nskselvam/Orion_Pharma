import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface RoleRouteProps {
  allowedRoles: Array<'manufacturer' | 'distributor' | 'pharmacy' | 'admin'>;
  children: React.ReactNode;
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const userInfo = useSelector((state: any) => state.auth?.userInfo);
  const role = String(userInfo?.role || '').toLowerCase();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role as any)) {
    return <Navigate to="/role-dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
