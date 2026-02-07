import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Printer,
  Settings,
  Eye,
  Layout,
  Grid,
  List,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Search,
  Users,
  FileText,
  QrCode,
  X,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/useToast";
import {
  getEventAttendees,
  getEventConfig,
  type EventAttendee,
  type EventStatistics,
  TicketStatus,
} from "@/lib/workstation-api";
import {
  getBadgeTemplates,
  type BadgeTemplate,
  replaceTemplateVariables,
  mmToPixels,
} from "@/lib/badge-template-api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

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

interface EventInfo {
  id: string;
  title: string;
  date: string;
  location: string;
  venue: string;
}

const ServicePointPrint: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event') || '';
  const badgePreviewRef = useRef<HTMLDivElement>(null);

  // State
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<EventAttendee[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_printed' | 'printed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewAttendee, setPreviewAttendee] = useState<EventAttendee | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [eventStats, setEventStats] = useState<EventStatistics | null>(null);
  const [printedBadges, setPrintedBadges] = useState<Set<string>>(new Set());

  const [currentEvent, setCurrentEvent] = useState<EventInfo>({
    id: eventId,
    title: "Loading...",
    date: "",
    location: "",
    venue: ""
  });

  const loadDemoData = useCallback(() => {
    // Demo attendees for testing
    const demoAttendees = [
      {
        registrationId: "reg-001",
        attendeeName: "Sarah Johnson",
        email: "sarah@techcorp.com",
        phoneNumber: "+254 700 123 456",
        ticketType: "VIP",
        ticketStatus: TicketStatus.ACTIVE,
        checkedInAt: null,
        checkedOutAt: null,
        isCurrentlyInside: false,
        reEntryCount: 0,
        lastScanFacility: null,
      },
      {
        registrationId: "reg-002",
        attendeeName: "Michael Chen",
        email: "michael@innovatelab.io",
        phoneNumber: "+254 700 234 567",
        ticketType: "Standard",
        ticketStatus: TicketStatus.ACTIVE,
        checkedInAt: new Date(),
        checkedOutAt: null,
        isCurrentlyInside: true,
        reEntryCount: 0,
        lastScanFacility: "Main Entrance",
      },
      {
        registrationId: "reg-003",
        attendeeName: "Emma Wilson",
        email: "emma@university.edu",
        phoneNumber: "+254 700 345 678",
        ticketType: "Student",
        ticketStatus: TicketStatus.ACTIVE,
        checkedInAt: null,
        checkedOutAt: null,
        isCurrentlyInside: false,
        reEntryCount: 0,
        lastScanFacility: null,
      },
      {
        registrationId: "reg-004",
        attendeeName: "David Kim",
        email: "david@startuphub.co",
        phoneNumber: "+254 700 456 789",
        ticketType: "VIP",
        ticketStatus: TicketStatus.ACTIVE,
        checkedInAt: null,
        checkedOutAt: null,
        isCurrentlyInside: false,
        reEntryCount: 0,
        lastScanFacility: null,
      },
    ] as unknown as EventAttendee[];

    setAttendees(demoAttendees);
    setFilteredAttendees(demoAttendees);
    setCurrentEvent({
      id: eventId || "demo-1",
      title: "Seamless East Africa 2025",
      date: "July 2-3, 2025",
      location: "Nairobi, Kenya",
      venue: "Kenyatta International Convention Centre"
    });
    setEventStats({
      totalAttendees: 4,
      checkedIn: 1,
      currentlyInside: 1,
      checkedOut: 0,
      reEntries: 0,
      scansToday: 1,
    });
  }, [eventId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load templates, event config, and attendees in parallel
      const [templatesRes, eventRes, attendeesRes] = await Promise.all([
        getBadgeTemplates(),
        getEventConfig(eventId).catch(() => null),
        getEventAttendees(eventId, 1, 500).catch(() => null),
      ]);

      // Set templates
      if (templatesRes.success && templatesRes.data.templates) {
        setTemplates(templatesRes.data.templates);
        // Select first template by default
        if (templatesRes.data.templates.length > 0) {
          setSelectedTemplate(templatesRes.data.templates[0]);
        }
      }

      // Set event info
      if (eventRes?.success && eventRes.data) {
        setCurrentEvent({
          id: eventId,
          title: eventRes.data.eventTitle,
          date: "",
          location: "",
          venue: ""
        });
        setEventStats(eventRes.data.statistics);
      }

      // Set attendees
      if (attendeesRes?.success && attendeesRes.data) {
        setAttendees(attendeesRes.data.attendees);
        setFilteredAttendees(attendeesRes.data.attendees);
      }

      // Load printed badges from localStorage
      const storedPrinted = localStorage.getItem(`printed_badges_${eventId}`);
      if (storedPrinted) {
        setPrintedBadges(new Set(JSON.parse(storedPrinted)));
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Using demo mode.",
        variant: "destructive",
      });

      // Load demo data
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast, loadDemoData]);

  // Load data on mount
  useEffect(() => {
    if (eventId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [eventId, loadData]);



  // Generate QR code as data URL
  const generateQRCode = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (error) {
      console.error("QR code generation error:", error);
      return '';
    }
  };

  // Generate badge PDF for an attendee
  const generateBadgePDF = async (attendee: EventAttendee, template: BadgeTemplate): Promise<Blob> => {
    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // Calculate dimensions
    const scale = 3; // Higher scale for better quality
    const width = mmToPixels(template.width) * scale;
    const height = mmToPixels(template.height) * scale;

    // Prepare attendee data for template
    const nameParts = attendee.attendeeName.split(' ');
    const attendeeData: Record<string, string | undefined> = {
      eventTitle: currentEvent.title,
      eventDate: currentEvent.date,
      eventVenue: currentEvent.venue,
      fullName: attendee.attendeeName,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: attendee.email,
      phone: attendee.phoneNumber || '',
      company: '', // Would come from extended attendee data
      jobTitle: '', // Would come from extended attendee data
      ticketType: attendee.ticketType || 'Standard',
      registrationId: attendee.registrationId,
      qrCode: `EVT|${eventId}|${attendee.registrationId}|${Date.now()}`,
      backupCode: attendee.registrationId.toUpperCase().slice(-10),
    };

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(attendeeData.qrCode || '');

    // Create badge HTML
    container.innerHTML = `
      <div style="
        width: ${width}px;
        height: ${height}px;
        background-color: ${template.backgroundColor};
        position: relative;
        font-family: 'Inter', Arial, sans-serif;
        overflow: hidden;
      ">
        ${template.elements.map(element => {
          const content = replaceTemplateVariables(element.content, attendeeData);
          const elementStyle = `
            position: absolute;
            left: ${mmToPixels(element.x) * scale}px;
            top: ${mmToPixels(element.y) * scale}px;
            width: ${mmToPixels(element.width) * scale}px;
            height: ${mmToPixels(element.height) * scale}px;
            font-size: ${(element.fontSize || 14) * scale}px;
            font-family: ${element.fontFamily || 'Inter'}, Arial, sans-serif;
            font-weight: ${element.fontWeight || 'normal'};
            text-align: ${element.textAlign || 'left'};
            color: ${element.color || '#000000'};
            background-color: ${element.backgroundColor || 'transparent'};
            border-radius: ${(element.borderRadius || 0) * scale}px;
            opacity: ${element.opacity || 1};
            transform: rotate(${element.rotation || 0}deg);
            display: ${element.isVisible === false ? 'none' : 'flex'};
            align-items: center;
            justify-content: ${element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'};
            padding: ${element.type === 'text' ? `${2 * scale}px` : '0'};
            overflow: hidden;
            box-sizing: border-box;
          `;

          if (element.type === 'text') {
            return `<div style="${elementStyle}"><span style="white-space: pre-wrap; word-break: break-word;">${content}</span></div>`;
          } else if (element.type === 'qr') {
            return `<div style="${elementStyle}"><img src="${qrCodeDataUrl}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`;
          } else if (element.type === 'shape') {
            return `<div style="${elementStyle}"></div>`;
          } else if (element.type === 'image') {
            return `<div style="${elementStyle}; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;"><span style="color: #9ca3af; font-size: ${10 * scale}px;">Image</span></div>`;
          }
          return '';
        }).join('')}
      </div>
    `;

    // Render to canvas
    const badgeElement = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(badgeElement, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: template.backgroundColor,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: template.orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [template.width, template.height],
    });

    // Add canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, template.width, template.height);

    // Cleanup
    document.body.removeChild(container);

    return pdf.output('blob');
  };

  // Print single badge
  const handlePrintBadge = async (attendee: EventAttendee) => {
    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select a badge template first.",
        variant: "destructive",
      });
      return;
    }

    const printJob: PrintJob = {
      id: Date.now().toString(),
      attendeeId: attendee.registrationId,
      attendeeName: attendee.attendeeName,
      ticketType: attendee.ticketType || 'Standard',
      template: selectedTemplate.name,
      status: 'printing',
      createdAt: new Date().toISOString()
    };

    setPrintJobs(prev => [printJob, ...prev]);
    setIsPrinting(true);

    try {
      const pdfBlob = await generateBadgePDF(attendee, selectedTemplate);

      // Create download link and trigger print
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      // Mark as printed
      setPrintedBadges(prev => {
        const newSet = new Set(prev);
        newSet.add(attendee.registrationId);
        // Save to localStorage
        localStorage.setItem(`printed_badges_${eventId}`, JSON.stringify([...newSet]));
        return newSet;
      });

      // Update print job status
      setPrintJobs(prev =>
        prev.map(job =>
          job.id === printJob.id
            ? { ...job, status: 'completed', completedAt: new Date().toISOString() }
            : job
        )
      );

      toast({
        title: "Badge Generated",
        description: `Badge for ${attendee.attendeeName} is ready for printing.`,
      });

    } catch (error) {
      console.error("Print error:", error);
      setPrintJobs(prev =>
        prev.map(job =>
          job.id === printJob.id
            ? { ...job, status: 'failed', error: 'Failed to generate badge' }
            : job
        )
      );
      toast({
        title: "Print Failed",
        description: "Failed to generate badge PDF.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Print multiple badges
  const handleBulkPrint = async () => {
    if (selectedAttendees.length === 0) return;
    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select a badge template first.",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);

    for (const attendeeId of selectedAttendees) {
      const attendee = attendees.find(a => a.registrationId === attendeeId);
      if (attendee) {
        await handlePrintBadge(attendee);
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setSelectedAttendees([]);
    setIsPrinting(false);
  };

  // Download badge as PDF
  const handleDownloadBadge = async (attendee: EventAttendee) => {
    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select a badge template first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPrinting(true);
      const pdfBlob = await generateBadgePDF(attendee, selectedTemplate);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `badge-${attendee.attendeeName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Badge Downloaded",
        description: `Badge for ${attendee.attendeeName} has been downloaded.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download badge PDF.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Toggle attendee selection
  const handleSelectAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev =>
      prev.includes(attendeeId)
        ? prev.filter(id => id !== attendeeId)
        : [...prev, attendeeId]
    );
  };

  // Select all filtered attendees
  const handleSelectAll = () => {
    if (selectedAttendees.length === filteredAttendees.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(filteredAttendees.map(a => a.registrationId));
    }
  };

  // Preview badge
  const handlePreviewBadge = (attendee: EventAttendee) => {
    setPreviewAttendee(attendee);
    setShowPreviewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-warning/10 text-warning";
      case 'printing': return "bg-primary/10 text-primary";
      case 'completed': return "bg-success/10 text-success";
      case 'failed': return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'printing': return <Loader size="sm" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size="lg" />
            <p className="text-muted-foreground">Loading print center...</p>
          </div>
        </div>
    );
  }

  if (!eventId) {
    return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/service-point" label="Back" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Badge Print Center</h1>
              <p className="text-sm text-muted-foreground">Print badges for event attendees</p>
            </div>
          </div>
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <Printer className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Event Selected</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Please select an event from the Service Point dashboard to print badges for attendees.
                </p>
                <Button onClick={() => navigate('/admin/service-point')}>
                  Go to Service Point
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/service-point" label="Back" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Badge Print Center</h1>
              <p className="text-sm text-muted-foreground">{currentEvent.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/service-point/templates')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Templates
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {eventStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Attendees</p>
                    <p className="text-2xl font-bold text-primary">{eventStats.totalAttendees}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Checked In</p>
                    <p className="text-2xl font-bold text-success">{eventStats.checkedIn}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Badges Printed</p>
                    <p className="text-2xl font-bold text-foreground">{printedBadges.size}</p>
                  </div>
                  <Printer className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-foreground">
                      {eventStats.totalAttendees - printedBadges.size}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Templates & Print Queue */}
          <div className="space-y-4">
            {/* Template Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center">
                    <Layout className="w-4 h-4 mr-2" />
                    Badge Template
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/service-point/templates')}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {template.width}mm × {template.height}mm
                        </p>
                      </div>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates found</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate('/admin/service-point/templates')}
                    >
                      Create Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Print Queue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Queue
                  </div>
                  {printJobs.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrintJobs([])}
                    >
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {printJobs.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No print jobs</p>
                    </div>
                  ) : (
                    printJobs.slice(0, 10).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(job.status)}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{job.attendeeName}</p>
                            <p className="text-xs text-muted-foreground">{job.ticketType}</p>
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

          {/* Main Content - Attendees List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as 'all' | 'not_printed' | 'printed')}
                      className="h-9 px-3 border border-border rounded-md text-sm bg-background"
                    >
                      <option value="all">All Attendees</option>
                      <option value="not_printed">Not Printed</option>
                      <option value="printed">Printed</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedAttendees.length === filteredAttendees.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={handleBulkPrint}
                      disabled={selectedAttendees.length === 0 || isPrinting}
                    >
                      {isPrinting ? (
                        <Loader size="sm" className="mr-2" />
                      ) : (
                        <Printer className="w-4 h-4 mr-2" />
                      )}
                      Print ({selectedAttendees.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendees */}
            {viewMode === 'list' ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filteredAttendees.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No attendees found</p>
                      </div>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <div
                          key={attendee.registrationId}
                          className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                            selectedAttendees.includes(attendee.registrationId) ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => handleSelectAttendee(attendee.registrationId)}
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={selectedAttendees.includes(attendee.registrationId)}
                              onCheckedChange={() => {}}
                            />
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {attendee.attendeeName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">{attendee.attendeeName}</h4>
                              <p className="text-sm text-muted-foreground">{attendee.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{attendee.ticketType || 'Standard'}</Badge>
                            {printedBadges.has(attendee.registrationId) && (
                              <Badge className="bg-success/10 text-success">Printed</Badge>
                            )}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewBadge(attendee);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadBadge(attendee);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintBadge(attendee);
                                }}
                                disabled={isPrinting}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAttendees.map((attendee) => (
                  <Card
                    key={attendee.registrationId}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAttendees.includes(attendee.registrationId) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectAttendee(attendee.registrationId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-primary">
                              {attendee.attendeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{attendee.attendeeName}</h4>
                            <p className="text-sm text-muted-foreground">{attendee.email}</p>
                          </div>
                        </div>
                        {printedBadges.has(attendee.registrationId) && (
                          <CheckCircle className="w-5 h-5 text-success" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{attendee.ticketType || 'Standard'}</Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewBadge(attendee);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintBadge(attendee);
                            }}
                            disabled={isPrinting}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {showPreviewModal && previewAttendee && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Badge Preview - {previewAttendee.attendeeName}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                {/* Badge Preview */}
                <div
                  ref={badgePreviewRef}
                  className="border-2 border-dashed border-gray-300 shadow-lg"
                  style={{
                    width: `${mmToPixels(selectedTemplate.width)}px`,
                    height: `${mmToPixels(selectedTemplate.height)}px`,
                    backgroundColor: selectedTemplate.backgroundColor,
                    position: 'relative',
                  }}
                >
                  {selectedTemplate.elements.map((element) => {
                    const nameParts = previewAttendee.attendeeName.split(' ');
                    const attendeeData: Record<string, string | undefined> = {
                      eventTitle: currentEvent.title,
                      eventDate: currentEvent.date,
                      eventVenue: currentEvent.venue,
                      fullName: previewAttendee.attendeeName,
                      firstName: nameParts[0] || '',
                      lastName: nameParts.slice(1).join(' ') || '',
                      email: previewAttendee.email,
                      phone: previewAttendee.phoneNumber || '',
                      ticketType: previewAttendee.ticketType || 'Standard',
                      registrationId: previewAttendee.registrationId,
                    };
                    const content = replaceTemplateVariables(element.content, attendeeData);

                    return (
                      <div
                        key={element.id}
                        style={{
                          position: 'absolute',
                          left: `${mmToPixels(element.x)}px`,
                          top: `${mmToPixels(element.y)}px`,
                          width: `${mmToPixels(element.width)}px`,
                          height: `${mmToPixels(element.height)}px`,
                          fontSize: `${element.fontSize || 14}px`,
                          fontFamily: element.fontFamily || 'Inter',
                          fontWeight: element.fontWeight || 'normal',
                          textAlign: element.textAlign || 'left',
                          color: element.color || '#000000',
                          backgroundColor: element.backgroundColor || 'transparent',
                          borderRadius: `${element.borderRadius || 0}px`,
                          opacity: element.opacity || 1,
                          display: element.isVisible === false ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                          padding: element.type === 'text' ? '2px' : 0,
                          overflow: 'hidden',
                        }}
                      >
                        {element.type === 'text' && (
                          <span className="whitespace-pre-wrap break-words">{content}</span>
                        )}
                        {element.type === 'qr' && (
                          <div className="w-full h-full bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                            <QrCode className="w-full h-full text-gray-800" />
                          </div>
                        )}
                        {element.type === 'shape' && (
                          <div className="w-full h-full" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleDownloadBadge(previewAttendee)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={() => handlePrintBadge(previewAttendee)} disabled={isPrinting}>
                    {isPrinting ? (
                      <Loader size="sm" className="mr-2" />
                    ) : (
                      <Printer className="w-4 h-4 mr-2" />
                    )}
                    Print Badge
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default ServicePointPrint;
