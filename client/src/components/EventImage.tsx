import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EventImageProps {
  src: string | null | undefined;
  alt: string;
  focalX?: number | null;
  focalY?: number | null;
  className?: string;
  containerClassName?: string;
  fallback?: React.ReactNode;
  /** When true, uses background-image instead of img tag (for Hero sections) */
  asBackground?: boolean;
  children?: React.ReactNode;
}

/**
 * EventImage component that respects focal point positioning.
 * Use this component wherever event images are displayed to ensure
 * consistent cropping based on the organizer's selected focal point.
 */
export function EventImage({
  src,
  alt,
  focalX = 50,
  focalY = 50,
  className,
  containerClassName,
  fallback,
  asBackground = false,
  children,
}: EventImageProps) {
  const [hasError, setHasError] = useState(false);

  // Default to center if focal point not provided
  const x = focalX ?? 50;
  const y = focalY ?? 50;

  const objectPosition = `${x}% ${y}%`;

  if (!src || hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div
        className={cn(
          'w-full h-full bg-muted flex items-center justify-center',
          containerClassName
        )}
      >
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  if (asBackground) {
    return (
      <div
        className={cn('w-full h-full', containerClassName)}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: objectPosition,
          backgroundRepeat: 'no-repeat',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      style={{ objectPosition }}
      onError={() => setHasError(true)}
    />
  );
}
