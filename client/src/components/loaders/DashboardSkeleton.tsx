/**
 * Professional Dashboard Skeleton Loaders
 * Mimics the exact layout of AdminEnhancedDashboard
 * Based on GridArc/Smart Purchase quality standards
 */

import React from 'react';
import {
  Skeleton,
  SkeletonMetricCard,
  SkeletonChart,
  SkeletonGroup
} from '../ui/Skeleton';
import { Activity } from 'lucide-react';

/**
 * Stats Card Skeleton Loader
 * Uses the centralized SkeletonMetricCard component
 */
export const StatsCardSkeleton: React.FC = () => {
  return <SkeletonMetricCard />;
};

/**
 * Chart Card Skeleton Loader with animated bars
 * Matches the exact styling from AdminEnhancedDashboard
 */
export const ChartCardSkeleton: React.FC<{ height?: number; title?: string }> = ({
  height = 224,
  title
}) => {
  return <SkeletonChart height={height} />;
};

/**
 * Full Dashboard Skeleton Loader
 * Mimics the exact layout of AdminEnhancedDashboard (no quick actions)
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <SkeletonGroup className="space-y-6">
      {/* Key Metrics Section - Exactly matches AdminEnhancedDashboard */}
      <section aria-labelledby="stats-heading">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              id="stats-heading"
              className="text-section-header uppercase tracking-wide"
            >
              <Skeleton className="h-5 w-32" animation="shimmer" />
            </h2>
            <Skeleton className="h-3 w-64 mt-1" animation="shimmer" style={{ animationDelay: '50ms' }} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium">Live</span>
          </div>
        </div>

        {/* Stats Cards Grid - 4 columns */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      </section>

      {/* Growth Insights Section - Exactly matches AdminEnhancedDashboard */}
      <section className="space-y-6 border-t border-border/50 pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-section-header uppercase tracking-wide flex items-center gap-2">
              <Skeleton className="h-5 w-40" animation="shimmer" />
            </h2>
            <Skeleton className="h-3 w-72 mt-1" animation="shimmer" style={{ animationDelay: '50ms' }} />
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {/* Period selector skeleton */}
            <Skeleton variant="rounded" className="h-9 w-full sm:w-80 rounded-full" animation="pulse" />
          </div>
        </div>

        {/* Charts Grid - 2 columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCardSkeleton height={224} />
          <ChartCardSkeleton height={224} />
          <ChartCardSkeleton height={224} />
          <ChartCardSkeleton height={224} />
        </div>
      </section>
    </SkeletonGroup>
  );
};
