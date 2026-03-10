/**
 * Public Layout
 * Wraps all public routes (homepage, events, info pages, etc.)
 * No authentication required - accessible to everyone
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { publicRoutes } from '../routes/publicRoutes';
import { Skeleton } from '../components/ui/Skeleton';

/**
 * Loading fallback component for suspense
 * Mimics the actual home page structure: Navbar → Hero → Search/Filter → Event Grid → Footer
 */
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col bg-background">
    {/* Navbar skeleton */}
    <div className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-6 flex items-center h-16 justify-between">
        <Skeleton className="h-8 w-28" animation="shimmer" variant="rounded" />
        <div className="hidden md:flex items-center gap-6">
          <Skeleton className="h-4 w-16" animation="shimmer" />
          <Skeleton className="h-4 w-16" animation="shimmer" style={{ animationDelay: '50ms' }} />
          <Skeleton className="h-4 w-16" animation="shimmer" style={{ animationDelay: '100ms' }} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20" animation="shimmer" variant="rounded" />
          <Skeleton className="h-9 w-9" animation="shimmer" variant="circular" />
        </div>
      </div>
    </div>

    <main className="flex-1 pt-16">
      {/* Hero skeleton */}
      <div className="container mx-auto px-6 py-6">
        <div className="relative rounded-2xl overflow-hidden h-[400px] lg:h-[450px]">
          <Skeleton className="absolute inset-0 rounded-2xl" animation="shimmer" />
          {/* Hero content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 space-y-4">
            <Skeleton className="h-5 w-24" animation="pulse" variant="rounded" />
            <Skeleton className="h-9 w-80 max-w-full" animation="pulse" />
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-36" animation="pulse" />
              <Skeleton className="h-4 w-44" animation="pulse" />
              <Skeleton className="h-4 w-16" animation="pulse" />
            </div>
            {/* Dot indicators */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-1.5 w-8" variant="rounded" animation="pulse" />
              <Skeleton className="h-1.5 w-1.5" variant="circular" animation="pulse" />
              <Skeleton className="h-1.5 w-1.5" variant="circular" animation="pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Search filter skeleton */}
      <section className="pb-4 pt-6 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <Skeleton className="h-6 w-52 mb-3" animation="shimmer" />
          <div className="flex items-center gap-2">
            <Skeleton className="flex-1 h-10 rounded-full" animation="shimmer" />
            <Skeleton className="h-10 w-10 rounded-full" animation="shimmer" />
          </div>
        </div>
      </section>

      {/* Event grid skeleton */}
      <section className="pt-4 pb-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/40 skeleton-fade-in" style={{ animationDelay: `${(i - 1) * 60}ms` }}>
                <div>
                  {/* Card image */}
                  <Skeleton className="h-64 w-full" animation="shimmer" />
                  {/* Card details */}
                  <div className="pt-4 pb-2 pl-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" animation="pulse" />
                    <Skeleton className="h-4 w-1/2" animation="pulse" />
                    <Skeleton className="h-4 w-2/5" animation="pulse" />
                    <Skeleton className="h-4 w-3/5 mb-1" animation="pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

    {/* Footer skeleton */}
    <div className="border-t border-border/40 bg-card py-8">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between gap-6">
        <Skeleton className="h-6 w-28" animation="shimmer" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-16" animation="shimmer" />
          <Skeleton className="h-4 w-16" animation="shimmer" />
          <Skeleton className="h-4 w-16" animation="shimmer" />
        </div>
      </div>
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
