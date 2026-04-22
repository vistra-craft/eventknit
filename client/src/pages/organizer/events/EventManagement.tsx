import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Mic,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Settings,
  BarChart3,
  UserPlus,
  Eye,
  CheckCircle,
  TrendingUp,
  Download,
  Target,
  Share2,
  MessageSquare,
  X,
  MoreHorizontal,
  Copy,
  AlertCircle,
  Plus,
  RotateCcw,
  Ticket,
  Link2,
  Copy as CopyIcon,
  Grid3X3,
  Search,
  QrCode,
  LogIn,
  LogOut,
  UserCheck,
  RefreshCw,
  Shield,
  Pencil,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, ButtonLoader } from "@/components/ui/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { getOrganizerEventById, getEventRegistrations, cancelEvent, getSubscription, getEventRefunds, getEventRefundSummary, type OrganizerSubscription, type OrganizerRefund, type OrganizerRefundSummary } from "@/lib/organizer-api";
import { getEventInvitations, createInvitation, revokeInvitation, getRegistrationLinkUrl, type InvitationsListResponse, InviteType } from "@/lib/invitation-api";
import { transformEventData } from "@/lib/event-utils";
import type { EventData } from "@/types/event";
import { shareEvent } from "@/lib/utils/share";
import { exportEventData } from "@/lib/utils/export";
import { useToast } from "@/hooks/useToast";
import { EventStaffAssignment } from '@/components/events/EventStaffAssignment';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EventOverviewTab } from "@/components/organizer/EventOverviewTab";
import { SubscriptionTierBadge } from "@/components/organizer/SubscriptionTierBadge";
import { UpgradePrompt } from "@/components/organizer/UpgradePrompt";
import BackButton from "@/components/BackButton";
import { EventSeatMapManager } from "@/components/organizer/EventSeatMapManager";
import { SeatManagementDashboard } from "@/components/organizer/SeatManagementDashboard";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { exportAttendees, quickRegisterAttendee } from "@/lib/attendee-import-api";
import type { QuickRegisterRequest } from "@/lib/attendee-import-api";
import { getEventResaleStats, getEventResaleListings, getEventTransferStats, getEventTransferHistory, type ResaleStats, type ResaleListing, type TransferStats, type TransferRecord, getEventScanOverview, getEventScanHistory, getEventScanAttendees, updateEventScanConfig, type OrganizerScanConfig, type OrganizerScanStatistics, type OrganizerScanRecord, type OrganizerScanAttendee } from "@/lib/organizer-dashboard-api";
import { extractErrorMessage, showErrorToast } from "@/lib/utils/error";
import { stripHtml } from "@/lib/utils";
import { updateEvent } from "@/lib/event-api";

// Ticket type with all fields (including ones not in EventData type)
interface FullTicketType {
  name: string;
  price: number;
  quantity?: number | null;
  features?: string[];
  originalPrice?: number | null;
  discountLabel?: string | null;
  isComplementary?: boolean;
  requiresInvitation?: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  earlyBirdQuantity?: number | null;
  isSoldOut?: boolean;
  description?: string;
  maxPerPerson?: number;
  minPerOrder?: number;
  salesChannel?: string;
  isHidden?: boolean;
}

// Form state for the ticket edit sheet
interface EditableTicket {
  name: string;
  type: 'free' | 'paid';
  price: string;
  quantity: string;
  description: string;
  isComplementary: boolean;
  requiresInvitation: boolean;
  isHidden: boolean;
  salesChannel: string;
  maxPerPerson: string;
  minPerOrder: string;
  originalPrice: string;
  discountLabel: string;
  availableFrom: string;
  availableUntil: string;
}

// Top-level interfaces for type safety
interface Attendee {
  id?: string;
  status?: string;
  totalAmount?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
  name?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentTransactionId?: string | null;
  ticketType?: string;
  createdAt?: string;
  registeredDate?: string;
  quantity?: number;
  /** Dynamic custom form fields submitted by attendee */
  registrationData?: Record<string, unknown> | null;
  /** Per-ticket-type breakdown */
  ticketLineItems?: Array<{ ticketType: string; quantity: number; unitPrice?: number; totalPrice?: number }>;
  /** Gateway payment details — FULL tier only */
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
}

type SpeakerItem = NonNullable<EventData['speakers']>[number];
type SponsorItem = NonNullable<EventData['sponsors']>[number];

// Extended event data with organizer-specific fields from the API
interface OrganizerEventData extends EventData {
  organizerDataAccess?: string;
}

// Shared component - imported from shared location
import EventCommunicationSection from '@/components/events/EventCommunicationSection';

interface EventManagementProps {
  isAdminMode?: boolean;
}

const EventManagement = ({ isAdminMode = false }: EventManagementProps) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const backPath = isAdminMode ? `/admin/event-day/event/${eventId}` : '/organizer/dashboard';
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("overview");
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [attendeesPage, setAttendeesPage] = useState(1);
  const [attendeesLimit, setAttendeesLimit] = useState(25);
  const [subscription, setSubscription] = useState<OrganizerSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  // Refund state
  const [refunds, setRefunds] = useState<OrganizerRefund[]>([]);
  const [refundSummary, setRefundSummary] = useState<OrganizerRefundSummary | null>(null);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('all');
  // Attendee detail sheet state
  const [selectedAttendee, setSelectedAttendee] = useState<typeof attendees[number] | null>(null);
  const [attendeeSheetOpen, setAttendeeSheetOpen] = useState(false);
  // Attendee search and filter
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState<string>('all');
  // Add attendee dialog
  const [showAddAttendee, setShowAddAttendee] = useState(false);
  const [addAttendeeForm, setAddAttendeeForm] = useState<QuickRegisterRequest>({ firstName: '', lastName: '', email: '' });
  const [addingAttendee, setAddingAttendee] = useState(false);
  const [exportingAttendees, setExportingAttendees] = useState(false);

  // Invitation state
  type InvitationItem = InvitationsListResponse['data']['invitations'][number];
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [showCreateInvitation, setShowCreateInvitation] = useState(false);
  const [newInviteType, setNewInviteType] = useState<InviteType>(InviteType.ATTENDEE);
  const [newInviteTitle, setNewInviteTitle] = useState('');
  const [newInviteMaxUses, setNewInviteMaxUses] = useState('');
  const [creatingInvitation, setCreatingInvitation] = useState(false);

  // Resale & Transfer state
  const [resaleStats, setResaleStats] = useState<ResaleStats | null>(null);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);
  const [transferStats, setTransferStats] = useState<TransferStats | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [resaleTransferLoading, setResaleTransferLoading] = useState(false);

  // Scan & Check-In state
  const [scanConfig, setScanConfig] = useState<OrganizerScanConfig | null>(null);
  const [scanStatistics, setScanStatistics] = useState<OrganizerScanStatistics | null>(null);
  const [scanHistory, setScanHistory] = useState<OrganizerScanRecord[]>([]);
  const [scanAttendees, setScanAttendees] = useState<OrganizerScanAttendee[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanHistoryTotal, setScanHistoryTotal] = useState(0);
  const [scanHistoryPage, setScanHistoryPage] = useState(1);
  const [scanTypeFilter, setScanTypeFilter] = useState<string>('all');
  const [scanAttendeesTotal, setScanAttendeesTotal] = useState(0);
  const [scanAttendeesPage, setScanAttendeesPage] = useState(1);
  const [scanTab, setScanTab] = useState<'overview' | 'history' | 'attendees' | 'settings'>('overview');
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Ticket editing state
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState<EditableTicket | null>(null);
  const [savingTicket, setSavingTicket] = useState(false);

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
        setSubscriptionLoading(true);
        setError(null);

        // Fetch event details, attendees, and subscription in parallel
        const [eventResponse, registrationsResponse, subscriptionResponse] = await Promise.all([
          getOrganizerEventById(eventId),
          getEventRegistrations(eventId),
          getSubscription(),
        ]);
        
        if (eventResponse.success && eventResponse.data) {
          // Normalize timezone: convert null to undefined to match BackendEvent type
          const normalizedEvent = {
            ...eventResponse.data.event,
            timezone: eventResponse.data.event.timezone ?? undefined,
          };
          const transformedEvent = transformEventData(normalizedEvent);
          setEventData(transformedEvent);
        } else {
          throw new Error(eventResponse.message || 'Failed to fetch event');
        }

        // Fetch attendees/registrations
        if (registrationsResponse.success && registrationsResponse.data) {
          // Transform registrations to attendees format
          // Backend already filters based on access level
          interface TicketLineItemData {
            ticketType: string;
            quantity: number;
            unitPrice?: number;
            totalPrice?: number;
          }
          interface PaymentTransactionData {
            id: string;
            transactionNumber: string;
            gatewayReference: string;
            gateway: string;
            amount: number;
            currency: string;
            paymentStatus: string;
            paymentDate: string;
          }
          interface Registration {
            id: string;
            attendee?: { id?: string; firstName?: string; lastName?: string; email?: string; phoneNumber?: string | null };
            user?: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string | null };
            ticketType?: string | null;
            ticketLineItems?: TicketLineItemData[];
            status?: string;
            createdAt?: string;
            quantity?: number;
            totalAmount?: number | string;
            paymentStatus?: string | null;
            paymentMethod?: string | null;
            paymentTransactionId?: string | null;
            registrationData?: Record<string, unknown> | null;
            paymentTransaction?: PaymentTransactionData | null;
          }
          const transformedAttendees = registrationsResponse.data.registrations.map((reg: Registration) => {
            // Build ticket type display from line items (preferred) or legacy ticketType field
            const ticketDisplay = reg.ticketLineItems && reg.ticketLineItems.length > 0
              ? reg.ticketLineItems.map(li => `${li.ticketType}${li.quantity > 1 ? ` x${li.quantity}` : ''}`).join(', ')
              : reg.ticketType || 'Standard';
            return {
              id: reg.id,
              name: `${reg.attendee?.firstName || reg.user?.firstName || ''} ${reg.attendee?.lastName || reg.user?.lastName || ''}`.trim() || 'Guest',
              firstName: reg.attendee?.firstName || reg.user?.firstName || '',
              lastName: reg.attendee?.lastName || reg.user?.lastName || '',
              email: reg.attendee?.email || reg.user?.email || 'N/A',
              phoneNumber: reg.attendee?.phoneNumber || reg.user?.phoneNumber || null,
              ticketType: ticketDisplay,
              status: reg.status?.toLowerCase() || 'pending',
              registeredDate: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A',
              createdAt: reg.createdAt,
              quantity: reg.quantity || 1,
              totalAmount: reg.totalAmount || 0,
              paymentStatus: reg.paymentStatus || undefined,
              paymentMethod: reg.paymentMethod || undefined,
              paymentTransactionId: reg.paymentTransactionId || null,
              registrationData: reg.registrationData || null,
              ticketLineItems: reg.ticketLineItems || [],
              paymentTransaction: reg.paymentTransaction || null,
            };
          });
          setAttendees(transformedAttendees);
        }
        
        if (subscriptionResponse.success && subscriptionResponse.data) {
          setSubscription(subscriptionResponse.data.subscription);
        }
      } catch (err: unknown) {
        console.error('[EventManagement] Error fetching event:', err);
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to load event data. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
        setSubscriptionLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Fetch refunds when the refunds tab is active (lazy loading)
  useEffect(() => {
    const fetchRefunds = async () => {
      if (!eventId || activeSection !== 'refunds') return;
      try {
        setRefundsLoading(true);
        const statusParam = refundStatusFilter !== 'all' ? refundStatusFilter : undefined;
        const [refundsRes, summaryRes] = await Promise.all([
          getEventRefunds(eventId, { status: statusParam }),
          getEventRefundSummary(eventId),
        ]);
        if (refundsRes.success && refundsRes.data) {
          setRefunds(refundsRes.data);
        }
        if (summaryRes.success && summaryRes.data) {
          setRefundSummary(summaryRes.data);
        }
      } catch (err) {
        showErrorToast(toast, err, 'Load failed', 'Failed to load refund data.');
      } finally {
        setRefundsLoading(false);
      }
    };
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, activeSection, refundStatusFilter]);

  // Fetch invitations when the invitations tab is active (lazy loading)
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!eventId || activeSection !== 'invitations') return;
      try {
        setInvitationsLoading(true);
        const response = await getEventInvitations(eventId);
        if (response.success && response.data) {
          setInvitations(response.data.invitations || []);
        }
      } catch (err) {
        showErrorToast(toast, err, 'Load failed', 'Failed to load invitations.');
      } finally {
        setInvitationsLoading(false);
      }
    };
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, activeSection]);

  // Fetch resale & transfer data when the tab is active (lazy loading)
  useEffect(() => {
    const fetchResaleTransfers = async () => {
      if (!eventId || activeSection !== 'resale-transfers') return;
      try {
        setResaleTransferLoading(true);
        const [resaleStatsRes, resaleListingsRes, transferStatsRes, transferHistoryRes] = await Promise.all([
          getEventResaleStats(eventId),
          getEventResaleListings(eventId, { limit: 20 }),
          getEventTransferStats(eventId),
          getEventTransferHistory(eventId, { limit: 20 }),
        ]);
        if (resaleStatsRes.success && resaleStatsRes.data) setResaleStats(resaleStatsRes.data);
        if (resaleListingsRes.success && resaleListingsRes.data) setResaleListings(resaleListingsRes.data.listings);
        if (transferStatsRes.success && transferStatsRes.data) setTransferStats(transferStatsRes.data);
        if (transferHistoryRes.success && transferHistoryRes.data) setTransferHistory(transferHistoryRes.data.transfers);
      } catch (err) {
        showErrorToast(toast, err, "Load failed", "Failed to load resale & transfer data");
      } finally {
        setResaleTransferLoading(false);
      }
    };
    fetchResaleTransfers();
  }, [eventId, activeSection, toast]);

  // Fetch scan & check-in data when the tab is active (lazy loading)
  useEffect(() => {
    const fetchScanData = async () => {
      if (!eventId || activeSection !== 'scan-settings') return;
      try {
        setScanLoading(true);
        const scanFilters: { scanType?: string; page?: number; limit?: number } = {
          page: scanHistoryPage,
          limit: 20,
        };
        if (scanTypeFilter !== 'all') {
          scanFilters.scanType = scanTypeFilter;
        }
        const [overviewRes, scansRes, attendeesRes] = await Promise.all([
          getEventScanOverview(eventId),
          getEventScanHistory(eventId, scanFilters),
          getEventScanAttendees(eventId, { page: scanAttendeesPage, limit: 20 }),
        ]);
        if (overviewRes.success && overviewRes.data) {
          setScanConfig(overviewRes.data.config);
          setScanStatistics(overviewRes.data.statistics);
        }
        if (scansRes.success && scansRes.data) {
          setScanHistory(scansRes.data.scans);
          setScanHistoryTotal(scansRes.data.total);
        }
        if (attendeesRes.success && attendeesRes.data) {
          setScanAttendees(attendeesRes.data.attendees);
          setScanAttendeesTotal(attendeesRes.data.total);
        }
      } catch (err) {
        showErrorToast(toast, err, "Load failed", "Failed to load scan data");
      } finally {
        setScanLoading(false);
      }
    };
    fetchScanData();
  }, [eventId, activeSection, scanHistoryPage, scanTypeFilter, scanAttendeesPage, toast]);

  // Handle scan config update
  const handleUpdateScanConfig = async (updates: { allowReEntry?: boolean; requireCheckOut?: boolean; maxReEntries?: number | null }) => {
    if (!eventId) return;
    try {
      setUpdatingConfig(true);
      const res = await updateEventScanConfig(eventId, updates);
      if (res.success && res.data) {
        setScanConfig(res.data.config);
        toast({ title: "Settings updated", description: "Scan configuration has been saved" });
      }
    } catch (err) {
      showErrorToast(toast, err, "Update failed", "Failed to update scan settings");
    } finally {
      setUpdatingConfig(false);
    }
  };

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
          // Normalize timezone: convert null to undefined to match BackendEvent type
          const normalizedEvent = {
            ...eventResponse.data.event,
            timezone: eventResponse.data.event.timezone ?? undefined,
          };
          const transformedEvent = transformEventData(normalizedEvent);
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

  // ── Ticket editing helpers ──────────────────────────────────────────────

  const emptyTicketForm = (): EditableTicket => ({
    name: '', type: 'free', price: '', quantity: '100',
    description: '', isComplementary: false, requiresInvitation: false,
    isHidden: false, salesChannel: 'both', maxPerPerson: '', minPerOrder: '',
    originalPrice: '', discountLabel: '', availableFrom: '', availableUntil: '',
  });

  const openAddTicket = () => {
    setEditingTicketIndex(null);
    setTicketForm(emptyTicketForm());
    setTicketSheetOpen(true);
  };

  const openEditTicket = (ticket: FullTicketType, index: number) => {
    setEditingTicketIndex(index);
    setTicketForm({
      name: ticket.name || '',
      type: (ticket.price === 0 || !ticket.price) && !ticket.isComplementary ? 'free' : 'paid',
      price: String(ticket.price ?? ''),
      quantity: String(ticket.quantity ?? ''),
      description: ticket.description || '',
      isComplementary: ticket.isComplementary || false,
      requiresInvitation: ticket.requiresInvitation || false,
      isHidden: ticket.isHidden || false,
      salesChannel: ticket.salesChannel || 'both',
      maxPerPerson: ticket.maxPerPerson ? String(ticket.maxPerPerson) : '',
      minPerOrder: ticket.minPerOrder ? String(ticket.minPerOrder) : '',
      originalPrice: ticket.originalPrice ? String(ticket.originalPrice) : '',
      discountLabel: ticket.discountLabel || '',
      availableFrom: ticket.availableFrom || '',
      availableUntil: ticket.availableUntil || '',
    });
    setTicketSheetOpen(true);
  };

  const buildTicketPayload = (form: EditableTicket): Record<string, unknown> => ({
    name: form.name.trim(),
    price: form.type === 'paid' && !form.isComplementary ? parseFloat(form.price) || 0 : 0,
    quantity: form.quantity ? parseInt(form.quantity) : null,
    description: form.description || undefined,
    isComplementary: form.isComplementary || undefined,
    requiresInvitation: form.requiresInvitation || undefined,
    isHidden: form.isHidden || undefined,
    salesChannel: form.salesChannel !== 'both' ? form.salesChannel : undefined,
    maxPerPerson: form.maxPerPerson ? parseInt(form.maxPerPerson) : undefined,
    minPerOrder: form.minPerOrder ? parseInt(form.minPerOrder) : undefined,
    originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
    discountLabel: form.discountLabel || undefined,
    availableFrom: form.availableFrom || undefined,
    availableUntil: form.availableUntil || undefined,
  });

  const refreshEventData = (updatedEvent: Parameters<typeof transformEventData>[0]) => {
    setEventData(transformEventData(updatedEvent));
  };

  const handleSaveTicket = async () => {
    if (!ticketForm || !eventId || !eventData) return;
    if (!ticketForm.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a ticket name.', variant: 'destructive' });
      return;
    }

    const currentTickets = (eventData.ticketTypes || []) as FullTicketType[];
    const originalName = editingTicketIndex !== null ? currentTickets[editingTicketIndex]?.name : null;
    const soldForType = originalName ? attendees.filter(a => a.ticketType === originalName).length : 0;
    const newQty = ticketForm.quantity ? parseInt(ticketForm.quantity) : 0;
    if (newQty > 0 && newQty < soldForType) {
      toast({ title: 'Quantity too low', description: `${soldForType} tickets already sold — quantity cannot go below ${soldForType}.`, variant: 'destructive' });
      return;
    }

    const updatedTicket = buildTicketPayload(ticketForm);
    const newTicketTypes = editingTicketIndex === null
      ? [...currentTickets, updatedTicket]
      : currentTickets.map((t, i) => i === editingTicketIndex ? updatedTicket : t);

    try {
      setSavingTicket(true);
      const response = await updateEvent(eventId, { ticketTypes: newTicketTypes } as Parameters<typeof updateEvent>[1]);
      if (response.success && response.data) {
        refreshEventData(response.data.event);
        setTicketSheetOpen(false);
        toast({ title: 'Saved', description: editingTicketIndex === null ? 'New ticket type added.' : 'Ticket type updated.' });
      }
    } catch (err) {
      showErrorToast(toast, err, 'Save failed', 'Failed to update tickets.');
    } finally {
      setSavingTicket(false);
    }
  };

  const handleArchiveTicket = async (index: number) => {
    if (!eventId || !eventData) return;
    const currentTickets = (eventData.ticketTypes || []) as FullTicketType[];
    const newTicketTypes = currentTickets.map((t, i) => i === index ? { ...t, isHidden: true } : t);
    try {
      setSavingTicket(true);
      const response = await updateEvent(eventId, { ticketTypes: newTicketTypes } as Parameters<typeof updateEvent>[1]);
      if (response.success && response.data) {
        refreshEventData(response.data.event);
        toast({ title: 'Archived', description: 'Ticket is now hidden from new purchases.' });
      }
    } catch (err) {
      showErrorToast(toast, err, 'Failed to archive ticket');
    } finally {
      setSavingTicket(false);
    }
  };

  const handleRemoveTicket = async (index: number) => {
    if (!eventId || !eventData) return;
    const currentTickets = (eventData.ticketTypes || []) as FullTicketType[];
    const newTicketTypes = currentTickets.filter((_, i) => i !== index);
    try {
      setSavingTicket(true);
      const response = await updateEvent(eventId, { ticketTypes: newTicketTypes } as Parameters<typeof updateEvent>[1]);
      if (response.success && response.data) {
        refreshEventData(response.data.event);
        toast({ title: 'Removed', description: 'Ticket type removed.' });
      }
    } catch (err) {
      showErrorToast(toast, err, 'Failed to remove ticket');
    } finally {
      setSavingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" className="mx-auto mb-4" />
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
          <Button onClick={() => navigate(isAdminMode ? '/admin/event-day' : '/organizer/events')} className="mt-4">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  // Get access level from event data (if available)
  const orgEventData = eventData as OrganizerEventData;
  const accessLevel = orgEventData.organizerDataAccess || 'RESTRICTED';
  const hasPaymentDetailsAccess = accessLevel === 'STANDARD' || accessLevel === 'FULL';


  // Calculate summary stats (always available)
  const totalAttendees = attendees.length;
  const confirmedAttendees = attendees.filter((a) => a.status === 'confirmed' || a.status === 'CONFIRMED').length;
  const pendingAttendees = attendees.filter((a) => a.status === 'pending' || a.status === 'PENDING').length;
  const currency = eventData?.currency || '$';
  const totalRevenue = hasPaymentDetailsAccess
    ? attendees.reduce((sum: number, a) => sum + (Number(a.totalAmount) || 0), 0)
    : 0;

  // Data from API - attendees are real, speakers and sponsors come from eventData if available
  const apiData = {
    // Real attendees data from API (already filtered by backend based on access level)
    attendees: attendees,
    // Speakers from API if available
    speakers: eventData?.speakers && Array.isArray(eventData.speakers) ? eventData.speakers : [],
    // Sponsors from API if available
    sponsors: eventData?.sponsors && Array.isArray(eventData.sponsors) ? eventData.sponsors : [],
  };


  const navigationSections = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "attendees", label: "Attendees", icon: Users },
    { key: "tickets", label: "Tickets", icon: Ticket },
    { key: "communication", label: "Messages", icon: MessageSquare },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
  ] as Array<{ key: string; label: string; icon: typeof BarChart3 }>;

  const moreMenuSections = [
    { key: "invitations", label: "Invitations", icon: Link2 },
    { key: "refunds", label: "Refunds", icon: RotateCcw, badge: refunds.filter(r => r.status === 'pending').length },
    { key: "staff", label: "Staff Assignment", icon: UserPlus },
    { key: "settings", label: "Event Details", icon: Settings },
    { key: "scan-settings", label: "Scan & Check-In", icon: QrCode },
    { key: "remittance", label: "Remittance", icon: DollarSign },
    { key: "resale-transfers", label: "Resale & Transfers", icon: Share2 },
    { key: "seating", label: "Seating", icon: Grid3X3, conditional: true },
    { key: "speakers", label: "Speakers", icon: Mic, conditional: true },
    { key: "sponsors", label: "Sponsors", icon: Star, conditional: true },
  ] as Array<{ key: string; label: string; icon: typeof BarChart3; badge?: number; conditional?: boolean }>;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "APPROVED":
        return "bg-success-light text-success border-success/20";
      case "PENDING":
      case "UNDER_REVIEW":
        return "bg-muted text-muted-foreground border-border";
      case "REJECTED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "CANCELLED":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return "Unknown";
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case "APPROVED": return "Published";
      case "PENDING": return "Pending Approval";
      case "REJECTED": return "Rejected";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "tickets": {
        const ticketTypes = (eventData.ticketTypes || []) as FullTicketType[];
        const totalSold = attendees.length;
        const totalCapacity = eventData.capacity || 0;

        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Ticket Types</h3>
                <p className="text-sm text-muted-foreground">
                  {totalSold} sold · {totalCapacity || '∞'} capacity · {ticketTypes.length} type{ticketTypes.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button size="sm" onClick={openAddTicket}>
                <Plus className="w-4 h-4 mr-2" />
                Add Ticket Type
              </Button>
            </div>

            {/* Ticket Type List */}
            <Card>
              <CardContent className="p-0">
                {ticketTypes.length === 0 ? (
                  <div className="p-8 text-center">
                    <Ticket className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No ticket types configured</p>
                    <p className="text-xs text-muted-foreground mt-1">Add your first ticket type to get started</p>
                    <Button size="sm" className="mt-4" onClick={openAddTicket}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ticket Type
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {ticketTypes.map((ticket, idx) => {
                      const soldForType = attendees.filter(a => a.ticketType === ticket.name).length;
                      const available = ticket.quantity || 0;
                      const fillPct = available > 0 ? Math.min(100, (soldForType / available) * 100) : 0;
                      const hasSales = soldForType > 0;

                      return (
                        <div key={`${ticket.name}-${idx}`} className={`p-4 hover:bg-muted/30 transition-colors ${ticket.isHidden ? 'opacity-60' : ''}`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold truncate">{ticket.name}</span>
                                {ticket.isHidden && (
                                  <Badge variant="outline" className="text-xs">Archived</Badge>
                                )}
                                {ticket.isComplementary && (
                                  <Badge variant="secondary" className="text-xs">Free</Badge>
                                )}
                                {ticket.requiresInvitation && (
                                  <Badge variant="outline" className="text-xs">Invite Only</Badge>
                                )}
                                {ticket.discountLabel && (
                                  <Badge variant="destructive" className="text-xs">{ticket.discountLabel}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      fillPct >= 90 ? 'bg-destructive' : fillPct >= 70 ? 'bg-amber-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${fillPct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {soldForType} sold / {available || '∞'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="font-bold">
                                  {ticket.price === 0 || !ticket.price ? 'Free' : `${currency} ${ticket.price}`}
                                </p>
                                {ticket.originalPrice && ticket.originalPrice > (ticket.price || 0) && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    {currency} {ticket.originalPrice}
                                  </p>
                                )}
                                {hasPaymentDetailsAccess && soldForType > 0 && (ticket.price || 0) > 0 && (
                                  <p className="text-xs text-success mt-1">
                                    {currency} {(soldForType * (ticket.price || 0)).toLocaleString()} revenue
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditTicket(ticket, idx)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {hasSales && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {soldForType} ticket{soldForType !== 1 ? 's' : ''} sold — price changes apply to new purchases only
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      case "invitations": {
        const handleCreateInvitation = async () => {
          if (!eventId) return;
          try {
            setCreatingInvitation(true);
            await createInvitation(eventId, {
              inviteType: newInviteType,
              title: newInviteTitle.trim() || undefined,
              maxUses: newInviteMaxUses ? parseInt(newInviteMaxUses, 10) : undefined,
            });
            toast({ title: "Success", description: "Invitation link created" });
            setShowCreateInvitation(false);
            setNewInviteTitle('');
            setNewInviteMaxUses('');
            // Refresh invitations
            const response = await getEventInvitations(eventId);
            if (response.success && response.data) {
              setInvitations(response.data.invitations || []);
            }
          } catch (err) {
            showErrorToast(toast, err, "Invitation failed", "Failed to create invitation");
          } finally {
            setCreatingInvitation(false);
          }
        };

        const handleRevokeInvitation = async (invId: string) => {
          try {
            await revokeInvitation(invId);
            toast({ title: "Revoked", description: "Invitation link has been revoked" });
            setInvitations(prev => prev.map(inv => inv.id === invId ? { ...inv, isActive: false } : inv));
          } catch (err) {
            showErrorToast(toast, err, "Revoke failed", "Failed to revoke invitation");
          }
        };

        const handleCopyLink = (token: string) => {
          const url = getRegistrationLinkUrl(token);
          navigator.clipboard.writeText(url).then(() => {
            toast({ title: "Copied", description: "Invitation link copied to clipboard" });
          });
        };

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Invitation Links</h3>
                <p className="text-sm text-muted-foreground">
                  Create shareable links for complimentary tickets, speakers, and VIP guests
                </p>
              </div>
              <Dialog open={showCreateInvitation} onOpenChange={setShowCreateInvitation}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Invitation Link</DialogTitle>
                    <DialogDescription>
                      Generate a shareable registration link for this event
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Invitation Type</Label>
                      <Select value={newInviteType} onValueChange={(v) => setNewInviteType(v as InviteType)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATTENDEE">Attendee</SelectItem>
                          <SelectItem value="SPEAKER">Speaker</SelectItem>
                          <SelectItem value="EXHIBITOR">Exhibitor</SelectItem>
                          <SelectItem value="GUEST">VIP Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Title (optional)</Label>
                      <Input
                        className="mt-2"
                        value={newInviteTitle}
                        onChange={(e) => setNewInviteTitle(e.target.value)}
                        placeholder="e.g., Speaker Registration, VIP Access"
                      />
                    </div>
                    <div>
                      <Label>Max Uses (optional)</Label>
                      <Input
                        className="mt-2"
                        type="number"
                        min="1"
                        value={newInviteMaxUses}
                        onChange={(e) => setNewInviteMaxUses(e.target.value)}
                        placeholder="Unlimited if empty"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateInvitation(false)} disabled={creatingInvitation}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateInvitation} disabled={creatingInvitation}>
                      {creatingInvitation ? <><ButtonLoader /> Creating...</> : 'Create Link'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">Total Links</p>
                  <p className="text-lg font-bold mt-1">{invitations.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">Active</p>
                  <p className="text-lg font-bold mt-1 text-success">{invitations.filter(i => i.isActive).length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">Total Registrations</p>
                  <p className="text-lg font-bold mt-1">{invitations.reduce((sum, i) => sum + (i.usageCount || i.usedCount || 0), 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Invitations List */}
            {invitationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="default" />
              </div>
            ) : invitations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Link2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No invitation links yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create invitation links for speakers, VIP guests, or complimentary attendees
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <Card key={inv.id} className="border-border/40">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {inv.title || `${inv.inviteType} Invitation`}
                            </span>
                            <Badge variant="secondary" className="text-xs">{inv.inviteType}</Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${inv.isActive ? 'text-success border-success/30' : 'text-muted-foreground'}`}
                            >
                              {inv.isActive ? 'Active' : 'Revoked'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{inv.usageCount || inv.usedCount || 0} used{inv.maxUses ? ` / ${inv.maxUses} max` : ''}</span>
                            <span>Created {new Date(inv.createdAt).toLocaleDateString()}</span>
                            {inv.expiresAt && (
                              <span>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(inv.token)}
                            disabled={!inv.isActive}
                          >
                            <CopyIcon className="w-3.5 h-3.5 mr-1.5" />
                            Copy Link
                          </Button>
                          {inv.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRevokeInvitation(inv.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      }

      case "attendees": {
        if (!subscriptionLoading && subscription?.tier === 'BASIC') {
          return (
            <UpgradePrompt
              variant="card"
              targetTier="STANDARD"
              message="Upgrade to Standard (free) to view attendee details, manage registrations, export data, and add attendees manually."
              dismissible={false}
            />
          );
        }
        // Client-side search and filter
        const filteredAttendees = apiData.attendees.filter((a) => {
          const matchesSearch = !attendeeSearch ||
            (a.name || '').toLowerCase().includes(attendeeSearch.toLowerCase()) ||
            (a.email || '').toLowerCase().includes(attendeeSearch.toLowerCase());
          const matchesStatus = attendeeStatusFilter === 'all' ||
            (a.status || 'pending').toLowerCase() === attendeeStatusFilter.toLowerCase();
          return matchesSearch && matchesStatus;
        });
        const attendeesStartIndex = (attendeesPage - 1) * attendeesLimit;
        const attendeesEndIndex = attendeesStartIndex + attendeesLimit;
        const paginatedAttendees = filteredAttendees.slice(attendeesStartIndex, attendeesEndIndex);
        const attendeesTotalPages = Math.ceil(filteredAttendees.length / attendeesLimit);

        const handleExportAttendees = async () => {
          if (!eventId) return;
          setExportingAttendees(true);
          try {
            await exportAttendees(eventId);
            toast({ title: "Exported", description: "Attendee data downloaded successfully." });
          } catch (err) {
            toast({ title: "Export failed", description: extractErrorMessage(err, "Unable to export attendees. Please try again."), variant: "destructive" });
          } finally {
            setExportingAttendees(false);
          }
        };

        const handleAddAttendee = async () => {
          if (!eventId || !addAttendeeForm.firstName.trim() || !addAttendeeForm.email.trim()) {
            toast({ title: "Missing fields", description: "First name and email are required.", variant: "destructive" });
            return;
          }
          setAddingAttendee(true);
          try {
            const result = await quickRegisterAttendee(eventId, {
              ...addAttendeeForm,
              firstName: addAttendeeForm.firstName.trim(),
              lastName: addAttendeeForm.lastName.trim(),
              email: addAttendeeForm.email.trim(),
            });
            toast({ title: "Attendee added", description: `${result.attendeeName} has been registered.` });
            setShowAddAttendee(false);
            setAddAttendeeForm({ firstName: '', lastName: '', email: '' });
            // Refresh attendees
            const registrationsResponse = await getEventRegistrations(eventId);
            if (registrationsResponse.success && registrationsResponse.data) {
              interface TicketLineItemData { ticketType: string; quantity: number; unitPrice?: number; totalPrice?: number; }
              interface Registration {
                id: string;
                attendee?: { firstName?: string; lastName?: string; email?: string };
                user?: { firstName?: string; lastName?: string; email?: string };
                ticketType?: string | null;
                ticketLineItems?: TicketLineItemData[];
                status?: string;
                createdAt?: string;
                quantity?: number;
                totalAmount?: number | string;
                paymentStatus?: string | null;
                paymentMethod?: string | null;
              }
              const transformedAttendees = registrationsResponse.data.registrations.map((reg: Registration) => {
                const ticketDisplay = reg.ticketLineItems && reg.ticketLineItems.length > 0
                  ? reg.ticketLineItems.map(li => `${li.ticketType}${li.quantity > 1 ? ` x${li.quantity}` : ''}`).join(', ')
                  : reg.ticketType || 'Standard';
                return {
                  id: reg.id,
                  name: `${reg.attendee?.firstName || reg.user?.firstName || ''} ${reg.attendee?.lastName || reg.user?.lastName || ''}`.trim() || 'Guest',
                  email: reg.attendee?.email || reg.user?.email || 'N/A',
                  ticketType: ticketDisplay,
                  status: reg.status?.toLowerCase() || 'pending',
                  registeredDate: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A',
                  createdAt: reg.createdAt,
                  quantity: reg.quantity || 1,
                  totalAmount: reg.totalAmount || 0,
                  paymentStatus: reg.paymentStatus || undefined,
                  paymentMethod: reg.paymentMethod || undefined,
                };
              });
              setAttendees(transformedAttendees);
            }
          } catch (err) {
            toast({ title: "Registration failed", description: extractErrorMessage(err, "Unable to add attendee. Please try again."), variant: "destructive" });
          } finally {
            setAddingAttendee(false);
          }
        };

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold">Attendees Management</h3>
                  {!subscriptionLoading && subscription && (
                    <SubscriptionTierBadge tier={subscription.tier} size="sm" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {apiData.attendees.length} attendee{apiData.attendees.length !== 1 ? 's' : ''} registered
                </p>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exportingAttendees || apiData.attendees.length === 0}
                  onClick={handleExportAttendees}
                >
                  {exportingAttendees ? <ButtonLoader /> : <Download className="w-4 h-4 mr-2" />}
                  Export
                </Button>
                <Dialog open={showAddAttendee} onOpenChange={setShowAddAttendee}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Attendee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Attendee</DialogTitle>
                      <DialogDescription>Manually register an attendee for this event (walk-in registration).</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="att-first">First Name *</Label>
                          <Input id="att-first" className="mt-2" value={addAttendeeForm.firstName} onChange={(e) => setAddAttendeeForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
                        </div>
                        <div>
                          <Label htmlFor="att-last">Last Name</Label>
                          <Input id="att-last" className="mt-2" value={addAttendeeForm.lastName} onChange={(e) => setAddAttendeeForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="att-email">Email *</Label>
                        <Input id="att-email" type="email" className="mt-2" value={addAttendeeForm.email} onChange={(e) => setAddAttendeeForm(f => ({ ...f, email: e.target.value }))} placeholder="attendee@email.com" />
                      </div>
                      <div>
                        <Label htmlFor="att-phone">Phone (optional)</Label>
                        <Input id="att-phone" className="mt-2" value={addAttendeeForm.phoneNumber || ''} onChange={(e) => setAddAttendeeForm(f => ({ ...f, phoneNumber: e.target.value || undefined }))} placeholder="+1234567890" />
                      </div>
                      {eventData.ticketTypes && eventData.ticketTypes.length > 0 && (
                        <div>
                          <Label htmlFor="att-ticket">Ticket Type</Label>
                          <Select value={addAttendeeForm.ticketType || ''} onValueChange={(v) => setAddAttendeeForm(f => ({ ...f, ticketType: v || undefined }))}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select ticket type" />
                            </SelectTrigger>
                            <SelectContent>
                              {eventData.ticketTypes.map((t) => (
                                <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddAttendee(false)} disabled={addingAttendee}>Cancel</Button>
                      <Button onClick={handleAddAttendee} disabled={addingAttendee}>
                        {addingAttendee ? <><ButtonLoader /> Registering...</> : 'Register Attendee'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Attendees</p>
                      <p className="text-lg font-semibold">{totalAttendees}</p>
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
                      <p className="text-lg font-semibold">{confirmedAttendees}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-lg font-semibold">{pendingAttendees}</p>
                    </div>
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={attendeeSearch}
                  onChange={(e) => { setAttendeeSearch(e.target.value); setAttendeesPage(1); }}
                />
              </div>
              <Select value={attendeeStatusFilter} onValueChange={(v) => { setAttendeeStatusFilter(v); setAttendeesPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {filteredAttendees.length === apiData.attendees.length
                    ? `${filteredAttendees.length} total`
                    : `${filteredAttendees.length} of ${apiData.attendees.length}`}
                </span>
                <Select value={attendeesLimit.toString()} onValueChange={(value) => { setAttendeesLimit(parseInt(value, 10)); setAttendeesPage(1); }}>
                  <SelectTrigger className="w-20">
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
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_40px] gap-3 px-4 py-2 border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span>Attendee</span>
                  <span>Ticket(s)</span>
                  <span>Amount</span>
                  <span>Payment</span>
                  <span>Status</span>
                  <span />
                </div>
                <div className="divide-y">
                  {filteredAttendees.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {attendeeSearch || attendeeStatusFilter !== 'all' ? 'No attendees match your search' : 'No attendees registered yet'}
                      </p>
                    </div>
                  ) : (
                    paginatedAttendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_40px] gap-2 sm:gap-3 items-center px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => { setSelectedAttendee(attendee); setAttendeeSheetOpen(true); }}
                      >
                        {/* Attendee */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                            {(attendee.name || attendee.email || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{attendee.name || '—'}</p>
                            <p className="text-xs text-muted-foreground truncate">{attendee.email}</p>
                          </div>
                        </div>
                        {/* Ticket */}
                        <div className="text-sm truncate text-muted-foreground sm:text-foreground">
                          {attendee.ticketType}
                        </div>
                        {/* Amount */}
                        <div className="text-sm font-medium">
                          {hasPaymentDetailsAccess && attendee.totalAmount && Number(attendee.totalAmount) > 0
                            ? `${currency} ${Number(attendee.totalAmount).toFixed(2)}`
                            : <span className="text-muted-foreground">—</span>}
                        </div>
                        {/* Payment status */}
                        <div>
                          {hasPaymentDetailsAccess && attendee.paymentStatus ? (
                            <Badge className={
                              attendee.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-200' :
                              attendee.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }>
                              {attendee.paymentStatus}
                            </Badge>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </div>
                        {/* Registration status */}
                        <div>
                          <Badge className={getStatusColor(attendee.status || 'pending')}>
                            {attendee.status || 'pending'}
                          </Badge>
                        </div>
                        {/* Chevron */}
                        <div className="hidden sm:flex justify-end">
                          <Eye className="w-4 h-4 text-muted-foreground/60" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {attendeesTotalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination
                      currentPage={attendeesPage}
                      totalPages={attendeesTotalPages}
                      onPageChange={(newPage: number) => {
                        setAttendeesPage(newPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendee Detail Sheet */}
            <Sheet open={attendeeSheetOpen} onOpenChange={setAttendeeSheetOpen}>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle>Attendee Details</SheetTitle>
                  <SheetDescription>Full registration and payment information</SheetDescription>
                </SheetHeader>
                {selectedAttendee && (
                  <div className="space-y-6">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {(selectedAttendee.name || selectedAttendee.email || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-semibold">{selectedAttendee.name || '—'}</p>
                        <p className="text-sm text-muted-foreground">{selectedAttendee.email}</p>
                        {selectedAttendee.phoneNumber && (
                          <p className="text-sm text-muted-foreground">{selectedAttendee.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Registration info */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Registration</p>
                      <div className="rounded-lg border divide-y">
                        {[
                          { label: 'Registration ID', value: selectedAttendee.id, mono: true },
                          { label: 'Status', value: selectedAttendee.status || 'pending' },
                          { label: 'Registered On', value: selectedAttendee.createdAt ? new Date(selectedAttendee.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
                        ].map(({ label, value, mono }) => (
                          <div key={label} className="flex items-start justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <span className={`text-sm font-medium text-right max-w-[55%] break-all capitalize ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ticket breakdown */}
                    {selectedAttendee.ticketLineItems && selectedAttendee.ticketLineItems.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Tickets</p>
                        <div className="rounded-lg border divide-y">
                          {selectedAttendee.ticketLineItems.map((li, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2">
                              <div>
                                <p className="text-sm font-medium">{li.ticketType}</p>
                                <p className="text-xs text-muted-foreground">Qty: {li.quantity}</p>
                              </div>
                              {li.totalPrice != null && (
                                <p className="text-sm font-medium">{currency} {Number(li.totalPrice).toFixed(2)}</p>
                              )}
                            </div>
                          ))}
                          {hasPaymentDetailsAccess && selectedAttendee.totalAmount && Number(selectedAttendee.totalAmount) > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
                              <p className="text-sm font-semibold">Total</p>
                              <p className="text-sm font-semibold">{currency} {Number(selectedAttendee.totalAmount).toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ticket</p>
                        <div className="rounded-lg border px-3 py-2 flex justify-between">
                          <span className="text-sm">{selectedAttendee.ticketType}</span>
                          {hasPaymentDetailsAccess && selectedAttendee.totalAmount && Number(selectedAttendee.totalAmount) > 0 && (
                            <span className="text-sm font-medium">{currency} {Number(selectedAttendee.totalAmount).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment info — only for orgs with access */}
                    {hasPaymentDetailsAccess && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Payment</p>
                        <div className="rounded-lg border divide-y">
                          {[
                            { label: 'Payment Status', value: selectedAttendee.paymentStatus || '—' },
                            { label: 'Payment Method', value: selectedAttendee.paymentMethod || '—' },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex items-start justify-between px-3 py-2">
                              <span className="text-sm text-muted-foreground">{label}</span>
                              <span className="text-sm font-medium capitalize">{value}</span>
                            </div>
                          ))}
                          {/* Gateway reference IDs — sensitive, shown at bottom */}
                          {selectedAttendee.paymentTransaction && (
                            <>
                              <div className="flex items-start justify-between px-3 py-2">
                                <span className="text-sm text-muted-foreground">Transaction #</span>
                                <span className="text-xs font-mono font-medium text-right break-all max-w-[55%]">{selectedAttendee.paymentTransaction.transactionNumber}</span>
                              </div>
                              <div className="flex items-start justify-between px-3 py-2">
                                <span className="text-sm text-muted-foreground">Gateway Ref</span>
                                <span className="text-xs font-mono font-medium text-right break-all max-w-[55%]">{selectedAttendee.paymentTransaction.gatewayReference}</span>
                              </div>
                              <div className="flex items-start justify-between px-3 py-2">
                                <span className="text-sm text-muted-foreground">Gateway</span>
                                <span className="text-sm font-medium">{selectedAttendee.paymentTransaction.gateway}</span>
                              </div>
                              <div className="flex items-start justify-between px-3 py-2">
                                <span className="text-sm text-muted-foreground">Paid At</span>
                                <span className="text-sm font-medium">{new Date(selectedAttendee.paymentTransaction.paymentDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Custom form fields */}
                    {selectedAttendee.registrationData && Object.keys(selectedAttendee.registrationData).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Form Responses</p>
                        <div className="rounded-lg border divide-y">
                          {Object.entries(selectedAttendee.registrationData).map(([key, value]) => (
                            <div key={key} className="flex items-start justify-between px-3 py-2 gap-2">
                              <span className="text-sm text-muted-foreground capitalize shrink-0">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                              <span className="text-sm font-medium text-right break-words max-w-[55%]">
                                {Array.isArray(value) ? value.join(', ') : String(value ?? '—')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => { setAttendeeSheetOpen(false); setActiveSection('communication'); }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        );
      }

      case "speakers":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Speakers</h3>
              <Button size="sm" variant="outline" onClick={() => navigate(`/organizer/events/create?edit=${eventId}`)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit in Event Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Speakers</p>
                      <p className="text-lg font-semibold">{apiData.speakers.length}</p>
                    </div>
                    <Mic className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">With Company</p>
                      <p className="text-lg font-semibold">{(apiData.speakers as SpeakerItem[]).filter((s) => s.company).length}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">With Bio</p>
                      <p className="text-lg font-semibold">{(apiData.speakers as SpeakerItem[]).filter((s) => s.bio).length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-success" />
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
                  {apiData.speakers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No speakers added yet. Add speakers from the event edit page.</p>
                  ) : (
                    (apiData.speakers as SpeakerItem[]).map((speaker, idx) => (
                      <div key={speaker.id || idx} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          {speaker.image ? (
                            <img src={speaker.image} alt={speaker.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {speaker.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{speaker.name}</p>
                            {speaker.title && <p className="text-sm text-muted-foreground">{speaker.title}</p>}
                            {speaker.company && <p className="text-xs text-muted-foreground">{speaker.company}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {speaker.company && <Badge variant="secondary">{speaker.company}</Badge>}
                          {speaker.website && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={speaker.website} target="_blank" rel="noopener noreferrer">
                                <Link2 className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "sponsors":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Sponsors</h3>
              <Button size="sm" variant="outline" onClick={() => navigate(`/organizer/events/create?edit=${eventId}`)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit in Event Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sponsors</p>
                      <p className="text-lg font-semibold">{apiData.sponsors.length}</p>
                    </div>
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sponsor Tiers</p>
                      <p className="text-lg font-semibold">{new Set((apiData.sponsors as SponsorItem[]).map(s => s.level).filter(Boolean)).size}</p>
                    </div>
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">With Website</p>
                      <p className="text-lg font-semibold">{(apiData.sponsors as SponsorItem[]).filter(s => s.website).length}</p>
                    </div>
                    <Link2 className="w-8 h-8 text-muted-foreground" />
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
                  {apiData.sponsors.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No sponsors added yet. Add sponsors from the event edit page.</p>
                  ) : (
                    (apiData.sponsors as SponsorItem[]).map((sponsor, idx: number) => (
                    <div key={sponsor.id || idx} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        {sponsor.logo ? (
                          <img src={sponsor.logo} alt={sponsor.name} className="w-10 h-10 rounded-lg object-contain p-1" />
                        ) : (
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {sponsor.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{sponsor.name}</p>
                          {sponsor.level && <p className="text-sm text-muted-foreground">{sponsor.level}</p>}
                          {sponsor.description && <p className="text-xs text-muted-foreground line-clamp-1">{stripHtml(sponsor.description)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {sponsor.level && <Badge variant="secondary">{sponsor.level}</Badge>}
                        {sponsor.website && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                              <Link2 className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "analytics":
        if (!subscriptionLoading && subscription?.tier !== 'PREMIUM') {
          return (
            <UpgradePrompt
              variant="card"
              targetTier="PREMIUM"
              message="Upgrade to Premium to access advanced analytics, revenue breakdowns, and registration timelines."
              dismissible={false}
            />
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Analytics & Revenue</h3>
              <Button variant="outline" size="sm" onClick={() => navigate(`/organizer/analytics/events?eventId=${eventId}`)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Full Analytics
              </Button>
            </div>
            
            {!hasPaymentDetailsAccess && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your data access is currently restricted. Contact an administrator to request access to detailed revenue information.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-lg font-semibold">
                        {hasPaymentDetailsAccess
                          ? (totalRevenue === 0 ? 'Free' : `${currency} ${totalRevenue.toLocaleString()}`)
                          : 'N/A'}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-lg font-semibold">{confirmedAttendees}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Ticket Price</p>
                      <p className="text-lg font-semibold">
                        {hasPaymentDetailsAccess && totalAttendees > 0
                          ? (totalRevenue === 0 ? 'Free' : `${currency} ${(totalRevenue / totalAttendees).toFixed(2)}`)
                          : '—'}
                      </p>
                    </div>
                    <Ticket className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Fill Rate</p>
                      <p className="text-lg font-semibold">{eventData.capacity && eventData.capacity > 0
                        ? ((totalAttendees / eventData.capacity) * 100).toFixed(1)
                        : 0}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown by Ticket Type */}
            {hasPaymentDetailsAccess && (eventData.ticketTypes?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Ticket Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eventData.ticketTypes?.map((ticket, idx) => {
                      const soldForType = attendees.filter(a => a.ticketType === ticket.name).length;
                      const typeRevenue = soldForType * (ticket.price || 0);
                      const pctOfTotal = totalRevenue > 0 ? (typeRevenue / totalRevenue) * 100 : 0;
                      return (
                        <div key={`${ticket.name}-${idx}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{ticket.name}</span>
                              <span className="text-xs text-muted-foreground">{soldForType} sold</span>
                            </div>
                            {totalRevenue > 0 && (
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-xs">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${pctOfTotal}%` }} />
                              </div>
                            )}
                          </div>
                          <p className="font-semibold ml-4">
                            {typeRevenue === 0 ? 'Free' : `${currency} ${typeRevenue.toLocaleString()}`}
                          </p>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-3 border-t font-semibold">
                      <span>Total</span>
                      <span className="text-success">{totalRevenue === 0 ? 'Free' : `${currency} ${totalRevenue.toLocaleString()}`}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Registrations Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No registrations yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...attendees]
                      .sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                      })
                      .slice(0, 10)
                      .map((attendee, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attendee.name || 'Guest'}</p>
                            <p className="text-xs text-muted-foreground">{attendee.ticketType}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge className={`text-xs ${getStatusColor(attendee.status || 'pending')}`}>
                              {attendee.status || 'pending'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{attendee.registeredDate}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Event Settings</h3>
              <Button onClick={() => navigate(`/organizer/events/create?edit=${eventId}`)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Event
              </Button>
            </div>
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Event Title</p>
                    <p className="text-sm text-muted-foreground">{eventData?.title}</p>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">{eventData?.date} {eventData?.time && `at ${eventData.time}`}</p>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{eventData?.venue || eventData?.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Event Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Refund Policy</p>
                  <p className="text-sm text-muted-foreground">
                    {eventData?.refundPolicy === 'no_refunds' && 'No refunds — all ticket sales are final.'}
                    {eventData?.refundPolicy === 'full_refund' && `Full refund available up to ${eventData.refundDeadlineDays || 0} days before the event.`}
                    {eventData?.refundPolicy === 'partial_refund' && `50% partial refund available up to ${eventData.refundDeadlineDays || 0} days before the event.`}
                    {eventData?.refundPolicy === 'custom' && (eventData.refundPolicyText || 'Custom refund policy.')}
                    {!eventData?.refundPolicy && 'No refund policy configured.'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Event Capacity</p>
                  <p className="text-sm text-muted-foreground">{eventData?.capacity || 'Unlimited'} attendees</p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {canCancelEvent() && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Cancel Event</p>
                      <p className="text-sm text-muted-foreground">This action cannot be undone. All attendees will be notified.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                      Cancel Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "resale-transfers":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Resale & Transfers</h3>
              <p className="text-sm text-muted-foreground">Track ticket resale and transfer activity for this event</p>
            </div>

            {resaleTransferLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader />
              </div>
            ) : (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase">Total Resale Listings</p>
                      <p className="text-2xl font-bold mt-1">{resaleStats?.totalListings || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {resaleStats?.activeListings || 0} active · {resaleStats?.soldListings || 0} sold
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-success">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase">Resale Value</p>
                      <p className="text-2xl font-bold mt-1">
                        {eventData?.currency || '$'}{(resaleStats?.totalResaleValue || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {eventData?.currency || '$'}{(resaleStats?.totalPlatformFees || 0).toLocaleString()} in fees
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase">Total Transfers</p>
                      <p className="text-2xl font-bold mt-1">{transferStats?.totalTransfers || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transferStats?.pendingTransfers || 0} pending · {transferStats?.acceptedTransfers || 0} completed
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase">Cancelled / Expired</p>
                      <p className="text-2xl font-bold mt-1">
                        {(resaleStats?.cancelledListings || 0) + (resaleStats?.expiredListings || 0) +
                         (transferStats?.cancelledTransfers || 0) + (transferStats?.expiredTransfers || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">across resale &amp; transfers</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Resale Listings Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resale Listings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {resaleListings.length === 0 ? (
                      <div className="p-8 text-center">
                        <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No resale activity yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Resale listings will appear here when attendees list tickets for sale</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                              <th className="text-left p-3 font-medium text-muted-foreground">Seller</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">Ticket</th>
                              <th className="text-right p-3 font-medium text-muted-foreground">Original</th>
                              <th className="text-right p-3 font-medium text-muted-foreground">Resale</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">Buyer</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resaleListings.map((listing) => (
                              <tr key={listing.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                <td className="p-3">
                                  <p className="font-medium">{listing.seller.firstName} {listing.seller.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{listing.seller.email}</p>
                                </td>
                                <td className="p-3">{listing.ticketType}</td>
                                <td className="p-3 text-right text-muted-foreground line-through">
                                  {eventData?.currency || '$'}{listing.originalPrice}
                                </td>
                                <td className="p-3 text-right font-medium">
                                  {eventData?.currency || '$'}{listing.resalePrice}
                                </td>
                                <td className="p-3">
                                  <Badge className={
                                    listing.status === 'SOLD' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    listing.status === 'LISTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                    listing.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-muted text-muted-foreground'
                                  }>
                                    {listing.status}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  {listing.buyer ? (
                                    <span>{listing.buyer.firstName} {listing.buyer.lastName}</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-muted-foreground text-xs">
                                  {new Date(listing.listedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transfer History Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Transfer History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {transferHistory.length === 0 ? (
                      <div className="p-8 text-center">
                        <Share2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No transfers yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Ticket transfers will appear here</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                              <th className="text-left p-3 font-medium text-muted-foreground">From</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">To</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">Ticket</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                              <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transferHistory.map((transfer) => (
                              <tr key={transfer.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                <td className="p-3">
                                  <p className="font-medium">{transfer.fromUser.firstName} {transfer.fromUser.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{transfer.fromUser.email}</p>
                                </td>
                                <td className="p-3">
                                  {transfer.toUser ? (
                                    <>
                                      <p className="font-medium">{transfer.toUser.firstName} {transfer.toUser.lastName}</p>
                                      <p className="text-xs text-muted-foreground">{transfer.toUser.email}</p>
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground">{transfer.toEmail || '—'}</p>
                                  )}
                                </td>
                                <td className="p-3">{transfer.ticketType}</td>
                                <td className="p-3">
                                  <Badge className={
                                    transfer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    transfer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-muted text-muted-foreground'
                                  }>
                                    {transfer.status}
                                  </Badge>
                                </td>
                                <td className="p-3 text-muted-foreground text-xs">
                                  {new Date(transfer.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      case "overview":
      default:
        return (
          <EventOverviewTab
            eventData={{
              capacity: eventData.capacity,
              hasSeatMap: eventData.hasSeatMap ?? undefined,
              currency: eventData.currency ?? undefined,
              ticketTypes: eventData.ticketTypes ?? undefined,
              speakers: eventData.speakers ?? undefined,
              sponsors: eventData.sponsors ?? undefined,
              startDate: eventData.startDate,
              endDate: eventData.endDate ?? undefined,
              status: eventData.status,
            }}
            attendees={apiData.attendees}
            hasPaymentDetailsAccess={hasPaymentDetailsAccess}
            pendingAttendees={pendingAttendees}
            confirmedAttendees={confirmedAttendees}
            totalRevenue={totalRevenue}
            refunds={refunds}
            subscription={subscription}
            subscriptionLoading={subscriptionLoading}
            eventId={eventId!}
            onNavigate={setActiveSection}
          />
        );

      case "communication":
        if (!subscriptionLoading && subscription?.tier === 'BASIC') {
          return (
            <UpgradePrompt
              variant="card"
              targetTier="STANDARD"
              message="Upgrade to Standard (free) to send announcements and messages to your attendees."
              dismissible={false}
            />
          );
        }
        return (
          <EventCommunicationSection eventId={eventId || ""} eventTitle={eventData?.title || ""} />
        );

      case "refunds":
        if (!subscriptionLoading && subscription?.tier === 'BASIC') {
          return (
            <UpgradePrompt
              variant="card"
              targetTier="STANDARD"
              message="Upgrade to Standard (free) to view and track refund requests from attendees."
              dismissible={false}
            />
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Refund Management</h3>
                <p className="text-sm text-muted-foreground">
                  View and track refund requests for this event
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={refundStatusFilter} onValueChange={setRefundStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary Cards */}
            {refundSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Total Refunds</p>
                    <p className="text-lg font-bold mt-1">{refundSummary.totalCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Pending</p>
                    <p className="text-lg font-bold mt-1 text-amber-600 dark:text-amber-400">{refundSummary.pendingCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Completed</p>
                    <p className="text-lg font-bold mt-1 text-success">{refundSummary.completedCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Amount Refunded</p>
                    <p className="text-lg font-bold mt-1">${refundSummary.totalRefunded.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Refunds List */}
            {refundsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="default" />
              </div>
            ) : refunds.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RotateCcw className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No refund requests</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {refundStatusFilter !== 'all'
                      ? `No ${refundStatusFilter} refunds found. Try a different filter.`
                      : 'When attendees request refunds, they will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <Card key={refund.id} className="border-border/40">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium font-mono">{refund.refundNumber}</span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                refund.status === 'completed' ? 'bg-success/10 text-success' :
                                refund.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                                refund.status === 'processing' ? 'bg-primary/10 text-primary' :
                                refund.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {refund.refundType === 'full' ? 'Full Refund' : 'Partial Refund'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {refund.requester
                              ? `${refund.requester.firstName} ${refund.requester.lastName}`
                              : refund.transaction?.attendeeName || 'Unknown'}
                            {refund.requester?.email && (
                              <span className="ml-1 text-xs">({refund.requester.email})</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            &ldquo;{refund.refundReason}&rdquo;
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-sm font-bold">
                            {refund.currency} {Number(refund.refundAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(refund.requestedAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                          {refund.completedAt && (
                            <p className="text-xs text-success">
                              Completed {new Date(refund.completedAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Refund Policy Info */}
            {eventData && (
              <Card className="border-border/40 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Event Refund Policy</p>
                  <p className="text-sm">
                    {eventData.refundPolicy === 'no_refunds' && 'No refunds — all ticket sales are final.'}
                    {eventData.refundPolicy === 'full_refund' && `Full refund available up to ${eventData.refundDeadlineDays || 0} days before the event.`}
                    {eventData.refundPolicy === 'partial_refund' && `50% partial refund available up to ${eventData.refundDeadlineDays || 0} days before the event.`}
                    {eventData.refundPolicy === 'custom' && (eventData.refundPolicyText || 'Custom refund policy.')}
                    {!eventData.refundPolicy && 'No refund policy configured for this event.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "staff":
        if (!subscriptionLoading && subscription?.tier === 'BASIC') {
          return (
            <UpgradePrompt
              variant="card"
              targetTier="STANDARD"
              message="Upgrade to Standard (free) to assign and manage staff members for your event."
              dismissible={false}
            />
          );
        }
        return (
          <div className="space-y-6">
            {eventId && (
              <EventStaffAssignment
                eventId={eventId}
                eventTitle={eventData?.title}
                variant="organizer"
              />
            )}
          </div>
        );

      case "seating":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Seating Management</h2>
              <p className="text-muted-foreground mt-1">
                Manage and monitor seat allocations for this event
              </p>
            </div>
            <SeatManagementDashboard eventId={eventId!} />
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Seat Map</h3>
              <EventSeatMapManager eventId={eventId!} />
            </div>
          </div>
        );

      case "scan-settings":
        if (!subscriptionLoading && subscription?.tier === 'BASIC') {
          return (
            <UpgradePrompt
              variant="card"
              targetTier="STANDARD"
              message="Upgrade to Standard (free) to view scan & check-in data for your event."
              dismissible={false}
            />
          );
        }
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Scan & Check-In</h2>
              <p className="text-muted-foreground mt-1">
                Live check-in monitoring, scan history, and attendee status
              </p>
            </div>

            {scanLoading && !scanStatistics ? (
              <div className="flex items-center justify-center py-12">
                <Loader />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Registered", value: scanStatistics?.totalAttendees || 0, icon: Users, gradient: "from-blue-500 to-blue-600" },
                    { label: "Checked In", value: scanStatistics?.checkedIn || 0, icon: LogIn, gradient: "from-emerald-500 to-emerald-600" },
                    { label: "Currently Inside", value: scanStatistics?.currentlyInside || 0, icon: UserCheck, gradient: "from-violet-500 to-violet-600" },
                    { label: "Checked Out", value: scanStatistics?.checkedOut || 0, icon: LogOut, gradient: "from-slate-500 to-slate-600" },
                    { label: "Re-entries", value: scanStatistics?.reEntries || 0, icon: RefreshCw, gradient: "from-amber-500 to-amber-600" },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                          </div>
                          <div className={`w-10 h-10 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                            <stat.icon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Check-in progress bar */}
                {scanStatistics && scanStatistics.totalAttendees > 0 && (
                  <Card className="border-border/40 bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Check-in Progress</p>
                        <p className="text-sm text-muted-foreground">
                          {scanStatistics.checkedIn} / {scanStatistics.totalAttendees} ({Math.round((scanStatistics.checkedIn / scanStatistics.totalAttendees) * 100)}%)
                        </p>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (scanStatistics.checkedIn / scanStatistics.totalAttendees) * 100)}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sub-tabs */}
                <div className="flex gap-1 border-b border-border/40">
                  {[
                    { key: 'overview' as const, label: 'Overview' },
                    { key: 'history' as const, label: 'Scan History' },
                    { key: 'attendees' as const, label: 'Attendee Status' },
                    { key: 'settings' as const, label: 'Settings' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setScanTab(tab.key)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        scanTab === tab.key
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Overview Tab */}
                {scanTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Config summary */}
                    <Card className="border-border/40 bg-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Scan Configuration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg border bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Scan Method</p>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-primary" />
                              <p className="font-semibold text-sm">QR Code + Backup Code</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Re-entry Policy</p>
                            <p className="font-semibold text-sm">
                              {scanConfig?.allowReEntry ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Allowed{scanConfig.maxReEntries ? ` (max ${scanConfig.maxReEntries})` : ''}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Not allowed</span>
                              )}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg border bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Check-out Required</p>
                            <p className="font-semibold text-sm">
                              {scanConfig?.requireCheckOut ? (
                                <span className="text-blue-600 dark:text-blue-400">Yes</span>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent scans */}
                    <Card className="border-border/40 bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Recent Scans</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => setScanTab('history')}>
                            View all
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {scanHistory.length === 0 ? (
                          <div className="p-8 text-center">
                            <QrCode className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">No scans recorded yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Scans will appear here when attendees check in</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/40 bg-muted/30">
                                  <th className="text-left p-3 font-medium text-muted-foreground">Attendee</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Ticket</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scanHistory.slice(0, 10).map((scan) => (
                                  <tr key={scan.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                    <td className="p-3">
                                      <p className="font-medium">{scan.attendeeName}</p>
                                    </td>
                                    <td className="p-3 text-muted-foreground">{scan.ticketType || '—'}</td>
                                    <td className="p-3">
                                      <Badge className={
                                        scan.scanType === 'CHECK_IN' || scan.scanType === 'MANUAL_CHECK_IN'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      }>
                                        {scan.scanType === 'CHECK_IN' ? 'Check-in' :
                                         scan.scanType === 'CHECK_OUT' ? 'Check-out' :
                                         scan.scanType === 'MANUAL_CHECK_IN' ? 'Manual In' :
                                         'Manual Out'}
                                      </Badge>
                                      {scan.isReEntry && (
                                        <Badge className="ml-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                          Re-entry
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="p-3 text-muted-foreground text-xs">
                                      {new Date(scan.scannedAt).toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                      {scan.isValid ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Scan History Tab */}
                {scanTab === 'history' && (
                  <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-3">
                      <Select value={scanTypeFilter} onValueChange={(val: string) => { setScanTypeFilter(val); setScanHistoryPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All scan types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Scan Types</SelectItem>
                          <SelectItem value="CHECK_IN">Check-in</SelectItem>
                          <SelectItem value="CHECK_OUT">Check-out</SelectItem>
                          <SelectItem value="MANUAL_CHECK_IN">Manual Check-in</SelectItem>
                          <SelectItem value="MANUAL_CHECK_OUT">Manual Check-out</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground ml-auto">
                        {scanHistoryTotal} scan{scanHistoryTotal !== 1 ? 's' : ''} total
                      </p>
                    </div>

                    <Card className="border-border/40 bg-card">
                      <CardContent className="p-0">
                        {scanHistory.length === 0 ? (
                          <div className="p-8 text-center">
                            <QrCode className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">No scans match the filter</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/40 bg-muted/30">
                                  <th className="text-left p-3 font-medium text-muted-foreground">Attendee</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Ticket Type</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Scan Type</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Scanned At</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Scanned By</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Facility</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Valid</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scanHistory.map((scan) => (
                                  <tr key={scan.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                    <td className="p-3">
                                      <p className="font-medium">{scan.attendeeName}</p>
                                    </td>
                                    <td className="p-3 text-muted-foreground">{scan.ticketType || '—'}</td>
                                    <td className="p-3">
                                      <Badge className={
                                        scan.scanType === 'CHECK_IN' || scan.scanType === 'MANUAL_CHECK_IN'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      }>
                                        {scan.scanType === 'CHECK_IN' ? 'Check-in' :
                                         scan.scanType === 'CHECK_OUT' ? 'Check-out' :
                                         scan.scanType === 'MANUAL_CHECK_IN' ? 'Manual In' :
                                         'Manual Out'}
                                      </Badge>
                                      {scan.isReEntry && (
                                        <Badge className="ml-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                          Re-entry
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                                      {new Date(scan.scannedAt).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-muted-foreground text-xs">{scan.scannedBy || '—'}</td>
                                    <td className="p-3 text-muted-foreground text-xs">{scan.facility || scan.scanLocation || '—'}</td>
                                    <td className="p-3">
                                      {scan.isValid ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pagination */}
                    {scanHistoryTotal > 20 && (
                      <div className="flex justify-center">
                        <Pagination
                          currentPage={scanHistoryPage}
                          totalPages={Math.ceil(scanHistoryTotal / 20)}
                          onPageChange={setScanHistoryPage}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Attendee Status Tab */}
                {scanTab === 'attendees' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {scanAttendeesTotal} registered attendee{scanAttendeesTotal !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <Card className="border-border/40 bg-card">
                      <CardContent className="p-0">
                        {scanAttendees.length === 0 ? (
                          <div className="p-8 text-center">
                            <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">No attendees registered</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/40 bg-muted/30">
                                  <th className="text-left p-3 font-medium text-muted-foreground">Attendee</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Ticket</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Checked In</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Checked Out</th>
                                  <th className="text-right p-3 font-medium text-muted-foreground">Re-entries</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scanAttendees.map((attendee) => (
                                  <tr key={attendee.registrationId} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                    <td className="p-3">
                                      <p className="font-medium">{attendee.attendeeName}</p>
                                      <p className="text-xs text-muted-foreground">{attendee.email}</p>
                                    </td>
                                    <td className="p-3 text-muted-foreground">{attendee.ticketType || '—'}</td>
                                    <td className="p-3">
                                      {attendee.isCurrentlyInside ? (
                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                          Inside
                                        </Badge>
                                      ) : attendee.checkedInAt ? (
                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                          Checked Out
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-muted text-muted-foreground">
                                          Not Arrived
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="p-3 text-muted-foreground text-xs">
                                      {attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleString() : '—'}
                                    </td>
                                    <td className="p-3 text-muted-foreground text-xs">
                                      {attendee.checkedOutAt ? new Date(attendee.checkedOutAt).toLocaleString() : '—'}
                                    </td>
                                    <td className="p-3 text-right">
                                      {attendee.reEntryCount > 0 ? (
                                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                          {attendee.reEntryCount}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">0</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pagination */}
                    {scanAttendeesTotal > 20 && (
                      <div className="flex justify-center">
                        <Pagination
                          currentPage={scanAttendeesPage}
                          totalPages={Math.ceil(scanAttendeesTotal / 20)}
                          onPageChange={setScanAttendeesPage}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {scanTab === 'settings' && (
                  <div className="space-y-4">
                    <Card className="border-border/40 bg-card">
                      <CardHeader>
                        <CardTitle className="text-base">Check-In Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Re-entry toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Allow Re-entry</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Allow attendees to check in again after checking out
                            </p>
                          </div>
                          <Button
                            variant={scanConfig?.allowReEntry ? "default" : "outline"}
                            size="sm"
                            disabled={updatingConfig}
                            onClick={() => handleUpdateScanConfig({ allowReEntry: !scanConfig?.allowReEntry })}
                          >
                            {scanConfig?.allowReEntry ? 'Enabled' : 'Disabled'}
                          </Button>
                        </div>

                        {/* Require checkout toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Require Check-out</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Attendees must check out before they can re-enter
                            </p>
                          </div>
                          <Button
                            variant={scanConfig?.requireCheckOut ? "default" : "outline"}
                            size="sm"
                            disabled={updatingConfig}
                            onClick={() => handleUpdateScanConfig({ requireCheckOut: !scanConfig?.requireCheckOut })}
                          >
                            {scanConfig?.requireCheckOut ? 'Required' : 'Optional'}
                          </Button>
                        </div>

                        {/* Max re-entries */}
                        {scanConfig?.allowReEntry && (
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div className="flex-1">
                              <p className="font-medium text-sm">Maximum Re-entries</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Limit the number of times an attendee can re-enter (leave empty for unlimited)
                              </p>
                            </div>
                            <div className="w-24">
                              <Input
                                type="number"
                                min={0}
                                placeholder="∞"
                                value={scanConfig.maxReEntries ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const val = e.target.value;
                                  handleUpdateScanConfig({
                                    maxReEntries: val === '' ? null : parseInt(val, 10),
                                  });
                                }}
                                disabled={updatingConfig}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Scan settings control how ticket scanning behaves at your event. Changes take effect immediately for all scanning devices.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "remittance":
        if (!subscriptionLoading && subscription?.tier === 'BASIC') {
          return (
            <UpgradePrompt
              variant="card"
              targetTier="STANDARD"
              message="Upgrade to Standard (free) to view remittance details and payment disbursement information."
              dismissible={false}
            />
          );
        }
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Remittance</h2>
              <p className="text-muted-foreground mt-1">
                Payment disbursement and payout information for this event
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Gross Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    {hasPaymentDetailsAccess ? `${currency} ${totalRevenue.toLocaleString()}` : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Platform Fee</p>
                  <p className="text-2xl font-bold mt-1 text-muted-foreground">Calculated at payout</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Est. Payout</p>
                  <p className="text-2xl font-bold mt-1 text-success">After event</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Disbursements are processed after your event ends</p>
                <p className="text-sm mt-1">
                  Funds are typically released within 5–7 business days post-event. Contact support for payout status.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="default" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <BackButton />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">{error}</p>
              {error.toLowerCase().includes("not found") && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-sm">
                    <strong>Note:</strong> If you just created this event, it may still be pending admin approval. 
                    Pending events will appear here once they're approved.
                  </p>
                  <p className="text-sm mt-2">
                    You can edit your event while it's pending. <Link to="/organizer/dashboard" className="underline font-semibold">Go back to dashboard</Link>
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show content only if event data is loaded
  if (!eventData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="default" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Hero Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-3">
            {/* Event Image - Small */}
            {eventData?.image && (
              <img
                src={eventData.image}
                alt={eventData.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}

            {/* Event Title and Quick Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BackButton to={backPath} />
                <h1 className="text-xl font-bold text-foreground truncate">
                  {eventData?.title || 'Event Management'}
                </h1>
                {eventData?.status && (
                  <Badge className={`${getStatusColor(eventData.status)} border font-medium shrink-0`}>
                    {getStatusLabel(eventData.status)}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {eventData?.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {eventData.date}
                  </span>
                )}
                {(eventData?.venue || eventData?.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {eventData.venue || eventData.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {apiData.attendees.length} / {eventData?.capacity || '∞'}
                  {eventData?.capacity && eventData.capacity > 0 && (
                    <span className="text-xs">({((apiData.attendees.length / eventData.capacity) * 100).toFixed(0)}%)</span>
                  )}
                </span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowPreviewModal(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Event
                </DropdownMenuItem>
                {eventData?.status?.toUpperCase() === 'APPROVED' && (
                  <DropdownMenuItem asChild>
                    <Link to={`/event/${eventData?.slug ?? eventId}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Page
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveSection('settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Event Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/organizer/analytics/events?eventId=${eventId}`)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}/event/${eventData?.slug ?? eventId}`);
                    toast({
                      title: "Copied",
                      description: "Event link copied to clipboard",
                    });
                  } catch (err) {
                    toast({
                      title: "Copy failed",
                      description: extractErrorMessage(err, "Failed to copy link"),
                      variant: "destructive",
                    });
                  }
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Event Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (!eventId || !eventData) return;
                  const shared = await shareEvent(eventData.title || 'Event', eventId);
                  if (shared) {
                    toast({
                      title: "Shared",
                      description: "Event shared successfully",
                    });
                  } else {
                    toast({
                      title: "Link Copied",
                      description: "Event link copied to clipboard",
                    });
                  }
                }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (!eventId || !eventData) return;
                  try {
                    exportEventData({
                      id: eventId,
                      title: eventData.title || 'Event',
                      date: eventData.date,
                      location: (eventData.location || eventData.venue || undefined) ?? undefined,
                      attendees: typeof eventData.attendees === 'number' ? eventData.attendees : attendees.length,
                      revenue: 0,
                      views: 0,
                      status: eventData.status || undefined,
                      category: (eventData.category || undefined) ?? undefined,
                    });
                    toast({
                      title: "Exported",
                      description: "Event data exported successfully",
                    });
                  } catch (err) {
                    toast({
                      title: "Export failed",
                      description: extractErrorMessage(err, "Failed to export event data"),
                      variant: "destructive",
                    });
                  }
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Event Data
                </DropdownMenuItem>
                {canCancelEvent() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowCancelDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Event
                    </DropdownMenuItem>
                  </>
                )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/event/${eventData?.slug ?? eventId}`);
                  toast({
                    title: "Copied",
                    description: "Event link copied to clipboard",
                  });
                } catch (err) {
                  toast({
                    title: "Copy failed",
                    description: extractErrorMessage(err, "Failed to copy link"),
                    variant: "destructive",
                  });
                }
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!eventId || !eventData) return;
                const shared = await shareEvent(eventData.title || 'Event', eventId);
                if (shared) {
                  toast({
                    title: "Shared",
                    description: "Event shared successfully",
                  });
                } else {
                  toast({
                    title: "Link Copied",
                    description: "Event link copied to clipboard",
                  });
                }
              }}
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Share
            </Button>
            {eventData?.status?.toUpperCase() === 'APPROVED' && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/event/${eventData?.slug ?? eventId}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View Public
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-2">
          {navigationSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;
            return (
              <Button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </Button>
            );
          })}
          
          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {moreMenuSections.map((section) => {
                const Icon = section.icon;
                const badge = section.badge || 0;
                return (
                  <DropdownMenuItem
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {section.label}
                    {badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {badge}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {renderSection()}
      </div>

      {/* Event Preview Dialog */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>
              Complete event details and information
            </DialogDescription>
          </DialogHeader>
          {eventData && (
            <div className="space-y-6">
              {/* Event Image */}
              {eventData.image && (
                <div className="relative overflow-hidden rounded-xl h-64">
                  <img
                    src={eventData.image}
                    alt={eventData.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-2xl font-bold mb-2">{eventData.title}</h2>
                    {eventData.category && (
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                        {eventData.category}
                      </Badge>
                    )}
                  </div>
                  {eventData.status && (
                    <div className="absolute top-4 right-4">
                      <Badge className={getStatusColor(eventData.status)}>
                        {getStatusLabel(eventData.status)}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Title (if no image) */}
              {!eventData.image && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">{eventData.title}</h2>
                  {eventData.category && (
                    <Badge>{eventData.category}</Badge>
                  )}
                </div>
              )}

              {/* Description */}
              {(eventData.fullDescription || eventData.description) && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">About this event</h3>
                  <RichTextContent
                    content={eventData.fullDescription || eventData.description || ''}
                    className="text-sm text-muted-foreground"
                  />
                </div>
              )}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Time */}
                {eventData.date && (
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                      <p className="font-medium text-sm">{eventData.date}</p>
                      {eventData.time && (
                        <p className="text-sm text-muted-foreground">{eventData.time}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Location */}
                {(eventData.venue || eventData.location) && (
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Venue</p>
                      <p className="font-medium text-sm">{eventData.venue || eventData.location}</p>
                      {eventData.venue && eventData.location && eventData.venue !== eventData.location && (
                        <p className="text-sm text-muted-foreground">{eventData.location}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Capacity */}
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                    <p className="font-medium text-sm">
                      {totalAttendees} / {eventData.capacity || '∞'} registered
                    </p>
                    {eventData.capacity && eventData.capacity > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {((totalAttendees / eventData.capacity) * 100).toFixed(0)}% full
                      </p>
                    )}
                  </div>
                </div>

                {/* Price */}
                {(eventData.ticketTypes && eventData.ticketTypes.length > 0) && (
                  <div className="flex gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ticket Pricing</p>
                      {eventData.ticketTypes.map((ticket: { name: string; price?: number }, idx: number) => (
                        <p key={idx} className="text-sm">
                          <span className="font-medium">{ticket.name}:</span>{' '}
                          {ticket.price === 0 || !ticket.price ? 'Free' : `${eventData.currency || '$'}${ticket.price}`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Types Summary */}
              {eventData.ticketTypes && eventData.ticketTypes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Available Tickets</h3>
                  <div className="grid gap-2">
                    {eventData.ticketTypes.map((ticket, idx) => {
                      const soldForType = attendees.filter(a => a.ticketType === ticket.name).length;
                      const available = ticket.quantity || 0;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{ticket.name}</span>
                            {ticket.isComplementary && <Badge variant="secondary" className="text-xs">Free</Badge>}
                            {ticket.requiresInvitation && <Badge variant="outline" className="text-xs">Invite Only</Badge>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              {ticket.price === 0 || !ticket.price ? 'Free' : `${eventData.currency || '$'}${ticket.price}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {soldForType} / {available || '∞'} sold
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Requirements & Age Restriction */}
              {((eventData.requirements && eventData.requirements.length > 0) || eventData.ageRestriction) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Important Information</h3>
                  <div className="space-y-2">
                    {eventData.ageRestriction && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span>Age Restriction: {eventData.ageRestriction}</span>
                      </div>
                    )}
                    {eventData.requirements?.map((req: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speakers (if any) */}
              {apiData.speakers && apiData.speakers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Speakers</h3>
                  <div className="grid gap-2">
                    {apiData.speakers.map((speaker: { name: string; title?: string; image?: string }, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        {speaker.image ? (
                          <img src={speaker.image} alt={speaker.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {speaker.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{speaker.name}</p>
                          {speaker.title && <p className="text-xs text-muted-foreground">{speaker.title}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agenda */}
              {eventData.agenda && eventData.agenda.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Schedule</h3>
                  <div className="space-y-2">
                    {(Array.isArray(eventData.agenda) ? eventData.agenda : []).map((item: { title?: string; startTime?: string; endTime?: string; description?: string }, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {item.startTime && (
                            <span className="text-xs font-medium text-primary">
                              {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1">{item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{stripHtml(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exhibitors */}
              {eventData.exhibitors && eventData.exhibitors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Exhibitors</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Array.isArray(eventData.exhibitors) ? eventData.exhibitors : []).map((exhibitor: { name: string; booth?: string }, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">{exhibitor.name}</p>
                        {exhibitor.booth && <p className="text-xs text-muted-foreground">Booth: {exhibitor.booth}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors */}
              {apiData.sponsors && apiData.sponsors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Sponsors</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(apiData.sponsors as SponsorItem[]).map((sponsor, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                        {sponsor.logo ? (
                          <img src={sponsor.logo} alt={sponsor.name} className="h-8 mx-auto mb-1 object-contain" />
                        ) : (
                          <p className="text-sm font-medium">{sponsor.name}</p>
                        )}
                        {sponsor.level && <Badge variant="outline" className="text-xs">{sponsor.level}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {eventData.faqs && eventData.faqs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Frequently Asked Questions</h3>
                  <div className="space-y-2">
                    {(Array.isArray(eventData.faqs) ? eventData.faqs : []).map((faq: { question: string; answer: string }, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">{faq.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {eventData.tags && eventData.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {eventData.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Organizer Info */}
              {eventData.organizer && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Event Organizer
                  </h3>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="font-medium text-sm">
                      {eventData.organizer.firstName || ''} {eventData.organizer.lastName || ''}
                    </p>
                    {eventData.organizer.organizationName && (
                      <p className="text-xs text-muted-foreground">
                        {eventData.organizer.organizationName}
                      </p>
                    )}
                    {eventData.organizerDescription && (
                      <RichTextContent
                        content={eventData.organizerDescription}
                        className="text-xs text-muted-foreground leading-relaxed"
                      />
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                  Close
                </Button>
                {eventData?.status?.toUpperCase() === 'APPROVED' && (
                  <Button asChild onClick={() => setShowPreviewModal(false)}>
                    <Link to={`/event/${eventData?.slug ?? eventId}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Page
                    </Link>
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket Edit / Add Sheet */}
      <Sheet open={ticketSheetOpen} onOpenChange={setTicketSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTicketIndex === null ? 'Add Ticket Type' : 'Edit Ticket Type'}</SheetTitle>
            {editingTicketIndex !== null && (() => {
              const ticket = (eventData?.ticketTypes as FullTicketType[] | null | undefined)?.[editingTicketIndex];
              const sold = ticket ? attendees.filter(a => a.ticketType === ticket.name).length : 0;
              return sold > 0 ? (
                <SheetDescription>
                  {sold} ticket{sold !== 1 ? 's' : ''} sold — quantity cannot go below {sold}. Price changes apply to new purchases only.
                </SheetDescription>
              ) : null;
            })()}
          </SheetHeader>

          {ticketForm && (
            <div className="space-y-4 mt-6">
              {/* Name */}
              <div className="space-y-1.5">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g., General Admission"
                  value={ticketForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, name: e.target.value } : f)}
                />
              </div>

              {/* Type + Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={ticketForm.type}
                    onValueChange={(v: 'free' | 'paid') =>
                      setTicketForm(f => f ? { ...f, type: v, price: v === 'free' ? '0' : f.price } : f)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Price{ticketForm.type === 'paid' && !ticketForm.isComplementary && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  {ticketForm.type === 'paid' && !ticketForm.isComplementary ? (
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currency}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={ticketForm.price}
                        className="pl-8"
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, price: e.target.value } : f)}
                      />
                    </div>
                  ) : (
                    <div className="h-10 flex items-center px-3 border border-border rounded-md bg-muted/30">
                      <span className="text-sm text-muted-foreground">{ticketForm.isComplementary ? 'Comp.' : 'Free'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity */}
              {(() => {
                const origTicket = editingTicketIndex !== null
                  ? (eventData?.ticketTypes as FullTicketType[] | null | undefined)?.[editingTicketIndex]
                  : null;
                const soldForType = origTicket ? attendees.filter(a => a.ticketType === origTicket.name).length : 0;
                return (
                  <div className="space-y-1.5">
                    <Label>
                      Quantity{soldForType > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">(min {soldForType})</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      min={soldForType > 0 ? soldForType : 1}
                      placeholder="Unlimited"
                      value={ticketForm.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, quantity: e.target.value } : f)}
                    />
                  </div>
                );
              })()}

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="What's included with this ticket?"
                  value={ticketForm.description}
                  className="min-h-[70px] resize-none"
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, description: e.target.value } : f)}
                />
              </div>

              {/* Complementary toggle */}
              {ticketForm.type === 'paid' && (
                <div className="flex items-center justify-between py-2 border-t">
                  <div>
                    <p className="text-sm font-medium">Complementary</p>
                    <p className="text-xs text-muted-foreground">Invitation-only, price waived</p>
                  </div>
                  <Switch
                    checked={ticketForm.isComplementary}
                    onCheckedChange={(c: boolean) =>
                      setTicketForm(f => f ? { ...f, isComplementary: c, requiresInvitation: c, price: c ? '0' : f.price } : f)
                    }
                  />
                </div>
              )}
              {ticketForm.isComplementary && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Requires Invitation</p>
                    <p className="text-xs text-muted-foreground">Only accessible via invitation link</p>
                  </div>
                  <Switch
                    checked={ticketForm.requiresInvitation}
                    onCheckedChange={(c: boolean) => setTicketForm(f => f ? { ...f, requiresInvitation: c } : f)}
                  />
                </div>
              )}

              {/* Hidden toggle */}
              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <p className="text-sm font-medium">Hidden</p>
                  <p className="text-xs text-muted-foreground">Not shown publicly; access via link only</p>
                </div>
                <Switch
                  checked={ticketForm.isHidden}
                  onCheckedChange={(c: boolean) => setTicketForm(f => f ? { ...f, isHidden: c } : f)}
                />
              </div>

              {/* Per-person limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max per person</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={ticketForm.maxPerPerson}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, maxPerPerson: e.target.value } : f)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Min per order</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={ticketForm.minPerOrder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, minPerOrder: e.target.value } : f)}
                  />
                </div>
              </div>

              {/* Sales channel */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sales Channel</Label>
                <Select
                  value={ticketForm.salesChannel}
                  onValueChange={(v: string) => setTicketForm(f => f ? { ...f, salesChannel: v } : f)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Online & At Door</SelectItem>
                    <SelectItem value="online">Online Only</SelectItem>
                    <SelectItem value="door">At Door Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Available From</Label>
                  <Input
                    type="datetime-local"
                    value={ticketForm.availableFrom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, availableFrom: e.target.value } : f)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Available Until</Label>
                  <Input
                    type="datetime-local"
                    value={ticketForm.availableUntil}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTicketForm(f => f ? { ...f, availableUntil: e.target.value } : f)}
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-4 border-t mt-2">
                {editingTicketIndex !== null ? (() => {
                  const origTicket = (eventData?.ticketTypes as FullTicketType[] | null | undefined)?.[editingTicketIndex];
                  const sold = origTicket ? attendees.filter(a => a.ticketType === origTicket.name).length : 0;
                  return sold > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { void handleArchiveTicket(editingTicketIndex); setTicketSheetOpen(false); }}
                      disabled={savingTicket}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { void handleRemoveTicket(editingTicketIndex); setTicketSheetOpen(false); }}
                      disabled={savingTicket}
                    >
                      Remove
                    </Button>
                  );
                })() : <div />}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTicketSheetOpen(false)} disabled={savingTicket}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveTicket} disabled={savingTicket}>
                    {savingTicket ? <><ButtonLoader />Saving...</> : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
                  <ButtonLoader />
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
