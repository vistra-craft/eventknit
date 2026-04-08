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
 * Two-panel skeleton for SignIn / SignUp:
 * Left 55% ambient panel (desktop) + Right 45% card with floating-label inputs
 */
const TwoPanelAuthSkeleton = () => (
  <div className="min-h-screen w-full flex overflow-hidden bg-background">
    {/* Left panel — ambient (hidden on mobile) */}
    <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-background">
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
        {/* Logo */}
        <Skeleton className="h-8 w-28 mb-12" animation="shimmer" variant="rounded" />
        {/* Headline */}
        <div className="space-y-3 mb-6">
          <Skeleton className="h-10 w-64" animation="shimmer" />
          <Skeleton className="h-10 w-48" animation="shimmer" style={{ animationDelay: '50ms' }} />
        </div>
        {/* Description */}
        <div className="space-y-2 mb-12">
          <Skeleton className="h-4 w-80 max-w-full" animation="pulse" />
          <Skeleton className="h-4 w-64" animation="pulse" style={{ animationDelay: '50ms' }} />
        </div>
        {/* Feature pills */}
        <div className="flex gap-3">
          <Skeleton className="h-9 w-36 rounded-full" animation="pulse" />
          <Skeleton className="h-9 w-36 rounded-full" animation="pulse" style={{ animationDelay: '50ms' }} />
          <Skeleton className="h-9 w-40 rounded-full" animation="pulse" style={{ animationDelay: '100ms' }} />
        </div>
      </div>
    </div>

    {/* Right panel — card */}
    <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-8 sm:p-10 space-y-5">
            {/* Mobile logo */}
            <div className="flex justify-center lg:hidden">
              <Skeleton className="h-8 w-28 mb-4" animation="shimmer" variant="rounded" />
            </div>
            {/* Header */}
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-32 mx-auto" animation="shimmer" />
              <Skeleton className="h-4 w-56 mx-auto" animation="shimmer" style={{ animationDelay: '50ms' }} />
            </div>
            {/* Social buttons */}
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-lg" animation="pulse" />
              <Skeleton className="h-10 flex-1 rounded-lg" animation="pulse" style={{ animationDelay: '50ms' }} />
            </div>
            {/* Divider */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-px flex-1" animation="pulse" />
              <Skeleton className="h-3 w-28" animation="pulse" />
              <Skeleton className="h-px flex-1" animation="pulse" />
            </div>
            {/* Floating-label inputs */}
            <Skeleton className="h-14 w-full rounded-xl" animation="pulse" />
            <Skeleton className="h-14 w-full rounded-xl" animation="pulse" style={{ animationDelay: '50ms' }} />
            {/* Remember me + forgot */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36" animation="pulse" />
              <Skeleton className="h-4 w-28" animation="pulse" />
            </div>
            {/* Submit */}
            <Skeleton className="h-10 w-full rounded-lg" animation="shimmer" />
            {/* Sign up link */}
            <Skeleton className="h-4 w-44 mx-auto" animation="pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Centered card skeleton for ForgotPassword / ResetPassword:
 * Full-page ambient background + centered opaque card
 */
const SimpleAuthSkeleton = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="w-full max-w-md px-6">
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-8 sm:p-10 space-y-5">
          {/* Logo */}
          <div className="flex justify-center">
            <Skeleton className="h-8 w-28 mb-4" animation="shimmer" variant="rounded" />
          </div>
          {/* Title + subtitle */}
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" animation="shimmer" />
            <Skeleton className="h-4 w-64 mx-auto" animation="shimmer" style={{ animationDelay: '50ms' }} />
          </div>
          {/* Floating-label input */}
          <Skeleton className="h-14 w-full rounded-xl" animation="pulse" />
          {/* Submit button */}
          <Skeleton className="h-10 w-full rounded-lg" animation="shimmer" />
          {/* Back link */}
          <Skeleton className="h-4 w-32 mx-auto" animation="pulse" />
          {/* Help text */}
          <Skeleton className="h-3 w-56 mx-auto" animation="pulse" />
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
