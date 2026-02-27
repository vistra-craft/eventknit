import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Mail,
  Plus,
  XCircle,
  Lock,
  RotateCcw,
  Ticket,
  Link2,
  Copy as CopyIcon,
  Grid3X3,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loader, ButtonLoader } from "../../components/ui/loader";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Pagination } from "../../components/ui/pagination";
import { getOrganizerEventById, getEventRegistrations, cancelEvent, getSubscription, getEventRefunds, getEventRefundSummary, type OrganizerSubscription, type OrganizerRefund, type OrganizerRefundSummary } from "../../lib/organizer-api";
import { getEventInvitations, createInvitation, revokeInvitation, getRegistrationLinkUrl, type InvitationsListResponse, InviteType } from "../../lib/invitation-api";
import { transformEventData } from "../../lib/event-utils";
import type { EventData } from "../../types/event";
import { shareEvent } from "../../lib/utils/share";
import { exportEventData } from "../../lib/utils/export";
import { useToast } from "../../hooks/useToast";
import { EventStaffAssignment } from "../../components/EventStaffAssignment";
import { sendToEventRegistrations, getCommunicationHistory } from "../../lib/organizer-dashboard-api";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ConsentStatisticsCard } from "../../components/organizer/ConsentStatisticsCard";
import { SubscriptionTierBadge } from "../../components/organizer/SubscriptionTierBadge";
import { UpgradePrompt } from "../../components/organizer/UpgradePrompt";
import BackButton from "@/components/BackButton";
import { EventSeatMapManager } from "@/components/organizer/EventSeatMapManager";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/sheet";

interface CommunicationMessage {
  id: string;
  subject: string;
  content: string;
  recipientType: string;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  event?: { id: string; title: string };
}

const EventCommunicationSection = ({ eventId, eventTitle }: { eventId: string; eventTitle: string }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        const response = await getCommunicationHistory({ eventId });
        if (response.success && response.data) {
          setMessages(response.data.messages || []);
        }
      } catch (error) {
        console.error("Error loading communication history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [eventId]);

  const handleSendMessage = async () => {
    if (!eventId || !subject.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in subject and content",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const response = await sendToEventRegistrations(eventId, {
        subject: subject.trim(),
        content: content.trim(),
        sendEmail,
        sendNotification,
      });

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Message sent to ${response.data.sent} recipients`,
        });
        setIsSendDialogOpen(false);
        setSubject("");
        setContent("");
        // Reload messages
        const historyResponse = await getCommunicationHistory({ eventId });
        if (historyResponse.success && historyResponse.data) {
          setMessages(historyResponse.data.messages || []);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Communication</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Send messages to all attendees of {eventTitle}
          </p>
        </div>
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Message to Attendees</DialogTitle>
              <DialogDescription>
                Send a message to all registered attendees for this event
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="content">Message Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your message..."
                  className="mt-2 min-h-[200px]"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                  <Label htmlFor="send-email">Send via Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-notification"
                    checked={sendNotification}
                    onCheckedChange={setSendNotification}
                  />
                  <Label htmlFor="send-notification">Send via In-App Notification</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSendDialogOpen(false);
                  setSubject("");
                  setContent("");
                }}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={sending}>
                {sending ? (
                  <>
                    <ButtonLoader />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Communication History</h2>
        {loading ? (
          <div className="text-center py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages sent yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{message.subject}</h3>
                        <Badge variant="outline">Event Registrations</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {message.sentCount} sent
                        </span>
                        {message.failedCount > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3 w-3" />
                            {message.failedCount} failed
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EventManagement = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
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

  // Invitation state
  type InvitationItem = InvitationsListResponse['data']['invitations'][number];
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [showCreateInvitation, setShowCreateInvitation] = useState(false);
  const [newInviteType, setNewInviteType] = useState<InviteType>(InviteType.ATTENDEE);
  const [newInviteTitle, setNewInviteTitle] = useState('');
  const [newInviteMaxUses, setNewInviteMaxUses] = useState('');
  const [creatingInvitation, setCreatingInvitation] = useState(false);

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
            // Build ticket type display from line items (preferred) or legacy ticketType field
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
              quantity: reg.quantity || 1,
              totalAmount: reg.totalAmount || 0,
              paymentStatus: reg.paymentStatus || undefined,
              paymentMethod: reg.paymentMethod || undefined,
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
      } catch {
        // Silently fail — empty state will show
      } finally {
        setRefundsLoading(false);
      }
    };
    fetchRefunds();
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
      } catch {
        // Silently fail — empty state will show
      } finally {
        setInvitationsLoading(false);
      }
    };
    fetchInvitations();
  }, [eventId, activeSection]);

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
  
  // Type definitions for mock data
  interface Attendee {
    id?: string;
    status?: string;
    totalAmount?: number | string;
    firstName?: string;
    lastName?: string;
    email?: string;
    name?: string;
    paymentStatus?: string;
    ticketType?: string;
  }
  
  interface Speaker {
    id: string | number;
    name: string;
    title?: string;
    bio?: string;
    status?: string;
    sessions?: number;
  }
  
  interface Sponsor {
    id: string | number;
    name?: string;
    level?: string;
    amount?: number;
  }
  

  // Calculate summary stats (always available)
  const totalAttendees = attendees.length;
  const confirmedAttendees = attendees.filter((a) => a.status === 'confirmed' || a.status === 'CONFIRMED').length;
  const pendingAttendees = attendees.filter((a) => a.status === 'pending' || a.status === 'PENDING').length;
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
  ];

  const moreMenuSections = [
    { key: "invitations", label: "Invitations", icon: Link2 },
    { key: "refunds", label: "Refunds", icon: RotateCcw, badge: refunds.length > 0 ? refunds.filter(r => r.status === 'pending').length : 0 },
    { key: "staff", label: "Staff Assignment", icon: UserPlus },
    { key: "seating", label: "Seating", icon: Grid3X3, conditional: true },
    { key: "speakers", label: "Speakers", icon: Mic, conditional: true },
    { key: "sponsors", label: "Sponsors", icon: Star, conditional: true },
  ];

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
        const ticketTypes = eventData.ticketTypes || [];
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
              <Button size="sm" onClick={() => setActiveSection('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Tickets
              </Button>
            </div>

            {/* Ticket Type List */}
            <Card>
              <CardContent className="p-0">
                {ticketTypes.length === 0 ? (
                  <div className="p-8 text-center">
                    <Ticket className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No ticket types configured</p>
                    <p className="text-xs text-muted-foreground mt-1">Configure tickets in event settings</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {ticketTypes.map((ticket, idx) => {
                      const soldForType = attendees.filter(a => a.ticketType === ticket.name).length;
                      const available = ticket.quantity || 0;
                      const fillPct = available > 0 ? Math.min(100, (soldForType / available) * 100) : 0;

                      return (
                        <div key={`${ticket.name}-${idx}`} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold truncate">{ticket.name}</span>
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
                                  {soldForType} / {available || '∞'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold">
                                {ticket.price === 0 || !ticket.price ? 'Free' : `${eventData.currency || '$'}${ticket.price}`}
                              </p>
                              {ticket.originalPrice && ticket.originalPrice > (ticket.price || 0) && (
                                <p className="text-xs text-muted-foreground line-through">
                                  ${ticket.originalPrice}
                                </p>
                              )}
                            </div>
                          </div>
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
          } catch {
            toast({ title: "Error", description: "Failed to create invitation", variant: "destructive" });
          } finally {
            setCreatingInvitation(false);
          }
        };

        const handleRevokeInvitation = async (invId: string) => {
          try {
            await revokeInvitation(invId);
            toast({ title: "Revoked", description: "Invitation link has been revoked" });
            setInvitations(prev => prev.map(inv => inv.id === invId ? { ...inv, isActive: false } : inv));
          } catch {
            toast({ title: "Error", description: "Failed to revoke invitation", variant: "destructive" });
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        const attendeesStartIndex = (attendeesPage - 1) * attendeesLimit;
        const attendeesEndIndex = attendeesStartIndex + attendeesLimit;
        const paginatedAttendees = apiData.attendees.slice(attendeesStartIndex, attendeesEndIndex);
        const attendeesTotalPages = Math.ceil(apiData.attendees.length / attendeesLimit);
        
        return (
          <div className="space-y-6">
            {/* Tier Indicator Banner */}
            {!subscriptionLoading && subscription && subscription.tier === 'BASIC' && (
              <UpgradePrompt
                message="Upgrade to Standard (free) to access detailed attendee contact information and communication tools."
                targetTier="STANDARD"
                variant="banner"
                dismissible={true}
              />
            )}

            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">Attendees Management</h3>
                  {!subscriptionLoading && subscription && (
                    <SubscriptionTierBadge tier={subscription.tier} size="sm" />
                  )}
                </div>
                {/* Data Access Summary */}
                {!subscriptionLoading && subscription && (
                  <p className="text-sm text-muted-foreground">
                    {subscription.tier === 'BASIC' 
                      ? `Viewing summary data only. Upgrade to Standard to see attendee details.`
                      : `Viewing ${apiData.attendees.length} attendee${apiData.attendees.length !== 1 ? 's' : ''} with your ${subscription.tier.charAt(0) + subscription.tier.slice(1).toLowerCase()} subscription.`
                    }
                  </p>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {attendeesStartIndex + 1}-{Math.min(attendeesEndIndex, apiData.attendees.length)} of {apiData.attendees.length}
                </div>
                <Select value={attendeesLimit.toString()} onValueChange={(value) => {
                  setAttendeesLimit(parseInt(value, 10));
                  setAttendeesPage(1);
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
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={subscription?.tier === 'BASIC'}
                  onClick={() => {
                    if (subscription?.tier !== 'BASIC') {
                      // Export logic here
                      toast({
                        title: "Export started",
                        description: "Your attendee data is being exported.",
                      });
                    }
                  }}
                >
                  {subscription?.tier === 'BASIC' && <Lock className="w-4 h-4 mr-2" />}
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
                  <div className="space-y-2">
                    {apiData.attendees.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No attendees registered yet</p>
                    ) : (
                      paginatedAttendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => { setSelectedAttendee(attendee); setAttendeeSheetOpen(true); }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">
                                {(attendee.name || attendee.email || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{attendee.name || '—'}</p>
                              <p className="text-sm text-muted-foreground">{attendee.email}</p>
                              {hasPaymentDetailsAccess && attendee.totalAmount && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  ${Number(attendee.totalAmount).toFixed(2)} · {attendee.paymentStatus || 'N/A'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="hidden sm:flex">{attendee.ticketType}</Badge>
                            <Badge className={getStatusColor(attendee.status || 'pending')}>
                              {attendee.status || 'pending'}
                            </Badge>
                            <Eye className="w-4 h-4 text-muted-foreground/60" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {attendeesTotalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={attendeesPage}
                        totalPages={attendeesTotalPages}
                        onPageChange={(newPage) => {
                          setAttendeesPage(newPage);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Attendee Detail Sheet */}
            <Sheet open={attendeeSheetOpen} onOpenChange={setAttendeeSheetOpen}>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle>Attendee Details</SheetTitle>
                  <SheetDescription>Registration information and ticket summary</SheetDescription>
                </SheetHeader>
                {selectedAttendee && (
                  <div className="space-y-6">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {(selectedAttendee.name || selectedAttendee.email || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-semibold">{selectedAttendee.name || '—'}</p>
                        <p className="text-sm text-muted-foreground">{selectedAttendee.email}</p>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="space-y-3">
                      {[
                        { label: 'Ticket Type', value: selectedAttendee.ticketType },
                        { label: 'Registration Status', value: selectedAttendee.status || 'pending' },
                        ...(hasPaymentDetailsAccess ? [
                          { label: 'Amount Paid', value: selectedAttendee.totalAmount ? `$${Number(selectedAttendee.totalAmount).toFixed(2)}` : '—' },
                          { label: 'Payment Status', value: selectedAttendee.paymentStatus || '—' },
                          { label: 'Payment Method', value: selectedAttendee.paymentMethod || '—' },
                        ] : []),
                        { label: 'Registered', value: selectedAttendee.createdAt ? new Date(selectedAttendee.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="text-sm font-medium text-right max-w-[55%] capitalize">{value}</span>
                        </div>
                      ))}
                    </div>

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
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-lg font-semibold">{(apiData.speakers as Speaker[]).filter((s) => s.status === 'confirmed').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                      <p className="text-lg font-semibold">{(apiData.speakers as Speaker[]).reduce((sum: number, s) => sum + (s.sessions || 0), 0)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-primary" />
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
                    <p className="text-center text-muted-foreground py-8">No speakers added yet</p>
                  ) : (
                    (apiData.speakers as Speaker[]).map((speaker) => (
                      <div key={speaker.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
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
                          <Badge className={getStatusColor(speaker.status || 'pending')}>
                            {speaker.status || 'pending'}
                          </Badge>
                          <Button variant="outline" size="sm">Manage</Button>
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
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-lg font-semibold">${(apiData.sponsors as unknown as Sponsor[]).reduce((sum: number, s) => sum + (s.amount || 0), 0).toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gold Sponsors</p>
                      <p className="text-lg font-semibold">{(apiData.sponsors as unknown as Sponsor[]).filter((s) => s.level?.includes('Gold') || s.name?.includes('Gold')).length}</p>
                    </div>
                    <Star className="w-8 h-8 text-muted-foreground" />
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
                    <p className="text-center text-muted-foreground py-8">No sponsors added yet</p>
                  ) : (
                    (apiData.sponsors as unknown as Sponsor[]).map((sponsor, idx: number) => {
                      // Transform API sponsor format to display format
                      const displaySponsor = {
                        id: idx + 1,
                        name: sponsor.level || 'Sponsor',
                        company: sponsor.name || 'Company',
                        amount: 0, // Not available in API
                        benefits: [],
                      };
                      return (
                    <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {displaySponsor.company.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{displaySponsor.company}</p>
                          <p className="text-sm text-muted-foreground">{displaySponsor.name}</p>
                          <p className="text-xs text-muted-foreground">${displaySponsor.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{displaySponsor.name}</Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "analytics":
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
                          ? `$${totalRevenue.toLocaleString()}`
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
                      <p className="text-sm text-muted-foreground">Ticket Sales</p>
                      <p className="text-lg font-semibold">
                        {hasPaymentDetailsAccess
                          ? `$${(totalRevenue * 0.7).toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Platform Fee</p>
                      <p className="text-lg font-semibold">
                        {hasPaymentDetailsAccess
                          ? `$${(totalRevenue * 0.3).toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-lg font-semibold">{eventData.capacity && eventData.capacity > 0 
                        ? ((totalAttendees / eventData.capacity) * 100).toFixed(1)
                        : 0}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            {hasPaymentDetailsAccess && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Total Revenue</p>
                        <p className="text-sm text-muted-foreground">From all ticket sales</p>
                      </div>
                      <p className="font-bold text-success">${totalRevenue.toLocaleString()}</p>
                    </div>
                    {apiData.sponsors.length > 0 && (
                      <div className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Sponsorships</p>
                          <p className="text-sm text-muted-foreground">{apiData.sponsors.length} sponsor{apiData.sponsors.length !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-bold">
                          ${(apiData.sponsors as unknown as Sponsor[]).reduce((sum: number, s) => sum + (s.amount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Registration Trend Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Registration trend chart coming soon</p>
                  </div>
                </div>
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

      case "overview":
      default:
        return (
          <div className="space-y-6">
            {/* Key Metrics - Cleaner presentation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Attendees</p>
                      <p className="text-2xl font-bold text-primary mt-1">{apiData.attendees.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">of {eventData.capacity || '∞'}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-success">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Revenue</p>
                      <p className="text-2xl font-bold text-success mt-1">
                        ${hasPaymentDetailsAccess
                          ? (apiData.attendees.reduce((sum: number, a) => sum + (Number(a.totalAmount) || 0), 0)).toLocaleString()
                          : '---'}
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-success/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Fill Rate</p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {eventData.capacity && eventData.capacity > 0
                          ? ((apiData.attendees.length / eventData.capacity) * 100).toFixed(0)
                          : 0}%
                      </p>
                    </div>
                    <Target className="w-10 h-10 text-primary/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Pending</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingAttendees}</p>
                      <p className="text-xs text-muted-foreground mt-1">registrations</p>
                    </div>
                    <Clock className="w-10 h-10 text-amber-600/60 dark:text-amber-400/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Actions Alert */}
            {(pendingAttendees > 0 || (refunds.length > 0 && refunds.filter(r => r.status === 'pending').length > 0)) && (
              <Alert className="border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Pending Actions</p>
                    {pendingAttendees > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          {pendingAttendees} registration{pendingAttendees !== 1 ? 's' : ''} need{pendingAttendees === 1 ? 's' : ''} confirmation
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => setActiveSection('attendees')}
                        >
                          Review
                        </Button>
                      </div>
                    )}
                    {refunds.filter(r => r.status === 'pending').length > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          {refunds.filter(r => r.status === 'pending').length} refund request{refunds.filter(r => r.status === 'pending').length !== 1 ? 's' : ''} waiting for review
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => setActiveSection('refunds')}
                        >
                          Review
                        </Button>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Mic className="w-8 h-8 text-muted-foreground/60" />
                    <div>
                      <p className="text-sm text-muted-foreground">Speakers</p>
                      <p className="text-xl font-semibold">{apiData.speakers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-success/60" />
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-xl font-semibold">{confirmedAttendees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Star className="w-8 h-8 text-muted-foreground/60" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sponsors</p>
                      <p className="text-xl font-semibold">{apiData.sponsors.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {apiData.attendees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiData.attendees.slice(0, 5).map((attendee, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attendee.name} registered</p>
                          <p className="text-xs text-muted-foreground">{attendee.ticketType}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {attendee.registeredDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consent Statistics Section */}
            {!subscriptionLoading && eventId && (
              <ConsentStatisticsCard 
                eventId={eventId} 
                subscriptionTier={subscription?.tier}
              />
            )}
          </div>
        );

      case "communication":
        return (
          <EventCommunicationSection eventId={eventId || ""} eventTitle={eventData?.title || ""} />
        );

      case "refunds":
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <EventSeatMapManager eventId={eventId!} />
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
                    You can edit your event while it's pending. <a href="/organizer/dashboard" className="underline font-semibold">Go back to dashboard</a>
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
                <BackButton to="/organizer/dashboard" variant="ghost" size="sm" />
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
                  <DropdownMenuItem onClick={() => window.open(`/event/${eventId}`, '_blank')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Page
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
                    await navigator.clipboard.writeText(`${window.location.origin}/event/${eventId}`);
                    toast({
                      title: "Copied",
                      description: "Event link copied to clipboard",
                    });
                  } catch {
                    toast({
                      title: "Error",
                      description: "Failed to copy link",
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
                  } catch {
                    toast({
                      title: "Error",
                      description: "Failed to export event data",
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
                  await navigator.clipboard.writeText(`${window.location.origin}/event/${eventId}`);
                  toast({
                    title: "Copied",
                    description: "Event link copied to clipboard",
                  });
                } catch {
                  toast({
                    title: "Error",
                    description: "Failed to copy link",
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/event/${eventId}`, '_blank')}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                View Public
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              {eventData.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">About this event</h3>
                  <RichTextContent
                    content={eventData.description}
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
                      {eventData.ticketTypes.map((ticket, idx) => (
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

              {/* Speakers (if any) */}
              {apiData.speakers && apiData.speakers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Speakers</h3>
                  <div className="grid gap-2">
                    {apiData.speakers.slice(0, 5).map((speaker: Speaker, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {speaker.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{speaker.name}</p>
                          {speaker.title && <p className="text-xs text-muted-foreground">{speaker.title}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                  Close
                </Button>
                {eventData?.status?.toUpperCase() === 'APPROVED' && (
                  <Button onClick={() => {
                    setShowPreviewModal(false);
                    window.open(`/event/${eventId}`, '_blank');
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Page
                  </Button>
                )}
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
