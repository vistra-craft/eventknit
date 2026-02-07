/**
 * Elegant Dashboard Skeleton Loaders
 * Inspired by production-grade patterns for smooth loading UX
 */

import React from 'react';

/**
 * Shimmer animation effect
 */
const shimmerStyle = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes chartLine {
    0%, 100% { transform: scaleX(0); opacity: 0.3; }
    50% { transform: scaleX(1); opacity: 1; }
  }

  @keyframes pulse-soft {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

/**
 * Stats Card Skeleton Loader
 */
export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card-surface to-card p-5 shadow-sm">
      <style>{shimmerStyle}</style>

      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent"
        style={{
          animation: 'shimmer 2s infinite'
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          {/* Icon placeholder */}
          <div className="h-12 w-12 rounded-xl bg-muted/50 animate-pulse" />
          {/* Badge placeholder */}
          <div className="h-6 w-16 rounded-full bg-muted/50 animate-pulse" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Value placeholder */}
          <div className="h-8 w-28 rounded-lg bg-muted/50 animate-pulse" />
          {/* Title placeholder */}
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * Chart Card Skeleton Loader with animated lines
 */
export const ChartCardSkeleton: React.FC<{ title?: string }> = ({ title = "Chart Loading..." }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card-surface to-card p-5 shadow-sm">
      <style>{shimmerStyle}</style>

      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent"
        style={{
          animation: 'shimmer 2.5s infinite'
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            {/* Title skeleton */}
            <div className="h-5 w-40 rounded-lg bg-muted/50 animate-pulse" />
            {/* Subtitle skeleton */}
            <div className="h-3 w-56 rounded bg-muted/40 animate-pulse" />
          </div>
          {/* Icon placeholder */}
          <div className="h-10 w-10 rounded-lg bg-muted/50 animate-pulse" />
        </div>

        {/* Chart area with animated lines */}
        <div className="h-56 w-full rounded-lg bg-muted/20 relative overflow-hidden">
          {/* Animated chart lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full relative">
              {/* Line 1 */}
              <div
                className="absolute top-1/4 left-0 w-full h-0.5 bg-primary/40 rounded-full"
                style={{
                  animation: 'chartLine 2s ease-in-out infinite'
                }}
              />
              {/* Line 2 */}
              <div
                className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/30 rounded-full"
                style={{
                  animation: 'chartLine 2.5s ease-in-out infinite',
                  animationDelay: '0.3s'
                }}
              />
              {/* Line 3 */}
              <div
                className="absolute top-3/4 left-0 w-full h-0.5 bg-primary/20 rounded-full"
                style={{
                  animation: 'chartLine 3s ease-in-out infinite',
                  animationDelay: '0.6s'
                }}
              />
            </div>
          </div>

          {/* Animated data points */}
          <div className="absolute inset-0">
            {[0, 20, 40, 60, 80, 100].map((position, index) => (
              <div
                key={index}
                className="absolute w-2 h-2 rounded-full bg-primary/50"
                style={{
                  left: `${position}%`,
                  top: `${15 + Math.random() * 70}%`,
                  animation: 'pulse-soft 2s ease-in-out infinite',
                  animationDelay: `${index * 0.2}s`
                }}
              />
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-px bg-border/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Quick Action Card Skeleton
 */
export const QuickActionSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card-surface p-4 animate-pulse">
      {/* Icon */}
      <div className="h-10 w-10 rounded-lg bg-muted/50" />
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded bg-muted/50" />
        <div className="h-3 w-16 rounded bg-muted/40" />
      </div>
    </div>
  );
};

/**
 * Progress Bar Loader with shimmer
 */
export const ProgressBarLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-1 bg-muted/30 rounded-full overflow-hidden ${className}`}>
      <style>{shimmerStyle}</style>

      {/* Animated progress bar */}
      <div
        className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent"
        style={{
          animation: 'shimmer 1.5s ease-in-out infinite'
        }}
      />
    </div>
  );
};

/**
 * Full Dashboard Skeleton Loader
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Progress indicator */}
      <ProgressBarLoader />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionSkeleton />
        <QuickActionSkeleton />
        <QuickActionSkeleton />
        <QuickActionSkeleton />
      </div>

      {/* Charts Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton title="Organizer Growth" />
        <ChartCardSkeleton title="Events Created" />
        <ChartCardSkeleton title="Platform Revenue" />
        <ChartCardSkeleton title="Attendees / Users" />
      </div>
    </div>
  );
};
