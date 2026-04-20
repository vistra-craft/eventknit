export const HeroSkeleton = () => {
  return (
    <div className="container mx-auto px-6 py-6">
      {/* Hero Container — static dark background, no full-container pulse */}
      <div className="relative rounded-2xl overflow-hidden h-[400px] lg:h-[450px] bg-muted/60">
        {/* Gradient overlay matching the real hero */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content - Bottom aligned */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Left side - Event info skeleton */}
            <div className="flex-1 max-w-2xl space-y-4">
              {/* Badge skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
              </div>

              {/* Title skeleton - 2 lines */}
              <div className="space-y-2">
                <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-8 w-1/2 bg-white/10 rounded animate-pulse" />
              </div>

              {/* Event details skeleton */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            </div>

            {/* Right side - Button skeleton */}
            <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
          </div>

          {/* Dot indicators skeleton */}
          <div className="flex justify-center lg:justify-start gap-2 mt-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={`rounded-full animate-pulse ${
                  index === 0 ? 'h-1.5 w-8 bg-white/20' : 'h-1.5 w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
