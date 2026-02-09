/**
 * Authentication Layout
 * Wraps all /auth/* routes
 * Provides consistent layout for authentication pages
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { authRoutes } from '../routes/authRoutes';
import { Skeleton, SkeletonGroup } from '../components/ui/Skeleton';

/**
 * Loading fallback component for suspense
 * Professional skeleton loader for auth pages
 */
const LoadingFallback = () => (
  <SkeletonGroup className="p-6 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" animation="shimmer" />
      <Skeleton className="h-4 w-96" animation="shimmer" style={{ animationDelay: '50ms' }} />
    </div>
    <Skeleton variant="rounded" className="h-64 w-full" animation="pulse" />
  </SkeletonGroup>
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
