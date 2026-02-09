import { cn } from '@/lib/utils';
import type { CSSProperties, ReactNode } from 'react';

// ============================================================================
// Core Skeleton Component
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rounded' | 'text';
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'shimmer',
  width,
  height,
  style,
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    text: 'rounded h-4',
  };

  const animationClasses = {
    pulse: 'skeleton-pulse',
    shimmer: 'skeleton-shimmer',
    wave: 'skeleton-wave',
    none: 'skeleton-static',
  };

  return (
    <div
      className={cn(
        'skeleton-base',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// ============================================================================
// Skeleton Text - For multi-line text placeholders
// ============================================================================

interface SkeletonTextProps {
  lines?: number;
  gap?: number;
  lastLineWidth?: string;
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
}

export function SkeletonText({
  lines = 3,
  gap = 8,
  lastLineWidth = '60%',
  className,
  animation = 'shimmer',
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)} style={{ gap: `${gap}px` }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          animation={animation}
          className="h-3"
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
            animationDelay: `${i * 75}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Skeleton Avatar
// ============================================================================

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
}

export function SkeletonAvatar({
  size = 'md',
  className,
  animation = 'shimmer',
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton
      variant="circular"
      animation={animation}
      className={cn(sizeClasses[size], className)}
    />
  );
}

// ============================================================================
// Content-Aware Skeletons for Dashboard
// ============================================================================

// Matches dashboard metric cards - exact styling from AdminEnhancedDashboard
export function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" animation="shimmer" />
          <Skeleton className="h-8 w-28" animation="shimmer" style={{ animationDelay: '50ms' }} />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-5 w-14 rounded-full" animation="shimmer" style={{ animationDelay: '100ms' }} />
            <Skeleton className="h-3 w-20" animation="shimmer" style={{ animationDelay: '150ms' }} />
          </div>
        </div>
        <Skeleton variant="rounded" className="h-16 w-16" animation="pulse" />
      </div>
    </div>
  );
}

// Matches chart components - exact styling from AdminEnhancedDashboard
interface SkeletonChartProps {
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function SkeletonChart({
  height = 224,
  className,
}: SkeletonChartProps) {
  return (
    <div className={cn('group rounded-2xl border border-border/40 bg-card p-6 shadow-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" animation="shimmer" />
          <Skeleton className="h-4 w-48" animation="shimmer" style={{ animationDelay: '50ms' }} />
        </div>
        <Skeleton variant="rounded" className="h-7 w-20 rounded-full" animation="pulse" />
      </div>
      {/* Chart area with animated bars/lines simulation */}
      <div
        className="relative overflow-hidden rounded-lg flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="absolute inset-0 flex items-end justify-around gap-2 px-4 pb-8">
          {[65, 45, 80, 55, 70, 40, 85].map((h, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              animation="wave"
              className="flex-1"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 100}ms`,
                maxWidth: '60px',
              }}
            />
          ))}
        </div>
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-3 w-8"
              animation="pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Matches donut chart
export function SkeletonDonutChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <div className="p-6 pb-4 border-b border-border">
        <Skeleton className="h-5 w-32" animation="shimmer" />
        <Skeleton className="h-3 w-40 mt-2" animation="shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <div className="p-6 flex flex-col items-center">
        {/* Donut chart placeholder */}
        <div className="relative">
          <Skeleton variant="circular" className="h-44 w-44" animation="wave" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-card" />
          </div>
        </div>
        {/* Legend */}
        <div className="w-full mt-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton variant="circular" className="h-3 w-3" animation="pulse" />
                <Skeleton className="h-3 w-20" animation="shimmer" style={{ animationDelay: `${i * 50}ms` }} />
              </div>
              <Skeleton className="h-3 w-12" animation="shimmer" style={{ animationDelay: `${i * 50 + 25}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced table skeleton
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showAvatar?: boolean;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  showAvatar = true,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {showHeader && (
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Skeleton className="h-5 w-32" animation="shimmer" />
          <Skeleton className="h-4 w-16" animation="pulse" />
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="p-4 flex items-center gap-4"
            style={{ animationDelay: `${rowIndex * 75}ms` }}
          >
            {showAvatar && (
              <SkeletonAvatar size="md" animation="shimmer" />
            )}
            <div className="flex-1 flex items-center gap-4">
              {Array.from({ length: columns - (showAvatar ? 1 : 0) }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(
                    colIndex === 0 ? 'flex-1' : 'w-20',
                    'space-y-1'
                  )}
                >
                  <Skeleton
                    className={cn('h-4', colIndex === 0 ? 'w-3/4' : 'w-full')}
                    animation="shimmer"
                    style={{ animationDelay: `${(rowIndex * columns + colIndex) * 30}ms` }}
                  />
                  {colIndex === 0 && (
                    <Skeleton
                      className="h-3 w-1/2"
                      animation="shimmer"
                      style={{ animationDelay: `${(rowIndex * columns + colIndex) * 30 + 15}ms` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Layout Skeletons for full page loading
// ============================================================================

interface SkeletonPageHeaderProps {
  showActions?: boolean;
  className?: string;
}

export function SkeletonPageHeader({ showActions = true, className }: SkeletonPageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" animation="shimmer" />
        <Skeleton className="h-4 w-64" animation="shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      {showActions && (
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" className="h-10 w-24" animation="pulse" />
          <Skeleton variant="rounded" className="h-10 w-32" animation="pulse" />
        </div>
      )}
    </div>
  );
}

// Skeleton wrapper with stagger animation
interface SkeletonGroupProps {
  children: ReactNode;
  className?: string;
}

export function SkeletonGroup({ children, className }: SkeletonGroupProps) {
  return (
    <div className={cn('skeleton-group', className)}>
      {children}
    </div>
  );
}
