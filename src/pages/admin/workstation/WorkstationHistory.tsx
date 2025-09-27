import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  History, 
  Download, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
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
  Activity,
  TrendingUp,
  BarChart3,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import AdminLayout from "../AdminLayout";

interface ScanResult {
  id: string;
  attendeeId: string;
  attendeeName: string;
  email: string;
  ticketType: string;
  qrCode: string;
  scannedAt: string;
  facility: string;
  facilityType: 'entrance' | 'lunch' | 'gifts' | 'parking' | 'vip' | 'registration' | 'materials';
  status: 'approved' | 'rejected';
  reason?: string;
  scannedBy: string;
  eventId: string;
  eventName: string;
  avatar?: string;
}

interface ScanStats {
  totalScans: number;
  approvedScans: number;
  rejectedScans: number;
  scansByFacility: Record<string, number>;
  scansByHour: Record<string, number>;
  scansByDay: Record<string, number>;
  averageScanTime: number;
  peakScanHour: string;
}

const WorkstationHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');

  // Mock scan history data
  const scanHistory: ScanResult[] = [
    {
      id: "1",
      attendeeId: "1",
      attendeeName: "Sarah Johnson",
      email: "sarah@example.com",
      ticketType: "VIP",
      qrCode: "QR123456789",
      scannedAt: "2024-07-02T09:15:30Z",
      facility: "Main Entrance",
      facilityType: "entrance",
      status: "approved",
      scannedBy: "Scanner User 1",
      eventId: "1",
      eventName: "Seamless East Africa 2025",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "2",
      attendeeId: "2",
      attendeeName: "Michael Chen",
      email: "michael@example.com",
      ticketType: "Standard",
      qrCode: "QR234567890",
      scannedAt: "2024-07-02T09:20:15Z",
      facility: "Main Entrance",
      facilityType: "entrance",
      status: "approved",
      scannedBy: "Scanner User 1",
      eventId: "1",
      eventName: "Seamless East Africa 2025",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "3",
      attendeeId: "3",
      attendeeName: "Emma Wilson",
      email: "emma@example.com",
      ticketType: "Student",
      qrCode: "QR345678901",
      scannedAt: "2024-07-02T10:30:45Z",
      facility: "Lunch Area",
      facilityType: "lunch",
      status: "approved",
      scannedBy: "Scanner User 2",
      eventId: "1",
      eventName: "Seamless East Africa 2025",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "4",
      attendeeId: "4",
      attendeeName: "David Kim",
      email: "david@example.com",
      ticketType: "VIP",
      qrCode: "QR456789012",
      scannedAt: "2024-07-02T11:45:20Z",
      facility: "VIP Lounge",
      facilityType: "vip",
      status: "approved",
      scannedBy: "Scanner User 3",
      eventId: "1",
      eventName: "Seamless East Africa 2025",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "5",
      attendeeId: "5",
      attendeeName: "Invalid QR Code",
      email: "",
      ticketType: "",
      qrCode: "INVALID123",
      scannedAt: "2024-07-02T12:15:10Z",
      facility: "Main Entrance",
      facilityType: "entrance",
      status: "rejected",
      reason: "Invalid QR code",
      scannedBy: "Scanner User 1",
      eventId: "1",
      eventName: "Seamless East Africa 2025"
    }
  ];

  const facilities = [
    { id: "all", name: "All Facilities", icon: <Building2 className="w-4 h-4" /> },
    { id: "entrance", name: "Main Entrance", icon: <Shield className="w-4 h-4" /> },
    { id: "lunch", name: "Lunch Area", icon: <Utensils className="w-4 h-4" /> },
    { id: "gifts", name: "Gifts Desk", icon: <Gift className="w-4 h-4" /> },
    { id: "vip", name: "VIP Lounge", icon: <Star className="w-4 h-4" /> },
    { id: "parking", name: "Parking", icon: <Car className="w-4 h-4" /> }
  ];

  const statuses = [
    { id: "all", name: "All Status", icon: <Activity className="w-4 h-4" /> },
    { id: "approved", name: "Approved", icon: <CheckCircle className="w-4 h-4" /> },
    { id: "rejected", name: "Rejected", icon: <XCircle className="w-4 h-4" /> }
  ];

  const dates = [
    { id: "all", name: "All Time" },
    { id: "today", name: "Today" },
    { id: "yesterday", name: "Yesterday" },
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" }
  ];

  // Calculate stats
  const stats: ScanStats = {
    totalScans: scanHistory.length,
    approvedScans: scanHistory.filter(s => s.status === 'approved').length,
    rejectedScans: scanHistory.filter(s => s.status === 'rejected').length,
    scansByFacility: scanHistory.reduce((acc, scan) => {
      acc[scan.facility] = (acc[scan.facility] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    scansByHour: scanHistory.reduce((acc, scan) => {
      const hour = new Date(scan.scannedAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    scansByDay: scanHistory.reduce((acc, scan) => {
      const day = new Date(scan.scannedAt).toDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageScanTime: 2.5, // Mock data
    peakScanHour: "10:00 AM"
  };

  const filteredScans = scanHistory.filter(scan => {
    const matchesSearch = scan.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.qrCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFacility = selectedFacility === "all" || scan.facilityType === selectedFacility;
    const matchesStatus = selectedStatus === "all" || scan.status === selectedStatus;
    
    return matchesSearch && matchesFacility && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'rejected':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getFacilityIcon = (facilityType: string) => {
    switch (facilityType) {
      case 'entrance':
        return <Shield className="w-4 h-4" />;
      case 'lunch':
        return <Utensils className="w-4 h-4" />;
      case 'gifts':
        return <Gift className="w-4 h-4" />;
      case 'vip':
        return <Star className="w-4 h-4" />;
      case 'parking':
        return <Car className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/workstation')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workstation
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scan History</h1>
            <p className="text-gray-600 mt-2">View and analyze all QR code scans</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                  <p className="text-2xl font-bold">{stats.totalScans}</p>
                </div>
                <QrCode className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedScans}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedScans}</p>
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
                  <p className="text-2xl font-bold">
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
                  placeholder="Search scans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md text-sm"
                >
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.id}>{facility.name}</option>
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
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'list' ? (
          /* Scan History List */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Scan History ({filteredScans.length})
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {scan.avatar ? (
                          <img 
                            src={scan.avatar} 
                            alt={scan.attendeeName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-primary">
                            {scan.attendeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{scan.attendeeName}</h4>
                        <p className="text-sm text-gray-600">{scan.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {getFacilityIcon(scan.facilityType)}
                            <span className="text-xs text-gray-500">{scan.facility}</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{scan.scannedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={`text-xs ${getStatusColor(scan.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(scan.status)}
                            <span>{scan.status}</span>
                          </div>
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">{scan.ticketType}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(scan.scannedAt).toLocaleString()}
                        </p>
                        {scan.reason && (
                          <p className="text-xs text-red-600 mt-1">{scan.reason}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Statistics View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scans by Facility */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Scans by Facility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.scansByFacility).map(([facility, count]) => (
                    <div key={facility} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFacilityIcon(facility)}
                        <span className="text-sm font-medium">{facility}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(stats.scansByFacility))) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <h3 className="text-2xl font-bold">{stats.peakScanHour}</h3>
                  <p className="text-sm text-gray-600 mt-2">Most active scanning hour</p>
                </div>
              </CardContent>
            </Card>

            {/* Average Scan Time */}
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
                    <h3 className="text-2xl font-bold">{stats.averageScanTime}s</h3>
                    <p className="text-sm text-gray-600">Average scan time</p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-semibold">
                        {stats.totalScans > 0 ? Math.round((stats.approvedScans / stats.totalScans) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default WorkstationHistory;
