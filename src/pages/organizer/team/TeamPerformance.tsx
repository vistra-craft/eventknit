import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  CheckCircle, 
  AlertCircle,
  QrCode,
  Users,
  Calendar,
  Award,
  Target,
  Activity,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";

interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  eventsWorked: number;
  ticketsScanned: number;
  checkInsCompleted: number;
  accuracyRate: number;
  avgScanTime: number; // in seconds
  lastActive: string;
  status: 'active' | 'inactive';
}

interface EventPerformance {
  id: string;
  eventName: string;
  date: string;
  totalTickets: number;
  ticketsScanned: number;
  scanAccuracy: number;
  avgScanTime: number;
  staffCount: number;
}

const TeamPerformance = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('ticketsScanned');

  // Mock performance data
  const staffPerformance: StaffPerformance[] = [
    {
      id: "1",
      name: "Alex Rodriguez",
      role: "Ticket Scanner",
      eventsWorked: 12,
      ticketsScanned: 1247,
      checkInsCompleted: 1189,
      accuracyRate: 95.3,
      avgScanTime: 2.1,
      lastActive: "2 hours ago",
      status: 'active'
    },
    {
      id: "2",
      name: "Maria Santos",
      role: "Event Manager",
      eventsWorked: 8,
      ticketsScanned: 0,
      checkInsCompleted: 0,
      accuracyRate: 0,
      avgScanTime: 0,
      lastActive: "1 day ago",
      status: 'active'
    },
    {
      id: "3",
      name: "David Kim",
      role: "Check-in Staff",
      eventsWorked: 5,
      ticketsScanned: 456,
      checkInsCompleted: 445,
      accuracyRate: 97.6,
      avgScanTime: 1.8,
      lastActive: "3 days ago",
      status: 'active'
    },
    {
      id: "4",
      name: "Sarah Johnson",
      role: "Supervisor",
      eventsWorked: 15,
      ticketsScanned: 89,
      checkInsCompleted: 87,
      accuracyRate: 97.8,
      avgScanTime: 1.9,
      lastActive: "30 minutes ago",
      status: 'active'
    }
  ];

  const eventPerformance: EventPerformance[] = [
    {
      id: "1",
      eventName: "Tech Conference 2024",
      date: "2024-01-15",
      totalTickets: 500,
      ticketsScanned: 450,
      scanAccuracy: 95.2,
      avgScanTime: 2.0,
      staffCount: 3
    },
    {
      id: "2",
      eventName: "Music Festival",
      date: "2024-01-20",
      totalTickets: 2000,
      ticketsScanned: 1850,
      scanAccuracy: 96.8,
      avgScanTime: 1.9,
      staffCount: 2
    },
    {
      id: "3",
      eventName: "Workshop Series",
      date: "2024-01-22",
      totalTickets: 100,
      ticketsScanned: 95,
      scanAccuracy: 98.1,
      avgScanTime: 1.7,
      staffCount: 2
    }
  ];

  const getPerformanceColor = (value: number, type: 'accuracy' | 'time') => {
    if (type === 'accuracy') {
      if (value >= 95) return 'text-green-600';
      if (value >= 90) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value <= 2) return 'text-green-600';
      if (value <= 3) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'inactive': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const totalTicketsScanned = staffPerformance.reduce((sum, staff) => sum + staff.ticketsScanned, 0);
  const avgAccuracy = staffPerformance.reduce((sum, staff) => sum + staff.accuracyRate, 0) / staffPerformance.length;
  const avgScanTime = staffPerformance.reduce((sum, staff) => sum + staff.avgScanTime, 0) / staffPerformance.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Team Performance</h1>
          <p className="text-muted-foreground">
            Track staff efficiency and ticket scanning metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Scanned</p>
                <p className="text-2xl font-bold text-foreground">{totalTicketsScanned.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+12% vs last period</span>
                </div>
              </div>
              <QrCode className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold text-foreground">{avgAccuracy.toFixed(1)}%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+2.1% vs last period</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Scan Time</p>
                <p className="text-2xl font-bold text-foreground">{avgScanTime.toFixed(1)}s</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">-0.3s vs last period</span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold text-foreground">
                  {staffPerformance.filter(s => s.status === 'active').length}
                </p>
                <div className="flex items-center mt-1">
                  <Activity className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">All systems operational</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Staff Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffPerformance.map((staff) => (
                <div key={staff.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{staff.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {staff.role}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(staff.status)}`}>
                        {staff.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Last active: {staff.lastActive}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Events Worked:</span>
                      <span className="font-medium text-foreground ml-2">{staff.eventsWorked}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tickets Scanned:</span>
                      <span className="font-medium text-foreground ml-2">{staff.ticketsScanned}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Accuracy Rate:</span>
                      <span className={`font-medium ml-2 ${getPerformanceColor(staff.accuracyRate, 'accuracy')}`}>
                        {staff.accuracyRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Scan Time:</span>
                      <span className={`font-medium ml-2 ${getPerformanceColor(staff.avgScanTime, 'time')}`}>
                        {staff.avgScanTime}s
                      </span>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Performance Score</span>
                      <span>{Math.round((staff.accuracyRate + (100 - staff.avgScanTime * 10)) / 2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.round((staff.accuracyRate + (100 - staff.avgScanTime * 10)) / 2)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Event Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventPerformance.map((event) => (
                <div key={event.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{event.eventName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} • {event.staffCount} staff
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.ticketsScanned}/{event.totalTickets}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Scan Rate:</span>
                      <span className="font-medium text-foreground ml-2">
                        {((event.ticketsScanned / event.totalTickets) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span className={`font-medium ml-2 ${getPerformanceColor(event.scanAccuracy, 'accuracy')}`}>
                        {event.scanAccuracy}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Scan Time:</span>
                      <span className={`font-medium ml-2 ${getPerformanceColor(event.avgScanTime, 'time')}`}>
                        {event.avgScanTime}s
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Staff Efficiency:</span>
                      <span className="font-medium text-foreground ml-2">
                        {Math.round(event.ticketsScanned / event.staffCount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Scan Completion</span>
                      <span>{((event.ticketsScanned / event.totalTickets) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${(event.ticketsScanned / event.totalTickets) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Top Performer</h3>
              <p className="text-sm text-muted-foreground">
                David Kim leads with 97.6% accuracy and 1.8s average scan time
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Improvement Trend</h3>
              <p className="text-sm text-muted-foreground">
                Average scan time decreased by 0.3s this month
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Attention Needed</h3>
              <p className="text-sm text-muted-foreground">
                Consider additional training for ticket scanning accuracy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPerformance;
