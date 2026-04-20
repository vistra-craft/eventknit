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
  Ticket,
  Link2,
  Copy,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ShieldAlert,
  LogOut,
  Lock,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn, stripHtml } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getEventById } from "@/lib/event-api";
import { getEventRegistrations } from "@/lib/organizer-api";
import { updateOrganizerDataAccess } from "@/lib/admin-api";
import { getEventInvitations, createInvitation, revokeInvitation, getRegistrationLinkUrl, InviteType } from "@/lib/invitation-api";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/lib/utils/error";
import { exportEventData } from "@/lib/utils/export";
import { getEventConfig, updateEventConfig, type EventScanConfig } from "@/lib/workstation-api";
import { getRefunds, getDisbursements, getPlatformFeeSummary, type Refund, type Disbursement } from "@/lib/financial-api";
import { getSetting } from "@/lib/system-settings-api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EventStaffAssignment } from '@/components/events/EventStaffAssignment';
import EventCommunicationSection from '@/components/events/EventCommunicationSection';
import { usePermissionsEnhanced } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
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
  ticketTypes?: Array<{
    id: string;
    name: string;
    price: number;
    capacity: number;
    sold: number;
    description?: string;
  }>;
  organizerDataAccess?: 'RESTRICTED' | 'STANDARD' | 'FULL';
  isManaged?: boolean;
}

interface InvitationItem {
  id: string;
  eventId: string;
  inviteType: string;
  token: string;
  title: string | null;
  description: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  creator: { id: string; firstName: string; lastName: string; email: string };
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

interface PlatformFeeSummary {
  totalFees: number;
  totalOrganizerAmount: number;
  totalTransactions: number;
  disbursedCount: number;
  pendingCount: number;
}

interface Registration {
  id: string;
  eventId: string;
  attendeeId: string;
  status: string;
  ticketType?: string | null;
  ticketLineItems?: Array<{
    ticketType: string;
    quantity: number;
    unitPrice?: number | string;
    totalPrice?: number | string;
  }>;
  quantity: number;
  totalAmount: number | string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentTransactionId?: string | null;
  registrationData?: Record<string, unknown> | null;
  paymentTransaction?: {
    id: string;
    transactionNumber: string;
    gatewayReference: string;
    gateway: string;
    amount: number;
    currency: string;
    paymentStatus: string;
    paymentDate: string;
  } | null;
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
  const { user: adminUser } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [eventData, setEventData] = useState<EventDetails | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [scanConfig, setScanConfig] = useState<EventScanConfig | null>(null);
  const [scanConfigLoading, setScanConfigLoading] = useState(false);
  const [scanConfigSaving, setScanConfigSaving] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [registrationSheetOpen, setRegistrationSheetOpen] = useState(false);
  const [updatingAccess, setUpdatingAccess] = useState(false);
  const [canAccessEvent, setCanAccessEvent] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [disbursementsLoading, setDisbursementsLoading] = useState(false);
  const [platformFeeSummary, setPlatformFeeSummary] = useState<PlatformFeeSummary | null>(null);
  const [platformFeePercentage, setPlatformFeePercentage] = useState(7.5);
  const [platformFeeMinimum, setPlatformFeeMinimum] = useState(0);
  const [platformFeeMaximum, setPlatformFeeMaximum] = useState(0);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [createInviteDialogOpen, setCreateInviteDialogOpen] = useState(false);
  const [newInviteType, setNewInviteType] = useState<InviteType>(InviteType.ATTENDEE);
  const [newInviteTitle, setNewInviteTitle] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Support Mode — logged admin edit session
  const [supportModeActive, setSupportModeActive] = useState(false);
  const [supportModeDialogOpen, setSupportModeDialogOpen] = useState(false);
  const [supportModeTriggeredByEdit, setSupportModeTriggeredByEdit] = useState(false);
  const [supportReason, setSupportReason] = useState("");
  const [supportModeStartedAt, setSupportModeStartedAt] = useState<Date | null>(null);

  const ticketTypeCount = eventData?.ticketTypes?.length ?? 0;
  const hasMultipleTicketTypes = ticketTypeCount > 1;
  const hasComplementaryType = eventData?.ticketTypes?.some((ticket) => ticket.price === 0) ?? false;
  const normalizeStatus = (status?: string | null): string => (status || '').toUpperCase();

  const toAmount = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const normalizePaymentStatus = (status?: string | null): string =>
    normalizeStatus(status);

  const getRegistrationPaymentStatus = (registration: Registration): string => {
    const directStatus = normalizePaymentStatus(registration.paymentStatus);
    if (directStatus) return directStatus;

    const transactionStatus = normalizePaymentStatus(registration.paymentTransaction?.paymentStatus || null);
    if (transactionStatus === 'SUCCESS' || transactionStatus === 'COMPLETED') return 'COMPLETED';
    if (transactionStatus === 'FAILED' || transactionStatus === 'CANCELLED') return 'FAILED';
    if (transactionStatus === 'PENDING' || transactionStatus === 'INITIATED' || transactionStatus === 'PROCESSING') return 'PENDING';

    return 'PENDING';
  };

  const parsedTicketTypes = (eventData?.ticketTypes || []).map((ticket) => {
    const soldFromRegistrations = registrations.reduce((sum, reg) => {
      const lineItems = Array.isArray(reg.ticketLineItems) ? reg.ticketLineItems : [];
      const lineItemMatchQty = lineItems
        .filter((item) => (item.ticketType || '').trim().toLowerCase() === (ticket.name || '').trim().toLowerCase())
        .reduce((lineSum, item) => lineSum + (item.quantity || 0), 0);

      if (lineItemMatchQty > 0) return sum + lineItemMatchQty;

      const regTicketType = (reg.ticketType || '').trim().toLowerCase();
      const ticketName = (ticket.name || '').trim().toLowerCase();
      return regTicketType === ticketName ? sum + (reg.quantity || 1) : sum;
    }, 0);

    const sold = Number.isFinite(soldFromRegistrations) ? soldFromRegistrations : 0;

    return {
      ...ticket,
      sold,
    };
  });

  const totalTicketCapacity = parsedTicketTypes.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const totalTicketsSold = parsedTicketTypes.reduce((sum, t) => sum + (t.sold || 0), 0);

  const { toast } = useToast();

  // Load scan config when scan-settings tab is active
  useEffect(() => {
    const loadScanConfig = async () => {
      if (!eventId || activeSection !== 'scan-settings') return;

      try {
        setScanConfigLoading(true);
        const response = await getEventConfig(eventId);
        if (response.success && response.data) {
          setScanConfig(response.data.config);
        }
      } catch (error) {
        console.error('Error loading scan config:', error);
        toast({
          title: "Load failed",
          description: extractErrorMessage(error, "Failed to load scan settings"),
          variant: "destructive",
        });
      } finally {
        setScanConfigLoading(false);
      }
    };

    loadScanConfig();
  }, [eventId, activeSection, toast]);

  // Load refunds when refunds tab is active
  useEffect(() => {
    const loadRefunds = async () => {
      if (!eventId || activeSection !== 'refunds') return;

      try {
        setRefundsLoading(true);
        const response = await getRefunds({ eventId });
        if (response.success && response.data) {
          const payload = response.data as Refund[] | { refunds?: Refund[] };
          if (Array.isArray(payload)) {
            setRefunds(payload);
          } else {
            setRefunds(Array.isArray(payload.refunds) ? payload.refunds : []);
          }
        }
      } catch (error) {
        console.error('Error loading refunds:', error);
        toast({
          title: "Load failed",
          description: extractErrorMessage(error, "Failed to load refunds"),
          variant: "destructive",
        });
      } finally {
        setRefundsLoading(false);
      }
    };

    loadRefunds();
  }, [eventId, activeSection, toast]);

  // Load disbursements when remittance tab is active
  useEffect(() => {
    const loadDisbursements = async () => {
      if (!eventId || activeSection !== 'remittance') return;

      try {
        setDisbursementsLoading(true);
        const response = await getDisbursements({ eventId });
        if (response.success && response.data) {
          const payload = response.data as Disbursement[] | { disbursements?: Disbursement[] };
          if (Array.isArray(payload)) {
            setDisbursements(payload);
          } else {
            setDisbursements(Array.isArray(payload.disbursements) ? payload.disbursements : []);
          }
        }
      } catch (error) {
        console.error('Error loading disbursements:', error);
        toast({
          title: "Load failed",
          description: extractErrorMessage(error, "Failed to load disbursements"),
          variant: "destructive",
        });
      } finally {
        setDisbursementsLoading(false);
      }
    };

    loadDisbursements();
  }, [eventId, activeSection, toast]);

  // Load invitations when invitations tab is active
  useEffect(() => {
    const loadInvitations = async () => {
      if (!eventId || activeSection !== 'invitations') return;

      try {
        setInvitationsLoading(true);
        const response = await getEventInvitations(eventId);
        if (response.success && response.data?.invitations) {
          setInvitations(response.data.invitations);
        }
      } catch (error) {
        console.error('Error loading invitations:', error);
        toast({
          title: "Load failed",
          description: extractErrorMessage(error, "Failed to load invitations"),
          variant: "destructive",
        });
      } finally {
        setInvitationsLoading(false);
      }
    };

    loadInvitations();
  }, [eventId, activeSection, toast]);

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

        const [
          eventResponse,
          registrationsResponse,
          platformFeeSummaryResponse,
          platformFeeSettingResponse,
          minimumFeeSettingResponse,
          maximumFeeSettingResponse,
          refundsResponse,
          disbursementsResponse,
        ] = await Promise.all([
          getEventById(eventId),
          getEventRegistrations(eventId),
          getPlatformFeeSummary(eventId).catch(() => null),
          getSetting('finance.platformFeePercentage').catch(() => null),
          getSetting('finance.minimumFee').catch(() => null),
          getSetting('finance.maximumFee').catch(() => null),
          getRefunds({ eventId, limit: 500 }).catch(() => null),
          getDisbursements({ eventId, limit: 500 }).catch(() => null),
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
            attendees: (event as { _count?: { registrations?: number } })._count?.registrations || 0,
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
            ticketTypes: Array.isArray((event as { ticketTypes?: unknown }).ticketTypes)
              ? (event as { ticketTypes?: Array<{ id: string; name: string; price: number; capacity: number; sold: number; description?: string }> }).ticketTypes
              : undefined,
            organizerDataAccess: ((event as { organizerDataAccess?: string }).organizerDataAccess === 'RESTRICTED' ||
              (event as { organizerDataAccess?: string }).organizerDataAccess === 'STANDARD' ||
              (event as { organizerDataAccess?: string }).organizerDataAccess === 'FULL')
              ? (event as { organizerDataAccess?: 'RESTRICTED' | 'STANDARD' | 'FULL' }).organizerDataAccess
              : 'RESTRICTED' as 'RESTRICTED' | 'STANDARD' | 'FULL',
            isManaged: (event as { isManaged?: boolean }).isManaged ?? false,
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

        if (platformFeeSummaryResponse?.success && platformFeeSummaryResponse.data) {
          setPlatformFeeSummary(platformFeeSummaryResponse.data);
        }

        if (platformFeeSettingResponse?.success && platformFeeSettingResponse.data?.setting?.value !== undefined) {
          const configuredFee = Number(platformFeeSettingResponse.data.setting.value);
          if (Number.isFinite(configuredFee) && configuredFee >= 0) {
            setPlatformFeePercentage(configuredFee);
          }
        }

        if (minimumFeeSettingResponse?.success && minimumFeeSettingResponse.data?.setting?.value !== undefined) {
          const configuredMinimum = Number(minimumFeeSettingResponse.data.setting.value);
          if (Number.isFinite(configuredMinimum) && configuredMinimum >= 0) {
            setPlatformFeeMinimum(configuredMinimum);
          }
        }

        if (maximumFeeSettingResponse?.success && maximumFeeSettingResponse.data?.setting?.value !== undefined) {
          const configuredMaximum = Number(maximumFeeSettingResponse.data.setting.value);
          if (Number.isFinite(configuredMaximum) && configuredMaximum >= 0) {
            setPlatformFeeMaximum(configuredMaximum);
          }
        }

        if (refundsResponse?.success && refundsResponse.data) {
          const refundsPayload = refundsResponse.data as Refund[] | { refunds?: Refund[] };
          if (Array.isArray(refundsPayload)) {
            setRefunds(refundsPayload);
          } else if (Array.isArray(refundsPayload.refunds)) {
            setRefunds(refundsPayload.refunds);
          }
        }

        if (disbursementsResponse?.success && disbursementsResponse.data) {
          const disbursementsPayload = disbursementsResponse.data as Disbursement[] | { disbursements?: Disbursement[] };
          if (Array.isArray(disbursementsPayload)) {
            setDisbursements(disbursementsPayload);
          } else if (Array.isArray(disbursementsPayload.disbursements)) {
            setDisbursements(disbursementsPayload.disbursements);
          }
        }
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, canAccessEvent, refreshKey]);

  // Calculate payment metrics from registrations
  const metrics: EventMetrics = (() => {
    const paidRegistrations = registrations.filter(r => getRegistrationPaymentStatus(r) === 'COMPLETED');
    const pendingRegistrations = registrations.filter(r => getRegistrationPaymentStatus(r) === 'PENDING');
    const failedRegistrations = registrations.filter(r => getRegistrationPaymentStatus(r) === 'FAILED');
    
    const totalRevenue = paidRegistrations.reduce((sum, r) => {
      return sum + toAmount(r.totalAmount);
    }, 0);
    
    const calculatedPlatformFees = paidRegistrations.reduce((sum, registration) => {
      const amount = toAmount(registration.totalAmount);
      let fee = (amount * platformFeePercentage) / 100;
      if (platformFeeMinimum > 0) {
        fee = Math.max(fee, platformFeeMinimum);
      }
      if (platformFeeMaximum > 0) {
        fee = Math.min(fee, platformFeeMaximum);
      }
      return sum + fee;
    }, 0);

    const platformFees = platformFeeSummary?.totalTransactions
      ? platformFeeSummary.totalFees
      : Number(calculatedPlatformFees.toFixed(2));

    const organizerAmount = platformFeeSummary?.totalTransactions
      ? platformFeeSummary.totalOrganizerAmount
      : Math.max(0, totalRevenue - platformFees);

    // Calculate refund metrics from actual data
    const refundAmount = refunds.reduce((sum, r) => sum + toAmount(r.amount ?? r.refundAmount), 0);
    const pendingRefundsCount = refunds.filter(r => normalizeStatus(r.status) === 'PENDING').length;
    const processedRefundsCount = refunds.filter(r => {
      const status = normalizeStatus(r.status);
      return status === 'COMPLETED' || status === 'PROCESSED';
    }).length;

    // Calculate disbursement metrics from actual data
    const sentDisbursements = disbursements.filter(d => {
      const status = normalizeStatus(d.status);
      return status === 'COMPLETED' || status === 'PROCESSED';
    });
    const pendingDisbursements = disbursements.filter(d => normalizeStatus(d.status) === 'PENDING');

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
      attendanceRate: eventData && eventData.capacity > 0
        ? (Math.max(eventData.attendees, registrations.filter(r => normalizeStatus(r.status) === 'CONFIRMED').length) / eventData.capacity) * 100
        : 0,
      conversionRate: 0, // Would need views tracking to calculate
      averageTicketPrice: paidRegistrations.length > 0
        ? totalRevenue / paidRegistrations.length
        : 0,
    };
  })();

  // Filter payments
  const filteredPayments = registrations.filter(reg => {
    const normalizedPaymentStatus = getRegistrationPaymentStatus(reg);
    const matchesFilter = paymentFilter === "all" || 
      (paymentFilter === "successful" && normalizedPaymentStatus === 'COMPLETED') ||
      (paymentFilter === "pending" && normalizedPaymentStatus === 'PENDING') ||
      (paymentFilter === "failed" && normalizedPaymentStatus === 'FAILED');
    
    const matchesSearch = !paymentSearch || 
      `${reg.attendee.firstName} ${reg.attendee.lastName}`.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      reg.attendee.email.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      (reg.paymentTransactionId && reg.paymentTransactionId.toLowerCase().includes(paymentSearch.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Group payments by method
  const paymentsByMethod = registrations.reduce((acc, reg) => {
    if (getRegistrationPaymentStatus(reg) === 'COMPLETED' && reg.paymentMethod) {
      const method = reg.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      acc[method].total += toAmount(reg.totalAmount);
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
    // Managed events: admin owns them, no support mode required
    // Organizer events: support mode must be active (audit trail required)
    if (!eventData.isManaged && !supportModeActive) {
      setSupportModeTriggeredByEdit(true);
      setSupportModeDialogOpen(true);
      return;
    }
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
        attendees: Math.max(eventData.attendees, registrations.length),
        revenue: metrics.totalRevenue,
        views: eventData.views,
        status: eventData.status,
        category: eventData.category,
      });
      toast({
        title: "Exported",
        description: "Event data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: extractErrorMessage(error, "Failed to export event data"),
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    if (eventId) {
      setRefreshKey((k) => k + 1);
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
      toast({
        title: "Update failed",
        description: extractErrorMessage(err, 'Failed to update data access level'),
        variant: "destructive",
      });
    } finally {
      setUpdatingAccess(false);
    }
  };

  const primaryNavSections = [
    { key: "overview", label: "Overview" },
    { key: "details", label: "Details" },
    { key: "attendees", label: "Attendees" },
    { key: "tickets", label: "Tickets" },
    { key: "payments", label: "Payments" },
  ];

  const moreNavSections = [
    { key: "scan-settings", label: "Scan Settings" },
    ...(permissions.canAccessAllEvents ? [
      { key: "refunds", label: "Refunds" },
      { key: "remittance", label: "Remittance" },
      { key: "messages", label: "Messages" },
      { key: "invitations", label: "Invitations" },
      { key: "staff", label: "Assigned Staff" },
    ] : []),
  ];

  return (
      <div className="space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border -mx-6 px-6">
          <div className="flex items-center gap-2 py-2.5">
            {/* Breadcrumb */}
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 hidden sm:block" />
            <h1 className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
              {eventData.title}
            </h1>
            <Badge className={`text-xs shrink-0 ${getStatusBadge(eventData.status)}`}>
              {eventData.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleEdit}
                  className={(!eventData.isManaged && !supportModeActive) ? "text-muted-foreground" : ""}
                >
                  {(!eventData.isManaged && !supportModeActive)
                    ? <Lock className="h-4 w-4 mr-2" />
                    : <Settings className="h-4 w-4 mr-2" />
                  }
                  Edit Event
                  {(!eventData.isManaged && !supportModeActive) && (
                    <span className="ml-auto text-xs text-muted-foreground">Support Mode</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                {permissions.canAccessAllEvents && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveSection('overview')}>
                      <User className="h-4 w-4 mr-2" />
                      Data Access Level
                    </DropdownMenuItem>
                    {!supportModeActive ? (
                      <DropdownMenuItem
                        onClick={() => { setSupportModeTriggeredByEdit(false); setSupportModeDialogOpen(true); }}
                        className="text-amber-600 focus:text-amber-600"
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Enter Support Mode
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          setSupportModeActive(false);
                          setSupportReason("");
                          setSupportModeStartedAt(null);
                        }}
                        className="text-muted-foreground"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Exit Support Mode
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Button-based tab nav */}
          <div className="flex flex-wrap items-center gap-1 pb-3">
            {primaryNavSections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors",
                  activeSection === section.key
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {section.label}
              </button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors flex items-center gap-1",
                  moreNavSections.some(s => s.key === activeSection)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}>
                  More
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {moreNavSections.map((section) => (
                  <DropdownMenuItem
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={activeSection === section.key ? "bg-muted" : ""}
                  >
                    {section.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Support Mode Banner ── */}
        {supportModeActive && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-600">Support Mode Active</p>
              <p className="text-xs text-amber-600/80 mt-0.5">
                Editing as{" "}
                <span className="font-medium">
                  {adminUser?.firstName} {adminUser?.lastName}
                </span>
                {supportModeStartedAt && (
                  <> &middot; started {supportModeStartedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                )}
              </p>
              {supportReason && (
                <p className="text-xs text-amber-600/70 mt-1 italic">
                  Reason: "{supportReason}"
                </p>
              )}
              <p className="text-xs text-amber-600/60 mt-1">
                The organizer will be notified of any changes made during this session.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 h-7 text-xs"
              onClick={() => {
                setSupportModeActive(false);
                setSupportReason("");
                setSupportModeStartedAt(null);
              }}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Exit
            </Button>
          </div>
        )}

        {/* ── Enter Support Mode Dialog ── */}
        <Dialog open={supportModeDialogOpen} onOpenChange={setSupportModeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
                Enter Support Mode
              </DialogTitle>
              <DialogDescription>
                Support Mode allows you to make changes to this organizer's event on their behalf.
                Your session will be logged and the organizer will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-3 text-xs text-amber-600 space-y-1">
                <p className="font-medium">Before you proceed:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-600/80">
                  <li>All changes will be attributed to your admin account</li>
                  <li>The organizer receives an email notification</li>
                  <li>Session activity is logged in the audit trail</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-reason" className="text-sm font-medium">
                  Reason for support session <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="support-reason"
                  placeholder="e.g. Organizer requested help fixing ticket pricing after payment gateway error"
                  value={supportReason}
                  onChange={e => setSupportReason(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific — this reason is visible to the organizer and in audit logs.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSupportModeDialogOpen(false);
                  setSupportReason("");
                  setSupportModeTriggeredByEdit(false);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={supportReason.trim().length < 10}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => {
                  setSupportModeActive(true);
                  setSupportModeStartedAt(new Date());
                  setSupportModeDialogOpen(false);
                  toast({
                    title: "Support Mode Active",
                    description: "Your session is now logged. The organizer will be notified.",
                  });
                  if (supportModeTriggeredByEdit) {
                    setSupportModeTriggeredByEdit(false);
                    navigate(`/organizer/events/create?edit=${eventData.id}`);
                  }
                }}
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                {supportModeTriggeredByEdit ? "Activate & Edit Event" : "Activate Support Mode"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

          {/* Overview Tab */}
        {activeSection === "overview" && <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Total Attendees</span>
                  </div>
                  <p className="text-2xl font-bold">{Math.max(eventData.attendees, registrations.length)}</p>
                  <p className="text-xs text-muted-foreground mt-1">of {eventData.capacity} capacity</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.successfulPayments} paid registrations</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium text-muted-foreground">Confirmed</span>
                  </div>
                  <p className="text-2xl font-bold">{registrations.filter(r => normalizeStatus(r.status) === 'CONFIRMED').length}</p>
                  <p className="text-xs text-muted-foreground mt-1">confirmed registrations</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Fill Rate</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {eventData.capacity > 0
                      ? Math.round((Math.max(eventData.attendees, registrations.length) / eventData.capacity) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.max(0, eventData.capacity - Math.max(eventData.attendees, registrations.length))} spots remaining
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Platform Fees</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.platformFees)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Organizer Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.organizerAmount)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Ticket Price</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.averageTicketPrice)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Registration Status Breakdown */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Registration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-success/10">
                    <p className="text-2xl font-bold text-success">{metrics.successfulPayments}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-warning/10">
                    <p className="text-2xl font-bold text-warning">{metrics.pendingPayments}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-destructive/10">
                    <p className="text-2xl font-bold text-destructive">{metrics.failedPayments}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{metrics.processedRefunds}</p>
                    <p className="text-xs text-muted-foreground">Refunded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>}

          {/* Details Tab */}
        {activeSection === "details" && <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Organizer Data Access Control - Only for ADMIN and SUPERADMIN */}
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
        </div>}

          {/* Attendees Tab */}
        {activeSection === "attendees" && <div className="space-y-6">
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
                    {registrations.filter(r => normalizeStatus(r.status) === 'CONFIRMED').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-warning mb-2">
                    {registrations.filter(r => normalizeStatus(r.status) === 'PENDING').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {registrations.filter(r => getRegistrationPaymentStatus(r) === 'COMPLETED').length}
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
                  <div className="rounded-lg border overflow-hidden">
                    <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-3 px-4 py-3 bg-muted/40 border-b text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      <span>Attendee</span>
                      <span>Ticket</span>
                      <span>Amount</span>
                      <span>Payment</span>
                      <span>Status</span>
                      <span />
                    </div>
                    <div className="divide-y">
                      {registrations.map((reg) => {
                        const attendeeName = `${reg.attendee.firstName} ${reg.attendee.lastName}`.trim() || 'Guest';
                        const normalizedRegistrationStatus = normalizeStatus(reg.status);
                        const isConfirmed = normalizedRegistrationStatus === 'CONFIRMED';
                        const isPending = normalizedRegistrationStatus === 'PENDING';
                        const normalizedPaymentStatus = getRegistrationPaymentStatus(reg);
                        const ticketDisplay = reg.ticketLineItems && reg.ticketLineItems.length > 0
                          ? reg.ticketLineItems.map(item => `${item.ticketType}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join(', ')
                          : (reg.ticketType || 'Standard');
                        const amount = toAmount(reg.totalAmount);

                        return (
                          <div
                            key={reg.id}
                            className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-2 md:gap-3 items-center px-4 py-3 hover:bg-muted/30 cursor-pointer"
                            onClick={() => { setSelectedRegistration(reg); setRegistrationSheetOpen(true); }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{attendeeName}</p>
                                <p className="text-xs text-muted-foreground truncate">{reg.attendee.email}</p>
                              </div>
                            </div>
                            <div className="text-sm truncate text-muted-foreground md:text-foreground">{ticketDisplay}</div>
                            <div className="text-sm font-medium">{formatCurrency(amount || 0)}</div>
                            <div>
                              <Badge className={`text-xs ${
                                normalizedPaymentStatus === 'COMPLETED' ? 'bg-success/10 text-success border-success/20' :
                                normalizedPaymentStatus === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
                                'bg-muted text-muted-foreground border-border'
                              }`}>
                                {normalizedPaymentStatus || 'N/A'}
                              </Badge>
                            </div>
                            <div>
                              <Badge className={`text-xs ${
                                isConfirmed ? 'bg-success/10 text-success border-success/20' :
                                isPending ? 'bg-warning/10 text-warning border-warning/20' :
                                'bg-destructive/10 text-destructive border-destructive/20'
                              }`}>
                                {isConfirmed ? 'Confirmed' : isPending ? 'Pending' : normalizedRegistrationStatus || 'N/A'}
                              </Badge>
                            </div>
                            <div className="hidden md:flex justify-end">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
        </div>}

          {/* Payments Tab */}
        {activeSection === "payments" && <div className="space-y-6">
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
                      const amount = toAmount(reg.totalAmount);
                      const attendeeName = `${reg.attendee.firstName} ${reg.attendee.lastName}`;
                      const paymentStatus = getRegistrationPaymentStatus(reg) || 'PENDING';
                      const isSuccessful = paymentStatus === 'COMPLETED';
                      const isPending = paymentStatus === 'PENDING';
                      const isFailed = paymentStatus === 'FAILED';

                      return (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => { setSelectedRegistration(reg); setRegistrationSheetOpen(true); }}
                        >
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRegistration(reg);
                                setRegistrationSheetOpen(true);
                              }}
                            >
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
        </div>}

          {/* Registration / Payment Detail Sheet (Admin full-access) */}
        <Sheet open={registrationSheetOpen} onOpenChange={setRegistrationSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Attendee & Payment Details</SheetTitle>
              <SheetDescription>Complete registration and transaction information</SheetDescription>
            </SheetHeader>

            {selectedRegistration && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">
                      {`${selectedRegistration.attendee.firstName} ${selectedRegistration.attendee.lastName}`.trim() || 'Guest'}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedRegistration.attendee.email}</p>
                    {selectedRegistration.attendee.phoneNumber && (
                      <p className="text-sm text-muted-foreground">{selectedRegistration.attendee.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Registration</p>
                  <div className="rounded-lg border divide-y">
                    {[
                      { label: 'Registration ID', value: selectedRegistration.id, mono: true },
                      { label: 'Status', value: selectedRegistration.status },
                      { label: 'Created', value: formatDateTime(selectedRegistration.createdAt) },
                      { label: 'Ticket Type', value: selectedRegistration.ticketType || 'Standard' },
                      { label: 'Quantity', value: String(selectedRegistration.quantity || 1) },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-start justify-between px-3 py-2 gap-3">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className={`text-sm font-medium text-right break-all max-w-[60%] ${mono ? 'font-mono text-xs' : 'capitalize'}`}>{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedRegistration.ticketLineItems?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ticket Breakdown</p>
                    <div className="rounded-lg border divide-y">
                      {selectedRegistration.ticketLineItems?.map((item, idx) => (
                        <div key={`${item.ticketType}-${idx}`} className="flex items-center justify-between px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{item.ticketType}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">{formatCurrency(Number(item.totalPrice || 0))}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Payment</p>
                  <div className="rounded-lg border divide-y">
                    {[
                      { label: 'Amount', value: formatCurrency(typeof selectedRegistration.totalAmount === 'string' ? parseFloat(selectedRegistration.totalAmount) : selectedRegistration.totalAmount || 0) },
                      { label: 'Payment Status', value: selectedRegistration.paymentStatus || 'N/A' },
                      { label: 'Payment Method', value: selectedRegistration.paymentMethod || 'N/A' },
                      { label: 'Payment Txn ID', value: selectedRegistration.paymentTransactionId || 'N/A', mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-start justify-between px-3 py-2 gap-3">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className={`text-sm font-medium text-right break-all max-w-[60%] ${mono ? 'font-mono text-xs' : 'capitalize'}`}>{value}</span>
                      </div>
                    ))}

                    {selectedRegistration.paymentTransaction && (
                      <>
                        <div className="flex items-start justify-between px-3 py-2 gap-3">
                          <span className="text-sm text-muted-foreground">Transaction #</span>
                          <span className="text-xs font-mono font-medium text-right break-all max-w-[60%]">{selectedRegistration.paymentTransaction.transactionNumber}</span>
                        </div>
                        <div className="flex items-start justify-between px-3 py-2 gap-3">
                          <span className="text-sm text-muted-foreground">Gateway Reference</span>
                          <span className="text-xs font-mono font-medium text-right break-all max-w-[60%]">{selectedRegistration.paymentTransaction.gatewayReference}</span>
                        </div>
                        <div className="flex items-start justify-between px-3 py-2 gap-3">
                          <span className="text-sm text-muted-foreground">Gateway</span>
                          <span className="text-sm font-medium">{selectedRegistration.paymentTransaction.gateway}</span>
                        </div>
                        <div className="flex items-start justify-between px-3 py-2 gap-3">
                          <span className="text-sm text-muted-foreground">Paid At</span>
                          <span className="text-sm font-medium">{formatDateTime(selectedRegistration.paymentTransaction.paymentDate)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {selectedRegistration.registrationData && Object.keys(selectedRegistration.registrationData).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Registration Form Responses</p>
                    <div className="rounded-lg border divide-y">
                      {Object.entries(selectedRegistration.registrationData).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between px-3 py-2 gap-3">
                          <span className="text-sm text-muted-foreground capitalize shrink-0">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium text-right break-words max-w-[60%]">
                            {Array.isArray(value)
                              ? value.join(', ')
                              : (typeof value === 'object' && value !== null)
                                ? JSON.stringify(value)
                                : String(value ?? '—')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

          {/* Refunds Tab - Only for ADMIN and SUPERADMIN */}
        {permissions.canAccessAllEvents && activeSection === "refunds" && <div className="space-y-6">
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
        </div>}

          {/* Remittance Tab - Only for ADMIN and SUPERADMIN */}
        {permissions.canAccessAllEvents && activeSection === "remittance" && <div className="space-y-6">
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
        </div>}

          {/* Assigned Staff Tab - Only for ADMIN and SUPERADMIN */}
        {permissions.canAccessAllEvents && activeSection === "staff" && <div className="space-y-6">
            {eventId && (
              <EventStaffAssignment
                eventId={eventId}
                eventTitle={eventData?.title}
              />
            )}
        </div>}

          {/* Tickets Tab */}
        {activeSection === "tickets" && <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ticket Types</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Ticket Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Manage advanced ticket types, packages, reserved seating, and pricing rules.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => eventData?.id && navigate(`/admin/event/${eventData.id}/tickets/advanced`)}
                    >
                      Advanced Ticket Types
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => eventData?.id && navigate(`/admin/event/${eventData.id}/tickets/pricing`)}
                    >
                      Dynamic Pricing
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveSection("invitations")}
                    >
                      Complimentary Tickets (Invitations)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Industry Standards Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Multiple ticket types</span>
                    <Badge variant={hasMultipleTicketTypes ? "default" : "secondary"}>
                      {hasMultipleTicketTypes ? "Configured" : "Not configured"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Complementary tickets</span>
                    <Badge variant={hasComplementaryType ? "default" : "secondary"}>
                      {hasComplementaryType ? "Configured" : "Available"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dynamic pricing</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Packages & bundles</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reserved seating</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    Ticket Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total types</span>
                    <span className="font-medium">{ticketTypeCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total capacity</span>
                    <span className="font-medium">{totalTicketCapacity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total sold</span>
                    <span className="font-medium">{totalTicketsSold}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <Badge variant={totalTicketCapacity > totalTicketsSold ? "default" : "destructive"}>
                      {totalTicketCapacity > totalTicketsSold ? "Open" : "Sold out"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {parsedTicketTypes.length > 0 ? (
              <div className="space-y-4">
                {parsedTicketTypes.map((ticket) => {
                  const soldPercent = ticket.capacity > 0 ? Math.round((ticket.sold / ticket.capacity) * 100) : 0;
                  const revenue = ticket.sold * ticket.price;
                  return (
                    <Card key={ticket.id} className="border-0 bg-card-surface rounded-2xl shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Ticket className="h-5 w-5 text-primary" />
                            <div>
                              <h3 className="font-semibold">{ticket.name}</h3>
                              {ticket.description && (
                                <p className="text-sm text-muted-foreground">{stripHtml(ticket.description)}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">{formatCurrency(ticket.price)}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sold</span>
                            <span className="font-medium">{ticket.sold} / {ticket.capacity}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(soldPercent, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{soldPercent}% sold</span>
                            <span className="font-medium text-primary">{formatCurrency(revenue)} revenue</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Ticket Summary */}
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Types</p>
                        <p className="text-xl font-bold">{ticketTypeCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sold</p>
                        <p className="text-xl font-bold">
                          {totalTicketsSold}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Capacity</p>
                        <p className="text-xl font-bold">
                          {totalTicketCapacity}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardContent className="py-12 text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No ticket types configured for this event</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {eventData.price === 'free' ? 'This is a free event' : `Single ticket price: ${formatCurrency(eventData.ticketPrice || 0)}`}
                  </p>
                </CardContent>
              </Card>
            )}
        </div>}

          {/* Messages Tab */}
        {permissions.canAccessAllEvents && activeSection === "messages" && <div className="space-y-6">
              <EventCommunicationSection
                eventId={eventData.id}
                eventTitle={eventData.title}
              />
          </div>}

          {/* Invitations Tab */}
        {permissions.canAccessAllEvents && activeSection === "invitations" && <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Registration Links</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and manage invitation links for this event
                  </p>
                </div>
                <Dialog open={createInviteDialogOpen} onOpenChange={setCreateInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Registration Link</DialogTitle>
                      <DialogDescription>
                        Create a new invitation link for this event
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="invite-title">Title (optional)</Label>
                        <Input
                          id="invite-title"
                          value={newInviteTitle}
                          onChange={(e) => setNewInviteTitle(e.target.value)}
                          placeholder="e.g., VIP Access, Early Bird"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Invite Type</Label>
                        <Select
                          value={newInviteType}
                          onValueChange={(v) => setNewInviteType(v as InviteType)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={InviteType.ATTENDEE}>Attendee</SelectItem>
                            <SelectItem value={InviteType.SPEAKER}>Speaker</SelectItem>
                            <SelectItem value={InviteType.EXHIBITOR}>Exhibitor</SelectItem>
                            <SelectItem value={InviteType.GUEST}>Guest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCreateInviteDialogOpen(false);
                          setNewInviteTitle("");
                        }}
                        disabled={creatingInvite}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!eventId) return;
                          try {
                            setCreatingInvite(true);
                            await createInvitation(eventId, {
                              inviteType: newInviteType,
                              title: newInviteTitle || undefined,
                            });
                            toast({ title: "Success", description: "Invitation link created" });
                            setCreateInviteDialogOpen(false);
                            setNewInviteTitle("");
                            // Reload invitations
                            const response = await getEventInvitations(eventId);
                            if (response.success && response.data?.invitations) {
                              setInvitations(response.data.invitations);
                            }
                          } catch (err) {
                            toast({
                              title: "Failed",
                              description: extractErrorMessage(err, "Failed to create invitation"),
                              variant: "destructive",
                            });
                          } finally {
                            setCreatingInvite(false);
                          }
                        }}
                        disabled={creatingInvite}
                      >
                        {creatingInvite ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {invitationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size="lg" className="h-8 w-8" />
                  <span className="ml-2 text-muted-foreground">Loading invitations...</span>
                </div>
              ) : invitations.length === 0 ? (
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No invitation links created yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {invitations.map((inv) => {
                    const linkUrl = getRegistrationLinkUrl(inv.token);
                    return (
                      <Card key={inv.id} className="border-0 bg-card-surface rounded-2xl shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold">{inv.title || `${inv.inviteType} Link`}</h3>
                              <Badge variant={inv.isActive ? "default" : "secondary"}>
                                {inv.isActive ? "Active" : "Revoked"}
                              </Badge>
                              <Badge variant="outline">{inv.inviteType}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(linkUrl);
                                  setCopiedToken(inv.token);
                                  setTimeout(() => setCopiedToken(null), 2000);
                                  toast({ title: "Copied", description: "Link copied to clipboard" });
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                {copiedToken === inv.token ? "Copied!" : "Copy"}
                              </Button>
                              {inv.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await revokeInvitation(inv.id);
                                      toast({ title: "Revoked", description: "Invitation link revoked" });
                                      if (eventId) {
                                        const response = await getEventInvitations(eventId);
                                        if (response.success && response.data?.invitations) {
                                          setInvitations(response.data.invitations);
                                        }
                                      }
                                    } catch (err) {
                                      toast({
                                        title: "Failed",
                                        description: extractErrorMessage(err, "Failed to revoke invitation"),
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Revoke
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="truncate">{linkUrl}</p>
                            <div className="flex gap-4 text-xs">
                              <span>Used: {inv.usedCount || inv.usageCount || 0}{inv.maxUses ? ` / ${inv.maxUses}` : ''}</span>
                              <span>Created by: {inv.creator.firstName} {inv.creator.lastName}</span>
                              <span>Created: {new Date(inv.createdAt).toLocaleDateString()}</span>
                              {inv.expiresAt && (
                                <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
          </div>}

          {/* Scan Settings Tab */}
        {activeSection === "scan-settings" && <div className="space-y-6">
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
                            title: "Save failed",
                            description: extractErrorMessage(error, "Failed to save scan settings"),
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
        </div>}
      </div>
  );
};

export default EventDetailsPage;
