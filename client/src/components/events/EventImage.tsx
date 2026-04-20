import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventImageProps {
  src: string | null | undefined;
  alt: string;
  focalX?: number | null;
  focalY?: number | null;
  className?: string;
  containerClassName?: string;
  fallback?: React.ReactNode;
  asBackground?: boolean;
  children?: React.ReactNode;
}

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
  const [isLoaded, setIsLoaded] = useState(false);

  const x = focalX ?? 50;
  const y = focalY ?? 50;
  const objectPosition = `${x}% ${y}%`;

  if (!src || hasError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={cn("w-full h-full bg-muted flex flex-col items-center justify-center gap-2", containerClassName)}>
        <ImageOff className="w-6 h-6 text-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">No image</span>
      </div>
    );
  }

  if (asBackground) {
    return (
      <div
        className={cn("w-full h-full", containerClassName)}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: objectPosition,
          backgroundRepeat: "no-repeat",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className, containerClassName)}>
      {/* Shimmer skeleton while loading */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10"
          >
            <div className="w-full h-full bg-muted animate-pulse" />
            {/* Shimmer sweep */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground) / 0.04) 50%, transparent 100%)",
                animation: "skeleton-shimmer 1.5s ease-in-out infinite",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual image — fades in when loaded */}
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}
