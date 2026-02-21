import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Download,
  Share2,
  QrCode,
  Search,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Pagination } from "@/components/ui/pagination";
import EmptyState from "@/components/EmptyState";
import { EventImage } from "@/components/EventImage";
import { getUserRegisteredEvents } from "@/lib/event-api";
import { downloadTicketPDF } from "@/lib/ticket-api";
import { shareEvent } from "@/lib/utils/share";
import { useToast } from "@/hooks/useToast";

type AttendingFilter = "all" | "upcoming" | "past";

interface AttendingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  status: "upcoming" | "ongoing" | "completed";
  registrationId?: string;
  ticketType?: string;
  backupCode?: string;
  venue?: string;
  category?: string;
}

const ITEMS_PER_PAGE = 10;

export function AttendingEventsView() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<AttendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AttendingFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttending = async () => {
      try {
        setLoading(true);
        const response = await getUserRegisteredEvents({ page: 1, limit: 200 });
        if (response.success && response.data) {
          setEvents(
            response.data.events.map((e) => ({
              id: e.id,
              title: e.title,
              date: e.date || "",
              location: e.location || "",
              image: e.image || "",
              status: (e.status as AttendingEvent["status"]) || "upcoming",
              registrationId: e.registrationId,
              ticketType: e.ticketType,
              backupCode: e.backupCode,
              venue: e.venue,
              category: e.category,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching attending events:", error);
        toast({
          title: "Error",
          description: "Failed to load attending events",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAttending();
  }, [toast]);

  // Filter + search (client-side)
  const filtered = useMemo(() => {
    let result = events;

    // Status filter
    if (filter === "upcoming") {
      result = result.filter((e) => e.status === "upcoming" || e.status === "ongoing");
    } else if (filter === "past") {
      result = result.filter((e) => e.status === "completed");
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.location.toLowerCase().includes(term)
      );
    }

    return result;
  }, [events, filter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = async (event: AttendingEvent) => {
    if (!event.registrationId) {
      toast({
        title: "Unavailable",
        description: "Ticket download not available for this event",
        variant: "destructive",
      });
      return;
    }
    setDownloadingId(event.id);
    try {
      await downloadTicketPDF(event.registrationId);
      toast({ title: "Downloaded", description: "Ticket PDF downloaded" });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Download failed",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (event: AttendingEvent) => {
    const shared = await shareEvent(event.title, event.id);
    toast({
      title: shared ? "Shared" : "Link Copied",
      description: shared ? "Event shared successfully" : "Event link copied to clipboard",
    });
  };

  const statusBadge = (status: AttendingEvent["status"]) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge variant="secondary" className="text-xs flex-shrink-0 bg-primary/10 text-primary border-transparent">
            Upcoming
          </Badge>
        );
      case "ongoing":
        return (
          <Badge variant="secondary" className="text-xs flex-shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent">
            Ongoing
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="text-xs flex-shrink-0 bg-muted text-muted-foreground border-transparent">
            Past
          </Badge>
        );
    }
  };

  const filterTabs: { key: AttendingFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="default" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls: filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Event Cards */}
      {paginated.length > 0 ? (
        <div className="space-y-3">
          {paginated.map((event) => (
            <Card
              key={event.id}
              variant="interactive"
              className="group"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <div className="flex gap-4 p-4">
                <EventImage
                  src={event.image}
                  alt={event.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                  containerClassName="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    {statusBadge(event.status)}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mb-2">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{formatDate(event.date)}</span>
                    </p>
                    {event.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{event.venue || event.location}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {event.backupCode && (
                        <p className="flex items-center gap-1.5 font-mono text-xs">
                          <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
                          {event.backupCode}
                        </p>
                      )}
                      {event.ticketType && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {event.ticketType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={downloadingId === event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(event);
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      {downloadingId === event.id ? "..." : "Download"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(event);
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title={
            searchTerm
              ? "No Matching Events"
              : filter === "upcoming"
                ? "No Upcoming Events"
                : filter === "past"
                  ? "No Past Events"
                  : "No Events Yet"
          }
          description={
            searchTerm
              ? "Try adjusting your search terms."
              : "You haven't registered for any events yet. Browse events to find something interesting!"
          }
          action={
            !searchTerm
              ? { label: "Browse Events", onClick: () => navigate("/") }
              : undefined
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
