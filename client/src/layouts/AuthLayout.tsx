/**
 * Authentication Layout
 * Wraps all /auth/* routes
 * Provides consistent layout for authentication pages
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { authRoutes } from '../routes/authRoutes';
import { Skeleton } from '../components/ui/Skeleton';

/**
 * Two-panel skeleton for SignIn / SignUp: max-w-4xl, left image + right form
 */
const TwoPanelAuthSkeleton = () => (
  <div className="bg-background min-h-screen flex items-center justify-center">
    <div className="p-4 w-full">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl shadow-md overflow-hidden flex flex-col lg:flex-row">
          {/* Left panel — image (hidden on mobile) */}
          <div className="hidden lg:block lg:w-1/2">
            <Skeleton className="h-full min-h-[500px] w-full rounded-none" animation="shimmer" />
          </div>

          {/* Right panel — form */}
          <div className="w-full lg:w-1/2 p-5 lg:p-6">
            <div className="w-full max-w-md mx-auto space-y-5">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24" animation="shimmer" />
                <Skeleton className="h-8 w-24" animation="shimmer" variant="rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-7 w-56" animation="shimmer" />
                <Skeleton className="h-4 w-72 max-w-full" animation="shimmer" style={{ animationDelay: '50ms' }} />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-11 flex-1 rounded-lg" animation="pulse" />
                <Skeleton className="h-11 flex-1 rounded-lg" animation="pulse" style={{ animationDelay: '50ms' }} />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-px flex-1" animation="pulse" />
                <Skeleton className="h-3 w-8" animation="pulse" />
                <Skeleton className="h-px flex-1" animation="pulse" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" animation="shimmer" />
                  <Skeleton className="h-10 w-full rounded-lg" animation="pulse" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" animation="shimmer" />
                  <Skeleton className="h-10 w-full rounded-lg" animation="pulse" style={{ animationDelay: '50ms' }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36" animation="pulse" />
                <Skeleton className="h-4 w-28" animation="pulse" />
              </div>
              <Skeleton className="h-11 w-full rounded-lg" animation="shimmer" />
              <Skeleton className="h-4 w-48 mx-auto" animation="pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Single-card skeleton for ForgotPassword / ResetPassword: max-w-md, centered card
 */
const SimpleAuthSkeleton = () => (
  <div className="bg-background min-h-screen flex items-center justify-center">
    <div className="p-4 w-full">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card rounded-2xl shadow-md overflow-hidden">
          <div className="p-5 lg:p-6 space-y-5">
            {/* Back + Logo */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" animation="shimmer" />
              <Skeleton className="h-8 w-24" animation="shimmer" variant="rounded" />
            </div>
            {/* Title + subtitle */}
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" animation="shimmer" />
              <Skeleton className="h-4 w-72 max-w-full" animation="shimmer" style={{ animationDelay: '50ms' }} />
            </div>
            {/* Email field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" animation="shimmer" />
              <Skeleton className="h-11 w-full rounded-lg" animation="pulse" />
            </div>
            {/* Submit button */}
            <Skeleton className="h-11 w-full rounded-lg" animation="shimmer" />
            {/* Bottom link */}
            <Skeleton className="h-4 w-48 mx-auto" animation="pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Route-aware loading fallback
 * Shows the correct skeleton based on which auth page is loading
 */
const LoadingFallback = () => {
  const path = window.location.pathname;

  // ForgotPassword, ResetPassword, MagicLink — single centered card
  if (path.includes('forgot-password') || path.includes('reset-password') || path.includes('magic-link')) {
    return <SimpleAuthSkeleton />;
  }

  // SignIn, SignUp, Register — two-panel card
  return <TwoPanelAuthSkeleton />;
};

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
