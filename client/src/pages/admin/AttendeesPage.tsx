import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Download,
  Upload,
  MoreHorizontal,
  Mail,
  Phone,
  Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/useToast";
import { getAttendees, type Attendee, type UserStatus } from "@/lib/admin-api";
import { getEvents } from "@/lib/event-api";
import { exportAttendeeData } from "@/lib/utils/export";

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
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [previewAttendee, setPreviewAttendee] = useState<Attendee | null>(null);

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
          limit,
        });

        if (response.success && response.data) {
          setAttendees(response.data.attendees);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages);
            setTotal(response.data.pagination.total);
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching attendees:", err);
        const message = err instanceof Error ? err.message : "Failed to load attendees";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [searchTerm, statusFilter, eventFilter, page, limit, toast]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, eventFilter]);

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<UserStatus, string> = {
      ACTIVE: "bg-primary/10 text-primary border-primary/20",
      SUSPENDED: "bg-destructive/10 text-destructive border-destructive/20",
      DEACTIVATED: "bg-muted text-muted-foreground border-border",
      PENDING_APPROVAL: "bg-warning/10 text-warning border-warning/20",
    };
    return variants[status] || "bg-muted text-muted-foreground border-border";
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
        <div className="text-muted-foreground">Loading attendees...</div>
      </div>
    );
  }

  if (error && attendees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Attendees</h2>
          <p className="text-muted-foreground">Manage event attendees and view registration history</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {attendees.length} of {total || attendees.length} attendees
          </div>
          <Select value={limit.toString()} onValueChange={(value) => {
            setLimit(parseInt(value, 10));
            setPage(1);
          }}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-primary mb-2">{total || attendees.length}</div>
            <p className="text-sm text-muted-foreground">Total Attendees</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-primary mb-2">
              {attendees.filter((a) => a.status === "ACTIVE").length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-destructive mb-2">
              {attendees.filter((a) => a.status === "SUSPENDED").length}
            </div>
            <p className="text-sm text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-primary mb-2">
              {attendees.reduce((sum, a) => sum + a.registrations.length, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
      <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
        <CardHeader>
          <CardTitle>Attendees ({attendees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No attendees found</div>
          ) : (
            <div className="space-y-3">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border-0 rounded-2xl bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar
                      src={undefined} // Profile image URL if available in future
                      name={`${attendee.firstName} ${attendee.lastName}`}
                      alt={`${attendee.firstName} ${attendee.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">
                        {attendee.firstName} {attendee.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{attendee.email}</p>
                      {attendee.phoneNumber && (
                        <p className="text-sm text-muted-foreground">{attendee.phoneNumber}</p>
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
                      <div className="text-sm text-muted-foreground">
                        Joined: {formatDate(attendee.createdAt)}
                      </div>
                      {attendee.registrations.length > 0 && (
                        <div className="text-sm text-muted-foreground">
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
                        onClick={() => setPreviewAttendee(attendee)}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAttendee(attendee.id)}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewAttendee(attendee.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditAttendee(attendee.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Attendee
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {attendee.registrations.length > 0 && (
                            <DropdownMenuItem onClick={() => {
                              setPreviewAttendee(attendee);
                            }}>
                              <Ticket className="h-4 w-4 mr-2" />
                              View Registrations ({attendee.registrations.length})
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            try {
                              exportAttendeeData({
                                id: attendee.id,
                                firstName: attendee.firstName,
                                lastName: attendee.lastName,
                                email: attendee.email,
                                status: attendee.status,
                                registrations: attendee.registrations.map(reg => ({
                                  eventTitle: reg.event.title,
                                  registeredAt: reg.createdAt,
                                  totalAmount: reg.totalAmount,
                                  ticketType: 'Standard', // Not available in API
                                })),
                              });
                              toast({
                                title: "Exported",
                                description: "Attendee data exported successfully",
                              });
                            } catch {
                              toast({
                                title: "Error",
                                description: "Failed to export attendee data",
                                variant: "destructive",
                              });
                            }
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Attendee Preview Dialog */}
      <Dialog 
        open={!!previewAttendee} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttendee(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendee Preview</DialogTitle>
            <DialogDescription>
              View attendee details and registration history
            </DialogDescription>
          </DialogHeader>
          {previewAttendee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar
                  src={undefined} // Profile image URL if available in future
                  name={`${previewAttendee.firstName} ${previewAttendee.lastName}`}
                  alt={`${previewAttendee.firstName} ${previewAttendee.lastName}`}
                  size="xl"
                />
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    {previewAttendee.firstName} {previewAttendee.lastName}
                  </h2>
                  <Badge className={`${getStatusBadge(previewAttendee.status)} mb-2`}>
                    {previewAttendee.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{previewAttendee.email}</p>
                  </div>
                </div>
                {previewAttendee.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{previewAttendee.phoneNumber}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(previewAttendee.createdAt)}</p>
                  </div>
                </div>
                {previewAttendee.registrations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="font-medium">
                        {formatCurrency(
                          previewAttendee.registrations.reduce((sum, reg) => sum + reg.totalAmount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration History */}
              {previewAttendee.registrations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Registration History ({previewAttendee.registrations.length})</h3>
                  <div className="space-y-2">
                    {previewAttendee.registrations.map((registration, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{registration.event.title || 'Event'}</p>
                            <p className="text-sm text-muted-foreground">
                              {registration.createdAt ? formatDate(registration.createdAt) : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(registration.totalAmount)}</p>
                            <Badge variant="outline" className="text-xs">
                              Standard
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewAttendee(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setPreviewAttendee(null);
                  handleEditAttendee(previewAttendee.id);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Attendee
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendeesPage;

