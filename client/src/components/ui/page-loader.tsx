import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader } from "./loader";

/**
 * EventKnit Page Loader Component
 *
 * Full-page and section loading states with beautiful animations.
 *
 * USAGE:
 * <PageLoader /> - Full page loader
 * <PageLoader text="Loading events..." /> - With custom text
 * <PageLoader variant="minimal" /> - Minimal style
 * <SectionLoader /> - For loading sections within a page
 * <CardSkeleton /> - Skeleton placeholder for cards
 */

interface PageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  subtext?: string;
  variant?: "default" | "minimal" | "branded";
}

/**
 * Full Page Loader - Centered loader for entire page
 */
const PageLoader = React.forwardRef<HTMLDivElement, PageLoaderProps>(
  ({ text = "Loading...", subtext, variant = "default", className, ...props }, ref) => {
    if (variant === "minimal") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-center min-h-[400px] w-full",
            className
          )}
          {...props}
        >
          <Loader size="lg" />
        </div>
      );
    }

    if (variant === "branded") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center min-h-screen w-full bg-background",
            className
          )}
          {...props}
        >
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center animate-pulse">
              <span className="text-primary-foreground text-2xl font-bold">EK</span>
            </div>
            <div className="absolute -inset-2 bg-primary/20 rounded-3xl animate-ping" />
          </div>
          <Loader size="lg" variant="dots" className="mb-4" />
          <p className="text-lg font-medium text-foreground">{text}</p>
          {subtext && (
            <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>
      );
    }

    // Default variant
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center min-h-[400px] w-full",
          className
        )}
        {...props}
      >
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
          {/* Main loader */}
          <div className="relative bg-card-surface rounded-full p-4 shadow-lg border border-border">
            <Loader size="lg" />
          </div>
        </div>
        <p className="mt-6 text-base font-medium text-foreground">{text}</p>
        {subtext && (
          <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
    );
  }
);
PageLoader.displayName = "PageLoader";

/**
 * Section Loader - For loading content within a section
 */
interface SectionLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  height?: string;
}

const SectionLoader = React.forwardRef<HTMLDivElement, SectionLoaderProps>(
  ({ text, height = "200px", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center w-full rounded-2xl bg-muted/30 border border-border/50",
        className
      )}
      style={{ minHeight: height }}
      {...props}
    >
      <Loader size="default" />
      {text && (
        <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
);
SectionLoader.displayName = "SectionLoader";

/**
 * Inline Loader - Small loader for inline content
 */
const InlineLoader = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { text?: string }
>(({ text, className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("inline-flex items-center gap-2", className)}
    {...props}
  >
    <Loader size="sm" />
    {text && <span className="text-sm text-muted-foreground">{text}</span>}
  </span>
));
InlineLoader.displayName = "InlineLoader";

/**
 * Skeleton - Animated placeholder for loading content
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = "text", width, height, className, style, ...props }, ref) => {
    const baseClasses = "animate-pulse bg-muted";

    const variantClasses = {
      text: "rounded-md h-4",
      circular: "rounded-full",
      rectangular: "rounded-lg",
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        style={{
          width: width,
          height: height || (variant === "text" ? undefined : "100px"),
          ...style,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

/**
 * Card Skeleton - Placeholder for loading cards
 */
const CardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border bg-card-surface p-6 space-y-4",
      className
    )}
    {...props}
  >
    {/* Image placeholder */}
    <Skeleton variant="rectangular" height={160} className="w-full" />
    {/* Title */}
    <Skeleton variant="text" className="w-3/4 h-5" />
    {/* Description */}
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-5/6" />
    </div>
    {/* Footer */}
    <div className="flex items-center justify-between pt-2">
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="rectangular" width={80} height={36} />
    </div>
  </div>
));
CardSkeleton.displayName = "CardSkeleton";

/**
 * Table Skeleton - Placeholder for loading tables
 */
interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

const TableSkeleton = React.forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ rows = 5, columns = 4, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl border border-border overflow-hidden", className)}
      {...props}
    >
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" className="flex-1 h-4" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                variant="text"
                className="flex-1 h-4"
                style={{ opacity: 1 - rowIndex * 0.1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
);
TableSkeleton.displayName = "TableSkeleton";

/**
 * List Skeleton - Placeholder for loading lists
 */
interface ListSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number;
  showAvatar?: boolean;
}

const ListSkeleton = React.forwardRef<HTMLDivElement, ListSkeletonProps>(
  ({ items = 5, showAvatar = true, className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-card-surface border border-border"
        >
          {showAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/2 h-4" />
            <Skeleton variant="text" className="w-3/4 h-3" />
          </div>
          <Skeleton variant="rectangular" width={60} height={28} />
        </div>
      ))}
    </div>
  )
);
ListSkeleton.displayName = "ListSkeleton";

export {
  PageLoader,
  SectionLoader,
  InlineLoader,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
};
