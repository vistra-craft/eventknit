import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * EventKnit Card Variants
 *
 * USAGE GUIDE:
 * - default: Standard card with subtle shadow
 * - elevated: Card with stronger shadow for emphasis
 * - interactive: Clickable card with hover lift effect (signup page style)
 * - minimal: Flat card with minimal styling
 * - glass: Glassmorphism effect for overlays
 */
const cardVariants = cva(
  "rounded-2xl border transition-all duration-200",
  {
    variants: {
      variant: {
        // Default: Standard card with subtle shadow
        default: "border-border bg-card-surface text-card-foreground shadow-sm",

        // Elevated: Stronger shadow for emphasis
        elevated: "border-border bg-card-surface text-card-foreground shadow-md",

        // Interactive: Clickable card with hover effects (signup page style)
        interactive: "border-border bg-card-surface text-card-foreground shadow-none hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",

        // Minimal: Flat card with no shadow
        minimal: "border-border bg-card-surface text-card-foreground shadow-none",

        // Glass: Glassmorphism effect
        glass: "border-white/20 bg-white/10 backdrop-blur-sm text-card-foreground shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-base font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
