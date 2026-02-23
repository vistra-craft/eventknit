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
        "bg-input text-foreground placeholder:text-muted-foreground",
        "border-gray-300 dark:border-zinc-700",
        "focus-visible:outline-none focus-visible:border-primary/50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
