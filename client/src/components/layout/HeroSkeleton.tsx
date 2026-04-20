export const HeroSkeleton = () => {
  return (
    <section className="relative h-[480px] sm:h-[500px] lg:h-[560px] bg-muted overflow-hidden">
      {/* Gradient overlay matching the real hero */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Content — bottom-aligned, matches real hero padding */}
      <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          {/* Left — badge, title, details */}
          <div className="flex-1 max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-8 w-1/2 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          </div>

          {/* Right — CTA button */}
          <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>

        {/* Dots row */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            <div className="h-1.5 w-8 bg-white/20 rounded-full animate-pulse" />
            <div className="h-1.5 w-1.5 bg-white/10 rounded-full animate-pulse" />
            <div className="h-1.5 w-1.5 bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="h-5 w-5 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </section>
  );
};
