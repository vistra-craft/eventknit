import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, Clock, MapPin, Globe, Users, Video } from "lucide-react";
import { getVenueType } from "@/types/event";

interface EventHeroV2Props {
  title: string;
  category?: string | null;
  date: string;
  time: string;
  venue?: string | null;
  location: string;
  image?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  isOnline?: boolean;
  onlineLink?: string | null;
  registrationCount?: number;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};

export function EventHeroV2({
  title,
  category,
  date,
  time,
  venue,
  location,
  image,
  imageFocalX,
  imageFocalY,
  isOnline,
  onlineLink,
  registrationCount,
}: EventHeroV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const venueType = getVenueType({ isOnline, venue, onlineLink });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const focalX = imageFocalX ?? 50;
  const focalY = imageFocalY ?? 50;

  const locationLabel =
    venueType === "online"
      ? "Online Event"
      : venueType === "hybrid"
        ? `${venue ? venue : location} (Hybrid)`
        : venue
          ? `${venue}, ${location}`
          : location;

  const LocationIcon = venueType === "online" ? Globe : venueType === "hybrid" ? Video : MapPin;

  const hasImage = image && !imgError;

  return (
    <div
      ref={containerRef}
      className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden h-[60vh] min-h-[400px] max-h-[700px] sm:h-[70vh] sm:min-h-[500px]"
    >
      {/* Background */}
      {hasImage ? (
        <motion.img
          src={image}
          alt={title}
          style={{ y: imageY, objectPosition: `${focalX}% ${focalY}%` }}
          onError={() => setImgError(true)}
          className="absolute inset-0 h-[130%] w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background hero-pattern" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
      {/* Subtle brand radial at bottom-left */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.15),transparent_60%)]" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14"
        >
          {/* Category badge */}
          {category && (
            <motion.span
              variants={fadeUp}
              className="inline-flex px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs uppercase tracking-wider mb-4"
            >
              {category}
            </motion.span>
          )}

          {/* Title */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white max-w-3xl mb-5"
          >
            {title}
          </motion.h1>

          {/* Meta pills */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <MetaPill icon={Calendar} label={date} />
            {time && <MetaPill icon={Clock} label={time} />}
            <MetaPill icon={LocationIcon} label={locationLabel} />
            {typeof registrationCount === "number" && registrationCount > 0 && (
              <MetaPill icon={Users} label={`${registrationCount} attending`} />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function MetaPill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate max-w-[200px] sm:max-w-none">{label}</span>
    </span>
  );
}
