/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Mic,
  Building2,
  DollarSign,
  Star,
  FileText,
  Clock,
  MapPin,
  ArrowLeft,
  Settings,
  BarChart3,
  UserPlus,
  Eye,
  CheckCircle,
  TrendingUp,
  Download,
  Filter,
  Activity,
  Target,
  Zap,
  Heart,
  Share2,
  MessageSquare,
  X,
  MoreHorizontal,
  Copy,
  BarChart3,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { Loader2, AlertCircle } from "lucide-react";
import { CustomAreaChart, CustomBarChart, CustomPieChart } from "../../components/charts/ChartComponents";
import { CHART_COLORS } from "../../components/charts/chartConstants";
import { getOrganizerEventById, getEventRegistrations, cancelEvent } from "../../lib/organizer-api";
import { transformEventData } from "../../lib/event-utils";

const EventManagement = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [eventData, setEventData] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch event data and attendees
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch event details
        const eventResponse = await getOrganizerEventById(eventId);
        if (eventResponse.success && eventResponse.data) {
          const transformedEvent = transformEventData(eventResponse.data.event);
          setEventData(transformedEvent);
        } else {
          throw new Error(eventResponse.message || 'Failed to fetch event');
        }

        // Fetch attendees/registrations
        const registrationsResponse = await getEventRegistrations(eventId);
        if (registrationsResponse.success && registrationsResponse.data) {
          // Transform registrations to attendees format
          // Backend already filters based on access level
          interface Registration {
            id: string;
            attendee?: { firstName?: string; lastName?: string; email?: string };
            user?: { firstName?: string; lastName?: string; email?: string };
            ticketType?: string | null;
            status?: string;
            createdAt?: string;
            quantity?: number;
            totalAmount?: number | string;
            paymentStatus?: string | null;
            paymentMethod?: string | null;
          }
          const transformedAttendees = registrationsResponse.data.registrations.map((reg: Registration) => ({
            id: reg.id,
            name: `${reg.attendee?.firstName || reg.user?.firstName || ''} ${reg.attendee?.lastName || reg.user?.lastName || ''}`.trim() || 'Guest',
            email: reg.attendee?.email || reg.user?.email || 'N/A',
            ticketType: reg.ticketType || 'Standard',
            status: reg.status?.toLowerCase() || 'pending',
            registeredDate: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A',
            quantity: reg.quantity || 1,
            totalAmount: reg.totalAmount || 0, // May be undefined if RESTRICTED
            paymentStatus: reg.paymentStatus || undefined,
            paymentMethod: reg.paymentMethod || undefined,
            // paymentTransactionId is never included for organizers
          }));
          setAttendees(transformedAttendees);
        }
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to load event data. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Check if event can be cancelled (APPROVED and hasn't started)
  const canCancelEvent = () => {
    if (!eventData) return false;
    const status = eventData.status?.toUpperCase();
    if (status !== 'APPROVED') return false;
    
    // Check if event has started
    if (eventData.startDate) {
      const startDate = new Date(eventData.startDate);
      const now = new Date();
      if (startDate < now) return false;
    }
    
    return true;
  };

  // Handle cancel event
  const handleCancelEvent = async () => {
    if (!eventId) return;
    
    try {
      setCancelling(true);
      const response = await cancelEvent(eventId, cancelReason || undefined);
      
      if (response.success) {
        setShowCancelDialog(false);
        setCancelReason("");
        // Refresh event data
        const eventResponse = await getOrganizerEventById(eventId);
        if (eventResponse.success && eventResponse.data) {
          const transformedEvent = transformEventData(eventResponse.data.event);
          setEventData(transformedEvent);
        }
        // Show success message
        setError(null);
        // You could add a toast here if available
      } else {
        throw new Error(response.message || 'Failed to cancel event');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Failed to cancel event. Please try again.';
      setError(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Event not found'}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/organizer/events')} className="mt-4">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  // Get access level from event data (if available)
  const accessLevel = (eventData as { organizerDataAccess?: string })?.organizerDataAccess || 'RESTRICTED';
  const hasAttendeeListAccess = accessLevel === 'STANDARD' || accessLevel === 'FULL';
  const hasPaymentDetailsAccess = accessLevel === 'STANDARD' || accessLevel === 'FULL';
  
  // Calculate summary stats (always available)
  const totalAttendees = attendees.length;
  interface Attendee {
    status?: string;
    totalAmount?: number | string;
  }
  const confirmedAttendees = attendees.filter((a: Attendee) => a.status === 'confirmed' || a.status === 'CONFIRMED').length;
  const pendingAttendees = attendees.filter((a: Attendee) => a.status === 'pending' || a.status === 'PENDING').length;
  const totalRevenue = hasPaymentDetailsAccess 
    ? attendees.reduce((sum: number, a: Attendee) => sum + (Number(a.totalAmount) || 0), 0)
    : 0;

  // Mock data for sections that don't have APIs yet (speakers, exhibitors, sponsors, sessions, abstracts)
  // These can be added later when those features are implemented
  const mockData = {
    // Use real attendees data from API (already filtered by backend based on access level)
    attendees: attendees,

    speakers: eventData.speakers ? (Array.isArray(eventData.speakers) ? eventData.speakers : []) : [
      { id: 1, name: "No speakers", title: "Add speakers to your event", bio: "", sessions: 0, status: "pending" },
    ],
    exhibitors: eventData.sponsors ? (Array.isArray(eventData.sponsors) ? eventData.sponsors.map((s: any, idx: number) => ({
      id: idx + 1,
      name: s.name || 'Exhibitor',
      booth: `Booth ${idx + 1}`,
      category: s.level || 'General',
      contact: 'N/A',
      status: 'confirmed',
    })) : []) : [
      { id: 1, name: "No exhibitors", booth: "N/A", category: "Add exhibitors", contact: "N/A", status: "pending" },
    ],
    sponsors: eventData.sponsors ? (Array.isArray(eventData.sponsors) ? eventData.sponsors.map((s: any, idx: number) => ({
      id: idx + 1,
      name: s.level || 'Sponsor',
      company: s.name || 'Company',
      amount: 0,
      benefits: [],
    })) : []) : [
      { id: 1, name: "No sponsors", company: "Add sponsors", amount: 0, benefits: [] },
    ],
    sessions: [
      { id: 1, title: "No sessions scheduled", speaker: "Add sessions", time: "TBD", room: "TBD", attendees: 0 },
    ],
    abstracts: [
      { id: 1, title: "No abstracts submitted", author: "N/A", status: "pending", submittedDate: "N/A", category: "N/A" },
    ],
  };

  // Mock data for charts and analytics
  const registrationTrends = [
    { day: "Jan 1", registrations: 12 },
    { day: "Jan 2", registrations: 19 },
    { day: "Jan 3", registrations: 25 },
    { day: "Jan 4", registrations: 32 },
    { day: "Jan 5", registrations: 28 },
    { day: "Jan 6", registrations: 35 },
    { day: "Jan 7", registrations: 42 },
  ];

  const revenueBySource = [
    { name: "Ticket Sales", value: 70, amount: 101640 },
    { name: "Sponsorships", value: 20, amount: 29040 },
    { name: "Merchandise", value: 7, amount: 10164 },
    { name: "Donations", value: 3, amount: 4356 },
  ];

  const attendeeDemographics = [
    { age: "18-25", count: 85 },
    { age: "26-35", count: 142 },
    { age: "36-45", count: 98 },
    { age: "46-55", count: 67 },
    { age: "56+", count: 43 },
  ];

  const recentActivity = [
    { id: 1, type: "registration", message: "Sarah Johnson registered", time: "2 min ago", icon: Users, color: "text-green-600" },
    { id: 2, type: "payment", message: "Payment of $299 received", time: "5 min ago", icon: DollarSign, color: "text-blue-600" },
    { id: 3, type: "speaker", message: "New speaker confirmed", time: "12 min ago", icon: Mic, color: "text-purple-600" },
    { id: 4, type: "exhibitor", message: "Booth assignment completed", time: "18 min ago", icon: Building2, color: "text-orange-600" },
  ];

  const navigationSections = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "attendees", label: "Attendees", icon: Users },
    { key: "speakers", label: "Speakers", icon: Mic },
    { key: "exhibitors", label: "Exhibitors", icon: Building2 },
    { key: "sponsors", label: "Sponsors", icon: Star },
    { key: "revenue", label: "Revenue", icon: DollarSign },
    { key: "agenda", label: "Sessions", icon: Calendar },
    { key: "abstracts", label: "Abstracts", icon: FileText },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "attendees":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Attendees Management</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Attendee
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Attendees</p>
                      <p className="text-2xl font-bold">{totalAttendees}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-2xl font-bold">{confirmedAttendees}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{pendingAttendees}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {!hasAttendeeListAccess && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your data access is currently restricted. Contact an administrator to request access to attendee details.
                </AlertDescription>
              </Alert>
            )}

            {hasAttendeeListAccess && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendees List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.attendees.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No attendees registered yet</p>
                    ) : (
                      mockData.attendees.map((attendee: any) => (
                        <div key={attendee.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {attendee.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{attendee.name}</p>
                              <p className="text-sm text-muted-foreground">{attendee.email}</p>
                              {hasPaymentDetailsAccess && attendee.totalAmount && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Amount: ${Number(attendee.totalAmount).toFixed(2)} | 
                                  Status: {attendee.paymentStatus || 'N/A'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary">{attendee.ticketType}</Badge>
                            <Badge className={getStatusColor(attendee.status)}>
                              {attendee.status}
                            </Badge>
                            <Button variant="outline" size="sm">View Details</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "speakers":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Speakers Management</h3>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Speaker
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Speakers</p>
                      <p className="text-2xl font-bold">{mockData.speakers.length}</p>
                    </div>
                    <Mic className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-2xl font-bold">{mockData.speakers.filter((s: any) => s.status === 'confirmed').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                      <p className="text-2xl font-bold">{mockData.speakers.reduce((sum: number, s: any) => sum + (s.sessions || 0), 0)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Speakers List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.speakers.map((speaker: any) => (
                    <div key={speaker.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {speaker.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{speaker.name}</p>
                          <p className="text-sm text-muted-foreground">{speaker.title}</p>
                          <p className="text-xs text-muted-foreground">{speaker.bio}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{(speaker.sessions || 0)} sessions</Badge>
                        <Badge className={getStatusColor(speaker.status)}>
                          {speaker.status}
                        </Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "exhibitors":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Exhibitors Management</h3>
              <Button size="sm">
                <Building2 className="w-4 h-4 mr-2" />
                Add Exhibitor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Exhibitors</p>
                      <p className="text-2xl font-bold">{mockData.exhibitors.length}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-2xl font-bold">{mockData.exhibitors.filter((e: any) => e.status === 'confirmed').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{mockData.exhibitors.filter((e: any) => e.status === 'pending').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Exhibitors List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.exhibitors.map((exhibitor: any) => (
                    <div key={exhibitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {exhibitor.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{exhibitor.name}</p>
                          <p className="text-sm text-muted-foreground">Booth: {exhibitor.booth}</p>
                          <p className="text-xs text-muted-foreground">{exhibitor.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{exhibitor.category}</Badge>
                        <Badge className={getStatusColor(exhibitor.status)}>
                          {exhibitor.status}
                        </Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "sponsors":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Sponsors Management</h3>
              <Button size="sm">
                <Star className="w-4 h-4 mr-2" />
                Add Sponsor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sponsors</p>
                      <p className="text-2xl font-bold">{mockData.sponsors.length}</p>
                    </div>
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">${mockData.sponsors.reduce((sum: number, s: any) => sum + (s.amount || 0), 0).toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gold Sponsors</p>
                      <p className="text-2xl font-bold">{mockData.sponsors.filter((s: any) => s.name?.includes('Gold')).length}</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sponsors List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.sponsors.map((sponsor: any) => (
                    <div key={sponsor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {sponsor.company.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{sponsor.company}</p>
                          <p className="text-sm text-muted-foreground">{sponsor.name}</p>
                          <p className="text-xs text-muted-foreground">${sponsor.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{sponsor.name}</Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Revenue Analytics</h3>
            
            {!hasPaymentDetailsAccess && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your data access is currently restricted. You can only see summary statistics. Contact an administrator to request access to detailed revenue information.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {hasPaymentDetailsAccess 
                          ? `$${totalRevenue.toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Sales</p>
                      <p className="text-2xl font-bold">
                        {hasPaymentDetailsAccess 
                          ? `$${(totalRevenue * 0.7).toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Platform Fee</p>
                      <p className="text-2xl font-bold">
                        {hasPaymentDetailsAccess 
                          ? `$${(totalRevenue * 0.3).toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold">{eventData.capacity && eventData.capacity > 0 
                        ? ((totalAttendees / eventData.capacity) * 100).toFixed(1)
                        : 0}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">VIP Tickets</p>
                      <p className="text-sm text-muted-foreground">50 sold × $299</p>
                    </div>
                    <p className="font-bold">$14,950</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Standard Tickets</p>
                      <p className="text-sm text-muted-foreground">400 sold × $199</p>
                    </div>
                    <p className="font-bold">$79,600</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Student Tickets</p>
                      <p className="text-sm text-muted-foreground">35 sold × $99</p>
                    </div>
                    <p className="font-bold">$3,465</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Gold Sponsorship</p>
                      <p className="text-sm text-muted-foreground">1 × $50,000</p>
                    </div>
                    <p className="font-bold">$50,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "agenda":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Sessions & Agenda</h3>
              <Button size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Add Session
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sessions Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.sessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-muted-foreground">{session.speaker}</p>
                          <p className="text-xs text-muted-foreground">{session.time} • {session.room}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{session.attendees} attendees</Badge>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "abstracts":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Abstracts Management</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Review All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Abstracts</p>
                      <p className="text-2xl font-bold">{mockData.abstracts.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold">{mockData.abstracts.filter((a: any) => a.status === 'approved').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Under Review</p>
                      <p className="text-2xl font-bold">{mockData.abstracts.filter((a: any) => a.status === 'under_review').length}</p>
                    </div>
                    <Eye className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Abstracts List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.abstracts.map((abstract: any) => (
                    <div key={abstract.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {abstract.author.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{abstract.title}</p>
                          <p className="text-sm text-muted-foreground">{abstract.author}</p>
                          <p className="text-xs text-muted-foreground">{abstract.category} • {abstract.submittedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{abstract.category}</Badge>
                        <Badge className={getStatusColor(abstract.status)}>
                          {abstract.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="outline" size="sm">Review</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default: // overview
        return (
          <div className="space-y-8">
            {/* Hero Section with Image Left, Content Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Image - Left Side */}
              <div className="lg:col-span-1">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={eventData.image || 'https://via.placeholder.com/400x300?text=Event+Image'}
                    alt="Event background"
                    className="w-full h-80 lg:h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    {eventData.category && (
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                        {eventData.category}
                      </Badge>
                    )}
                    <div className="flex items-center gap-4 text-white/90 text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>2.3k</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        <span>156</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>89</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Details - Right Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Header */}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {eventData.title}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4">
                    {eventData.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{eventData.date || 'Date TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{eventData.time || 'Time TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{eventData.venue ? `${eventData.venue}, ${eventData.location}` : eventData.location || 'Location TBD'}</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Attendees</p>
                      <p className="text-2xl font-bold text-primary">{mockData.attendees.length}</p>
                          <p className="text-xs text-muted-foreground">of {eventData.capacity || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-primary/60" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Speakers</p>
                          <p className="text-2xl font-bold text-blue-600">{mockData.speakers.length}</p>
                          <p className="text-xs text-muted-foreground">confirmed</p>
                        </div>
                        <Mic className="w-8 h-8 text-blue-500/60" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-2xl font-bold text-green-600">${(mockData.attendees.reduce((sum: number, a: any) => sum + (a.totalAmount || 0), 0)).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">total</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500/60" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Conversion</p>
                          <p className="text-2xl font-bold text-purple-600">{eventData.capacity && eventData.capacity > 0 
                            ? ((mockData.attendees.length / eventData.capacity) * 100).toFixed(1)
                            : 0}%</p>
                          <p className="text-xs text-muted-foreground">rate</p>
                        </div>
                        <Target className="w-8 h-8 text-purple-500/60" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    size="lg" 
                    className="flex items-center gap-2"
                    onClick={() => window.open(`/event/${eventId}`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                    Preview Event
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex items-center gap-2"
                    onClick={() => navigate(`/organizer/events/create?edit=${eventId}`)}
                  >
                    <Settings className="w-4 h-4" />
                    Edit Event
                  </Button>
                  {canCancelEvent() && (
                    <Button 
                      variant="destructive" 
                      size="lg" 
                      className="flex items-center gap-2"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <X className="w-4 h-4" />
                      Cancel Event
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Event
                  </Button>
                </div>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registration Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Registration Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomAreaChart
                    data={registrationTrends}
                    xAxisKey="day"
                    dataKey="registrations"
                    height={200}
                    color={CHART_COLORS.primary}
                  />
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart
                    data={revenueBySource}
                    dataKey="value"
                    nameKey="name"
                    height={200}
                    colors={[CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error]}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Event Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">92</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Overall Health</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Registration Rate</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendee Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Attendee Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart
                    data={attendeeDemographics}
                    xAxisKey="age"
                    dataKey="count"
                    height={150}
                    color={CHART_COLORS.primary}
                  />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center`}>
                          <activity.icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Exhibitors</p>
                      <p className="text-xl font-bold">{mockData.exhibitors.length}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Star className="w-6 h-6 text-yellow-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">Sponsors</p>
                      <p className="text-xl font-bold">{mockData.sponsors.length}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Eye className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">Page Views</p>
                      <p className="text-xl font-bold">0</p>
                    </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                    <p className="text-xl font-bold">+18%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/organizer/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{eventData?.title || 'Event Management'}</h1>
                  <p className="text-muted-foreground">Event Management</p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPreviewModal(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate(`/organizer/events/create?edit=${eventId}`)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Event
              </Button>
              {canCancelEvent() && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Event
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(`/event/${eventId}`, '_blank')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/organizer/analytics/events?eventId=${eventId}`)}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/event/${eventId}`);
                  }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Event Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // TODO: Share event
                    console.log('Share event', eventId);
                  }}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // TODO: Export event data
                    console.log('Export event', eventId);
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {navigationSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.key;
                return (
                  <Button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`flex items-center gap-2 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {renderSection()}
        </div>
      </div>

      {/* Event Preview Dialog */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>
              Preview event details
            </DialogDescription>
          </DialogHeader>
          {eventData && (
            <div className="space-y-6">
              {eventData.image && (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={eventData.image}
                    alt={eventData.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-2xl font-bold mb-2">{eventData.title}</h2>
                    {eventData.category && (
                      <Badge className="bg-green-500/90 text-white">
                        {eventData.category}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {!eventData.image && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">{eventData.title}</h2>
                  {eventData.category && (
                    <Badge className="bg-green-500/90 text-white">
                      {eventData.category}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventData.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{eventData.date}</p>
                      {eventData.time && (
                        <p className="text-sm text-muted-foreground">{eventData.time}</p>
                      )}
                    </div>
                  </div>
                )}
                {eventData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{eventData.venue || eventData.location}</p>
                      {eventData.venue && eventData.location && (
                        <p className="text-sm text-muted-foreground">{eventData.location}</p>
                      )}
                    </div>
                  </div>
                )}
                {totalAttendees !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {totalAttendees} / {eventData.capacity || '∞'} registered
                    </p>
                  </div>
                )}
                {eventData.price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{eventData.price}</p>
                  </div>
                )}
              </div>

              {eventData.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{eventData.description}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowPreviewModal(false);
                  window.open(`/event/${eventId}`, '_blank');
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Page
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Event Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this event? This action cannot be undone. 
              All registrations will be notified of the cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="cancel-reason" className="text-sm font-medium">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancel-reason"
                className="mt-2 w-full min-h-[100px] px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason("");
              }}
              disabled={cancelling}
            >
              Keep Event
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelEvent}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManagement;
