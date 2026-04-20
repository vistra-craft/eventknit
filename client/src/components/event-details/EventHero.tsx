import { EventImage } from '@/components/events/EventImage';

interface EventHeroProps {
  title: string;
  image?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
}

export const EventHero = ({ title, image, imageFocalX, imageFocalY }: EventHeroProps) => {
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
      </div>
    </div>
  );
};
