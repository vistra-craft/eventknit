import { cva } from "class-variance-authority";

/**
 * EventKnit Button Variants
 *
 * USAGE GUIDE:
 * - primary (default): Main CTAs - Register, Buy Tickets, Save, Continue
 * - secondary: Secondary actions - Cancel, Back, Save Draft (outline style)
 * - ghost: Tertiary actions - Navigation, sidebar items, subtle buttons
 * - destructive: Delete, Cancel Registration, Remove
 * - success: Confirm, Mark Complete, Approve
 * - link: Inline text links
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Solid blue - for main CTAs
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md",

        // Secondary: Blue outline that fills on hover
        secondary: "border border-primary/30 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",

        // Outline: Neutral border for less prominent secondary actions
        outline: "border border-border bg-card-surface text-foreground hover:bg-muted hover:text-foreground",

        // Ghost: Minimal style for subtle actions
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",

        // Destructive: Red for delete/danger actions
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        // Success: Green for positive actions
        success: "bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success-dark,142_76%_30%))]",

        // Link: Text link style
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
