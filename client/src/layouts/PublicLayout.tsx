/**
 * Public Layout
 * Wraps all public routes (homepage, events, info pages, etc.)
 * No authentication required - accessible to everyone
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { publicRoutes } from '../routes/publicRoutes';
import { Skeleton, SkeletonGroup } from '../components/ui/Skeleton';

/**
 * Loading fallback component for suspense
 * Professional skeleton loader for public pages
 */
const LoadingFallback = () => (
  <div className="min-h-screen bg-background">
    <SkeletonGroup className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" animation="shimmer" />
        <Skeleton className="h-5 w-96" animation="shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} variant="rounded" className="h-64" animation="pulse" />
        ))}
      </div>
    </SkeletonGroup>
  </div>
);

/**
 * PublicLayout Component
 * Renders all public routes with lazy loading
 * Accessible to everyone regardless of authentication status
 */
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {publicRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default PublicLayout;
