import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * EventKnit Loader Component
 *
 * Beautiful, modern loading indicators with multiple variants.
 *
 * USAGE:
 * <Loader /> - Default spinner
 * <Loader variant="dots" /> - Bouncing dots
 * <Loader variant="pulse" /> - Pulsing circle
 * <Loader variant="bars" /> - Animated bars
 * <Loader size="lg" /> - Large size
 * <Loader className="text-success" /> - Custom color
 */



// Size mappings for different loader types
const sizeMap = {
  sm: { spinner: "w-4 h-4", dots: "w-1.5 h-1.5", bars: "w-0.5 h-3", pulse: "w-4 h-4" },
  default: { spinner: "w-6 h-6", dots: "w-2 h-2", bars: "w-1 h-4", pulse: "w-6 h-6" },
  lg: { spinner: "w-10 h-10", dots: "w-3 h-3", bars: "w-1.5 h-6", pulse: "w-10 h-10" },
  xl: { spinner: "w-16 h-16", dots: "w-4 h-4", bars: "w-2 h-8", pulse: "w-16 h-16" },
};

export interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "spinner" | "dots" | "pulse" | "bars";
  size?: "sm" | "default" | "lg" | "xl";
}

/**
 * Spinner Loader - Clean rotating ring
 */
const SpinnerLoader = React.forwardRef<
  HTMLDivElement,
  LoaderProps
>(({ className, size, ...props }, ref) => {
  const validSize = size && size in sizeMap ? size : "default";
  return (
    <div ref={ref} className={cn("relative", className)} {...props}>
      <div
        className={cn(
          sizeMap[validSize].spinner,
          "rounded-full border-2 border-muted-foreground/20"
        )}
      />
      <div
        className={cn(
          sizeMap[validSize].spinner,
          "absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"
        )}
      />
    </div>
  );
});
SpinnerLoader.displayName = "SpinnerLoader";

/**
 * Dots Loader - Three bouncing dots
 */
const DotsLoader = React.forwardRef<
  HTMLDivElement,
  LoaderProps
>(({ className, size, ...props }, ref) => {
  const validSize = size && size in sizeMap ? size : "default";
  return (
    <div ref={ref} className={cn("flex items-center gap-1", className)} {...props}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            sizeMap[validSize].dots,
            "rounded-full bg-primary animate-bounce"
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );
});
DotsLoader.displayName = "DotsLoader";

/**
 * Pulse Loader - Expanding circle
 */
const PulseLoader = React.forwardRef<
  HTMLDivElement,
  LoaderProps
>(({ className, size, ...props }, ref) => {
  const validSize = size && size in sizeMap ? size : "default";
  return (
    <div ref={ref} className={cn("relative", className)} {...props}>
      <div
        className={cn(
          sizeMap[validSize].pulse,
          "rounded-full bg-primary/30 animate-ping absolute inset-0"
        )}
      />
      <div
        className={cn(
          sizeMap[validSize].pulse,
          "rounded-full bg-primary relative"
        )}
      />
    </div>
  );
});
PulseLoader.displayName = "PulseLoader";

/**
 * Bars Loader - Animated equalizer-style bars
 */
const BarsLoader = React.forwardRef<
  HTMLDivElement,
  LoaderProps
>(({ className, size, ...props }, ref) => {
  const validSize = size && size in sizeMap ? size : "default";
  return (
    <div ref={ref} className={cn("flex items-end gap-0.5", className)} {...props}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            sizeMap[validSize].bars,
            "bg-primary rounded-full animate-pulse"
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.8s",
            transform: `scaleY(${0.4 + (i % 2) * 0.6})`,
          }}
        />
      ))}
    </div>
  );
});
BarsLoader.displayName = "BarsLoader";

/**
 * Main Loader Component
 */
const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ variant = "spinner", ...props }, ref) => {
    switch (variant) {
      case "dots":
        return <DotsLoader ref={ref} {...props} />;
      case "pulse":
        return <PulseLoader ref={ref} {...props} />;
      case "bars":
        return <BarsLoader ref={ref} {...props} />;
      default:
        return <SpinnerLoader ref={ref} {...props} />;
    }
  }
);
Loader.displayName = "Loader";

/**
 * Loading Text - Loader with text
 */
interface LoadingTextProps extends LoaderProps {
  text?: string;
}

const LoadingText = React.forwardRef<HTMLDivElement, LoadingTextProps>(
  ({ text = "Loading...", variant = "spinner", size = "default", className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-3", className)} {...props}>
      <Loader variant={variant} size={size} />
      <span className="text-sm text-muted-foreground animate-pulse">{text}</span>
    </div>
  )
);
LoadingText.displayName = "LoadingText";

/**
 * Button Loader - Small inline loader for buttons
 */
const ButtonLoader = React.forwardRef<
  HTMLDivElement,
  Omit<LoaderProps, "size">
>(({ className, ...props }, ref) => (
  <Loader ref={ref} size="sm" className={cn("mr-2", className)} {...props} />
));
ButtonLoader.displayName = "ButtonLoader";

export { Loader, LoadingText, ButtonLoader, SpinnerLoader, DotsLoader, PulseLoader, BarsLoader };
