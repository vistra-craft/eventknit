import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSkeleton = () => {
  return (
    <div className="container mx-auto px-6 py-6">
      {/* Hero Container */}
      <div className="relative rounded-2xl overflow-hidden h-[400px] lg:h-[450px] bg-muted animate-pulse">
        {/* Navigation Arrows - Left */}
        <Button
          variant="ghost"
          size="icon"
          disabled
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 text-white border-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {/* Navigation Arrows - Right */}
        <Button
          variant="ghost"
          size="icon"
          disabled
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 text-white border-0"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        {/* Content - Bottom aligned */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Left side - Event info skeleton */}
            <div className="flex-1 max-w-2xl space-y-4">
              {/* Badge skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted-foreground rounded animate-pulse" />
              </div>

              {/* Title skeleton - 2 lines */}
              <div className="space-y-2">
                <div className="h-8 w-3/4 bg-muted-foreground rounded animate-pulse" />
                <div className="h-8 w-1/2 bg-muted-foreground rounded animate-pulse" />
              </div>

              {/* Event details skeleton */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="h-5 w-32 bg-muted-foreground rounded animate-pulse" />
                <div className="h-5 w-40 bg-muted-foreground rounded animate-pulse" />
                <div className="h-5 w-16 bg-muted-foreground rounded animate-pulse" />
              </div>
            </div>

            {/* Right side - Button skeleton */}
            <div className="h-10 w-32 bg-muted-foreground rounded-lg animate-pulse" />
          </div>

          {/* Dot indicators skeleton */}
          <div className="flex justify-center lg:justify-start gap-2 mt-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={`rounded-full bg-muted-foreground animate-pulse ${
                  index === 0 ? 'h-1.5 w-8' : 'h-1.5 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
