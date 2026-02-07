/**
 * Public Layout
 * Wraps all public routes (homepage, events, info pages, etc.)
 * No authentication required - accessible to everyone
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { publicRoutes } from '../routes/publicRoutes';

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
 * PublicLayout Component
 * Renders all public routes with lazy loading
 * Accessible to everyone regardless of authentication status
 */
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
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
