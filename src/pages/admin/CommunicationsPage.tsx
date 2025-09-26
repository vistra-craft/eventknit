import { useState } from "react";
import { MessageSquare, Send, Users, Mail, Bell, Search, Filter, Eye, Edit, Trash2, Plus, Calendar, Clock, CheckCircle, AlertTriangle, X, Paperclip, Smile } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "./AdminLayout";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "general" | "maintenance" | "feature" | "urgent";
  status: "draft" | "scheduled" | "sent" | "cancelled";
  targetAudience: "all" | "organizers" | "attendees" | "admins";
  scheduledAt?: string;
  sentAt?: string;
  views: number;
  createdAt: string;
  createdBy: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  status: "active" | "inactive" | "expired";
  targetAudience: "all" | "organizers" | "attendees" | "admins";
  startDate: string;
  endDate?: string;
  views: number;
  clicks: number;
  createdAt: string;
  createdBy: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  category: "welcome" | "event" | "payment" | "notification" | "marketing";
  status: "active" | "inactive" | "draft";
  lastUsed: string;
  usageCount: number;
  createdAt: string;
  createdBy: string;
}

const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Platform Maintenance Scheduled",
    content: "We will be performing scheduled maintenance on Sunday, February 4th from 2:00 AM to 4:00 AM EST. During this time, the platform will be temporarily unavailable.",
    type: "maintenance",
    status: "sent",
    targetAudience: "all",
    sentAt: "2024-01-28 10:00:00",
    views: 1247,
    createdAt: "2024-01-28 09:30:00",
    createdBy: "admin_001"
  },
  {
    id: "2",
    title: "New Feature: Advanced Analytics",
    content: "We're excited to announce the launch of our new Advanced Analytics feature. Organizers can now access detailed insights about their events.",
    type: "feature",
    status: "scheduled",
    targetAudience: "organizers",
    scheduledAt: "2024-01-30 14:00:00",
    views: 0,
    createdAt: "2024-01-28 11:15:00",
    createdBy: "admin_002"
  },
  {
    id: "3",
    title: "Security Update Required",
    content: "Please update your passwords and enable two-factor authentication to ensure your account security.",
    type: "urgent",
    status: "draft",
    targetAudience: "all",
    views: 0,
    createdAt: "2024-01-28 13:45:00",
    createdBy: "admin_001"
  },
  {
    id: "4",
    title: "Monthly Newsletter - January 2024",
    content: "Check out our monthly newsletter featuring the latest platform updates, success stories, and upcoming events.",
    type: "general",
    status: "sent",
    targetAudience: "all",
    sentAt: "2024-01-25 09:00:00",
    views: 3456,
    createdAt: "2024-01-25 08:30:00",
    createdBy: "admin_003"
  }
];

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome to EventKnit!",
    message: "Get started by creating your first event or exploring our features.",
    type: "info",
    status: "active",
    targetAudience: "all",
    startDate: "2024-01-01 00:00:00",
    views: 8920,
    clicks: 1240,
    createdAt: "2024-01-01 00:00:00",
    createdBy: "system"
  },
  {
    id: "2",
    title: "Payment Processing Delay",
    message: "We're experiencing delays in payment processing. Please allow up to 24 hours for payments to be processed.",
    type: "warning",
    status: "active",
    targetAudience: "organizers",
    startDate: "2024-01-28 12:00:00",
    views: 456,
    clicks: 23,
    createdAt: "2024-01-28 12:00:00",
    createdBy: "admin_001"
  },
  {
    id: "3",
    title: "Event Registration Closing Soon",
    message: "Don't miss out! Event registration closes in 24 hours.",
    type: "info",
    status: "expired",
    targetAudience: "attendees",
    startDate: "2024-01-20 00:00:00",
    endDate: "2024-01-25 23:59:59",
    views: 2340,
    clicks: 567,
    createdAt: "2024-01-20 00:00:00",
    createdBy: "system"
  }
];

const mockEmailTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Welcome Email",
    subject: "Welcome to EventKnit!",
    description: "Welcome new users to the platform",
    category: "welcome",
    status: "active",
    lastUsed: "2024-01-28 14:30:00",
    usageCount: 1247,
    createdAt: "2024-01-01 00:00:00",
    createdBy: "admin_001"
  },
  {
    id: "2",
    name: "Event Confirmation",
    subject: "Your event has been created successfully",
    description: "Confirm event creation to organizers",
    category: "event",
    status: "active",
    lastUsed: "2024-01-28 13:15:00",
    usageCount: 892,
    createdAt: "2024-01-15 10:00:00",
    createdBy: "admin_002"
  },
  {
    id: "3",
    name: "Payment Receipt",
    subject: "Payment confirmation for your event",
    description: "Send payment receipts to users",
    category: "payment",
    status: "active",
    lastUsed: "2024-01-28 12:45:00",
    usageCount: 2340,
    createdAt: "2024-01-10 14:30:00",
    createdBy: "admin_001"
  },
  {
    id: "4",
    name: "Marketing Newsletter",
    subject: "Monthly EventKnit Newsletter",
    description: "Monthly newsletter for marketing purposes",
    category: "marketing",
    status: "draft",
    lastUsed: "2024-01-25 09:00:00",
    usageCount: 1,
    createdAt: "2024-01-20 16:00:00",
    createdBy: "admin_003"
  }
];

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  type: "sent" | "received";
}

const CommunicationsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "Admin",
      message: "Hello! How can I help you today?",
      timestamp: "2024-01-28 14:30:00",
      type: "received"
    },
    {
      id: "2",
      sender: "You",
      message: "I need help with my event setup",
      timestamp: "2024-01-28 14:32:00",
      type: "sent"
    },
    {
      id: "3",
      sender: "Admin",
      message: "I'd be happy to help you with that. What specific part of the event setup are you having trouble with?",
      timestamp: "2024-01-28 14:33:00",
      type: "received"
    }
  ]);

  const filteredAnnouncements = mockAnnouncements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || announcement.status === statusFilter;
    const matchesType = typeFilter === "all" || announcement.type === typeFilter;
    const matchesAudience = audienceFilter === "all" || announcement.targetAudience === audienceFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesAudience;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      sent: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      expired: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      general: "bg-blue-100 text-blue-800 border-blue-200",
      maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
      feature: "bg-green-100 text-green-800 border-green-200",
      urgent: "bg-red-100 text-red-800 border-red-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      error: "bg-red-100 text-red-800 border-red-200",
      success: "bg-green-100 text-green-800 border-green-200",
      welcome: "bg-purple-100 text-purple-800 border-purple-200",
      event: "bg-blue-100 text-blue-800 border-blue-200",
      payment: "bg-green-100 text-green-800 border-green-200",
      notification: "bg-orange-100 text-orange-800 border-orange-200",
      marketing: "bg-pink-100 text-pink-800 border-pink-200"
    };
    return variants[type as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getAudienceBadge = (audience: string) => {
    const variants = {
      all: "bg-gray-100 text-gray-800 border-gray-200",
      organizers: "bg-blue-100 text-blue-800 border-blue-200",
      attendees: "bg-green-100 text-green-800 border-green-200",
      admins: "bg-purple-100 text-purple-800 border-purple-200"
    };
    return variants[audience as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <AlertTriangle className="h-4 w-4" />;
      case "feature":
        return <CheckCircle className="h-4 w-4" />;
      case "urgent":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSendAnnouncement = (id: string) => {
    console.log("Sending announcement:", id);
    // TODO: Implement send logic
  };

  const handleEditAnnouncement = (id: string) => {
    console.log("Editing announcement:", id);
    // TODO: Implement edit logic
  };

  const handleDeleteAnnouncement = (id: string) => {
    console.log("Deleting announcement:", id);
    // TODO: Implement delete logic
  };

  const handleSendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "You",
        message: chatMessage,
        timestamp: new Date().toLocaleString(),
        type: "sent"
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage("");
      
      // Simulate admin response after 2 seconds
      setTimeout(() => {
        const adminResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "Admin",
          message: "Thank you for your message. I'll get back to you shortly.",
          timestamp: new Date().toLocaleString(),
          type: "received"
        };
        setChatMessages(prev => [...prev, adminResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-gray-600">Manage announcements, notifications, and email templates</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
            <Button size="sm" onClick={() => setShowChat(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {mockAnnouncements.filter(a => a.status === "sent").length}
              </div>
              <p className="text-sm text-gray-600">Sent Announcements</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {mockNotifications.filter(n => n.status === "active").length}
              </div>
              <p className="text-sm text-gray-600">Active Notifications</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {mockEmailTemplates.filter(t => t.status === "active").length}
              </div>
              <p className="text-sm text-gray-600">Active Templates</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {mockAnnouncements.reduce((sum, a) => sum + a.views, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Views</p>
            </CardContent>
          </Card>
        </div>

        {/* Communications Tabs */}
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-6">
            {/* Filters */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search announcements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Audiences</SelectItem>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="organizers">Organizers</SelectItem>
                      <SelectItem value="attendees">Attendees</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Announcements List */}
            <div className="space-y-3">
              {filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getTypeIcon(announcement.type)}
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">{announcement.title}</h3>
                          <Badge className={`text-xs ${getStatusBadge(announcement.status)}`}>
                            {announcement.status}
                          </Badge>
                          <Badge className={`text-xs ${getTypeBadge(announcement.type)}`}>
                            {announcement.type}
                          </Badge>
                          <Badge className={`text-xs ${getAudienceBadge(announcement.targetAudience)}`}>
                            {announcement.targetAudience}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{announcement.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Views: {announcement.views.toLocaleString()}</span>
                          <span>Created: {formatDate(announcement.createdAt)}</span>
                          {announcement.scheduledAt && (
                            <span>Scheduled: {formatDate(announcement.scheduledAt)}</span>
                          )}
                          {announcement.sentAt && (
                            <span>Sent: {formatDate(announcement.sentAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {announcement.status === "draft" && (
                          <Button 
                            size="sm"
                            onClick={() => handleSendAnnouncement(announcement.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Notifications List */}
            <div className="space-y-3">
              {mockNotifications.map((notification) => (
                <Card key={notification.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Bell className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <Badge className={`text-xs ${getStatusBadge(notification.status)}`}>
                            {notification.status}
                          </Badge>
                          <Badge className={`text-xs ${getTypeBadge(notification.type)}`}>
                            {notification.type}
                          </Badge>
                          <Badge className={`text-xs ${getAudienceBadge(notification.targetAudience)}`}>
                            {notification.targetAudience}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Views: {notification.views.toLocaleString()}</span>
                          <span>Clicks: {notification.clicks.toLocaleString()}</span>
                          <span>Start: {formatDate(notification.startDate)}</span>
                          {notification.endDate && (
                            <span>End: {formatDate(notification.endDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Email Templates List */}
            <div className="space-y-3">
              {mockEmailTemplates.map((template) => (
                <Card key={template.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <Badge className={`text-xs ${getStatusBadge(template.status)}`}>
                            {template.status}
                          </Badge>
                          <Badge className={`text-xs ${getTypeBadge(template.category)}`}>
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <p className="text-sm font-medium text-gray-900 mb-3">Subject: {template.subject}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Usage: {template.usageCount.toLocaleString()}</span>
                          <span>Last used: {formatDate(template.lastUsed)}</span>
                          <span>Created: {formatDate(template.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Live Chat Support</h3>
                    <p className="text-sm text-gray-600">Chat with our support team</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "sent" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === "sent"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === "sent" ? "text-primary-foreground/70" : "text-gray-500"
                      }`}>
                        {message.sender} • {formatDate(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="min-h-[40px] max-h-32 resize-none pr-20"
                      rows={1}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={!chatMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CommunicationsPage;
