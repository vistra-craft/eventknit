import { Calendar, MapPin, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroPreviewProps {
  type: "EVENT" | "IMAGE";
  title: string;
  image: string;
  category?: string;
  date?: string;
  time?: string;
  venue?: string;
  location?: string;
  price?: string;
  description?: string;
  linkText?: string;
}

export const HeroPreview = ({
  type,
  title,
  image,
  category,
  date,
  time,
  venue,
  location,
  description,
  linkText,
}: HeroPreviewProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Hero Preview</h3>
        <Badge variant="outline" className="text-xs">
          Live Preview
        </Badge>
      </div>

      <div className="relative rounded-lg overflow-hidden h-[200px] border border-border">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-muted transition-all duration-300"
          style={{
            backgroundImage: image ? `url(${image})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="flex flex-col gap-2">
            {/* Badges */}
            <div className="flex items-center gap-2">
              {category && (
                <Badge className="bg-primary text-white text-[10px] px-1.5 py-0">
                  {category}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-white/80 text-[10px]">
                <Eye className="w-3 h-3" />
                <span>{type === "EVENT" ? "Featured" : "Spotlight"}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-sm font-bold text-white leading-tight line-clamp-2">
              {title || "Your Title Here"}
            </h2>

            {type === "EVENT" ? (
              /* Event details row */
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/90">
                {date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-medium">
                      {formatDate(date)}
                    </span>
                    {time && (
                      <span className="text-[10px] text-white/70">
                        • {time}
                      </span>
                    )}
                  </div>
                )}
                {(venue || location) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-medium">
                      {venue}
                      {venue && location && ", "}
                      {location}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              description && (
                <p className="text-white/80 text-[10px] line-clamp-2">
                  {description}
                </p>
              )
            )}

            {/* CTA Button preview */}
            <div className="mt-1">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white text-[10px] h-6 px-2"
                disabled
              >
                {type === "EVENT" ? "Get Tickets" : linkText || "Learn More"}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        This is a scaled-down preview. Actual hero will be full-width.
      </p>
    </div>
  );
};
