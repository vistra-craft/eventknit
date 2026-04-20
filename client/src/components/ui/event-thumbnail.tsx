import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventThumbnailProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  category?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-20 h-20",
  lg: "w-24 h-24",
};

const categoryIcons: Record<string, React.ReactNode> = {
  music: "🎵",
  sports: "⚽",
  arts: "🎨",
  comedy: "🎭",
  technology: "💻",
  business: "💼",
  education: "📚",
  food: "🍔",
  health: "🏥",
  default: <Calendar className="w-1/2 h-1/2 text-muted-foreground" />,
};

const EventThumbnail = React.forwardRef<HTMLDivElement, EventThumbnailProps>(
  ({ src, alt, category, size = "md", className, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const hasImage = src && !imageError;
    const categoryKey = category?.toLowerCase() || "default";
    const categoryIcon = categoryIcons[categoryKey] || categoryIcons.default;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0",
          "bg-muted border border-border",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {hasImage && (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              src={src || undefined}
              alt={alt || "Event thumbnail"}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        )}
        {!hasImage && (
          <div className="flex items-center justify-center w-full h-full text-2xl">
            {typeof categoryIcon === "string" ? (
              <span>{categoryIcon}</span>
            ) : (
              categoryIcon
            )}
          </div>
        )}
      </div>
    );
  }
);

EventThumbnail.displayName = "EventThumbnail";

export { EventThumbnail };



