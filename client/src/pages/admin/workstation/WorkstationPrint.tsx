import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  Printer, 
  ArrowLeft,
  Settings,
  Eye,
  RefreshCw,
  Layout,
  Grid,
  List,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import AdminLayout from "../AdminLayout";

interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  isDefault: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrintJob {
  id: string;
  attendeeId: string;
  attendeeName: string;
  ticketType: string;
  template: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ticketType: string;
  status: 'registered' | 'checked_in' | 'scanned';
  registeredDate: string;
  qrCode: string;
  avatar?: string;
  company?: string;
  position?: string;
}

const WorkstationPrint: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [currentEvent, setCurrentEvent] = useState({
    id: eventId || "1",
    title: "Seamless East Africa 2025",
    date: "July 2-3, 2025",
    location: "Nairobi, Kenya",
    venue: "Kenyatta International Convention Centre"
  });

  // Mock events data for selection
  const events = [
    {
      id: "1",
      title: "Seamless East Africa 2025",
      date: "July 2-3, 2025",
      location: "Nairobi, Kenya",
      venue: "Kenyatta International Convention Centre"
    },
    {
      id: "2",
      title: "Tech Innovation Summit 2024",
      date: "March 15-17, 2024",
      location: "San Francisco, CA",
      venue: "Moscone Center"
    }
  ];

  // Mock badge templates
  const templates: BadgeTemplate[] = [
    {
      id: "default",
      name: "Default Badge",
      description: "Standard event badge with company logo",
      preview: "default-badge-preview.jpg",
      isDefault: true,
      isCustom: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    },
    {
      id: "vip",
      name: "VIP Badge",
      description: "Premium badge for VIP attendees",
      preview: "vip-badge-preview.jpg",
      isDefault: true,
      isCustom: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    },
    {
      id: "student",
      name: "Student Badge",
      description: "Special badge for student attendees",
      preview: "student-badge-preview.jpg",
      isDefault: true,
      isCustom: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    },
    {
      id: "custom1",
      name: "Custom Template 1",
      description: "Custom designed badge template",
      preview: "custom1-badge-preview.jpg",
      isDefault: false,
      isCustom: true,
      createdAt: "2024-02-15",
      updatedAt: "2024-02-20"
    }
  ];

  // Mock attendees data
  const attendees: Attendee[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+254 700 123 456",
      ticketType: "VIP",
      status: "registered",
      registeredDate: "2024-01-15",
      qrCode: "QR123456789",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      company: "TechCorp Ltd",
      position: "CEO"
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael@example.com",
      phone: "+254 700 234 567",
      ticketType: "Standard",
      status: "checked_in",
      registeredDate: "2024-01-20",
      qrCode: "QR234567890",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      company: "InnovateLab",
      position: "CTO"
    },
    {
      id: "3",
      name: "Emma Wilson",
      email: "emma@example.com",
      phone: "+254 700 345 678",
      ticketType: "Student",
      status: "scanned",
      registeredDate: "2024-02-01",
      qrCode: "QR345678901",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      company: "University of Nairobi",
      position: "Student"
    },
    {
      id: "4",
      name: "David Kim",
      email: "david@example.com",
      phone: "+254 700 456 789",
      ticketType: "VIP",
      status: "registered",
      registeredDate: "2024-02-05",
      qrCode: "QR456789012",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      company: "StartupHub",
      position: "Founder"
    }
  ];

  const filteredAttendees = attendees.filter(attendee =>
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintBadge = (attendeeId: string) => {
    const attendee = attendees.find(a => a.id === attendeeId);
    if (!attendee) return;

    const printJob: PrintJob = {
      id: Date.now().toString(),
      attendeeId: attendee.id,
      attendeeName: attendee.name,
      ticketType: attendee.ticketType,
      template: selectedTemplate,
      status: 'printing',
      createdAt: new Date().toISOString()
    };

    setPrintJobs(prev => [printJob, ...prev]);

    // Simulate printing process
    setTimeout(() => {
      setPrintJobs(prev => 
        prev.map(job => 
          job.id === printJob.id 
            ? { ...job, status: 'completed', completedAt: new Date().toISOString() }
            : job
        )
      );
    }, 2000);
  };

  const handleBulkPrint = () => {
    selectedAttendees.forEach(attendeeId => {
      handlePrintBadge(attendeeId);
    });
    setSelectedAttendees([]);
  };

  const handleSelectAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(attendeeId) 
        ? prev.filter(id => id !== attendeeId)
        : [...prev, attendeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAttendees.length === filteredAttendees.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(filteredAttendees.map(a => a.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'printing':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'completed':
        return "bg-green-100 text-green-800 border-green-200";
      case 'failed':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'printing':
        return <Printer className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Print Center</h1>
            <p className="text-gray-600 mt-2">{currentEvent.title} • {currentEvent.date}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={currentEvent.id}
              onChange={(e) => {
                const selectedEvent = events.find(ev => ev.id === e.target.value);
                if (selectedEvent) {
                  setCurrentEvent(selectedEvent);
                  navigate(`/admin/workstation/print?event=${selectedEvent.id}`);
                }
              }}
              className="px-3 py-2 border border-border rounded-md text-sm"
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Layout className="w-5 h-5 mr-2" />
                    Badge Templates
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/workstation/templates')}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTemplate === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {template.isCustom && (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Print Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Printer className="w-5 h-5 mr-2" />
                    Print Queue
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPrintJobs([])}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {printJobs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Printer className="w-8 h-8 mx-auto mb-2" />
                      <p>No print jobs</p>
                    </div>
                  ) : (
                    printJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-2 border border-border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <div>
                            <p className="text-sm font-medium">{job.attendeeName}</p>
                            <p className="text-xs text-gray-600">{job.ticketType}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                          {job.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendees List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search attendees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSelectAll}
                    >
                      {selectedAttendees.length === filteredAttendees.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={handleBulkPrint}
                      disabled={selectedAttendees.length === 0}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Selected ({selectedAttendees.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendees Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAttendees.map((attendee) => (
                  <Card 
                    key={attendee.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedAttendees.includes(attendee.id) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectAttendee(attendee.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          {attendee.avatar ? (
                            <img 
                              src={attendee.avatar} 
                              alt={attendee.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-primary">
                              {attendee.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{attendee.name}</h4>
                          <p className="text-sm text-gray-600">{attendee.company}</p>
                          <p className="text-sm text-gray-500">{attendee.position}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {attendee.ticketType}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintBadge(attendee.id);
                            }}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Preview badge
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-2">
                    {filteredAttendees.map((attendee) => (
                      <div 
                        key={attendee.id}
                        className={`flex items-center justify-between p-4 border-b border-border hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedAttendees.includes(attendee.id) ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleSelectAttendee(attendee.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {attendee.avatar ? (
                              <img 
                                src={attendee.avatar} 
                                alt={attendee.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-primary">
                                {attendee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{attendee.name}</h4>
                            <p className="text-sm text-gray-600">{attendee.email}</p>
                            <p className="text-sm text-gray-500">{attendee.company} • {attendee.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-xs">
                            {attendee.ticketType}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintBadge(attendee.id);
                              }}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Preview badge
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default WorkstationPrint;
