import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  User,
  Calendar,
  DollarSign,
  Download,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAttendees, type Attendee, type UserStatus } from "@/lib/admin-api";
import { getEvents } from "@/lib/event-api";

interface EventOption {
  id: string;
  title: string;
}

const AttendeesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch events for filter dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getEvents({ limit: 1000 });
        if (response.success && response.data?.events) {
          setEvents(
            response.data.events.map((e) => ({
              id: e.id,
              title: e.title,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch attendees
  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAttendees({
          eventId: eventFilter !== "all" ? eventFilter : undefined,
          search: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          limit: 50,
        });

        if (response.success && response.data) {
          setAttendees(response.data.attendees);
          setTotalPages(response.data.pagination.totalPages);
        }
      } catch (err: any) {
        console.error("Error fetching attendees:", err);
        setError(err.message || "Failed to load attendees");
        toast({
          title: "Error",
          description: err.message || "Failed to load attendees",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [searchTerm, statusFilter, eventFilter, page, toast]);

  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      SUSPENDED: "bg-red-100 text-red-800 border-red-200",
      DEACTIVATED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewAttendee = (id: string) => {
    navigate(`/admin/users/attendees/${id}`);
  };

  const handleEditAttendee = (id: string) => {
    navigate(`/admin/users/attendees/${id}/edit`);
  };

  if (loading && attendees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading attendees...</div>
      </div>
    );
  }

  if (error && attendees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendees</h2>
          <p className="text-gray-600">Manage event attendees and view registration history</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">{attendees.length}</div>
            <p className="text-sm text-gray-600">Total Attendees</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {attendees.filter((a) => a.status === "ACTIVE").length}
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {attendees.filter((a) => a.status === "SUSPENDED").length}
            </div>
            <p className="text-sm text-gray-600">Suspended</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {attendees.reduce((sum, a) => sum + a.registrations.length, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search attendees..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={eventFilter}
              onValueChange={(value) => {
                setEventFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as UserStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendees List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Attendees ({attendees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendees.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No attendees found</div>
          ) : (
            <div className="space-y-3">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {attendee.firstName} {attendee.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">{attendee.email}</p>
                      {attendee.phoneNumber && (
                        <p className="text-sm text-gray-600">{attendee.phoneNumber}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getStatusBadge(attendee.status)}`}>
                          {attendee.status}
                        </Badge>
                        {attendee.registrations.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {attendee.registrations.length} registration{attendee.registrations.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Joined: {formatDate(attendee.createdAt)}
                      </div>
                      {attendee.registrations.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Total: {formatCurrency(
                            attendee.registrations.reduce((sum, reg) => sum + reg.totalAmount, 0)
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAttendee(attendee.id)}
                        title="View Registration History"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAttendee(attendee.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendeesPage;

