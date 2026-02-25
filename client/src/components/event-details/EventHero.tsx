import { Heart, Share2 } from "lucide-react";
import { EventImage } from "@/components/EventImage";

interface EventHeroProps {
  title: string;
  image?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  onSave?: () => void;
  onShare?: () => void;
}

export const EventHero = ({ title, image, imageFocalX, imageFocalY, onSave, onShare }: EventHeroProps) => {
  return (
    <div className="animate-in fade-in duration-700">
      <div className="relative h-72 md:h-[420px] rounded-2xl overflow-hidden bg-muted">
        <EventImage
          src={image}
          alt={title}
          focalX={imageFocalX}
          focalY={imageFocalY}
          className="h-full w-full"
          fallback={
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm bg-muted">
              Event image coming soon
            </div>
          }
        />

        {/* Save / Share buttons — top right of image */}
        {(onSave || onShare) && (
          <div className="absolute top-3 right-3 flex gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="Save event"
              >
                <Heart className="h-4 w-4" />
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="Share event"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
