import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton-base skeleton-shimmer rounded-lg ${className ?? ""}`}
    />
  );
}

export function EventDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Body skeleton — matches max-w-6xl container with pt-24 from actual page */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full pt-24">
        {/* Hero skeleton — matches EventHero: h-72 md:h-[420px] rounded-2xl */}
        <div className="relative h-72 md:h-[420px] rounded-2xl overflow-hidden skeleton-base skeleton-shimmer" />

        {/* Event header skeleton */}
        <div className="space-y-3 py-8 border-b border-border/40">
          <Bone className="h-8 w-full max-w-lg" />
          <Bone className="h-4 w-56" />
          <Bone className="h-4 w-72" />
        </div>
      </div>

      {/* Two-column body skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          {/* Left column */}
          <div className="space-y-10 skeleton-stagger">
            {/* Organizer */}
            <div className="flex items-center gap-4">
              <Bone className="h-14 w-14 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-5 w-40" />
                <Bone className="h-4 w-24" />
              </div>
            </div>

            <div className="max-w-xs mx-auto border-t border-border/20" />

            {/* About */}
            <div className="space-y-3">
              <Bone className="h-7 w-48" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/4" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-2/3" />
            </div>

            <div className="max-w-xs mx-auto border-t border-border/20" />

            {/* Schedule */}
            <div className="space-y-4">
              <Bone className="h-7 w-40" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Bone className="h-4 w-16 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Bone className="h-5 w-3/4" />
                      <Bone className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-xs mx-auto border-t border-border/20" />

            {/* Speakers */}
            <div className="space-y-4">
              <Bone className="h-7 w-48" />
              <div className="grid grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-3">
                    <Bone className="h-48 w-full rounded-xl" />
                    <Bone className="h-5 w-32" />
                    <Bone className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-6 rounded-2xl border border-border/40 bg-card p-6">
              {/* Countdown boxes */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Bone key={i} className="h-16 rounded-xl" />
                ))}
              </div>

              <div className="border-t border-border/20" />

              {/* Price */}
              <div className="text-center space-y-1">
                <Bone className="h-4 w-24 mx-auto" />
                <Bone className="h-8 w-20 mx-auto" />
              </div>

              {/* CTA */}
              <Bone className="h-14 w-full rounded-xl" />

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Bone className="h-10 rounded-lg" />
                <Bone className="h-10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
