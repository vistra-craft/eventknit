import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Building2,
  Star,
  Eye,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  CreditCard,
  RefreshCw,
  FileText,
  BarChart3,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "../AdminLayout";

interface EventDetails {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  venue: string;
  organizer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  category: string;
  status: "active" | "pending" | "cancelled" | "completed";
  type: "public" | "private";
  price: "free" | "paid";
  ticketPrice?: number;
  capacity: number;
  attendees: number;
  views: number;
  conversion: number;
  rating: number;
  image: string;
  createdAt: string;
  updatedAt: string;
  registrationDeadline?: string;
  requirements?: string[];
  speakers?: Array<{
    id: string;
    name: string;
    title: string;
    bio: string;
    image?: string;
  }>;
  sponsors?: Array<{
    id: string;
    name: string;
    level: "gold" | "silver" | "bronze";
    logo: string;
  }>;
}

interface EventMetrics {
  totalRevenue: number;
  platformFees: number;
  organizerAmount: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalRefunds: number;
  pendingRefunds: number;
  processedRefunds: number;
  remittancesSent: number;
  remittancesPending: number;
  attendanceRate: number;
  conversionRate: number;
  averageTicketPrice: number;
}

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");

  // Mock event data - in a real app, this would come from your API
  const eventData: EventDetails = {
    id: eventId || "1",
    title: "Tech Innovation Summit 2024",
    description: "Explore the latest in technology innovation and digital transformation.",
    fullDescription: "Join us for the most comprehensive technology innovation summit of the year. Featuring keynote speakers, hands-on workshops, and networking opportunities with industry leaders.",
    date: "March 15-17, 2024",
    time: "9:00 AM",
    endTime: "5:00 PM",
    location: "San Francisco, CA",
    venue: "Moscone Center",
    organizer: {
      id: "ORG-001",
      name: "Tech Events Inc.",
      email: "contact@techevents.com",
      phone: "+1 (555) 123-4567"
    },
    category: "Technology",
    status: "active",
    type: "public",
    price: "paid",
    ticketPrice: 299,
    capacity: 500,
    attendees: 485,
    views: 3250,
    conversion: 14.9,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-28T14:30:00Z",
    registrationDeadline: "2024-03-10",
    requirements: [
      "Valid ID required for entry",
      "No outside food or drinks",
      "Professional dress code recommended"
    ],
    speakers: [
      {
        id: "SPK-001",
        name: "Dr. Maria Rodriguez",
        title: "Chief Technology Officer, TechCorp",
        bio: "Leading expert in AI and machine learning with 15+ years of experience.",
        image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: "SPK-002",
        name: "John Smith",
        title: "VP of Engineering, InnovateLab",
        bio: "Serial entrepreneur and technology innovator.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
      }
    ],
    sponsors: [
      {
        id: "SPN-001",
        name: "TechCorp",
        level: "gold",
        logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=50&fit=crop"
      },
      {
        id: "SPN-002",
        name: "InnovateLab",
        level: "silver",
        logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=50&fit=crop"
      }
    ]
  };

  // Mock metrics data
  const metrics: EventMetrics = {
    totalRevenue: 145200,
    platformFees: 14520,
    organizerAmount: 130680,
    totalPayments: 485,
    successfulPayments: 470,
    failedPayments: 8,
    pendingPayments: 7,
    totalRefunds: 12,
    pendingRefunds: 2,
    processedRefunds: 10,
    remittancesSent: 3,
    remittancesPending: 1,
    attendanceRate: 97.0,
    conversionRate: 14.9,
    averageTicketPrice: 299
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeBadge = (type: string) => {
    return type === "public" 
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const getPriceBadge = (price: string) => {
    return price === "free" 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-orange-100 text-orange-800 border-orange-200";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleBack = () => {
    navigate("/admin/events");
  };

  const handleEdit = () => {
    console.log("Edit event:", eventData.id);
    // TODO: Navigate to edit page
  };

  const handleExport = () => {
    console.log("Export event data:", eventData.id);
    // TODO: Implement export functionality
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{eventData.title}</h1>
              <p className="text-gray-600">Event ID: {eventData.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
            <Button size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Event Status and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge className={`text-xs ${getStatusBadge(eventData.status)}`}>
                {eventData.status}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Attendees</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {eventData.attendees}/{eventData.capacity}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Revenue</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Conversion</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {eventData.conversion}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
            <TabsTrigger value="remittance">Remittance</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Event Title</label>
                        <p className="text-sm text-gray-900">{eventData.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Category</label>
                        <p className="text-sm text-gray-900">{eventData.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date & Time</label>
                        <p className="text-sm text-gray-900">
                          {eventData.date} at {eventData.time}
                          {eventData.endTime && ` - ${eventData.endTime}`}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-sm text-gray-900">{eventData.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Venue</label>
                        <p className="text-sm text-gray-900">{eventData.venue}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Capacity</label>
                        <p className="text-sm text-gray-900">{eventData.capacity} attendees</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-sm text-gray-900 mt-1">{eventData.description}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Description</label>
                      <p className="text-sm text-gray-900 mt-1">{eventData.fullDescription}</p>
                    </div>

                    {eventData.requirements && eventData.requirements.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Requirements</label>
                        <ul className="text-sm text-gray-900 mt-1 list-disc list-inside">
                          {eventData.requirements.map((requirement, index) => (
                            <li key={index}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Organizer Information */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Organizer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Organizer Name</label>
                        <p className="text-sm text-gray-900">{eventData.organizer.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Organizer ID</label>
                        <p className="text-sm text-gray-900">{eventData.organizer.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm text-gray-900">{eventData.organizer.email}</p>
                      </div>
                      {eventData.organizer.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Phone</label>
                          <p className="text-sm text-gray-900">{eventData.organizer.phone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Event Image and Stats */}
              <div className="space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Event Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={eventData.image}
                      alt={eventData.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Event Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Views</span>
                      <span className="text-sm font-medium text-gray-900">{eventData.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="text-sm font-medium text-gray-900">{eventData.conversion}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-900">{eventData.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Attendance Rate</span>
                      <span className="text-sm font-medium text-gray-900">{metrics.attendanceRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Ticket Price</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(metrics.averageTicketPrice)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Event Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <Badge className={`text-xs ${getTypeBadge(eventData.type)}`}>
                        {eventData.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price</span>
                      <Badge className={`text-xs ${getPriceBadge(eventData.price)}`}>
                        {eventData.price}
                      </Badge>
                    </div>
                    {eventData.ticketPrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Ticket Price</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(eventData.ticketPrice)}</span>
                      </div>
                    )}
                    {eventData.registrationDeadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Registration Deadline</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(eventData.registrationDeadline)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm font-medium text-gray-900">{formatDateTime(eventData.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium text-gray-900">{formatDateTime(eventData.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Speakers and Sponsors */}
            {(eventData.speakers && eventData.speakers.length > 0) || (eventData.sponsors && eventData.sponsors.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {eventData.speakers && eventData.speakers.length > 0 && (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Speakers ({eventData.speakers.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {eventData.speakers.map((speaker) => (
                        <div key={speaker.id} className="flex items-center gap-3">
                          <img
                            src={speaker.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"}
                            alt={speaker.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{speaker.name}</p>
                            <p className="text-xs text-gray-600">{speaker.title}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {eventData.sponsors && eventData.sponsors.length > 0 && (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Sponsors ({eventData.sponsors.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {eventData.sponsors.map((sponsor) => (
                        <div key={sponsor.id} className="flex items-center gap-3">
                          <img
                            src={sponsor.logo}
                            alt={sponsor.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{sponsor.name}</p>
                            <Badge className={`text-xs ${
                              sponsor.level === 'gold' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              sponsor.level === 'silver' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                              'bg-orange-100 text-orange-800 border-orange-200'
                            }`}>
                              {sponsor.level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </TabsContent>

          {/* Attendees Tab */}
          <TabsContent value="attendees" className="space-y-6">
            {/* Attendees Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">485</div>
                  <p className="text-sm text-gray-600">Total Attendees</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">470</div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">10</div>
                  <p className="text-sm text-gray-600">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">5</div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendees Filters and Search */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search attendees..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Ticket Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Attendees List */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Attendees List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: "1", name: "Sarah Johnson", email: "sarah@example.com", ticketType: "VIP", status: "confirmed", registeredDate: "2024-01-15", paymentStatus: "paid" },
                    { id: "2", name: "Michael Chen", email: "michael@example.com", ticketType: "Standard", status: "confirmed", registeredDate: "2024-01-20", paymentStatus: "paid" },
                    { id: "3", name: "Emma Wilson", email: "emma@example.com", ticketType: "Student", status: "pending", registeredDate: "2024-02-01", paymentStatus: "pending" },
                    { id: "4", name: "David Brown", email: "david@example.com", ticketType: "Standard", status: "confirmed", registeredDate: "2024-01-25", paymentStatus: "paid" },
                    { id: "5", name: "Lisa Anderson", email: "lisa@example.com", ticketType: "VIP", status: "cancelled", registeredDate: "2024-01-18", paymentStatus: "refunded" }
                  ].map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{attendee.name}</h4>
                          <p className="text-sm text-gray-600">{attendee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`text-xs ${
                          attendee.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                          attendee.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {attendee.status}
                        </Badge>
                        <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                          {attendee.ticketType}
                        </Badge>
                        <span className="text-sm text-gray-600">{formatDate(attendee.registeredDate)}</span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(metrics.totalRevenue)}</div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{metrics.successfulPayments}</div>
                  <p className="text-sm text-gray-600">Successful</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">{metrics.pendingPayments}</div>
                  <p className="text-sm text-gray-600">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">{metrics.failedPayments}</div>
                  <p className="text-sm text-gray-600">Failed</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Breakdown */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-border rounded-lg">
                    <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold">Credit Card</div>
                    <div className="text-sm text-gray-600">320 payments</div>
                    <div className="text-sm font-medium text-green-600">{formatCurrency(95680)}</div>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600 font-bold text-sm">P</span>
                    </div>
                    <div className="text-lg font-semibold">PayPal</div>
                    <div className="text-sm text-gray-600">120 payments</div>
                    <div className="text-sm font-medium text-green-600">{formatCurrency(35880)}</div>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold text-sm">S</span>
                    </div>
                    <div className="text-lg font-semibold">Stripe</div>
                    <div className="text-sm text-gray-600">30 payments</div>
                    <div className="text-sm font-medium text-green-600">{formatCurrency(13640)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Payments</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="successful">Successful</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: "PAY-001", attendee: "Sarah Johnson", amount: 299, method: "Credit Card", status: "successful", date: "2024-02-15T10:30:00Z", transactionId: "TXN-123456" },
                    { id: "PAY-002", attendee: "Michael Chen", amount: 199, method: "PayPal", status: "successful", date: "2024-02-15T11:15:00Z", transactionId: "TXN-123457" },
                    { id: "PAY-003", attendee: "Emma Wilson", amount: 99, method: "Stripe", status: "pending", date: "2024-02-15T12:00:00Z", transactionId: "TXN-123458" },
                    { id: "PAY-004", attendee: "David Brown", amount: 299, method: "Credit Card", status: "failed", date: "2024-02-15T13:45:00Z", transactionId: "TXN-123459" },
                    { id: "PAY-005", attendee: "Lisa Anderson", amount: 299, method: "Credit Card", status: "successful", date: "2024-02-15T14:20:00Z", transactionId: "TXN-123460" }
                  ].map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{payment.attendee}</h4>
                          <p className="text-sm text-gray-600">{payment.method} • {payment.transactionId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatCurrency(payment.amount)}</div>
                          <div className="text-sm text-gray-600">{formatDateTime(payment.date)}</div>
                        </div>
                        <Badge className={`text-xs ${
                          payment.status === 'successful' ? 'bg-green-100 text-green-800 border-green-200' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {payment.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds" className="space-y-6">
            {/* Refunds Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">{formatCurrency(metrics.totalRefunds)}</div>
                  <p className="text-sm text-gray-600">Total Refunds</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{metrics.processedRefunds}</div>
                  <p className="text-sm text-gray-600">Processed</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">{metrics.pendingRefunds}</div>
                  <p className="text-sm text-gray-600">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">2.5%</div>
                  <p className="text-sm text-gray-600">Refund Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Refund Requests */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Refund Requests</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: "REF-001", attendee: "Lisa Anderson", amount: 299, reason: "Event cancelled", status: "approved", requestDate: "2024-02-10T09:00:00Z", processedDate: "2024-02-12T14:30:00Z", method: "Credit Card" },
                    { id: "REF-002", attendee: "John Smith", amount: 199, reason: "Unable to attend", status: "pending", requestDate: "2024-02-14T16:20:00Z", processedDate: null, method: "PayPal" },
                    { id: "REF-003", attendee: "Maria Garcia", amount: 99, reason: "Duplicate payment", status: "approved", requestDate: "2024-02-08T11:15:00Z", processedDate: "2024-02-09T10:45:00Z", method: "Stripe" },
                    { id: "REF-004", attendee: "Robert Wilson", amount: 299, reason: "Technical issues", status: "rejected", requestDate: "2024-02-12T13:30:00Z", processedDate: "2024-02-13T09:20:00Z", method: "Credit Card" },
                    { id: "REF-005", attendee: "Sarah Johnson", amount: 199, reason: "Change of plans", status: "pending", requestDate: "2024-02-15T08:45:00Z", processedDate: null, method: "PayPal" }
                  ].map((refund) => (
                    <div key={refund.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{refund.attendee}</h4>
                          <p className="text-sm text-gray-600">{refund.reason} • {refund.method}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatCurrency(refund.amount)}</div>
                          <div className="text-sm text-gray-600">
                            Requested: {formatDateTime(refund.requestDate)}
                          </div>
                          {refund.processedDate && (
                            <div className="text-sm text-gray-600">
                              Processed: {formatDateTime(refund.processedDate)}
                            </div>
                          )}
                        </div>
                        <Badge className={`text-xs ${
                          refund.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                          refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {refund.status}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {refund.status === 'pending' && (
                            <>
                              <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remittance Tab */}
          <TabsContent value="remittance" className="space-y-6">
            {/* Remittance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(metrics.organizerAmount)}</div>
                  <p className="text-sm text-gray-600">Total to Organizer</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{formatCurrency(metrics.platformFees)}</div>
                  <p className="text-sm text-gray-600">Platform Fees</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{metrics.remittancesSent}</div>
                  <p className="text-sm text-gray-600">Sent</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">{metrics.remittancesPending}</div>
                  <p className="text-sm text-gray-600">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Breakdown */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Total Event Revenue</h4>
                      <p className="text-sm text-gray-600">From all ticket sales</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
                      <div className="text-sm text-gray-600">100%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-green-50">
                    <div>
                      <h4 className="font-medium text-gray-900">Organizer Share</h4>
                      <p className="text-sm text-gray-600">Amount to be paid to organizer</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">{formatCurrency(metrics.organizerAmount)}</div>
                      <div className="text-sm text-gray-600">90%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-blue-50">
                    <div>
                      <h4 className="font-medium text-gray-900">Platform Fees</h4>
                      <p className="text-sm text-gray-600">EventKnit commission</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">{formatCurrency(metrics.platformFees)}</div>
                      <div className="text-sm text-gray-600">10%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remittance History */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Remittance History</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Send Payment
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: "REM-001", amount: 43560, status: "sent", date: "2024-02-01T10:00:00Z", method: "Bank Transfer", reference: "TXN-REM-001", description: "Q1 2024 payment" },
                    { id: "REM-002", amount: 43560, status: "sent", date: "2024-01-01T10:00:00Z", method: "Bank Transfer", reference: "TXN-REM-002", description: "December 2023 payment" },
                    { id: "REM-003", amount: 43560, status: "pending", date: "2024-03-01T10:00:00Z", method: "Bank Transfer", reference: "TXN-REM-003", description: "Q2 2024 payment" },
                    { id: "REM-004", amount: 21780, status: "sent", date: "2023-12-01T10:00:00Z", method: "PayPal", reference: "TXN-REM-004", description: "November 2023 payment" }
                  ].map((remittance) => (
                    <div key={remittance.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{remittance.description}</h4>
                          <p className="text-sm text-gray-600">{remittance.method} • {remittance.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatCurrency(remittance.amount)}</div>
                          <div className="text-sm text-gray-600">{formatDateTime(remittance.date)}</div>
                        </div>
                        <Badge className={`text-xs ${
                          remittance.status === 'sent' ? 'bg-green-100 text-green-800 border-green-200' :
                          remittance.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {remittance.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Organizer Payment Details */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Organizer Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Bank Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Name:</span>
                        <span className="text-gray-900">Tech Events Inc.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="text-gray-900">****1234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank:</span>
                        <span className="text-gray-900">Chase Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Routing:</span>
                        <span className="text-gray-900">****5678</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Payment Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="text-gray-900">Monthly</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Payment:</span>
                        <span className="text-gray-900">March 1, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Minimum Threshold:</span>
                        <span className="text-gray-900">{formatCurrency(100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="text-gray-900">Bank Transfer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default EventDetailsPage;
