import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Search, ArrowLeft } from "lucide-react";
import { getEvents, EventStatus } from "@/lib/event-api";
import { useParams, useNavigate } from "react-router-dom";
import { TicketPackageManager } from "@/components/tickets/TicketPackageManager";

interface EventSummary {
  id: string;
  title: string;
  date: string;
  location?: string;
  status: string;
}

const AdminAdvancedTicketTypes = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const response = await getEvents({ limit: 50, status: EventStatus.APPROVED });
      if (response.success && response.data?.events) {
        setEvents(response.data.events as EventSummary[]);
      }
    } catch {
      // non-fatal — user can retry via the search
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!eventId) fetchEvents();
  }, [eventId, fetchEvents]);

  // ── Event manager view ──────────────────────────────────────────────────

  if (eventId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/tickets/advanced")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <TicketPackageManager eventId={eventId} mode="admin" />
      </div>
    );
  }

  // ── Event selector view ─────────────────────────────────────────────────

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Advanced Ticket Types</h1>
        <p className="text-muted-foreground mt-1">
          Select an event to manage its ticket packages and reserved seating.
        </p>
      </div>

      <Card className="border-border/40 bg-card">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading events…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No events match your search." : "No approved events found."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((event) => (
                <Card
                  key={event.id}
                  className="border-border/40 bg-card hover:shadow-lg hover:border-primary transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/event/${event.id}/tickets/advanced`)}
                >
                  <CardContent className="pt-5 space-y-3">
                    <div>
                      <p className="font-semibold leading-tight line-clamp-2">
                        {event.title}
                      </p>
                      <Badge variant="outline" className="mt-1.5 text-xs">
                        {event.status}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Tickets
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAdvancedTicketTypes;
