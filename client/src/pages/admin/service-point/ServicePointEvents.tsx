import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "../../../components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { getCategoriesByGroup, getCategoryLabel } from "@/lib/event-categories";
import {
  Calendar,
  Users,
  QrCode,
  CheckCircle,
  Clock,
  MapPin,
  Activity,
  Search,
  AlertCircle,
  CalendarX,
  History,
  FileText,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import AdminLayout from "../AdminLayout";
import { getEvents, EventStatus, type EventData } from "@/lib/event-api";

type EventStatusFilter = "all" | "live" | "upcoming" | "completed";

interface EventWithComputedStatus extends EventData {
  computedStatus: "upcoming" | "ongoing" | "completed";
}

const ServicePointEvents: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithComputedStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const categoryGroups = getCategoriesByGroup();

  // Compute event status based on dates
  const computeEventStatus = (event: EventData): "upcoming" | "ongoing" | "completed" => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;

    // Set end of day for end date comparison
    endDate.setHours(23, 59, 59, 999);

    if (now < startDate) {
      return "upcoming";
    } else if (now > endDate) {
      return "completed";
    } else {
      return "ongoing";
    }
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEvents({ status: EventStatus.APPROVED, limit: 100 });

        if (response.success && response.data?.events) {
          const eventsWithStatus = response.data.events.map((event) => ({
            ...event,
            computedStatus: computeEventStatus(event),
          }));
          setEvents(eventsWithStatus);
        } else {
          setError("Failed to load events");
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events based on search, status, and category
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "live" && event.computedStatus === "ongoing") ||
        (statusFilter === "upcoming" && event.computedStatus === "upcoming") ||
        (statusFilter === "completed" && event.computedStatus === "completed");

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [events, searchTerm, statusFilter, categoryFilter]);

  // Count events by status
  const statusCounts = useMemo(() => {
    return {
      all: events.length,
      live: events.filter((e) => e.computedStatus === "ongoing").length,
      upcoming: events.filter((e) => e.computedStatus === "upcoming").length,
      completed: events.filter((e) => e.computedStatus === "completed").length,
    };
  }, [events]);

  const getStatusColor = (status: "upcoming" | "ongoing" | "completed") => {
    switch (status) {
      case "upcoming":
        return "bg-primary/10 text-primary border-primary";
      case "ongoing":
        return "bg-success/10 text-success border-success";
      case "completed":
        return "bg-muted text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
      default:
        return "bg-muted text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: "upcoming" | "ongoing" | "completed") => {
    switch (status) {
      case "upcoming":
        return <Clock className="w-3 h-3" />;
      case "ongoing":
        return <Activity className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const formatEventDate = (event: EventData) => {
    const startDate = new Date(event.startDate);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return startDate.toLocaleDateString("en-US", options);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/admin/service-point/event/${eventId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Service Point</h1>
            <p className="text-muted-foreground text-sm">
              Select an event to manage check-ins and facilities
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/service-point/templates")}
            >
              <FileText className="w-4 h-4 mr-1" />
              Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/service-point/history")}
            >
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events by name, location, or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectGroup>
                  <SelectLabel>Professional / MICE</SelectLabel>
                  {categoryGroups.mice.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Entertainment</SelectLabel>
                  {categoryGroups.entertainment.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Lifestyle</SelectLabel>
                  {categoryGroups.lifestyle.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>General</SelectLabel>
                  {categoryGroups.general.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as EventStatusFilter)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="live" className="text-success">
                Live ({statusCounts.live})
              </TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({statusCounts.upcoming})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">{error}</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-destructive"
                    onClick={() => window.location.reload()}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <CalendarX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "There are no approved events available for service point operations"}
                </p>
                {(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCategoryFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events Grid */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                onClick={() => handleEventClick(event.id)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={
                      event.image ||
                      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"
                    }
                    alt={event.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className={`${getStatusColor(event.computedStatus)} border-0`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(event.computedStatus)}
                        <span className="capitalize">
                          {event.computedStatus === "ongoing" ? "Live" : event.computedStatus}
                        </span>
                      </div>
                    </Badge>
                  </div>
                  {event.category && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        {getCategoryLabel(event.category)}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      {event.organizerName && (
                        <p className="text-sm text-muted-foreground mt-1">{event.organizerName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatEventDate(event)}</span>
                        {event.startTime && (
                          <>
                            <span className="text-muted-foreground/50">|</span>
                            <span>{event.startTime}</span>
                          </>
                        )}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="line-clamp-1">{event.venue || event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-medium">
                            {event.registrationCount || event.attendees || 0}
                          </span>
                          {event.capacity && (
                            <span className="text-muted-foreground">/ {event.capacity}</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <QrCode className="w-3.5 h-3.5" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServicePointEvents;
