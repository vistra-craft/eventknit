/**
 * Authentication Layout
 * Wraps all /auth/* routes
 * Provides consistent layout for authentication pages
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { authRoutes } from '../routes/authRoutes';

/**
 * Loading spinner component for suspense fallback
 */
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
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
      <Suspense fallback={<LoadingSpinner />}>
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
