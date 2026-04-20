import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  DollarSign,
  Star,
  Eye,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  TrendingUp,
  User,
  CreditCard,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { getEventById } from "@/lib/event-api";
import { getEventRegistrations } from "@/lib/organizer-api";
import { updateOrganizerDataAccess } from "@/lib/admin-api";
import { useToast } from "@/hooks/useToast";
import { exportEventData } from "@/lib/utils/export";
import { getEventConfig, updateEventConfig, type EventScanConfig } from "@/lib/workstation-api";
import { getRefunds, getDisbursements, type Refund, type Disbursement } from "@/lib/financial-api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EventStaffAssignment } from "@/components/EventStaffAssignment";
import { usePermissionsEnhanced } from "@/hooks/usePermissions";
import { getEventStatusBadgeClass, getEventTypeBadgeClass, getPriceBadgeClass } from "@/lib/utils/event-badge-helpers";

interface EventDetails {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  venue: string;
  organizer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  category: string;
  status: "active" | "pending" | "cancelled" | "completed";
  type: "public" | "private";
  price: "free" | "paid";
  ticketPrice?: number;
  capacity: number;
  attendees: number;
  views: number;
  conversion: number;
  rating: number;
  image: string;
  createdAt: string;
  updatedAt: string;
  registrationDeadline?: string;
  requirements?: string[];
  speakers?: Array<{
    id: string;
    name: string;
    title: string;
    bio: string;
    image?: string;
  }>;
  sponsors?: Array<{
    id: string;
    name: string;
    level: "gold" | "silver" | "bronze";
    logo: string;
  }>;
  organizerDataAccess?: 'RESTRICTED' | 'STANDARD' | 'FULL';
}

interface EventMetrics {
  totalRevenue: number;
  platformFees: number;
  organizerAmount: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalRefunds: number;
  pendingRefunds: number;
  processedRefunds: number;
  remittancesSent: number;
  remittancesPending: number;
  attendanceRate: number;
  conversionRate: number;
  averageTicketPrice: number;
}

interface Registration {
  id: string;
  eventId: string;
  attendeeId: string;
  status: string;
  ticketType?: string | null;
  quantity: number;
  totalAmount: number | string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentTransactionId?: string | null;
  createdAt: string;
  attendee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
  };
}

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissionsEnhanced();
  const [activeTab, setActiveTab] = useState("details");
  const [eventData, setEventData] = useState<EventDetails | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [scanConfig, setScanConfig] = useState<EventScanConfig | null>(null);
  const [scanConfigLoading, setScanConfigLoading] = useState(false);
  const [scanConfigSaving, setScanConfigSaving] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [updatingAccess, setUpdatingAccess] = useState(false);
  const [canAccessEvent, setCanAccessEvent] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [disbursementsLoading, setDisbursementsLoading] = useState(false);

  const { toast } = useToast();

  // Load scan config when scan-settings tab is active
  useEffect(() => {
    const loadScanConfig = async () => {
      if (!eventId || activeTab !== 'scan-settings') return;

      try {
        setScanConfigLoading(true);
        const response = await getEventConfig(eventId);
        if (response.success && response.data) {
          setScanConfig(response.data.config);
        }
      } catch (error) {
        console.error('Error loading scan config:', error);
        toast({
          title: "Error",
          description: "Failed to load scan settings",
          variant: "destructive",
        });
      } finally {
        setScanConfigLoading(false);
      }
    };

    loadScanConfig();
  }, [eventId, activeTab, toast]);

  // Load refunds when refunds tab is active
  useEffect(() => {
    const loadRefunds = async () => {
      if (!eventId || activeTab !== 'refunds') return;

      try {
        setRefundsLoading(true);
        const response = await getRefunds({ eventId });
        if (response.success && response.data) {
          setRefunds(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error loading refunds:', error);
        toast({
          title: "Error",
          description: "Failed to load refunds",
          variant: "destructive",
        });
      } finally {
        setRefundsLoading(false);
      }
    };

    loadRefunds();
  }, [eventId, activeTab, toast]);

  // Load disbursements when remittance tab is active
  useEffect(() => {
    const loadDisbursements = async () => {
      if (!eventId || activeTab !== 'remittance') return;

      try {
        setDisbursementsLoading(true);
        const response = await getDisbursements({ eventId });
        if (response.success && response.data) {
          setDisbursements(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error loading disbursements:', error);
        toast({
          title: "Error",
          description: "Failed to load disbursements",
          variant: "destructive",
        });
      } finally {
        setDisbursementsLoading(false);
      }
    };

    loadDisbursements();
  }, [eventId, activeTab, toast]);

  // Check event access permission
  useEffect(() => {
    const checkAccess = async () => {
      if (!eventId) return;

      if (permissions.canAccessAllEvents) {
        setCanAccessEvent(true);
        return;
      }

      const hasAccess = await permissions.isAssignedToEvent(eventId);
      setCanAccessEvent(hasAccess);

      if (!hasAccess) {
        setError('You do not have permission to access this event');
        setLoading(false);
      }
    };

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, permissions.canAccessAllEvents]);

  // Fetch event data and registrations
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId || !canAccessEvent) return;

      try {
        setLoading(true);
        setError(null);

        const [eventResponse, registrationsResponse] = await Promise.all([
          getEventById(eventId),
          getEventRegistrations(eventId),
        ]);

        if (eventResponse.success && eventResponse.data?.event) {
          const event = eventResponse.data.event;
          const now = new Date();
          let status: "active" | "pending" | "cancelled" | "completed" = "pending";
          
          if (event.status === 'REJECTED') {
            status = "cancelled";
          } else if (event.status === 'CANCELLED') {
            status = "cancelled";
          } else if (event.status === 'APPROVED') {
            if (event.endDate && new Date(event.endDate) < now) {
              status = "completed";
            } else {
              status = "active";
            }
          } else {
            status = "pending";
          }

          setEventData({
            id: event.id,
            title: event.title,
            description: event.description || '',
            fullDescription: event.fullDescription || event.description || '',
            date: event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD',
            time: event.startTime || 'TBD',
            endTime: event.endTime || undefined,
            location: event.location || 'TBD',
            venue: event.venue || event.location || 'TBD',
            organizer: {
              id: event.organizer?.id || '',
              name: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
              email: event.organizer?.email || '',
              phone: event.organizer?.phoneNumber || undefined,
            },
            category: event.category || 'Uncategorized',
            status,
            type: event.type === 'PUBLIC' ? 'public' : 'private',
            price: event.isFree ? 'free' : 'paid',
            ticketPrice: event.price ? Number(event.price) : undefined,
            capacity: event.capacity || 0,
            attendees: event.attendees || 0,
            views: 0, // TODO: Add views tracking
            conversion: 0, // TODO: Calculate conversion rate
            rating: 0, // TODO: Add rating system
            image: event.image || '',
            createdAt: event.createdAt || new Date().toISOString(),
            updatedAt: event.updatedAt || new Date().toISOString(),
            registrationDeadline: (event as { registrationDeadline?: string }).registrationDeadline || undefined,
            requirements: event.requirements || undefined,
            speakers: Array.isArray((event as { speakers?: unknown }).speakers) 
              ? (event as { speakers?: Array<{ id: string; name: string; title: string; bio: string; image?: string }> }).speakers 
              : undefined,
            sponsors: Array.isArray((event as { sponsors?: unknown }).sponsors)
              ? (event as { sponsors?: Array<{ id: string; name: string; level: "gold" | "silver" | "bronze"; logo: string }> }).sponsors
              : undefined,
            organizerDataAccess: ((event as { organizerDataAccess?: string }).organizerDataAccess === 'RESTRICTED' || 
              (event as { organizerDataAccess?: string }).organizerDataAccess === 'STANDARD' || 
              (event as { organizerDataAccess?: string }).organizerDataAccess === 'FULL')
              ? (event as { organizerDataAccess?: 'RESTRICTED' | 'STANDARD' | 'FULL' }).organizerDataAccess
              : 'RESTRICTED' as 'RESTRICTED' | 'STANDARD' | 'FULL',
          });
        }

        if (registrationsResponse.success && registrationsResponse.data?.registrations) {
          // Map registrations to include attendee data (backend returns 'attendee' field)
          const mappedRegistrations = registrationsResponse.data.registrations.map(reg => ({
            ...reg,
            attendee: reg.attendee || reg.user || {
              id: reg.attendeeId || reg.userId || '',
              firstName: '',
              lastName: '',
              email: '',
            },
          }));
          setRegistrations(mappedRegistrations as Registration[]);
        }
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, canAccessEvent]);

  // Calculate payment metrics from registrations
  const metrics: EventMetrics = (() => {
    const paidRegistrations = registrations.filter(r => r.paymentStatus === 'COMPLETED');
    const pendingRegistrations = registrations.filter(r => r.paymentStatus === 'PENDING');
    const failedRegistrations = registrations.filter(r => r.paymentStatus === 'FAILED');
    
    const totalRevenue = paidRegistrations.reduce((sum, r) => {
      const amount = typeof r.totalAmount === 'string' ? parseFloat(r.totalAmount) : r.totalAmount;
      return sum + (amount || 0);
    }, 0);
    
    const platformFees = totalRevenue * 0.1; // 10% platform fee
    const organizerAmount = totalRevenue - platformFees;

    // Calculate refund metrics from actual data
    const refundAmount = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);
    const pendingRefundsCount = refunds.filter(r => r.status === 'PENDING').length;
    const processedRefundsCount = refunds.filter(r => r.status === 'COMPLETED' || r.status === 'PROCESSED').length;

    // Calculate disbursement metrics from actual data
    const sentDisbursements = disbursements.filter(d => d.status === 'COMPLETED' || d.status === 'PROCESSED');
    const pendingDisbursements = disbursements.filter(d => d.status === 'PENDING');

    return {
      totalRevenue,
      platformFees,
      organizerAmount,
      totalPayments: registrations.length,
      successfulPayments: paidRegistrations.length,
      failedPayments: failedRegistrations.length,
      pendingPayments: pendingRegistrations.length,
      totalRefunds: refundAmount,
      pendingRefunds: pendingRefundsCount,
      processedRefunds: processedRefundsCount,
      remittancesSent: sentDisbursements.length,
      remittancesPending: pendingDisbursements.length,
      attendanceRate: eventData ? (eventData.attendees / eventData.capacity) * 100 : 0,
      conversionRate: 0, // Would need views tracking to calculate
      averageTicketPrice: paidRegistrations.length > 0
        ? totalRevenue / paidRegistrations.length
        : 0,
    };
  })();

  // Filter payments
  const filteredPayments = registrations.filter(reg => {
    const matchesFilter = paymentFilter === "all" || 
      (paymentFilter === "successful" && reg.paymentStatus === 'COMPLETED') ||
      (paymentFilter === "pending" && reg.paymentStatus === 'PENDING') ||
      (paymentFilter === "failed" && reg.paymentStatus === 'FAILED');
    
    const matchesSearch = !paymentSearch || 
      `${reg.attendee.firstName} ${reg.attendee.lastName}`.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      reg.attendee.email.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      (reg.paymentTransactionId && reg.paymentTransactionId.toLowerCase().includes(paymentSearch.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Group payments by method
  const paymentsByMethod = registrations.reduce((acc, reg) => {
    if (reg.paymentStatus === 'COMPLETED' && reg.paymentMethod) {
      const method = reg.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      const amount = typeof reg.totalAmount === 'string' ? parseFloat(reg.totalAmount) : reg.totalAmount;
      acc[method].total += amount || 0;
    }
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">Loading event details...</span>
        </div>
    );
  }

  if (error || !eventData) {
    return (
      <>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Event not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/admin/events")} className="mt-4">
          Back to Events
        </Button>
      </>
    );
  }


  const getStatusBadge = (status: string) => {
    return getEventStatusBadgeClass(status);
  };

  const getTypeBadge = (type: string) => {
    return getEventTypeBadgeClass(type);
  };

  const getPriceBadge = (isFree: boolean) => {
    return getPriceBadgeClass(isFree);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };


  const handleEdit = () => {
    navigate(`/organizer/events/create?edit=${eventData.id}`);
  };

  const handleExport = () => {
    if (!eventData) return;
    try {
      exportEventData({
        id: eventData.id,
        title: eventData.title,
        date: eventData.date,
        location: eventData.location || eventData.venue,
        attendees: eventData.attendees,
        revenue: 0, // Calculate from registrations if needed
        views: eventData.views,
        status: eventData.status,
        category: eventData.category,
      });
      toast({
        title: "Exported",
        description: "Event data exported successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to export event data",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    if (eventId) {
      window.location.reload();
    }
  };

  const handleUpdateDataAccess = async (newLevel: 'RESTRICTED' | 'STANDARD' | 'FULL') => {
    if (!eventId || !eventData) return;

    try {
      setUpdatingAccess(true);
      const response = await updateOrganizerDataAccess(eventId, newLevel);
      
      if (response.success) {
        setEventData({
          ...eventData,
          organizerDataAccess: newLevel,
        });
        toast({
          title: "Success",
          description: `Organizer data access updated to ${newLevel}`,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Failed to update data access level';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingAccess(false);
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/events" label="Back to Events" />
            <div>
              <h1 className="text-base font-semibold text-foreground">{eventData.title}</h1>
              <p className="text-muted-foreground hidden">Event ID: {eventData.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
            <Button size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Event Status and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge className={`text-xs ${getStatusBadge(eventData.status)}`}>
                {eventData.status}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Attendees</span>
              </div>
              <p className="text-base font-semibold text-foreground">
                {eventData.attendees}/{eventData.capacity}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Revenue</span>
              </div>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Conversion</span>
              </div>
              <p className="text-base font-semibold text-foreground">
                {eventData.conversion}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max min-w-full h-auto flex-wrap gap-1 rounded-lg bg-muted p-1">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              {permissions.canAccessAllEvents && (
                <>
                  <TabsTrigger value="refunds">Refunds</TabsTrigger>
                  <TabsTrigger value="remittance">Remittance</TabsTrigger>
                  <TabsTrigger value="staff">Assigned Staff</TabsTrigger>
                </>
              )}
              <TabsTrigger value="scan-settings">Scan Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Event Title</label>
                        <p className="text-sm text-foreground">{eventData.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <p className="text-sm text-foreground">{eventData.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                        <p className="text-sm text-foreground">
                          {eventData.date} at {eventData.time}
                          {eventData.endTime && ` - ${eventData.endTime}`}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="text-sm text-foreground">{eventData.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Venue</label>
                        <p className="text-sm text-foreground">{eventData.venue}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                        <p className="text-sm text-foreground">{eventData.capacity} attendees</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <RichTextContent
                        content={eventData.fullDescription || eventData.description || '<p>No description available.</p>'}
                        className="text-sm mt-1"
                      />
                    </div>

                    {eventData.requirements && eventData.requirements.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Requirements</label>
                        <ul className="text-sm text-foreground mt-1 list-disc list-inside">
                          {eventData.requirements.map((requirement, index) => (
                            <li key={index}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Organizer Information */}
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Organizer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Organizer Name</label>
                        <p className="text-sm text-foreground">{eventData.organizer.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Organizer ID</label>
                        <p className="text-sm text-foreground">{eventData.organizer.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm text-foreground">{eventData.organizer.email}</p>
                      </div>
                      {eventData.organizer.phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-sm text-foreground">{eventData.organizer.phone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Organizer Data Access Control - Only for ADMIN_STAFF and SUPERADMIN */}
                {permissions.canAccessAllEvents && (
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Organizer Data Access Control</CardTitle>
                    </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Current Access Level
                      </label>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge 
                          className={
                            eventData.organizerDataAccess === 'RESTRICTED' 
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : eventData.organizerDataAccess === 'STANDARD'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-success/10 text-success border-success/20'
                          }
                        >
                          {eventData.organizerDataAccess || 'RESTRICTED'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-muted-foreground">
                          <strong>RESTRICTED:</strong> Organizer can only see summary cards (total attendees, total revenue)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>STANDARD:</strong> Organizer can see attendee list and payment summaries (no transaction IDs)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>FULL:</strong> Organizer can see all payment details except transaction IDs
                        </p>
                        <p className="text-xs text-muted-foreground italic mt-2">
                          Note: Transaction IDs are never visible to organizers, only admins.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={eventData.organizerDataAccess === 'RESTRICTED' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleUpdateDataAccess('RESTRICTED')}
                          disabled={updatingAccess || eventData.organizerDataAccess === 'RESTRICTED'}
                        >
                          {updatingAccess && eventData.organizerDataAccess !== 'RESTRICTED' ? (
                            <Loader size="sm" className="h-4 w-4 mr-2" />
                          ) : null}
                          Set Restricted
                        </Button>
                        <Button
                          variant={eventData.organizerDataAccess === 'STANDARD' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleUpdateDataAccess('STANDARD')}
                          disabled={updatingAccess || eventData.organizerDataAccess === 'STANDARD'}
                        >
                          {updatingAccess && eventData.organizerDataAccess !== 'STANDARD' ? (
                            <Loader size="sm" className="h-4 w-4 mr-2" />
                          ) : null}
                          Set Standard
                        </Button>
                        <Button
                          variant={eventData.organizerDataAccess === 'FULL' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleUpdateDataAccess('FULL')}
                          disabled={updatingAccess || eventData.organizerDataAccess === 'FULL'}
                        >
                          {updatingAccess && eventData.organizerDataAccess !== 'FULL' ? (
                            <Loader size="sm" className="h-4 w-4 mr-2" />
                          ) : null}
                          Set Full
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}
              </div>

              {/* Event Image and Stats */}
              <div className="space-y-6">
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Event Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={eventData.image}
                      alt={eventData.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Event Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Views</span>
                      <span className="text-sm font-medium text-foreground">{eventData.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="text-sm font-medium text-foreground">{eventData.conversion}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span className="text-sm font-medium text-foreground">{eventData.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Attendance Rate</span>
                      <span className="text-sm font-medium text-foreground">{metrics.attendanceRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Ticket Price</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(metrics.averageTicketPrice)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Event Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge className={`text-xs ${getTypeBadge(eventData.type)}`}>
                        {eventData.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <Badge className={`text-xs ${getPriceBadge(eventData.price === 'free')}`}>
                        {eventData.price}
                      </Badge>
                    </div>
                    {eventData.ticketPrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ticket Price</span>
                        <span className="text-sm font-medium text-foreground">{formatCurrency(eventData.ticketPrice)}</span>
                      </div>
                    )}
                    {eventData.registrationDeadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Registration Deadline</span>
                        <span className="text-sm font-medium text-foreground">{formatDate(eventData.registrationDeadline)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium text-foreground">{formatDateTime(eventData.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium text-foreground">{formatDateTime(eventData.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Speakers and Sponsors */}
            {(eventData.speakers && eventData.speakers.length > 0) || (eventData.sponsors && eventData.sponsors.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {eventData.speakers && eventData.speakers.length > 0 && (
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Speakers ({eventData.speakers.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {eventData.speakers.map((speaker) => (
                        <div key={speaker.id} className="flex items-center gap-3">
                          <img
                            src={speaker.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"}
                            alt={speaker.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">{speaker.name}</p>
                            <p className="text-xs text-muted-foreground">{speaker.title}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {eventData.sponsors && eventData.sponsors.length > 0 && (
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Sponsors ({eventData.sponsors.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {eventData.sponsors.map((sponsor) => (
                        <div key={sponsor.id} className="flex items-center gap-3">
                          <img
                            src={sponsor.logo}
                            alt={sponsor.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">{sponsor.name}</p>
                            <Badge className={`text-xs ${
                              sponsor.level === 'gold' ? 'bg-warning/10 text-warning border-warning/20' :
                              sponsor.level === 'silver' ? 'bg-muted text-muted-foreground border-border' :
                              'bg-primary/10 text-primary border-primary/20'
                            }`}>
                              {sponsor.level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </TabsContent>

          {/* Attendees Tab */}
          <TabsContent value="attendees" className="space-y-6">
            {/* Attendees Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{registrations.length}</div>
                  <p className="text-sm text-muted-foreground">Total Attendees</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {registrations.filter(r => r.status === 'CONFIRMED').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-warning mb-2">
                    {registrations.filter(r => r.status === 'PENDING').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {registrations.filter(r => r.paymentStatus === 'COMPLETED').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendees Filters and Search */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search attendees..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Ticket Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Attendees List */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <CardTitle>Attendees List</CardTitle>
              </CardHeader>
              <CardContent>
                {registrations.length > 0 ? (
                  <div className="space-y-3">
                    {registrations.map((reg) => {
                      const attendeeName = `${reg.attendee.firstName} ${reg.attendee.lastName}`;
                      const isConfirmed = reg.status === 'CONFIRMED';
                      const isPending = reg.status === 'PENDING';
                      const hasPaid = reg.paymentStatus === 'COMPLETED';

                      return (
                        <div key={reg.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground">{attendeeName}</h4>
                              <p className="text-sm text-muted-foreground">{reg.attendee.email}</p>
                              {reg.attendee.phoneNumber && (
                                <p className="text-xs text-muted-foreground">{reg.attendee.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={`text-xs ${
                              isConfirmed ? 'bg-success/10 text-success border-success/20' :
                              isPending ? 'bg-warning/10 text-warning border-warning/20' :
                              'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                              {isConfirmed ? 'Confirmed' : isPending ? 'Pending' : reg.status}
                            </Badge>
                            {reg.ticketType && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                {reg.ticketType}
                              </Badge>
                            )}
                            {hasPaid && (
                              <Badge className="text-xs bg-success/10 text-success border-success/20">
                                Paid
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">{formatDate(reg.createdAt)}</span>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No attendees yet</h3>
                    <p className="text-sm text-muted-foreground">No one has registered for this event yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{formatCurrency(metrics.totalRevenue)}</div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{metrics.successfulPayments}</div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-warning mb-2">{metrics.pendingPayments}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-destructive mb-2">{metrics.failedPayments}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Breakdown */}
            {Object.keys(paymentsByMethod).length > 0 && (
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(paymentsByMethod).map(([method, data]) => (
                      <div key={method} className="text-center p-4 border border-border rounded-lg">
                        <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
                        <div className="text-base font-semibold">{method}</div>
                        <div className="text-sm text-muted-foreground">{data.count} payment{data.count !== 1 ? 's' : ''}</div>
                        <div className="text-sm font-medium text-primary">{formatCurrency(data.total)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payments List */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Transactions</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by name, email, or transaction ID..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="successful">Successful</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPayments.length > 0 ? (
                  <div className="space-y-3">
                    {filteredPayments.map((reg) => {
                      const amount = typeof reg.totalAmount === 'string' ? parseFloat(reg.totalAmount) : reg.totalAmount;
                      const attendeeName = `${reg.attendee.firstName} ${reg.attendee.lastName}`;
                      const paymentStatus = reg.paymentStatus || 'PENDING';
                      const isSuccessful = paymentStatus === 'COMPLETED';
                      const isPending = paymentStatus === 'PENDING';
                      const isFailed = paymentStatus === 'FAILED';

                      return (
                        <div key={reg.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground">{attendeeName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {reg.attendee.email}
                                {reg.paymentTransactionId && ` • ${reg.paymentTransactionId}`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {reg.paymentMethod || 'N/A'} • {reg.ticketType || 'General'} • Qty: {reg.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium text-foreground">{formatCurrency(amount || 0)}</div>
                              <div className="text-sm text-muted-foreground">{formatDateTime(reg.createdAt)}</div>
                            </div>
                            <Badge className={`text-xs ${
                              isSuccessful ? 'bg-success/10 text-success border-success/20' :
                              isPending ? 'bg-warning/10 text-warning border-warning/20' :
                              isFailed ? 'bg-destructive/10 text-destructive border-destructive/20' :
                              'bg-muted text-muted-foreground border-border'
                            }`}>
                              {isSuccessful ? 'Completed' : isPending ? 'Pending' : isFailed ? 'Failed' : paymentStatus}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No payments found</h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentSearch || paymentFilter !== "all" 
                        ? "Try adjusting your search or filter criteria"
                        : "No payment transactions for this event yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds Tab - Only for ADMIN_STAFF and SUPERADMIN */}
          {permissions.canAccessAllEvents && (
            <TabsContent value="refunds" className="space-y-6">
            {/* Refunds Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-success mb-2">{formatCurrency(metrics.totalRefunds)}</div>
                  <p className="text-sm text-muted-foreground">Total Refunds</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{metrics.processedRefunds}</div>
                  <p className="text-sm text-muted-foreground">Processed</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-warning mb-2">{metrics.pendingRefunds}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">2.5%</div>
                  <p className="text-sm text-muted-foreground">Refund Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Refund Requests */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Refund Requests</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {refundsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader size="lg" className="h-8 w-8" />
                    <span className="ml-2 text-muted-foreground">Loading refunds...</span>
                  </div>
                ) : refunds.length > 0 ? (
                  <div className="space-y-3">
                    {refunds.map((refund) => (
                      <div key={refund.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <RefreshCw className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{refund.registration?.attendee?.firstName} {refund.registration?.attendee?.lastName}</h4>
                            <p className="text-sm text-muted-foreground">{refund.reason || 'No reason provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium text-foreground">{formatCurrency(refund.amount)}</div>
                            <div className="text-sm text-muted-foreground">
                              Requested: {formatDateTime(refund.createdAt)}
                            </div>
                            {refund.processedAt && (
                              <div className="text-sm text-muted-foreground">
                                Processed: {formatDateTime(refund.processedAt)}
                              </div>
                            )}
                          </div>
                          <Badge className={`text-xs ${
                            refund.status === 'COMPLETED' || refund.status === 'PROCESSED' ? 'bg-success/10 text-success border-success/20' :
                            refund.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
                            refund.status === 'FAILED' || refund.status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                            'bg-muted text-muted-foreground border-border'
                          }`}>
                            {refund.status}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {refund.status === 'PENDING' && (
                              <>
                                <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-muted">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/5">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No refunds yet</h3>
                    <p className="text-sm text-muted-foreground">No refund requests for this event</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Remittance Tab - Only for ADMIN_STAFF and SUPERADMIN */}
          {permissions.canAccessAllEvents && (
            <TabsContent value="remittance" className="space-y-6">
            {/* Remittance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{formatCurrency(metrics.organizerAmount)}</div>
                  <p className="text-sm text-muted-foreground">Total to Organizer</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{formatCurrency(metrics.platformFees)}</div>
                  <p className="text-sm text-muted-foreground">Platform Fees</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{metrics.remittancesSent}</div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-warning mb-2">{metrics.remittancesPending}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Breakdown */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Total Event Revenue</h4>
                      <p className="text-sm text-muted-foreground">From all ticket sales</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-primary">{formatCurrency(metrics.totalRevenue)}</div>
                      <div className="text-sm text-muted-foreground">100%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-success/10">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Organizer Share</h4>
                      <p className="text-sm text-muted-foreground">Amount to be paid to organizer</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-primary">{formatCurrency(metrics.organizerAmount)}</div>
                      <div className="text-sm text-muted-foreground">90%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-primary/5">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Platform Fees</h4>
                      <p className="text-sm text-muted-foreground"><span className="text-primary">EventKnit</span> commission</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-primary">{formatCurrency(metrics.platformFees)}</div>
                      <div className="text-sm text-muted-foreground">10%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remittance History */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Remittance History</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Send Payment
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {disbursementsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader size="lg" className="h-8 w-8" />
                    <span className="ml-2 text-muted-foreground">Loading disbursements...</span>
                  </div>
                ) : disbursements.length > 0 ? (
                  <div className="space-y-3">
                    {disbursements.map((disbursement) => (
                      <div key={disbursement.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Disbursement #{disbursement.id.slice(-8)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {disbursement.paymentMethod || 'Bank Transfer'} • {disbursement.transactionReference || 'Pending'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium text-foreground">{formatCurrency(disbursement.amount)}</div>
                            <div className="text-sm text-muted-foreground">{formatDateTime(disbursement.createdAt)}</div>
                          </div>
                          <Badge className={`text-xs ${
                            disbursement.status === 'COMPLETED' || disbursement.status === 'PROCESSED' ? 'bg-success/10 text-success border-success/20' :
                            disbursement.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
                            disbursement.status === 'FAILED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                            'bg-muted text-muted-foreground border-border'
                          }`}>
                            {disbursement.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No disbursements yet</h3>
                    <p className="text-sm text-muted-foreground">No payments have been sent to the organizer yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Payment Details */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <CardTitle>Organizer Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Bank Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="text-foreground">Tech Events Inc.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="text-foreground">****1234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="text-foreground">Chase Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Routing:</span>
                        <span className="text-foreground">****5678</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Payment Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="text-foreground">Monthly</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next Payment:</span>
                        <span className="text-foreground">March 1, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Minimum Threshold:</span>
                        <span className="text-foreground">{formatCurrency(100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="text-foreground">Bank Transfer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Assigned Staff Tab - Only for ADMIN_STAFF and SUPERADMIN */}
          {permissions.canAccessAllEvents && (
            <TabsContent value="staff" className="space-y-6">
            {eventId && (
              <EventStaffAssignment
                eventId={eventId}
                eventTitle={eventData?.title}
              />
            )}
          </TabsContent>
          )}

          {/* Scan Settings Tab */}
          <TabsContent value="scan-settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold">Scan Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure how tickets are scanned and validated for this event
                </p>
              </div>
            </div>

            {scanConfigLoading ? (
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-12 text-center">
                  <Loader size="lg" className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading scan settings...</p>
                </CardContent>
              </Card>
            ) : scanConfig ? (
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardHeader>
                  <CardTitle>Ticket Scanning Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Allow Re-entry */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowReEntry" className="text-base font-medium">
                        Allow Re-entry
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow attendees to leave and re-enter the event
                      </p>
                    </div>
                    <Switch
                      id="allowReEntry"
                      checked={scanConfig.allowReEntry}
                      onCheckedChange={(checked) =>
                        setScanConfig({ ...scanConfig, allowReEntry: checked })
                      }
                    />
                  </div>

                  {/* Require Check-out */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireCheckOut" className="text-base font-medium">
                        Require Check-out
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Require attendees to check out before leaving the event
                      </p>
                    </div>
                    <Switch
                      id="requireCheckOut"
                      checked={scanConfig.requireCheckOut}
                      onCheckedChange={(checked) =>
                        setScanConfig({ ...scanConfig, requireCheckOut: checked })
                      }
                    />
                  </div>

                  {/* Max Re-entries */}
                  {scanConfig.allowReEntry && (
                    <div className="space-y-2">
                      <Label htmlFor="maxReEntries" className="text-base font-medium">
                        Maximum Re-entries
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Maximum number of times an attendee can re-enter. Leave empty for unlimited.
                      </p>
                      <Input
                        id="maxReEntries"
                        type="number"
                        min="0"
                        value={scanConfig.maxReEntries ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setScanConfig({
                            ...scanConfig,
                            maxReEntries: value === '' ? null : parseInt(value, 10) || 0,
                          });
                        }}
                        placeholder="Unlimited"
                        className="max-w-xs"
                      />
                    </div>
                  )}

                  {/* Current Configuration Display */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Current Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Re-entry allowed:</span>
                        <Badge variant={scanConfig.allowReEntry ? "default" : "secondary"}>
                          {scanConfig.allowReEntry ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-out required:</span>
                        <Badge variant={scanConfig.requireCheckOut ? "default" : "secondary"}>
                          {scanConfig.requireCheckOut ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {scanConfig.allowReEntry && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max re-entries:</span>
                          <span className="font-medium">
                            {scanConfig.maxReEntries === null ? "Unlimited" : scanConfig.maxReEntries}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={async () => {
                        if (!eventId || !scanConfig) return;

                        try {
                          setScanConfigSaving(true);
                          const response = await updateEventConfig(eventId, {
                            allowReEntry: scanConfig.allowReEntry,
                            requireCheckOut: scanConfig.requireCheckOut,
                            maxReEntries: scanConfig.maxReEntries,
                            scanSettings: scanConfig.scanSettings,
                          });

                          if (response.success) {
                            toast({
                              title: "Success",
                              description: "Scan settings saved successfully",
                            });
                            setScanConfig(response.data.config);
                          } else {
                            throw new Error('Failed to save scan settings');
                          }
                        } catch (error) {
                          console.error('Error saving scan config:', error);
                          toast({
                            title: "Error",
                            description: "Failed to save scan settings",
                            variant: "destructive",
                          });
                        } finally {
                          setScanConfigSaving(false);
                        }
                      }}
                      disabled={scanConfigSaving}
                      className="w-full sm:w-auto"
                    >
                      {scanConfigSaving ? (
                        <>
                          <Loader size="sm" className="w-4 h-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Failed to load scan settings</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default EventDetailsPage;
