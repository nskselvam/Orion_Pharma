import React, { Suspense } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router-dom';

// Eager load critical components
import Renderpage from '../render/Renderpage';  
import Protected from '../private/Protected';
import IPCheckWrapper from '../private/IPCheckWrapper';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy load pages for better code splitting
const Login = React.lazy(() => import('../pages/Login/Login'));
const CommonDashboard = React.lazy(() => import('../pages/Dashboard/Common/CommonDashboard'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    fontSize: '14px',
    color: '#666'
  }}>
    <div>Loading...</div>
  </div>
);

// Wrapper for lazy routes
const LazyRoute = ({ Component }: { Component: React.LazyExoticComponent<React.FC> }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

// Router configuration
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Renderpage />}>
      <Route element={<IPCheckWrapper />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LazyRoute Component={Login} />} />
        
        <Route element={<Protected />}>
          <Route path="/common/dashboard" element={<LazyRoute Component={CommonDashboard} />} />
          {/* Add more protected routes here */}
        </Route>
      </Route>
      
      {/* Catch-all 404 */}
      <Route path="*" element={
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/login" style={{ color: '#1e3a8a' }}>Go to Login</a>
        </div>
      } />
    </Route>
  )
);

// App Router export
const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default AppRouter;
