/**
 * Public Layout
 * Wraps all public routes (homepage, events, info pages, etc.)
 * No authentication required - accessible to everyone
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { publicRoutes } from '../routes/publicRoutes';
import { Skeleton } from '../components/ui/Skeleton';
import { EventDetailsSkeleton } from '../components/event-details/EventDetailsSkeleton';
import { RegisterEventSkeleton } from '../components/loaders/RegisterEventSkeleton';

/**
 * Shared navbar skeleton used across public page fallbacks
 */
const NavbarSkeleton = () => (
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
);

/**
 * Homepage skeleton — Full-bleed Hero → Floating Search → Popular → Event Grid → Dark Footer
 */
const HomeSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <NavbarSkeleton />
    <main className="flex-1">
      {/* Hero — full-bleed, matches h-[480px] sm:h-[500px] lg:h-[560px] */}
      <div className="relative h-[480px] sm:h-[500px] lg:h-[560px] bg-muted/40 overflow-hidden">
        <Skeleton className="absolute inset-0" animation="shimmer" />
        {/* Gradient overlay mimic */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* Content at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 bg-white/15" animation="pulse" variant="rounded" />
            <Skeleton className="h-4 w-24 bg-white/10" animation="pulse" />
          </div>
          <Skeleton className="h-9 w-80 max-w-full bg-white/15" animation="pulse" />
          <div className="flex flex-wrap items-center gap-5">
            <Skeleton className="h-4 w-36 bg-white/10" animation="pulse" />
            <Skeleton className="h-4 w-44 bg-white/10" animation="pulse" />
            <Skeleton className="h-4 w-16 bg-white/10" animation="pulse" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Skeleton className="h-1.5 w-8 bg-white/20" variant="rounded" animation="pulse" />
              <Skeleton className="h-1.5 w-1.5 bg-white/15" variant="circular" animation="pulse" />
              <Skeleton className="h-1.5 w-1.5 bg-white/15" variant="circular" animation="pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Search filter — floating glassmorphic card overlapping hero */}
      <section className="relative z-20 -mt-6 pb-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="flex-1 h-11 rounded-xl" animation="shimmer" />
              <Skeleton className="h-11 w-11 rounded-xl" animation="shimmer" />
            </div>
          </div>
        </div>
      </section>

      {/* Popular this week skeleton */}
      <section className="py-10 px-6">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5 rounded" animation="shimmer" />
            <Skeleton className="h-6 w-44" animation="shimmer" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl border border-border/40 bg-card" style={{ animationDelay: `${(i - 1) * 80}ms` }}>
                <Skeleton className="w-20 h-20 rounded-lg shrink-0" animation="shimmer" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" animation="pulse" />
                  <Skeleton className="h-3 w-1/2" animation="pulse" />
                  <Skeleton className="h-3 w-1/3" animation="pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event grid skeleton — matches real EventCard structure */}
      <section className="pb-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/40" style={{ animationDelay: `${(i - 1) * 60}ms` }}>
                {/* Accent strip */}
                <div className="h-[2px] bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/5 to-transparent" />
                {/* Image */}
                <div className="relative h-56 sm:h-64 bg-muted overflow-hidden">
                  <Skeleton className="absolute inset-0" animation="shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                </div>
                {/* Date block + content row */}
                <div className="flex gap-3 p-4">
                  <div className="shrink-0 w-12 space-y-1.5 text-center">
                    <Skeleton className="h-2.5 w-8 mx-auto" animation="pulse" />
                    <Skeleton className="h-6 w-8 mx-auto" animation="pulse" />
                    <Skeleton className="h-2.5 w-8 mx-auto" animation="pulse" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" animation="pulse" style={{ animationDelay: `${i * 60}ms` }} />
                    <Skeleton className="h-3 w-3/4" animation="pulse" style={{ animationDelay: `${i * 60 + 40}ms` }} />
                    <Skeleton className="h-3.5 w-1/3" animation="pulse" style={{ animationDelay: `${i * 60 + 80}ms` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

    {/* Footer skeleton — dark in light mode, blends in dark mode */}
    <div className="bg-neutral-950 dark:bg-background border-t border-orange-500/20 dark:border-border">
      <div className="h-0.5 bg-gradient-to-r from-orange-600/30 via-orange-500/20 to-orange-600/30 dark:from-orange-500/40 dark:via-orange-500/60 dark:to-orange-500/40" />
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="space-y-4">
              <Skeleton className="h-4 w-20 bg-neutral-800 dark:bg-muted" animation="shimmer" />
              <div className="space-y-3">
                <Skeleton className="h-3 w-24 bg-neutral-800/60 dark:bg-muted/60" animation="pulse" />
                <Skeleton className="h-3 w-28 bg-neutral-800/60 dark:bg-muted/60" animation="pulse" />
                <Skeleton className="h-3 w-20 bg-neutral-800/60 dark:bg-muted/60" animation="pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-800 dark:border-border mt-10 pt-6 flex items-center justify-between">
          <Skeleton className="h-5 w-32 bg-neutral-800 dark:bg-muted" animation="shimmer" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-8 bg-neutral-800/60 dark:bg-muted/60" animation="pulse" variant="circular" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * About page skeleton — mirrors the actual About page structure:
 * Hero (full-bleed) → Stats bar → Platform overview (2-col) →
 * Feature timeline (zigzag) → Partners (2-col) → CTA (full-bleed)
 */
const AboutSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-background">
    {/* Hero — full bleed dark block */}
    <div className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[650px] bg-muted/40">
      <NavbarSkeleton />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <Skeleton className="h-10 sm:h-12 w-72 sm:w-96 mx-auto" animation="shimmer" />
          <Skeleton className="h-4 w-80 sm:w-[28rem] mx-auto" animation="shimmer" style={{ animationDelay: '50ms' }} />
          <Skeleton className="h-4 w-64 sm:w-80 mx-auto" animation="shimmer" style={{ animationDelay: '100ms' }} />
          <div className="flex gap-3 justify-center pt-4">
            <Skeleton className="h-11 w-32" animation="shimmer" variant="rounded" />
            <Skeleton className="h-11 w-32" animation="shimmer" variant="rounded" style={{ animationDelay: '50ms' }} />
          </div>
        </div>
      </div>
    </div>

    {/* Stats bar — hidden until real data is wired up */}
    <div className="hidden border-y border-border bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="text-center py-6 sm:py-8 space-y-2">
              <Skeleton className="h-8 w-20 mx-auto" animation="pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <Skeleton className="h-3 w-16 mx-auto" animation="pulse" style={{ animationDelay: `${i * 80 + 40}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Platform overview — 2 columns */}
    <div className="py-20 sm:py-28 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" animation="shimmer" />
            <Skeleton className="h-4 w-full" animation="pulse" style={{ animationDelay: '50ms' }} />
            <Skeleton className="h-4 w-full" animation="pulse" style={{ animationDelay: '100ms' }} />
            <Skeleton className="h-4 w-3/4" animation="pulse" style={{ animationDelay: '150ms' }} />
            <Skeleton className="h-4 w-full" animation="pulse" style={{ animationDelay: '200ms' }} />
            <Skeleton className="h-4 w-2/3" animation="pulse" style={{ animationDelay: '250ms' }} />
          </div>
          <Skeleton className="aspect-[4/3] w-full rounded-xl" animation="shimmer" />
        </div>
      </div>
    </div>

    {/* Features timeline — zigzag */}
    <div className="py-20 sm:py-28 px-6 bg-muted/20">
      <div className="container mx-auto max-w-2xl lg:max-w-5xl">
        <div className="text-center mb-14 space-y-3">
          <Skeleton className="h-8 w-56 mx-auto" animation="shimmer" />
          <Skeleton className="h-4 w-80 mx-auto" animation="shimmer" style={{ animationDelay: '50ms' }} />
        </div>
        {/* Timeline nodes */}
        <div className="space-y-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[40px_1fr] lg:grid-cols-[1fr_48px_1fr] gap-4 lg:gap-6">
              {/* Desktop: left card on even */}
              <div className="hidden lg:block">
                {i % 2 === 0 && <Skeleton className="h-48 w-full rounded-2xl" animation="pulse" style={{ animationDelay: `${i * 100}ms` }} />}
              </div>
              {/* Spine dot */}
              <div className="flex flex-col items-center">
                <Skeleton className="w-10 h-10 lg:w-11 lg:h-11 shrink-0" animation="shimmer" variant="circular" style={{ animationDelay: `${i * 100}ms` }} />
                {i < 3 && <Skeleton className="w-px flex-1 min-h-[24px] lg:min-h-[40px]" animation="pulse" />}
              </div>
              {/* Mobile: always right. Desktop: right card on odd */}
              <div className="lg:hidden">
                <Skeleton className="h-48 w-full rounded-2xl" animation="pulse" style={{ animationDelay: `${i * 100}ms` }} />
              </div>
              <div className="hidden lg:block">
                {i % 2 !== 0 && <Skeleton className="h-48 w-full rounded-2xl" animation="pulse" style={{ animationDelay: `${i * 100}ms` }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Partners — 2 columns */}
    <div className="py-20 sm:py-28 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-4">
            <Skeleton className="h-8 w-72" animation="shimmer" />
            <Skeleton className="h-4 w-full" animation="pulse" style={{ animationDelay: '50ms' }} />
            <Skeleton className="h-4 w-3/4" animation="pulse" style={{ animationDelay: '100ms' }} />
            {/* Marquee rows */}
            <div className="mt-6 space-y-3">
              <div className="flex gap-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl" animation="shimmer" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
              <div className="flex gap-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl" animation="shimmer" style={{ animationDelay: `${i * 60 + 30}ms` }} />
                ))}
              </div>
            </div>
          </div>
          {/* Africa map placeholder */}
          <Skeleton className="aspect-[3/4] max-w-[400px] mx-auto w-full rounded-xl" animation="shimmer" />
        </div>
      </div>
    </div>

    {/* CTA — full bleed dark block */}
    <Skeleton className="min-h-[360px] sm:min-h-[420px] w-full" animation="shimmer" />
  </div>
);

/**
 * Generic page skeleton — for info pages, support, etc.
 */
const GenericPageSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <NavbarSkeleton />
    <main className="flex-1 pt-16">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-64" animation="shimmer" />
        <Skeleton className="h-4 w-96 max-w-full" animation="shimmer" style={{ animationDelay: '50ms' }} />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full" animation="pulse" />
          <Skeleton className="h-4 w-full" animation="pulse" style={{ animationDelay: '50ms' }} />
          <Skeleton className="h-4 w-3/4" animation="pulse" style={{ animationDelay: '100ms' }} />
        </div>
      </div>
    </main>
  </div>
);

/**
 * Route-aware loading fallback
 * Reads the current URL to show the correct skeleton for each page type
 */
const LoadingFallback = () => {
  const path = window.location.pathname;

  // Homepage
  if (path === '/' || path === '') {
    return <HomeSkeleton />;
  }

  // Event details page: /event/:id (but not /event/:id/register, /event/:id/payment, etc.)
  if (/^\/event\/[^/]+$/.test(path)) {
    return <EventDetailsSkeleton />;
  }

  // Event registration: /event/:id/register
  if (/^\/event\/[^/]+\/register$/.test(path)) {
    return <RegisterEventSkeleton />;
  }

  // About page
  if (path === '/about') {
    return <AboutSkeleton />;
  }

  // All other public pages
  return <GenericPageSkeleton />;
};

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
