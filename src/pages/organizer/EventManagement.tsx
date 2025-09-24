import React, { useState } from "react";
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
  MessageCircle,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";

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
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Event Overview</h3>
            
            {/* Event Banner */}
            <div className="relative rounded-2xl p-8 mb-8 text-white overflow-hidden">
              <img 
                src={eventData.image}
                alt="Event background"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold mb-2">{eventData.title}</h1>
                  <p className="text-white/80 text-sm">{eventData.category}</p>
                </div>
                
                <div className="mb-6">
                  <p className="text-xl font-semibold mb-2">{eventData.date}</p>
                  <p className="text-white/90">{eventData.location}</p>
                </div>
                
                <div className="bg-white/20 rounded-lg px-4 py-2 inline-block">
                  <span className="text-white font-medium">#{eventData.title.replace(/\s+/g, '')}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Attendees</p>
                      <p className="text-2xl font-bold">{eventData.attendees}/{eventData.capacity}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Speakers</p>
                      <p className="text-2xl font-bold">{eventData.speakers}</p>
                    </div>
                    <Mic className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Exhibitors</p>
                      <p className="text-2xl font-bold">{eventData.exhibitors}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">${eventData.revenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{eventData.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Date & Time
                      </h4>
                      <p className="text-muted-foreground">{eventData.date}</p>
                      <p className="text-muted-foreground">{eventData.time}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Location
                      </h4>
                      <p className="text-muted-foreground">{eventData.venue}</p>
                      <p className="text-muted-foreground">{eventData.location}</p>
                    </div>
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
