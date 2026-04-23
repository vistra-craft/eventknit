import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Eye, Clock, Mail, ShieldX, MoreHorizontal, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { EventThumbnail } from "../../../components/ui/event-thumbnail";
import { Pagination } from "../../../components/ui/pagination";
import { Loader } from "../../../components/ui/loader";
import { getEvents, EventStatus, type EventData } from "../../../lib/event-api";
import { getAdminEventById, sendKYCReminder } from "../../../lib/admin-api";
import { EventPreviewModal } from "@/components/events/EventPreviewModal";
import { useToast } from "../../../hooks/useToast";
import { showErrorToast } from "../../../lib/utils/error";
import { getEventTypeBadgeClass, getPriceBadgeClass } from "../../../lib/utils/event-badge-helpers";

interface Event {
  id: string;
  slug?: string | null;
  title: string;
  organizer: string;
  organizerId?: string;
  date: string;
  startDate?: string;
  startTime?: string;
  location: string;
  venue?: string;
  attendees: number;
  category: string;
  type: "public" | "private";
  isFree: boolean;
  submittedDate: string;
  image?: string;
  description: string;
}

const AwaitingKycPage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [previewEventData, setPreviewEventData] = useState<EventData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreviewEvent = (eventId: string) => {
    setPreviewEventId(eventId);
    setPreviewModalOpen(true);
  };

  useEffect(() => {
    const fetchPreviewEvent = async () => {
      if (!previewEventId || !previewModalOpen) return;
      try {
        setPreviewLoading(true);
        const response = await getAdminEventById(previewEventId);
        if (response.success && response.data?.event) {
          setPreviewEventData(response.data.event);
        } else {
          showErrorToast(toast, new Error("Failed to load event details"), "Preview failed", "Failed to load event details");
          setPreviewModalOpen(false);
        }
      } catch (err: unknown) {
        showErrorToast(toast, err, "Preview failed", "Failed to load event details");
        setPreviewModalOpen(false);
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreviewEvent();
  }, [previewEventId, previewModalOpen, toast]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const filters: Record<string, unknown> = {
          status: EventStatus.PENDING,
          organizerKycSubmitted: false,
          page,
          limit,
        };

        if (categoryFilter !== "all") filters.category = categoryFilter;
        if (typeFilter !== "all") filters.type = typeFilter === "public" ? "PUBLIC" : "PRIVATE";
        if (priceFilter !== "all") filters.isFree = priceFilter === "free";
        if (searchTerm) filters.search = searchTerm;

        const response = await getEvents(filters);
        if (response.success && response.data?.events) {
          const mapped = response.data.events.map(event => ({
            id: event.id,
            slug: event.slug ?? null,
            title: event.title,
            organizer:
              event.organizer?.organizationName ||
              `${event.organizer?.firstName || ""} ${event.organizer?.lastName || ""}`.trim() ||
              "Unknown",
            organizerId: event.organizer?.id,
            date: event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD",
            startDate: event.startDate,
            startTime: event.startTime || "",
            location: event.location || event.venue || "TBD",
            venue: event.venue || undefined,
            attendees: event.attendees || 0,
            category: event.category || "Uncategorized",
            type: (event.type === "PUBLIC" ? "public" : "private") as "public" | "private",
            isFree: event.isFree || false,
            submittedDate: event.createdAt || new Date().toISOString(),
            image: event.image || undefined,
            description: event.description || "",
          }));
          setEvents(mapped);
          if (response.data.totalPages !== undefined) setTotalPages(response.data.totalPages);
          if (response.data.total !== undefined) setTotal(response.data.total);
        }
      } catch (err) {
        console.error("Error fetching awaiting KYC events:", err);
        setError("Failed to load events awaiting KYC");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [page, limit, categoryFilter, priceFilter, searchTerm, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, typeFilter, priceFilter]);

  const handleSendKycReminder = async (event: Event) => {
    if (!event.organizerId) return;
    try {
      setSendingReminder(event.id);
      await sendKYCReminder(event.organizerId, event.title);
      toast({
        title: "Reminder sent",
        description: `KYC verification reminder emailed to ${event.organizer}.`,
      });
    } catch (err: unknown) {
      showErrorToast(toast, err, "Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const daysSince = (dateStr: string) =>
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Awaiting KYC</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Events created by organizers who have not yet submitted KYC verification.
            These events cannot be approved until the organizer completes verification.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {total} event{total !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Info callout */}
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <ShieldX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          The organizers below have not submitted KYC. Send them a reminder to complete verification so their events can be reviewed and approved.
        </AlertDescription>
      </Alert>

      {/* Stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">Awaiting KYC</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events or organizers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Events list */}
      {loading ? (
        <Loader />
      ) : events.length === 0 ? (
        <Card className="bg-card border-border/40">
          <CardContent className="p-12 text-center">
            <ShieldX className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No events awaiting KYC</h3>
            <p className="text-sm text-muted-foreground">
              All organizers with pending events have submitted their KYC verification.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Card key={event.id} className="bg-card border-border/40 hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <EventThumbnail
                    src={event.image}
                    alt={event.title}
                    className="w-20 h-14 rounded-md flex-shrink-0 hidden sm:block"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          by{" "}
                          {event.organizerId ? (
                            <Link
                              to={`/admin/users/organizers/${event.organizerId}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {event.organizer}
                            </Link>
                          ) : (
                            <span className="font-medium">{event.organizer}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-400 text-xs">
                          <ShieldX className="h-3 w-3 mr-1" />
                          KYC Not Submitted
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreviewEvent(event.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview Event
                            </DropdownMenuItem>
                            {event.organizerId && (
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/users/organizers/${event.organizerId}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Organizer
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSendKycReminder(event)}
                              disabled={sendingReminder === event.id}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {sendingReminder === event.id ? "Sending..." : "Send KYC Reminder"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submitted {daysSince(event.submittedDate)}d ago
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="outline" className={getEventTypeBadgeClass(event.type)}>
                        {event.type}
                      </Badge>
                      <Badge variant="outline" className={getPriceBadgeClass(event.isFree)}>
                        {event.isFree ? "Free" : "Paid"}
                      </Badge>
                      {event.category && (
                        <Badge variant="outline" className="text-xs">
                          {event.category}
                        </Badge>
                      )}
                      <div className="ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                          onClick={() => handleSendKycReminder(event)}
                          disabled={sendingReminder === event.id}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          {sendingReminder === event.id ? "Sending..." : "Send Reminder"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Preview Modal */}
      <EventPreviewModal
        isOpen={previewModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewModalOpen(false);
            setPreviewEventId(null);
            setPreviewEventData(null);
          }
        }}
        event={previewEventData}
        loading={previewLoading}
      />
    </div>
  );
};

export default AwaitingKycPage;
