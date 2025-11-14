import * as React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string; // For initials fallback
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, name, size = "md", className, fallbackIcon, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Generate initials from name
    const getInitials = (name: string): string => {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    // Color generation based on name (consistent colors for same name)
    const getColorFromName = (name: string): string => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = hash % 360;
      return `hsl(${hue}, 65%, 50%)`;
    };

    const hasImage = src && !imageError;
    const hasName = name && name.trim().length > 0;
    const showInitials = !hasImage && hasName;
    const showIcon = !hasImage && !hasName;

    const sizeClass = sizeClasses[size];
    const bgColor = hasName ? getColorFromName(name) : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden flex-shrink-0",
          "bg-muted border border-border",
          sizeClass,
          className
        )}
        {...props}
      >
        {hasImage && (
          <>
            {!imageLoaded && (
              <div
                className="absolute inset-0 bg-muted animate-pulse"
                style={{ backgroundColor: bgColor || undefined }}
              />
            )}
            <img
              src={src || undefined}
              alt={alt || name || "Avatar"}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        )}
        {showInitials && (
          <span
            className="font-semibold text-white select-none"
            style={{ backgroundColor: bgColor }}
          >
            {getInitials(name)}
          </span>
        )}
        {showIcon && (
          <div className="text-muted-foreground">
            {fallbackIcon || <User className="w-1/2 h-1/2" />}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
