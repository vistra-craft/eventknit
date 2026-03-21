/**
 * Skeleton loader for the RegisterEvent (checkout) page
 * Mimics: CheckoutHeader → Progress steps → Event info card → Ticket selection card
 */

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton-base skeleton-shimmer rounded-lg ${className ?? ""}`}
    />
  );
}

export function RegisterEventSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* CheckoutHeader skeleton — sticky h-14, max-w-4xl */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bone className="h-4 w-4 rounded" />
            <Bone className="h-4 w-24" />
          </div>
          <Bone className="hidden sm:block h-4 w-48" />
          <Bone className="h-7 w-7 rounded-md" />
        </div>
      </header>

      <main className="flex-1 pt-6 pb-10 bg-gradient-to-b from-primary/5 via-background to-muted/10">
        <div className="max-w-3xl mx-auto px-4 space-y-6">

          {/* Progress indicator skeleton — 3 steps */}
          <div className="flex items-center justify-center py-4 -mt-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Bone className="w-8 h-8 rounded-full" />
                <Bone className="h-4 w-14 ml-2" />
              </div>
              <Bone className="w-8 h-0.5" />
              <div className="flex items-center">
                <Bone className="w-8 h-8 rounded-full" />
                <Bone className="h-4 w-20 ml-2" />
              </div>
              <Bone className="w-8 h-0.5" />
              <div className="flex items-center">
                <Bone className="w-8 h-8 rounded-full" />
                <Bone className="h-4 w-16 ml-2" />
              </div>
            </div>
          </div>

          {/* Event info card skeleton */}
          <section className="rounded-2xl bg-background shadow-sm border border-border overflow-hidden">
            {/* Event image — h-52 md:h-56 */}
            <div className="relative h-52 md:h-56 skeleton-base skeleton-shimmer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <Bone className="h-3 w-20" />
                <Bone className="h-8 w-72 max-w-full" />
              </div>
            </div>
            {/* 3-col info grid: date, location, organizer */}
            <div className="p-6 md:p-8 grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Bone className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Bone className="h-3 w-20" />
                    <Bone className="h-4 w-32" />
                    <Bone className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Ticket selection card skeleton */}
          <section className="rounded-2xl bg-background shadow-sm border border-border">
            <div className="p-6 md:p-8 space-y-8">
              {/* Section header */}
              <div className="space-y-2">
                <Bone className="h-3 w-14" />
                <Bone className="h-7 w-48" />
                <Bone className="h-4 w-80 max-w-full" />
              </div>

              {/* Ticket type cards */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border p-5 space-y-3 skeleton-fade-in"
                    style={{ animationDelay: `${(i - 1) * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Bone className="h-5 w-36" />
                        <Bone className="h-4 w-56 max-w-full" />
                      </div>
                      <Bone className="h-6 w-16" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Bone className="h-4 w-24" />
                      {/* Quantity selector */}
                      <div className="flex items-center gap-3">
                        <Bone className="h-8 w-8 rounded-full" />
                        <Bone className="h-5 w-6" />
                        <Bone className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code + Continue button */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex gap-2">
                  <Bone className="h-10 flex-1 rounded-lg" />
                  <Bone className="h-10 w-20 rounded-lg" />
                </div>
                <Bone className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
