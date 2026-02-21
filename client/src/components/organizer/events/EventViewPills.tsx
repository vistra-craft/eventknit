import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Clock,
  CheckCircle,
  XCircle,
  Ticket,
  FileText,
  FilePen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ViewType = "all" | "upcoming" | "past" | "cancelled" | "attending" | "templates" | "drafts";

interface PillConfig {
  id: ViewType;
  label: string;
  icon: LucideIcon;
}

const pills: PillConfig[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "upcoming", label: "Upcoming", icon: Clock },
  { id: "past", label: "Past", icon: CheckCircle },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
  { id: "attending", label: "Attending", icon: Ticket },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "drafts", label: "Drafts", icon: FilePen },
];

interface EventViewPillsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  counts?: Partial<Record<ViewType, number>>;
}

export function EventViewPills({ activeView, onViewChange, counts }: EventViewPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Check scroll position for gradient fade edges on mobile
  const updateScrollIndicators = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollIndicators();
    el.addEventListener("scroll", updateScrollIndicators, { passive: true });
    window.addEventListener("resize", updateScrollIndicators);
    return () => {
      el.removeEventListener("scroll", updateScrollIndicators);
      window.removeEventListener("resize", updateScrollIndicators);
    };
  }, []);

  // Scroll active pill into view when it changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector(`[data-pill="${activeView}"]`) as HTMLElement;
    if (activeEl) {
      const containerRect = el.getBoundingClientRect();
      const pillRect = activeEl.getBoundingClientRect();
      if (pillRect.left < containerRect.left || pillRect.right > containerRect.right) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeView]);

  return (
    <div className="relative">
      {/* Left fade */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none lg:hidden" />
      )}

      {/* Right fade */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none lg:hidden" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:overflow-visible lg:flex-wrap"
        role="tablist"
        aria-label="Event views"
      >
        {pills.map((pill) => {
          const isActive = activeView === pill.id;
          const count = counts?.[pill.id];
          const Icon = pill.icon;

          return (
            <button
              key={pill.id}
              data-pill={pill.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(pill.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                whitespace-nowrap snap-start transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              {/* Animated background pill */}
              {isActive && (
                <motion.div
                  layoutId="active-pill-bg"
                  className="absolute inset-0 bg-primary rounded-full shadow-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Content */}
              <span className="relative flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{pill.label}</span>
                {count !== undefined && (
                  <span
                    className={`
                      text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                      ${isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
