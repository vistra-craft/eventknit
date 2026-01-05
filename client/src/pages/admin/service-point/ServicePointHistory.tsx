import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import {
  History,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Building2,
  Star,
  Gift,
  Utensils,
  Car,
  Shield,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import BackButton from "@/components/BackButton";
import { getEventScans, type TicketScanRecord, type ScanHistoryFilters, ScanType } from "../../../lib/workstation-api";
import { getEvents, type EventData } from "../../../lib/event-api";
import { useToast } from "../../../hooks/use-toast";

interface ScanStats {
  totalScans: number;
  approvedScans: number;
  rejectedScans: number;
  scansBySession: Record<string, number>;
  scansByHour: Record<string, number>;
  scansByDay: Record<string, number>;
  peakScanHour: string;
  reEntryCount: number;
  errorRate: number;
}

const ServicePointHistory: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedScanType, setSelectedScanType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<TicketScanRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<ScanStats>({
    totalScans: 0,
    approvedScans: 0,
    rejectedScans: 0,
    scansBySession: {},
    scansByHour: {},
    scansByDay: {},
    peakScanHour: '',
    reEntryCount: 0,
    errorRate: 0,
  });
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || searchParams.get('event') || '');

  // Load events for event selector
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await getEvents({ limit: 100 });
        if (response.success && response.data) {
          setEvents(response.data.events);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  // Load scans when filters change
  useEffect(() => {
    const loadScans = async () => {
      if (!selectedEventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const filters: ScanHistoryFilters = {
          page: pagination.page,
          limit: pagination.limit,
          session: selectedSession !== 'all' ? selectedSession : undefined,
          scanType: selectedScanType !== 'all' ? (selectedScanType as ScanType) : undefined,
        };

        // Apply date range filter
        if (selectedDate !== 'all') {
          const now = new Date();
          let startDate: Date;
          
          switch (selectedDate) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              filters.startDate = startDate.toISOString();
              break;
            case 'yesterday': {
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
              const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              filters.startDate = startDate.toISOString();
              filters.endDate = endDate.toISOString();
              break;
            }
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              filters.startDate = startDate.toISOString();
              break;
            case 'month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              filters.startDate = startDate.toISOString();
              break;
          }
        }

        const response = await getEventScans(selectedEventId, filters);
        
        if (response.success && response.data) {
          setScans(response.data.scans);
          if (response.data.pagination) {
            setPagination({
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              total: response.data.scans.length, // Use scans length as total
              totalPages: response.data.pagination.totalPages,
            });
          }
          
          // Calculate statistics
          calculateStats(response.data.scans);
        }
      } catch (error) {
        console.error('Error loading scans:', error);
        toast({
          title: "Error",
          description: "Failed to load scan history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadScans();
  }, [selectedEventId, selectedSession, selectedScanType, selectedDate, pagination.page, pagination.limit, toast]);

  const calculateStats = (scanData: TicketScanRecord[]) => {
    const totalScans = scanData.length;
    const approvedScans = scanData.filter(s => s.isValid).length;
    const rejectedScans = scanData.filter(s => !s.isValid).length;
    const reEntryCount = scanData.filter(s => s.isReEntry).length;
    
    const scansBySession: Record<string, number> = {};
    const scansByHour: Record<string, number> = {};
    const scansByDay: Record<string, number> = {};
    
    scanData.forEach(scan => {
      // Session stats
      const sess = scan.session || 'Unknown';
      scansBySession[sess] = (scansBySession[sess] || 0) + 1;
      
      // Hour stats
      const hour = new Date(scan.scannedAt).getHours();
      scansByHour[hour] = (scansByHour[hour] || 0) + 1;
      
      // Day stats
      const day = new Date(scan.scannedAt).toDateString();
      scansByDay[day] = (scansByDay[day] || 0) + 1;
    });

    // Find peak hour
    let peakHour = 0;
    let maxScans = 0;
    Object.entries(scansByHour).forEach(([hour, count]) => {
      if (count > maxScans) {
        maxScans = count;
        peakHour = parseInt(hour);
      }
    });

    const peakScanHour = `${peakHour < 10 ? '0' : ''}${peakHour}:00`;
    const errorRate = totalScans > 0 ? (rejectedScans / totalScans) * 100 : 0;

    setStats({
      totalScans,
      approvedScans,
      rejectedScans,
      scansBySession,
      scansByHour,
      scansByDay,
      peakScanHour,
      reEntryCount,
      errorRate,
    });
  };

  // Filter scans by search term and status
  const filteredScans = scans.filter(scan => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        scan.attendeeName.toLowerCase().includes(searchLower) ||
        scan.registrationId.toLowerCase().includes(searchLower) ||
        (scan.ticketType && scan.ticketType.toLowerCase().includes(searchLower))
      );
      if (!matchesSearch) return false;
    }
    
    // Status filter (frontend-only, since backend doesn't support it)
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'valid' && !scan.isValid) return false;
      if (selectedStatus === 'invalid' && scan.isValid) return false;
    }
    
    return true;
  });

  // Helper function to get session icon
  const getSessionIconFromName = React.useCallback((sessionName: string): React.ReactNode => {
    const name = sessionName.toLowerCase();
    if (name.includes('entrance')) return <Shield className="w-4 h-4" />;
    if (name.includes('lunch')) return <Utensils className="w-4 h-4" />;
    if (name.includes('gift')) return <Gift className="w-4 h-4" />;
    if (name.includes('vip')) return <Star className="w-4 h-4" />;
    if (name.includes('parking')) return <Car className="w-4 h-4" />;
    return <Building2 className="w-4 h-4" />;
  }, []);

  // Get unique sessions from scans
  const sessionsOptions = React.useMemo(() => {
    const sessionSet = new Set<string>();
    scans.forEach(scan => {
      if (scan.session) {
        sessionSet.add(scan.session);
      }
    });
    
    const sessionList = Array.from(sessionSet).map(sess => ({
      id: sess,
      name: sess,
      icon: getSessionIconFromName(sess),
    }));

    return [
      { id: "all", name: "All Sessions", icon: <Building2 className="w-4 h-4" /> },
      ...sessionList,
    ];
  }, [scans, getSessionIconFromName]);

  const getStatusColor = (isValid: boolean) => {
    return isValid 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid 
      ? <CheckCircle className="w-4 h-4" />
      : <XCircle className="w-4 h-4" />;
  };

  const getScanTypeColor = (scanType: ScanType) => {
    switch (scanType) {
      case ScanType.CHECK_IN:
        return "bg-blue-100 text-blue-800";
      case ScanType.CHECK_OUT:
        return "bg-purple-100 text-purple-800";
      case ScanType.MANUAL_CHECK_IN:
      case ScanType.MANUAL_CHECK_OUT:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const exportToCSV = () => {
    if (filteredScans.length === 0) {
      toast({
        title: "No Data",
        description: "No scans to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Scan ID',
      'Registration ID',
      'Attendee Name',
      'Ticket Type',
      'Scan Type',
      'Session',
      'Scanned At',
      'Scanned By',
      'Valid',
      'Is Re-Entry',
      'Error Message',
    ];

    const rows = filteredScans.map(scan => [
      scan.id,
      scan.registrationId,
      scan.attendeeName,
      scan.ticketType || '',
      scan.scanType,
      scan.session || '',
      new Date(scan.scannedAt).toISOString(),
      scan.scannedBy,
      scan.isValid ? 'Yes' : 'No',
      scan.isReEntry ? 'Yes' : 'No',
      '', // errorMessage not in TicketScanRecord type
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scan-history-${selectedEventId || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Scan history exported to CSV",
    });
  };

  const dates = [
    { id: "all", name: "All Time" },
    { id: "today", name: "Today" },
    { id: "yesterday", name: "Yesterday" },
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" }
  ];

  const scanTypes = [
    { id: "all", name: "All Types" },
    { id: "CHECK_IN" as ScanType, name: "Check In" },
    { id: "CHECK_OUT" as ScanType, name: "Check Out" },
    { id: "MANUAL_CHECK_IN" as ScanType, name: "Manual Check In" },
    { id: "MANUAL_CHECK_OUT" as ScanType, name: "Manual Check Out" },
  ];

  const statuses = [
    { id: "all", name: "All Status" },
    { id: "valid", name: "Valid" },
    { id: "invalid", name: "Invalid" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to="/admin/service-point" label="Back" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Scan History</h1>
            <p className="text-muted-foreground mt-2">View and analyze all QR code scans</p>
          </div>
        </div>

        {/* Event Selector */}
        {!eventId && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Select Event:</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="px-3 py-2 border border-border rounded-md text-sm flex-1 max-w-md"
                >
                  <option value="">-- Select an event --</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedEventId && !eventId && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Please select an event to view scan history</p>
            </CardContent>
          </Card>
        )}

        {selectedEventId && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                      <p className="font-semibold text-foreground">{stats.totalScans}</p>
                    </div>
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valid Scans</p>
                      <p className="font-semibold text-green-600">{stats.approvedScans}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Invalid Scans</p>
                      <p className="font-semibold text-red-600">{stats.rejectedScans}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className="font-semibold text-foreground">
                        {stats.totalScans > 0 ? Math.round((stats.approvedScans / stats.totalScans) * 100) : 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by attendee name, registration ID, or ticket type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md text-sm"
                    >
                      {sessionsOptions.map(sess => (
                        <option key={sess.id} value={sess.id}>{sess.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md text-sm"
                    >
                      {statuses.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedScanType}
                      onChange={(e) => setSelectedScanType(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md text-sm"
                    >
                      {scanTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md text-sm"
                    >
                      {dates.map(date => (
                        <option key={date.id} value={date.id}>{date.name}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode(viewMode === 'list' ? 'stats' : 'list')}
                    >
                      {viewMode === 'list' ? <BarChart3 className="w-4 h-4" /> : <History className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" onClick={exportToCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">Loading scan history...</div>
                </CardContent>
              </Card>
            ) : viewMode === 'list' ? (
              /* Scan History List */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <History className="w-5 h-5 mr-2" />
                      Scan History ({filteredScans.length} of {pagination.total})
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setPagination({ ...pagination, page: 1 });
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredScans.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No scans found</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {filteredScans.map((scan) => (
                          <div key={scan.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {scan.attendeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{scan.attendeeName}</h4>
                                <p className="text-sm text-muted-foreground">Registration: {scan.registrationId}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    {getSessionIconFromName(scan.session || '')}
                                    <span className="text-xs text-gray-500">{scan.session || 'Unknown'}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{scan.scannedBy}</span>
                                  {scan.isReEntry && (
                                    <>
                                      <span className="text-xs text-gray-400">•</span>
                                      <Badge variant="secondary" className="text-xs">Re-entry</Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <Badge className={`text-xs ${getStatusColor(scan.isValid)}`}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(scan.isValid)}
                                    <span>{scan.isValid ? 'Valid' : 'Invalid'}</span>
                                  </div>
                                </Badge>
                                <Badge className={`text-xs mt-1 ${getScanTypeColor(scan.scanType)}`}>
                                  {scan.scanType.replace('_', ' ')}
                                </Badge>
                                {scan.ticketType && (
                                  <p className="text-sm text-muted-foreground mt-1">{scan.ticketType}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(scan.scannedAt).toLocaleString()}
                                </p>
                                {/* errorMessage not in TicketScanRecord type */}
                              </div>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} scans
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
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Statistics View */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scans by Session */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Scans by Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.scansBySession).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No session data available</div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(stats.scansBySession)
                          .sort(([, a], [, b]) => b - a)
                          .map(([sess, count]) => (
                            <div key={sess} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getSessionIconFromName(sess)}
                                <span className="text-sm font-medium">{sess}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full"
                                    style={{ 
                                      width: `${(count / Math.max(...Object.values(stats.scansBySession))) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold w-8 text-right">{count}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Scans by Hour */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Scans by Hour
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.scansByHour).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No hourly data available</div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(stats.scansByHour)
                          .sort(([a], [b]) => parseInt(a) - parseInt(b))
                          .map(([hour, count]) => (
                            <div key={hour} className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {parseInt(hour) < 10 ? `0${hour}:00` : `${hour}:00`}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full"
                                    style={{ 
                                      width: `${(count / Math.max(...Object.values(stats.scansByHour))) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold w-8 text-right">{count}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Peak Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Peak Scan Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{stats.peakScanHour || 'N/A'}</h3>
                      <p className="text-sm text-muted-foreground mt-2">Most active scanning hour</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-foreground">
                          {stats.totalScans > 0 ? Math.round((stats.approvedScans / stats.totalScans) * 100) : 0}%
                        </h3>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                      </div>
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Re-entries</span>
                          <span className="font-semibold">{stats.reEntryCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Error Rate</span>
                          <span className="font-semibold">{stats.errorRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServicePointHistory;
