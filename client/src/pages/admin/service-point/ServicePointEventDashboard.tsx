import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  Calendar,
  Users,
  QrCode,
  Printer,
  Monitor,
  History,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  Star,
  Activity,
  Zap,
  Settings,
  Gift,
  Utensils,
  Car,
  Shield,
  Download,
  Plus,
  Edit2,
  Trash2,
  DoorOpen,
  Coffee,
  ClipboardList,
  Award,
  Presentation,
  Camera,
  Upload,
  UserPlus,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import BackButton from "@/components/BackButton";
import { AttendeeImportDialog } from '@/components/attendee/AttendeeImportDialog';
import { AttendeeDetailModal } from '@/components/attendee/AttendeeDetailModal';
import { QuickRegisterDialog } from '@/components/attendee/QuickRegisterDialog';
import { getEvent, getEventAttendees, type EventAttendee, type EventStatistics, TicketStatus } from "../../../lib/workstation-api";
import { exportAttendees } from "@/lib/attendee-import-api";
import { getEventById, type EventData } from "../../../lib/event-api";
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  type EventSession,
  type CreateSessionRequest,
  SESSION_ICONS,
  SESSION_COLORS,
} from "../../../lib/session-api";
import { useToast } from "../../../hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";

const ServicePointEventDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/organizer') ? '/organizer' : '/admin';
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'sessions' | 'no-shows'>('overview');
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Sessions state
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [sessionFormData, setSessionFormData] = useState<CreateSessionRequest>({
    name: '',
    code: '',
    description: '',
    icon: 'shield',
    color: '#3b82f6',
    location: '',
    isActive: true,
    allowCheckIn: true,
    allowCheckOut: true,
  });
  const [sessionSaving, setSessionSaving] = useState(false);

  // Attendee import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  // Attendee detail modal state
  const [selectedAttendee, setSelectedAttendee] = useState<EventAttendee | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Quick register dialog state
  const [quickRegisterOpen, setQuickRegisterOpen] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // No-show report state
  const [noShowAttendees, setNoShowAttendees] = useState<EventAttendee[]>([]);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [noShowExporting, setNoShowExporting] = useState(false);

  // Emergency muster report state
  const [musterOpen, setMusterOpen] = useState(false);
  const [musterAttendees, setMusterAttendees] = useState<EventAttendee[]>([]);
  const [musterLoading, setMusterLoading] = useState(false);
  const [musterExporting, setMusterExporting] = useState(false);

  // Session icon mapping
  const getSessionIcon = (iconId: string | null): React.ElementType => {
    const iconMap: Record<string, React.ElementType> = {
      'shield': Shield,
      'door-open': DoorOpen,
      'utensils': Utensils,
      'coffee': Coffee,
      'gift': Gift,
      'star': Star,
      'car': Car,
      'clipboard': ClipboardList,
      'award': Award,
      'users': Users,
      'presentation': Presentation,
      'camera': Camera,
    };
    return iconMap[iconId || 'shield'] || Shield;
  };

  // Load event data and statistics
  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) {
        showErrorToast(toast, new Error("Event ID is required"), "Event ID is required");
        navigate(`${basePrefix}/event-day`);
        return;
      }

      try {
        setLoading(true);

        // Load event details
        const eventResponse = await getEventById(eventId);
        const event = eventResponse.success && eventResponse.data
          ? eventResponse.data.event
          : null;

        if (!event) {
          showErrorToast(toast, new Error("Event not found"), "Event not found");
          navigate(`${basePrefix}/event-day`);
          return;
        }

        setEventData(event);

        // Load workstation statistics
        const workstationResponse = await getEvent(eventId);
        if (workstationResponse.success && workstationResponse.data) {
          setStatistics(workstationResponse.data.statistics);
        }
      } catch (error) {
        console.error('Error loading event data:', error);
        showErrorToast(toast, error, "Failed to load event data");
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [basePrefix, eventId, navigate, toast]);

  // Refresh attendees function (for use after import)
  const refreshAttendees = async () => {
    if (!eventId) return;
    try {
      setAttendeesLoading(true);
      const response = await getEventAttendees(eventId, pagination.page, pagination.limit);
      if (response.success && response.data) {
        setAttendees(response.data.attendees);
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.attendees.length,
            totalPages: response.data.pagination.totalPages,
          });
        }
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setAttendeesLoading(false);
    }
  };

  // Open attendee detail modal
  const handleViewAttendee = (attendee: EventAttendee) => {
    setSelectedAttendee(attendee);
    setDetailModalOpen(true);
  };

  // Handle export attendees
  const handleExportAttendees = async () => {
    if (!eventId) return;
    try {
      setExporting(true);
      await exportAttendees(eventId);
      toast({
        title: "Export Complete",
        description: "Attendees CSV has been downloaded",
      });
    } catch (error) {
      console.error('Error exporting attendees:', error);
      showErrorToast(toast, error, "Failed to export attendees");
    } finally {
      setExporting(false);
    }
  };

  // Handle quick register success
  const handleQuickRegisterSuccess = () => {
    refreshAttendees();
    // Also refresh statistics
    if (eventId) {
      getEvent(eventId).then(response => {
        if (response.success && response.data) {
          setStatistics(response.data.statistics);
        }
      });
    }
  };

  // Load no-shows when no-shows tab is active
  useEffect(() => {
    const loadNoShows = async () => {
      if (!eventId || activeTab !== 'no-shows') return;
      try {
        setNoShowLoading(true);
        const response = await getEventAttendees(eventId, 1, 500);
        if (response.success && response.data) {
          setNoShowAttendees(response.data.attendees.filter(a => !a.checkedInAt));
        }
      } catch (error) {
        console.error('Error loading no-shows:', error);
        showErrorToast(toast, error, "Failed to load no-show report");
      } finally {
        setNoShowLoading(false);
      }
    };
    loadNoShows();
  }, [eventId, activeTab, toast]);

  // Export no-show report as CSV
  const handleExportNoShows = () => {
    if (noShowAttendees.length === 0) return;
    setNoShowExporting(true);
    try {
      const headers = ['Name', 'Email', 'Phone', 'Ticket Type', 'Ticket Status', 'Registered At'];
      const rows = noShowAttendees.map(a => [
        a.attendeeName,
        a.email,
        a.phoneNumber || '',
        a.ticketType || '',
        a.ticketStatus,
        new Date(a.registeredAt).toLocaleString(),
      ]);
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const eventSlug = eventData?.title?.replace(/\s+/g, '_').toLowerCase() || eventId;
      link.href = url;
      link.download = `no_shows_${eventSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: `${noShowAttendees.length} no-show records exported` });
    } finally {
      setNoShowExporting(false);
    }
  };

  // Load muster report (all currently inside)
  const handleOpenMuster = async () => {
    if (!eventId) return;
    setMusterOpen(true);
    setMusterLoading(true);
    try {
      const response = await getEventAttendees(eventId, 1, 500);
      if (response.success && response.data) {
        setMusterAttendees(response.data.attendees.filter(a => a.isCurrentlyInside));
      }
    } catch (error) {
      console.error('Error loading muster report:', error);
      showErrorToast(toast, error, "Failed to load muster report");
    } finally {
      setMusterLoading(false);
    }
  };

  const handleExportMuster = () => {
    if (musterAttendees.length === 0) return;
    setMusterExporting(true);
    try {
      const now = new Date();
      const headers = ['Name', 'Email', 'Phone', 'Ticket Type', 'Last Scanned Facility'];
      const rows = musterAttendees.map(a => [
        a.attendeeName,
        a.email,
        a.phoneNumber || '',
        a.ticketType || '',
        a.lastScanFacility || '',
      ]);
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const eventSlug = eventData?.title?.replace(/\s+/g, '_').toLowerCase() || eventId;
      link.href = url;
      link.download = `muster_${eventSlug}_${now.toISOString().slice(0, 16).replace(':', '-')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Muster Report Exported", description: `${musterAttendees.length} people currently inside` });
    } finally {
      setMusterExporting(false);
    }
  };

  // Load attendees when attendees tab is active
  useEffect(() => {
    const loadAttendees = async () => {
      if (!eventId || activeTab !== 'attendees') return;

      try {
        setAttendeesLoading(true);
        const response = await getEventAttendees(
          eventId,
          pagination.page,
          pagination.limit
        );

        if (response.success && response.data) {
          setAttendees(response.data.attendees);
          if (response.data.pagination) {
            setPagination({
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              total: response.data.attendees.length,
              totalPages: response.data.pagination.totalPages,
            });
          }
        }
      } catch (error) {
        console.error('Error loading attendees:', error);
        showErrorToast(toast, error, "Failed to load attendees");
      } finally {
        setAttendeesLoading(false);
      }
    };

    loadAttendees();
  }, [eventId, activeTab, pagination.page, pagination.limit, toast]);

  // Load sessions when sessions tab is active
  useEffect(() => {
    const loadSessions = async () => {
      if (!eventId || activeTab !== 'sessions') return;

      try {
        setSessionsLoading(true);
        const response = await getSessions(eventId, { includeStats: true });
        if (response.success && response.data) {
          setSessions(response.data);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        showErrorToast(toast, error, "Failed to load sessions");
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [eventId, activeTab, toast]);

  // Session management handlers
  const handleOpenSessionDialog = (session?: EventSession) => {
    if (session) {
      setEditingSession(session);
      setSessionFormData({
        name: session.name,
        code: session.code,
        description: session.description || '',
        icon: session.icon || 'shield',
        color: session.color || '#3b82f6',
        location: session.location || '',
        isActive: session.isActive,
        allowCheckIn: session.allowCheckIn,
        allowCheckOut: session.allowCheckOut,
      });
    } else {
      setEditingSession(null);
      setSessionFormData({
        name: '',
        code: '',
        description: '',
        icon: 'shield',
        color: '#3b82f6',
        location: '',
        isActive: true,
        allowCheckIn: true,
        allowCheckOut: true,
      });
    }
    setSessionDialogOpen(true);
  };

  const handleCloseSessionDialog = () => {
    setSessionDialogOpen(false);
    setEditingSession(null);
  };

  const handleSaveSession = async () => {
    if (!eventId || !sessionFormData.name || !sessionFormData.code) {
      showErrorToast(toast, new Error("Name and code are required"), "Name and code are required");
      return;
    }

    try {
      setSessionSaving(true);

      if (editingSession) {
        const response = await updateSession(eventId, editingSession.id, sessionFormData);
        if (response.success) {
          setSessions(prev =>
            prev.map(s => s.id === editingSession.id ? response.data : s)
          );
          toast({
            title: "Success",
            description: "Session updated successfully",
          });
        }
      } else {
        const response = await createSession(eventId, sessionFormData);
        if (response.success) {
          setSessions(prev => [...prev, response.data]);
          toast({
            title: "Success",
            description: "Session created successfully",
          });
        }
      }

      handleCloseSessionDialog();
    } catch (error) {
      console.error('Error saving session:', error);
      showErrorToast(toast, error, editingSession ? "Failed to update session" : "Failed to create session");
    } finally {
      setSessionSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!eventId || !deleteSessionId) return;

    try {
      setDeletingSession(true);
      const response = await deleteSession(eventId, deleteSessionId);
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== deleteSessionId));
        toast({
          title: "Success",
          description: "Session deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showErrorToast(toast, error, "Failed to delete session");
    } finally {
      setDeletingSession(false);
      setDeleteSessionId(null);
    }
  };

  // Determine event status
  const getEventStatus = (): 'upcoming' | 'ongoing' | 'completed' => {
    if (!eventData) return 'upcoming';

    const now = new Date();
    const startDate = new Date(eventData.startDate);
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

    if (endDate && now > endDate) {
      return 'completed';
    } else if (now >= startDate && (!endDate || now <= endDate)) {
      return 'ongoing';
    } else {
      return 'upcoming';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return "bg-primary/10 text-primary border-primary";
      case 'ongoing':
        return "bg-success/10 text-success border-success";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-3 h-3" />;
      case 'ongoing':
        return <Activity className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTicketStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.ACTIVE:
        return "bg-success/10 text-success border-success";
      case TicketStatus.DEACTIVATED:
        return "bg-destructive/10 text-destructive border-destructive";
      case TicketStatus.EXPIRED:
        return "bg-muted text-muted-foreground border-border";
      case TicketStatus.CANCELLED:
        return "bg-destructive/10 text-destructive border-destructive";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time range
  const formatTimeRange = () => {
    if (!eventData) return '';

    const startDate = new Date(eventData.startDate);
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
      return `${formatDate(eventData.startDate)} - ${eventData.endDate ? formatDate(eventData.endDate) : 'Ongoing'}`;
    } else {
      return formatDate(eventData.startDate);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading event data...</span>
        </div>
    );
  }

  if (!eventData) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Event not found</div>
        </div>
    );
  }

  const status = getEventStatus();
  const imageUrl = eventData.image || eventData.images?.[0] || '/placeholder-event.jpg';
  const organizerName = eventData.organizer?.organizationName || eventData.organizer?.firstName || 'Unknown';

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <BackButton to={`${basePrefix}/event-day`} label="Back to Events" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{eventData.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm truncate">{organizerName} • {formatTimeRange()} • {eventData.location}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <Button
              onClick={() => navigate(`${basePrefix}/event-day/scanner?event=${eventId}`)}
              className="bg-primary hover:bg-primary/90"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Scanner
            </Button>
            <Button
              onClick={() => navigate(`${basePrefix}/event-day/print?event=${eventId}`)}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Center
            </Button>
          </div>
        </div>

        {/* Event Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={imageUrl}
                  alt={eventData.title}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getStatusColor(status)} border-0`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </div>
                    </Badge>
                    {eventData.category && (
                      <Badge variant="secondary">{eventData.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeRange()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{eventData.location}</span>
                    </div>
                    {eventData.venue && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{eventData.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Attendees</p>
                <p className="font-semibold text-foreground">
                  {statistics?.totalAttendees || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Checked In: {statistics?.checkedIn || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`${basePrefix}/event-day/dashboard/${eventId}`)}
              >
                <Activity className="w-6 h-6 text-green-600" />
                <span>Live Dashboard</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`${basePrefix}/event-day/scanner?event=${eventId}`)}
              >
                <QrCode className="w-6 h-6" />
                <span>QR Scanner</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`${basePrefix}/event-day/print?event=${eventId}`)}
              >
                <Printer className="w-6 h-6" />
                <span>Print Center</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`${basePrefix}/event-day/event/${eventId}/templates`)}
              >
                <Settings className="w-6 h-6" />
                <span>Templates</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`${basePrefix}/event-day/history?event=${eventId}`)}
              >
                <History className="w-6 h-6" />
                <span>Scan History</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`${basePrefix}/event-day/zones/${eventId}`)}
              >
                <MapPin className="w-6 h-6" />
                <span>Facility Zones</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`${basePrefix}/event-day/event/${eventId}/walk-in`)}
              >
                <UserPlus className="w-6 h-6 text-primary" />
                <span>Walk-In Reg.</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 border-destructive/50 hover:bg-destructive/5"
                onClick={handleOpenMuster}
              >
                <Shield className="w-6 h-6 text-destructive" />
                <span className="text-destructive font-medium">Muster Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="whitespace-nowrap"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'attendees' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('attendees')}
          >
            <Users className="w-4 h-4 mr-2" />
            Attendees
          </Button>
          <Button
            variant={activeTab === 'sessions' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('sessions')}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Sessions
          </Button>
          <Button
            variant={activeTab === 'no-shows' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('no-shows')}
          >
            <Clock className="w-4 h-4 mr-2" />
            No-Shows
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                    <p className="font-semibold text-foreground">{statistics?.totalAttendees || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Checked In</p>
                    <p className="font-semibold text-foreground">{statistics?.checkedIn || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Currently Inside</p>
                    <p className="font-semibold text-foreground">{statistics?.currentlyInside || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scans Today</p>
                    <p className="font-semibold text-foreground">{statistics?.scansToday || 0}</p>
                  </div>
                  <QrCode className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'attendees' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Attendees Management
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setQuickRegisterOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attendee
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportAttendees}
                    disabled={exporting || attendees.length === 0}
                  >
                    {exporting ? (
                      <Loader size="sm" className="mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendeesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader />
                  <span className="ml-2 text-muted-foreground">Loading attendees...</span>
                </div>
              ) : attendees.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">No attendees found</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendees.map((attendee) => (
                    <div
                      key={attendee.registrationId}
                      className="flex items-center justify-between p-4 border border-border/40 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewAttendee(attendee)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {attendee.attendeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{attendee.attendeeName}</h4>
                          <p className="text-sm text-muted-foreground">{attendee.email}</p>
                          {attendee.phoneNumber && (
                            <p className="text-sm text-muted-foreground">{attendee.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`text-xs ${getTicketStatusColor(attendee.ticketStatus)}`}>
                          {attendee.ticketStatus}
                        </Badge>
                        {attendee.ticketType && (
                          <Badge variant="outline" className="text-xs">
                            {attendee.ticketType}
                          </Badge>
                        )}
                        {attendee.isCurrentlyInside && (
                          <Badge variant="secondary" className="text-xs">
                            Inside
                          </Badge>
                        )}
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">
                            Registered: {new Date(attendee.registeredAt).toLocaleDateString()}
                          </div>
                          <div className={attendee.checkedInAt ? 'text-success' : 'text-muted-foreground'}>
                            {attendee.checkedInAt
                              ? `Checked in: ${new Date(attendee.checkedInAt).toLocaleTimeString()}`
                              : 'Not checked in'
                            }
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAttendee(attendee);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} attendees
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === 1}
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'sessions' && (
          <>
            {/* Sessions Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">{sessions.length}</div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {sessions.filter(s => s.isActive).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {sessions.reduce((sum, s) => sum + (s.stats?.totalScans || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Scans</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {sessions.reduce((sum, s) => sum + (s.stats?.uniqueAttendees || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Unique Attendees</p>
                </CardContent>
              </Card>
            </div>

            {/* Sessions List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Sessions Management
                  </div>
                  <Button onClick={() => handleOpenSessionDialog()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader size="lg" />
                    <span className="ml-2 text-muted-foreground">Loading sessions...</span>
                  </div>
                ) : sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const SessionIcon = getSessionIcon(session.icon);
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${session.color || '#3b82f6'}20` }}
                            >
                              <SessionIcon
                                className="h-6 w-6"
                                style={{ color: session.color || '#3b82f6' }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">{session.name}</h4>
                                <Badge variant="outline" className="text-xs">{session.code}</Badge>
                                {!session.isActive && (
                                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                )}
                              </div>
                              {session.description && (
                                <p className="text-sm text-muted-foreground">{session.description}</p>
                              )}
                              {session.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {session.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-foreground">
                                {session.stats?.totalScans || 0} scans
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.stats?.uniqueAttendees || 0} unique
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {session.allowCheckIn && (
                                <Badge variant="outline" className="text-xs bg-success/5 text-success border-success">IN</Badge>
                              )}
                              {session.allowCheckOut && (
                                <Badge variant="outline" className="text-xs bg-destructive/5 text-destructive border-destructive">OUT</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenSessionDialog(session)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive/5"
                                onClick={() => setDeleteSessionId(session.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create sessions to define check-in points for this event
                    </p>
                    <Button onClick={() => handleOpenSessionDialog()} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'no-shows' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  No-Show Report
                  {!noShowLoading && (
                    <Badge variant="secondary" className="ml-3">
                      {noShowAttendees.length} attendee{noShowAttendees.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportNoShows}
                  disabled={noShowExporting || noShowAttendees.length === 0 || noShowLoading}
                >
                  {noShowExporting ? (
                    <Loader size="sm" className="mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {noShowLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader />
                  <span className="ml-2 text-muted-foreground">Loading no-show report...</span>
                </div>
              ) : noShowAttendees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <CheckCircle className="w-8 h-8 text-success" />
                  <p className="text-muted-foreground font-medium">All registered attendees have checked in!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    These attendees registered but have not yet checked in.
                  </p>
                  {noShowAttendees.map((attendee) => (
                    <div
                      key={attendee.registrationId}
                      className="flex items-center justify-between p-4 border border-border/40 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-destructive">
                            {attendee.attendeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{attendee.attendeeName}</h4>
                          <p className="text-sm text-muted-foreground">{attendee.email}</p>
                          {attendee.phoneNumber && (
                            <p className="text-sm text-muted-foreground">{attendee.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {attendee.ticketType && (
                          <Badge variant="outline" className="text-xs">
                            {attendee.ticketType}
                          </Badge>
                        )}
                        <div className="text-right text-xs text-muted-foreground">
                          <div>Registered: {new Date(attendee.registeredAt).toLocaleDateString()}</div>
                          <div className="text-destructive font-medium">Not checked in</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Session Create/Edit Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Edit Session' : 'Add New Session'}</DialogTitle>
            <DialogDescription>
              {editingSession
                ? 'Update the session details below.'
                : 'Create a new check-in point or service location for this event.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Name *</Label>
                <Input
                  id="session-name"
                  value={sessionFormData.name}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, name: e.target.value })}
                  placeholder="e.g., Main Entrance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-code">Code *</Label>
                <Input
                  id="session-code"
                  value={sessionFormData.code}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., ENT"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-description">Description</Label>
              <Textarea
                id="session-description"
                value={sessionFormData.description}
                onChange={(e) => setSessionFormData({ ...sessionFormData, description: e.target.value })}
                placeholder="Optional description of this session"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-location">Location</Label>
              <Input
                id="session-location"
                value={sessionFormData.location}
                onChange={(e) => setSessionFormData({ ...sessionFormData, location: e.target.value })}
                placeholder="e.g., Building A, Ground Floor"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {SESSION_ICONS.map((iconOption) => {
                  const IconComponent = getSessionIcon(iconOption.id);
                  return (
                    <button
                      key={iconOption.id}
                      type="button"
                      onClick={() => setSessionFormData({ ...sessionFormData, icon: iconOption.id })}
                      className={`p-2 rounded-lg border transition-colors ${
                        sessionFormData.icon === iconOption.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      title={iconOption.label}
                    >
                      <IconComponent className="h-5 w-5 mx-auto" style={{ color: sessionFormData.color }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {SESSION_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.id}
                    type="button"
                    onClick={() => setSessionFormData({ ...sessionFormData, color: colorOption.id })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      sessionFormData.color === colorOption.id
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: colorOption.id }}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="session-active" className="text-sm">Active</Label>
                <Switch
                  id="session-active"
                  checked={sessionFormData.isActive}
                  onCheckedChange={(checked) => setSessionFormData({ ...sessionFormData, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="session-checkin" className="text-sm">Check-In</Label>
                <Switch
                  id="session-checkin"
                  checked={sessionFormData.allowCheckIn}
                  onCheckedChange={(checked) => setSessionFormData({ ...sessionFormData, allowCheckIn: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="session-checkout" className="text-sm">Check-Out</Label>
                <Switch
                  id="session-checkout"
                  checked={sessionFormData.allowCheckOut}
                  onCheckedChange={(checked) => setSessionFormData({ ...sessionFormData, allowCheckOut: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSessionDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveSession} disabled={sessionSaving}>
              {sessionSaving ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                editingSession ? 'Update Session' : 'Create Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Session Confirmation */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
              Any scan history associated with this session will be preserved but the session reference will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={deletingSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSession ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendee Import Dialog */}
      {eventId && (
        <AttendeeImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          eventId={eventId}
          onImportComplete={() => {
            refreshAttendees();
            toast({
              title: "Import Complete",
              description: "Attendees have been imported successfully",
            });
          }}
        />
      )}

      {/* Attendee Detail Modal */}
      <AttendeeDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        attendee={selectedAttendee}
        registrationFields={eventData?.registrationFields}
      />

      {/* Quick Register Dialog */}
      {eventId && (
        <QuickRegisterDialog
          open={quickRegisterOpen}
          onOpenChange={setQuickRegisterOpen}
          eventId={eventId}
          event={eventData}
          onSuccess={handleQuickRegisterSuccess}
        />
      )}

      {/* Emergency Muster Report Dialog */}
      <Dialog open={musterOpen} onOpenChange={setMusterOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              Emergency Muster Report
            </DialogTitle>
            <DialogDescription>
              People currently inside the venue as of {new Date().toLocaleTimeString()}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {musterLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader />
                <span className="ml-2 text-muted-foreground">Generating muster report...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                  <div>
                    <p className="font-semibold text-foreground text-lg">{musterAttendees.length}</p>
                    <p className="text-sm text-muted-foreground">People currently inside</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportMuster}
                    disabled={musterExporting || musterAttendees.length === 0}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    {musterExporting ? (
                      <Loader size="sm" className="mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export CSV
                  </Button>
                </div>
                {musterAttendees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground">
                    <Activity className="w-8 h-8" />
                    <p>No attendees are currently inside</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {musterAttendees.map((attendee) => (
                      <div
                        key={attendee.registrationId}
                        className="flex items-center justify-between p-3 border border-border/40 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                            {attendee.attendeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{attendee.attendeeName}</p>
                            <p className="text-xs text-muted-foreground">{attendee.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {attendee.ticketType && (
                            <Badge variant="outline" className="text-xs mb-1">
                              {attendee.ticketType}
                            </Badge>
                          )}
                          {attendee.lastScanFacility && (
                            <p className="text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {attendee.lastScanFacility}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMusterOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServicePointEventDashboard;
