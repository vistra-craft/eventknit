import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Mic,
  Building2,
  DollarSign,
  Star,
  FileText,
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
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  Heart,
  Share2,
  MessageSquare,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CustomAreaChart, CustomBarChart, CustomPieChart } from "../../components/charts/ChartComponents";
import { CHART_COLORS } from "../../components/charts/chartConstants";

const EventManagement = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  // Mock event data - in a real app, this would come from your API
  const eventData = {
    id: eventId || "1",
    title: "Tech Innovation Summit 2024",
    date: "March 15-17, 2024",
    time: "9:00 AM - 5:00 PM",
    location: "San Francisco, CA",
    venue: "Moscone Center",
    status: "active",
    attendees: 485,
    capacity: 500,
    revenue: 145200,
    views: 3250,
    conversion: 14.9,
    speakers: 24,
    exhibitors: 18,
    sponsors: 12,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
    description: "Explore the latest in technology innovation and digital transformation.",
    category: "Technology"
  };

  // Mock data for different sections
  const attendees = [
    { id: 1, name: "Sarah Johnson", email: "sarah@example.com", ticketType: "VIP", status: "confirmed", registeredDate: "2024-01-15" },
    { id: 2, name: "Michael Chen", email: "michael@example.com", ticketType: "Standard", status: "confirmed", registeredDate: "2024-01-20" },
    { id: 3, name: "Emma Wilson", email: "emma@example.com", ticketType: "Student", status: "pending", registeredDate: "2024-02-01" },
  ];

  const speakers = [
    { id: 1, name: "Dr. Maria Rodriguez", title: "CTO at TechCorp", bio: "Expert in AI and Machine Learning", sessions: 3, status: "confirmed" },
    { id: 2, name: "John Smith", title: "VP of Engineering", bio: "Leading digital transformation initiatives", sessions: 2, status: "confirmed" },
    { id: 3, name: "Lisa Park", title: "Product Manager", bio: "Specialist in user experience design", sessions: 1, status: "pending" },
  ];

  const exhibitors = [
    { id: 1, name: "TechCorp", booth: "A-101", category: "Technology", contact: "contact@techcorp.com", status: "confirmed" },
    { id: 2, name: "InnovateLab", booth: "B-205", category: "Startup", contact: "hello@innovatelab.com", status: "confirmed" },
    { id: 3, name: "DataFlow", booth: "C-310", category: "Analytics", contact: "info@dataflow.com", status: "pending" },
  ];

  const sponsors = [
    { id: 1, name: "Gold Sponsor", company: "TechGiant Inc", amount: 50000, benefits: ["Logo on stage", "Booth space", "Speaking slot"] },
    { id: 2, name: "Silver Sponsor", company: "InnovateNow", amount: 25000, benefits: ["Logo on banners", "Booth space"] },
    { id: 3, name: "Bronze Sponsor", company: "StartupHub", amount: 10000, benefits: ["Logo on website"] },
  ];

  const sessions = [
    { id: 1, title: "Opening Keynote: Future of Technology", speaker: "Dr. Maria Rodriguez", time: "9:00 AM - 10:00 AM", room: "Main Hall", attendees: 485 },
    { id: 2, title: "AI and Machine Learning Workshop", speaker: "John Smith", time: "10:30 AM - 12:00 PM", room: "Room A", attendees: 120 },
    { id: 3, title: "Digital Transformation Panel", speaker: "Lisa Park", time: "2:00 PM - 3:30 PM", room: "Room B", attendees: 85 },
  ];

  const abstracts = [
    { id: 1, title: "Revolutionary AI Applications", author: "Dr. Sarah Kim", status: "approved", submittedDate: "2024-01-15", category: "Technology" },
    { id: 2, title: "Sustainable Tech Solutions", author: "Prof. David Lee", status: "under_review", submittedDate: "2024-01-20", category: "Sustainability" },
    { id: 3, title: "Future of Work", author: "Dr. Maria Garcia", status: "pending", submittedDate: "2024-02-01", category: "Business" },
  ];

  // Mock data for charts and analytics
  const registrationTrends = [
    { day: "Jan 1", registrations: 12 },
    { day: "Jan 2", registrations: 19 },
    { day: "Jan 3", registrations: 25 },
    { day: "Jan 4", registrations: 32 },
    { day: "Jan 5", registrations: 28 },
    { day: "Jan 6", registrations: 35 },
    { day: "Jan 7", registrations: 42 },
  ];

  const revenueBySource = [
    { name: "Ticket Sales", value: 70, amount: 101640 },
    { name: "Sponsorships", value: 20, amount: 29040 },
    { name: "Merchandise", value: 7, amount: 10164 },
    { name: "Donations", value: 3, amount: 4356 },
  ];

  const attendeeDemographics = [
    { age: "18-25", count: 85 },
    { age: "26-35", count: 142 },
    { age: "36-45", count: 98 },
    { age: "46-55", count: 67 },
    { age: "56+", count: 43 },
  ];

  const recentActivity = [
    { id: 1, type: "registration", message: "Sarah Johnson registered", time: "2 min ago", icon: Users, color: "text-green-600" },
    { id: 2, type: "payment", message: "Payment of $299 received", time: "5 min ago", icon: DollarSign, color: "text-blue-600" },
    { id: 3, type: "speaker", message: "New speaker confirmed", time: "12 min ago", icon: Mic, color: "text-purple-600" },
    { id: 4, type: "exhibitor", message: "Booth assignment completed", time: "18 min ago", icon: Building2, color: "text-orange-600" },
  ];

  const navigationSections = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "attendees", label: "Attendees", icon: Users },
    { key: "speakers", label: "Speakers", icon: Mic },
    { key: "exhibitors", label: "Exhibitors", icon: Building2 },
    { key: "sponsors", label: "Sponsors", icon: Star },
    { key: "revenue", label: "Revenue", icon: DollarSign },
    { key: "agenda", label: "Sessions", icon: Calendar },
    { key: "abstracts", label: "Abstracts", icon: FileText },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "attendees":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Attendees Management</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
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
                      <p className="text-2xl font-bold">{attendees.length}</p>
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
                      <p className="text-2xl font-bold">{attendees.filter(a => a.status === 'confirmed').length}</p>
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
                      <p className="text-2xl font-bold">{attendees.filter(a => a.status === 'pending').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Attendees List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {attendee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{attendee.name}</p>
                          <p className="text-sm text-muted-foreground">{attendee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{attendee.ticketType}</Badge>
                        <Badge className={getStatusColor(attendee.status)}>
                          {attendee.status}
                        </Badge>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

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
                      <p className="text-2xl font-bold">{speakers.length}</p>
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
                      <p className="text-2xl font-bold">{speakers.filter(s => s.status === 'confirmed').length}</p>
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
                      <p className="text-2xl font-bold">{speakers.reduce((sum, s) => sum + s.sessions, 0)}</p>
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
                  {speakers.map((speaker) => (
                    <div key={speaker.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {speaker.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{speaker.name}</p>
                          <p className="text-sm text-muted-foreground">{speaker.title}</p>
                          <p className="text-xs text-muted-foreground">{speaker.bio}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{speaker.sessions} sessions</Badge>
                        <Badge className={getStatusColor(speaker.status)}>
                          {speaker.status}
                        </Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "exhibitors":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Exhibitors Management</h3>
              <Button size="sm">
                <Building2 className="w-4 h-4 mr-2" />
                Add Exhibitor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Exhibitors</p>
                      <p className="text-2xl font-bold">{exhibitors.length}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-2xl font-bold">{exhibitors.filter(e => e.status === 'confirmed').length}</p>
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
                      <p className="text-2xl font-bold">{exhibitors.filter(e => e.status === 'pending').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Exhibitors List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exhibitors.map((exhibitor) => (
                    <div key={exhibitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {exhibitor.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{exhibitor.name}</p>
                          <p className="text-sm text-muted-foreground">Booth: {exhibitor.booth}</p>
                          <p className="text-xs text-muted-foreground">{exhibitor.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{exhibitor.category}</Badge>
                        <Badge className={getStatusColor(exhibitor.status)}>
                          {exhibitor.status}
                        </Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
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
                      <p className="text-2xl font-bold">{sponsors.length}</p>
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
                      <p className="text-2xl font-bold">${sponsors.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
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
                      <p className="text-2xl font-bold">{sponsors.filter(s => s.name.includes('Gold')).length}</p>
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
                  {sponsors.map((sponsor) => (
                    <div key={sponsor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {sponsor.company.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{sponsor.company}</p>
                          <p className="text-sm text-muted-foreground">{sponsor.name}</p>
                          <p className="text-xs text-muted-foreground">${sponsor.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{sponsor.name}</Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Revenue Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">${eventData.revenue.toLocaleString()}</p>
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
                      <p className="text-2xl font-bold">${(eventData.revenue * 0.7).toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sponsorships</p>
                      <p className="text-2xl font-bold">${(eventData.revenue * 0.3).toLocaleString()}</p>
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
                      <p className="text-2xl font-bold">{eventData.conversion}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">VIP Tickets</p>
                      <p className="text-sm text-muted-foreground">50 sold × $299</p>
                    </div>
                    <p className="font-bold">$14,950</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Standard Tickets</p>
                      <p className="text-sm text-muted-foreground">400 sold × $199</p>
                    </div>
                    <p className="font-bold">$79,600</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Student Tickets</p>
                      <p className="text-sm text-muted-foreground">35 sold × $99</p>
                    </div>
                    <p className="font-bold">$3,465</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Gold Sponsorship</p>
                      <p className="text-sm text-muted-foreground">1 × $50,000</p>
                    </div>
                    <p className="font-bold">$50,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "agenda":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Sessions & Agenda</h3>
              <Button size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Add Session
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sessions Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-muted-foreground">{session.speaker}</p>
                          <p className="text-xs text-muted-foreground">{session.time} • {session.room}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{session.attendees} attendees</Badge>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "abstracts":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Abstracts Management</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Review All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Abstracts</p>
                      <p className="text-2xl font-bold">{abstracts.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold">{abstracts.filter(a => a.status === 'approved').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Under Review</p>
                      <p className="text-2xl font-bold">{abstracts.filter(a => a.status === 'under_review').length}</p>
                    </div>
                    <Eye className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Abstracts List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {abstracts.map((abstract) => (
                    <div key={abstract.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {abstract.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{abstract.title}</p>
                          <p className="text-sm text-muted-foreground">{abstract.author}</p>
                          <p className="text-xs text-muted-foreground">{abstract.category} • {abstract.submittedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{abstract.category}</Badge>
                        <Badge className={getStatusColor(abstract.status)}>
                          {abstract.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="outline" size="sm">Review</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default: // overview
        return (
          <div className="space-y-8">
            {/* Hero Section with Image Left, Content Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Image - Left Side */}
              <div className="lg:col-span-1">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={eventData.image}
                    alt="Event background"
                    className="w-full h-80 lg:h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                      {eventData.category}
                    </Badge>
                    <div className="flex items-center gap-4 text-white/90 text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>2.3k</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        <span>156</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>89</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Details - Right Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Header */}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {eventData.title}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4">
                    {eventData.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{eventData.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{eventData.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{eventData.venue}, {eventData.location}</span>
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
                          <p className="text-2xl font-bold text-primary">{eventData.attendees}</p>
                          <p className="text-xs text-muted-foreground">of {eventData.capacity}</p>
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
                          <p className="text-2xl font-bold text-blue-600">{eventData.speakers}</p>
                          <p className="text-xs text-muted-foreground">confirmed</p>
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
                          <p className="text-2xl font-bold text-green-600">${eventData.revenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">total</p>
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
                          <p className="text-2xl font-bold text-purple-600">{eventData.conversion}%</p>
                          <p className="text-xs text-muted-foreground">rate</p>
                        </div>
                        <Target className="w-8 h-8 text-purple-500/60" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview Event
                  </Button>
                  <Button variant="outline" size="lg" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Event Settings
                  </Button>
                  <Button variant="outline" size="lg" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Event
                  </Button>
                </div>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registration Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Registration Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomAreaChart
                    data={registrationTrends}
                    xAxisKey="day"
                    areas={[
                      { dataKey: "registrations", name: "Registrations", color: CHART_COLORS.primary }
                    ]}
                    height={200}
                  />
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart
                    data={revenueBySource}
                    dataKey="value"
                    nameKey="name"
                    height={200}
                    colors={[CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error]}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Event Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">92</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Overall Health</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Registration Rate</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendee Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Attendee Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart
                    data={attendeeDemographics}
                    xAxisKey="age"
                    bars={[
                      { dataKey: "count", name: "Attendees", color: CHART_COLORS.primary }
                    ]}
                    height={150}
                  />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center`}>
                          <activity.icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Exhibitors</p>
                    <p className="text-xl font-bold">{eventData.exhibitors}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sponsors</p>
                    <p className="text-xl font-bold">{eventData.sponsors}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Eye className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Page Views</p>
                    <p className="text-xl font-bold">{eventData.views.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                    <p className="text-xl font-bold">+18%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/organizer/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{eventData.title}</h1>
                <p className="text-muted-foreground">Event Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Event Settings
              </Button>
              <Button size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview Event
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-8">
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
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
