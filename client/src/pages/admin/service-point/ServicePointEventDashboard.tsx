import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Loader2,
  DoorOpen,
  Coffee,
  ClipboardList,
  Award,
  Presentation,
  Camera,
  Upload,
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import BackButton from "@/components/BackButton";
import { AttendeeImportDialog } from "@/components/AttendeeImportDialog";
import { AttendeeDetailModal } from "@/components/AttendeeDetailModal";
import { QuickRegisterDialog } from "@/components/QuickRegisterDialog";
import { getEvent, getEventAttendees, type EventAttendee, type EventStatistics, TicketStatus } from "../../../lib/workstation-api";
import { exportAttendees } from "@/lib/attendee-import-api";
import { getEvents, type EventData } from "../../../lib/event-api";
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
import { useToast } from "../../../hooks/use-toast";

const ServicePointEventDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'sessions'>('overview');
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
        toast({
          title: "Error",
          description: "Event ID is required",
          variant: "destructive",
        });
        navigate('/admin/service-point');
        return;
      }

      try {
        setLoading(true);

        // Load event details from event API
        const eventsResponse = await getEvents({ limit: 1000 });
        const event = eventsResponse.success && eventsResponse.data
          ? eventsResponse.data.events.find(e => e.id === eventId)
          : null;

        if (!event) {
          toast({
            title: "Error",
            description: "Event not found",
            variant: "destructive",
          });
          navigate('/admin/service-point');
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
        toast({
          title: "Error",
          description: "Failed to load event data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, navigate, toast]);

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
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export attendees",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: "Failed to load attendees",
          variant: "destructive",
        });
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
        toast({
          title: "Error",
          description: "Failed to load sessions",
          variant: "destructive",
        });
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
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: editingSession ? "Failed to update session" : "Failed to create session",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'ongoing':
        return "bg-green-100 text-green-800 border-green-200";
      case 'completed':
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
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
        return "bg-green-100 text-green-800 border-green-200";
      case TicketStatus.DEACTIVATED:
        return "bg-red-100 text-red-800 border-red-200";
      case TicketStatus.EXPIRED:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
      case TicketStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading event data...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!eventData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Event not found</div>
        </div>
      </AdminLayout>
    );
  }

  const status = getEventStatus();
  const imageUrl = eventData.image || eventData.images?.[0] || '/placeholder-event.jpg';
  const organizerName = eventData.organizer?.organizationName || eventData.organizer?.firstName || 'Unknown';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to="/admin/service-point" label="Back to Events" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">{eventData.title}</h1>
            <p className="text-muted-foreground mt-2">{organizerName} • {formatTimeRange()} • {eventData.location}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(`/admin/service-point/scanner?event=${eventId}`)}
              className="bg-primary hover:bg-primary/90"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Scanner
            </Button>
            <Button
              onClick={() => navigate(`/admin/service-point/print?event=${eventId}`)}
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
                <p className="text-sm text-gray-500">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/service-point/scanner?event=${eventId}`)}
              >
                <QrCode className="w-6 h-6" />
                <span>QR Scanner</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/service-point/print?event=${eventId}`)}
              >
                <Printer className="w-6 h-6" />
                <span>Print Center</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/service-point/templates?event=${eventId}`)}
              >
                <Settings className="w-6 h-6" />
                <span>Templates</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/service-point/history?event=${eventId}`)}
              >
                <History className="w-6 h-6" />
                <span>Scan History</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
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
                  <CheckCircle className="h-8 w-8 text-green-600" />
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
                  <Activity className="h-8 w-8 text-blue-600" />
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
                            <p className="text-sm text-gray-500">{attendee.phoneNumber}</p>
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
                          <div className={attendee.checkedInAt ? 'text-green-600' : 'text-muted-foreground'}>
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
                  <p className="text-sm text-gray-600">Total Sessions</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {sessions.filter(s => s.isActive).length}
                  </div>
                  <p className="text-sm text-gray-600">Active</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {sessions.reduce((sum, s) => sum + (s.stats?.totalScans || 0), 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total Scans</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-base font-semibold text-primary mb-2">
                    {sessions.reduce((sum, s) => sum + (s.stats?.uniqueAttendees || 0), 0)}
                  </div>
                  <p className="text-sm text-gray-600">Unique Attendees</p>
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
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading sessions...</span>
                  </div>
                ) : sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const SessionIcon = getSessionIcon(session.icon);
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
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
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">IN</Badge>
                              )}
                              {session.allowCheckOut && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">OUT</Badge>
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
                                className="text-red-600 border-red-200 hover:bg-red-50"
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
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingSession ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
    </AdminLayout>
  );
};

export default ServicePointEventDashboard;
