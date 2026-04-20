import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgendaItem {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  sessionType?: string;
  room?: string;
  speakerIds?: string[];
  speakers?: string[];
}

interface AgendaTimelineProps {
  agenda: AgendaItem[];
  eventStartDate: string;
}

const SESSION_STYLES: Record<string, string> = {
  keynote: "bg-primary/10 text-primary",
  workshop: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  panel: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  networking: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  breakout: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  break: "bg-muted text-muted-foreground",
  lunch: "bg-muted text-muted-foreground",
  meal: "bg-muted text-muted-foreground",
  registration: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  other: "bg-muted text-muted-foreground",
};

function getSessionStyle(type?: string): string {
  if (!type) return SESSION_STYLES.other;
  return SESSION_STYLES[type.toLowerCase()] || SESSION_STYLES.other;
}

function formatTime(t?: string): string {
  if (!t) return "";
  if (/AM|PM/i.test(t)) return t;
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${period}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function AgendaTimeline({ agenda, eventStartDate }: AgendaTimelineProps) {
  // Group items by date
  const grouped = new Map<string, AgendaItem[]>();
  agenda.forEach((item) => {
    const key = item.date || eventStartDate;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  // Sort each group by startTime
  grouped.forEach((items) => {
    items.sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
  });

  const dates = Array.from(grouped.keys()).sort();
  const isMultiDay = dates.length > 1;

  if (isMultiDay) {
    return (
      <Tabs defaultValue={dates[0]} className="w-full">
        <TabsList className="mb-4">
          {dates.map((date) => (
            <TabsTrigger key={date} value={date}>
              {formatDateLabel(date)}
            </TabsTrigger>
          ))}
        </TabsList>
        {dates.map((date) => (
          <TabsContent key={date} value={date}>
            <TimelineList items={grouped.get(date)!} />
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return <TimelineList items={grouped.get(dates[0]) || []} />;
}

function TimelineList({ items }: { items: AgendaItem[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[79px] top-2 bottom-2 w-px bg-border/60 sm:left-[95px]" />

      <div className="space-y-0">
        {items.map((item, i) => (
          <TimelineItem key={item.id || i} item={item} />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ item }: { item: AgendaItem }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!item.description;
  const timeStr = formatTime(item.startTime);
  const endStr = formatTime(item.endTime);

  return (
    <div className="relative flex items-start gap-4 py-3 group">
      {/* Time */}
      <div className="w-16 sm:w-20 text-right flex-shrink-0 pt-0.5">
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {timeStr || "--:--"}
        </span>
      </div>

      {/* Dot */}
      <div className="relative flex-shrink-0 mt-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
          {item.sessionType && (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${getSessionStyle(item.sessionType)}`}
            >
              {item.sessionType}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {endStr && (
            <span className="text-xs text-muted-foreground">
              {timeStr} – {endStr}
            </span>
          )}
          {item.room && (
            <span className="text-xs text-muted-foreground">
              {item.room}
            </span>
          )}
          {item.speakers && item.speakers.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {item.speakers.join(", ")}
            </span>
          )}
        </div>

        {hasDetails && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expanded ? "Hide details" : "Show details"}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
