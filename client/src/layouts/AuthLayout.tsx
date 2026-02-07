/**
 * Authentication Layout
 * Wraps all /auth/* routes
 * Provides consistent layout for authentication pages
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { authRoutes } from '../routes/authRoutes';

/**
 * Loading fallback component for suspense
 * Minimal inline loader - no full-screen spinner
 */
const LoadingFallback = () => (
  <div className="p-6">
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="h-4 w-96 bg-muted rounded"></div>
      </div>
      <div className="h-64 bg-muted rounded-xl"></div>
    </div>
  </div>
);

/**
 * AuthLayout Component
 * Renders all authentication routes with lazy loading
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {authRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default AuthLayout;
