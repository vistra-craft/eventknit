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
  ArrowLeft,
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
  Loader2,
  AlertCircle,
  Mail,
  Plus,
  XCircle,
  Lock,
  Filter,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Pagination } from "../../components/ui/pagination";
import { getOrganizerEventById, getEventRegistrations, cancelEvent, getSubscription, type OrganizerSubscription } from "../../lib/organizer-api";
import { transformEventData } from "../../lib/event-utils";
import type { EventData } from "../../types/event";
import { shareEvent } from "../../lib/utils/share";
import { exportEventData } from "../../lib/utils/export";
import { useToast } from "../../hooks/use-toast";
import { OrganizerEventStaffAssignment } from "../../components/OrganizerEventStaffAssignment";
import { sendToEventRegistrations, getCommunicationHistory } from "../../lib/organizer-dashboard-api";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ConsentStatisticsCard } from "../../components/organizer/ConsentStatisticsCard";
import { SubscriptionTierBadge } from "../../components/organizer/SubscriptionTierBadge";
import { UpgradePrompt } from "../../components/organizer/UpgradePrompt";

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
    } catch (error) {
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                          <span className="flex items-center gap-1 text-red-600">
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
        
        if (subscriptionResponse.success && subscriptionResponse.data) {
          setSubscription(subscriptionResponse.data.subscription);
        }
      } catch (err: unknown) {
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
    { key: "communication", label: "Communication", icon: MessageSquare },
    { key: "speakers", label: "Speakers", icon: Mic },
    { key: "sponsors", label: "Sponsors", icon: Star },
    { key: "revenue", label: "Revenue", icon: DollarSign },
    { key: "staff", label: "Assigned Staff", icon: UserPlus },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
                    <CheckCircle className="w-8 h-8 text-green-600" />
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
                    {apiData.attendees.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No attendees registered yet</p>
                    ) : (
                      paginatedAttendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {(attendee.name || attendee.email || 'U').split(' ').map((n: string) => n[0]).join('')}
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
                            <Badge className={getStatusColor(attendee.status || 'pending')}>
                              {attendee.status || 'pending'}
                            </Badge>
                            <Button variant="outline" size="sm">View Details</Button>
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
                    <CheckCircle className="w-8 h-8 text-green-600" />
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
                  {apiData.speakers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No speakers added yet</p>
                  ) : (
                    (apiData.speakers as Speaker[]).map((speaker) => (
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
                    <DollarSign className="w-8 h-8 text-green-600" />
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
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <p className="text-lg font-semibold">
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
                      <p className="text-lg font-semibold">
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
                      <p className="text-lg font-semibold">
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
                      <p className="text-lg font-semibold">{eventData.capacity && eventData.capacity > 0 
                        ? ((totalAttendees / eventData.capacity) * 100).toFixed(1)
                        : 0}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {hasPaymentDetailsAccess && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Total Revenue</p>
                        <p className="text-sm text-muted-foreground">From all ticket sales</p>
                      </div>
                      <p className="font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
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
          </div>
        );

      case "overview":
      default:
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
                  </div>
                </div>
              </div>

              {/* Event Details - Right Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Header */}
                <div>
                  <h1 className="text-lg font-semibold text-foreground mb-2">
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
                          <p className="text-lg font-semibold text-primary">{apiData.attendees.length}</p>
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
                          <p className="text-lg font-semibold text-blue-600">{apiData.speakers.length}</p>
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
                          <p className="text-lg font-semibold text-green-600">
                            ${hasPaymentDetailsAccess 
                              ? (apiData.attendees.reduce((sum: number, a) => sum + (Number(a.totalAmount) || 0), 0)).toLocaleString()
                              : 'N/A'}
                          </p>
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
                          <p className="text-lg font-semibold text-purple-600">
                            {eventData.capacity && eventData.capacity > 0 
                              ? ((apiData.attendees.length / eventData.capacity) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-purple-500/60" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Additional Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Sponsors</p>
                          <p className="text-lg font-semibold">{apiData.sponsors.length}</p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500/60" />
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
                        <CheckCircle className="w-8 h-8 text-green-500/60" />
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
                        <Clock className="w-8 h-8 text-yellow-500/60" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </div>

            {/* Consent Statistics Section */}
            {!subscriptionLoading && eventId && (
              <div className="mt-8">
                <ConsentStatisticsCard 
                  eventId={eventId} 
                  subscriptionTier={subscription?.tier}
                />
              </div>
            )}

          </div>
        );

      case "communication":
        return (
          <EventCommunicationSection eventId={eventId || ""} eventTitle={eventData?.title || ""} />
        );

      case "staff":
        return (
          <div className="space-y-6">
            {eventId && (
              <OrganizerEventStaffAssignment
                eventId={eventId}
                eventTitle={eventData?.title}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header with Event Image and Info */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
        {/* Background Image */}
        {eventData?.image && (
          <div className="absolute inset-0">
            <img 
              src={eventData.image} 
              alt={eventData.title}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
          </div>
        )}
        
        <div className="relative p-6 md:p-8">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/organizer/dashboard')}
              className="self-start"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreHorizontal className="w-4 h-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowPreviewModal(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/event/${eventId}`, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Page
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/organizer/events/create?edit=${eventId}`)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Event Details
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

          {/* Event Title and Status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {eventData?.title || 'Event Management'}
                </h1>
                {eventData?.status && (
                  <Badge className={`${getStatusColor(eventData.status)} border font-medium`}>
                    {getStatusLabel(eventData.status)}
                  </Badge>
                )}
              </div>
              {eventData?.category && (
                <Badge variant="secondary" className="mb-3">
                  {eventData.category}
                </Badge>
              )}
              {eventData?.description && (
                <p className="text-muted-foreground line-clamp-2 mt-2">
                  {eventData.description}
                </p>
              )}
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {eventData?.date && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{eventData.date}</p>
                  {eventData.time && (
                    <p className="text-xs text-muted-foreground">{eventData.time}</p>
                  )}
                </div>
              </div>
            )}
            {(eventData?.venue || eventData?.location) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium line-clamp-1">
                    {eventData.venue || eventData.location}
                  </p>
                  {eventData.venue && eventData.location && eventData.venue !== eventData.location && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{eventData.location}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attendees</p>
                <p className="text-sm font-medium">
                  {apiData.attendees.length} / {eventData?.capacity || '∞'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {eventData?.capacity && eventData.capacity > 0 
                    ? `${((apiData.attendees.length / eventData.capacity) * 100).toFixed(0)}% full`
                    : 'Unlimited'}
                </p>
              </div>
            </div>
            {hasPaymentDetailsAccess && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-sm font-medium">
                    ${(apiData.attendees.reduce((sum: number, a) => sum + (Number(a.totalAmount) || 0), 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div>
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
                    <h2 className="text-lg font-semibold mb-2">{eventData.title}</h2>
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
                  <h2 className="text-lg font-semibold mb-2">{eventData.title}</h2>
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
                      <p className="font-medium">{String(eventData.venue ?? eventData.location ?? '')}</p>
                      {eventData.venue && eventData.location && (
                        <p className="text-sm text-muted-foreground">{String(eventData.location ?? '')}</p>
                      )}
                    </div>
                  </div>
                )}
                {totalAttendees !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {totalAttendees} / {(eventData.capacity as number | undefined) || '∞'} registered
                    </p>
                  </div>
                )}
                {eventData.price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{String(eventData.price ?? '')}</p>
                  </div>
                )}
              </div>

              {eventData.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{String(eventData.description ?? '')}</p>
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
