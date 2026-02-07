import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border px-3 py-2 text-base shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Use design tokens so textarea backgrounds follow light/dark theme
        "bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[0.5px] focus-visible:border-primary/30",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
