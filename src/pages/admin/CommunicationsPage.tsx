import { useState } from "react";
import { MessageSquare, Send, Mail, Bell, Search, Eye, Edit, Trash2, Plus, CheckCircle, AlertTriangle, X, Paperclip, Smile, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  content: string;
  category: "welcome" | "event" | "payment" | "notification" | "marketing" | "reminder" | "promotional";
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
    content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to EventKnit</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Welcome to EventKnit!</h1>
        <p>Hi {{user_name}},</p>
        <p>We're thrilled to have you join the EventKnit community! You now have access to powerful event management tools that will help you create, manage, and promote amazing events.</p>
        
        <h2>Getting Started:</h2>
        <ul>
            <li>Create your first event</li>
            <li>Set up your organizer profile</li>
            <li>Explore our analytics dashboard</li>
            <li>Connect with our support team</li>
        </ul>
        
        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The EventKnit Team</p>
    </div>
</body>
</html>`,
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
    subject: "Your event '{{event_title}}' has been created successfully",
    description: "Confirm event creation to organizers",
    content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Created Successfully</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Event Created Successfully!</h1>
        <p>Hi {{organizer_name}},</p>
        <p>Congratulations! Your event "<strong>{{event_title}}</strong>" has been successfully created and is now live on EventKnit.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Event Details:</h3>
            <p><strong>Event:</strong> {{event_title}}</p>
            <p><strong>Date:</strong> {{event_date}}</p>
            <p><strong>Location:</strong> {{event_location}}</p>
            <p><strong>Event URL:</strong> <a href="{{event_url}}">{{event_url}}</a></p>
        </div>
        
        <p>You can now start promoting your event and managing registrations through your organizer dashboard.</p>
        <p>Best of luck with your event!</p>
        <p>The EventKnit Team</p>
    </div>
</body>
</html>`,
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
    subject: "Payment confirmation for {{event_title}}",
    description: "Send payment receipts to users",
    content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Payment Confirmed!</h1>
        <p>Hi {{attendee_name}},</p>
        <p>Thank you for your purchase! Your payment has been successfully processed.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p><strong>Event:</strong> {{event_title}}</p>
            <p><strong>Date:</strong> {{event_date}}</p>
            <p><strong>Tickets:</strong> {{ticket_quantity}} x {{ticket_type}}</p>
            <p><strong>Total Amount:</strong> \${{total_amount}}</p>
            <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
        </div>
        
        <p>Your tickets have been sent to your email. Please bring a valid ID to the event.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you for choosing EventKnit!</p>
    </div>
</body>
</html>`,
    category: "payment",
    status: "active",
    lastUsed: "2024-01-28 12:45:00",
    usageCount: 2340,
    createdAt: "2024-01-10 14:30:00",
    createdBy: "admin_001"
  },
  {
    id: "4",
    name: "Event Reminder",
    subject: "Don't forget! {{event_title}} is tomorrow",
    description: "Remind attendees about upcoming events",
    content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Event Reminder</h1>
        <p>Hi {{attendee_name}},</p>
        <p>This is a friendly reminder that <strong>{{event_title}}</strong> is happening tomorrow!</p>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3>Event Details:</h3>
            <p><strong>Event:</strong> {{event_title}}</p>
            <p><strong>Date:</strong> {{event_date}}</p>
            <p><strong>Time:</strong> {{event_time}}</p>
            <p><strong>Location:</strong> {{event_location}}</p>
        </div>
        
        <p>Please arrive 15 minutes early for check-in. Don't forget to bring your ticket and a valid ID.</p>
        <p>We're excited to see you there!</p>
        <p>The EventKnit Team</p>
    </div>
</body>
</html>`,
    category: "reminder",
    status: "active",
    lastUsed: "2024-01-28 10:30:00",
    usageCount: 1567,
    createdAt: "2024-01-05 09:00:00",
    createdBy: "admin_001"
  },
  {
    id: "5",
    name: "Marketing Newsletter",
    subject: "Monthly EventKnit Newsletter - {{month}} {{year}}",
    description: "Monthly newsletter for marketing purposes",
    content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>EventKnit Newsletter</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">EventKnit Newsletter</h1>
        <p>Hi {{subscriber_name}},</p>
        <p>Welcome to our monthly newsletter! Here's what's happening in the EventKnit community this month.</p>
        
        <h2>Featured Events</h2>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>{{featured_event_title}}</h3>
            <p>{{featured_event_description}}</p>
            <p><strong>Date:</strong> {{featured_event_date}}</p>
        </div>
        
        <h2>Platform Updates</h2>
        <ul>
            <li>New analytics dashboard</li>
            <li>Enhanced mobile app</li>
            <li>Improved payment processing</li>
        </ul>
        
        <p>Thank you for being part of the EventKnit community!</p>
        <p>The EventKnit Team</p>
    </div>
</body>
</html>`,
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
  
  // State for announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
  
  // State for email templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<EmailTemplate | null>(null);
  
  // Form data states
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "general" as "general" | "maintenance" | "feature" | "urgent",
    targetAudience: "all" as "all" | "organizers" | "attendees" | "admins",
    scheduledAt: ""
  });
  
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "error" | "success",
    targetAudience: "all" as "all" | "organizers" | "attendees" | "admins",
    startDate: "",
    endDate: ""
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    description: "",
    content: "",
    category: "welcome" as "welcome" | "event" | "payment" | "notification" | "marketing" | "reminder" | "promotional"
  });
  
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

  const filteredAnnouncements = announcements.filter(announcement => {
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

  // Announcement handlers
  const handleCreateAnnouncement = () => {
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: announcementForm.title,
      content: announcementForm.content,
      type: announcementForm.type,
      status: "draft",
      targetAudience: announcementForm.targetAudience,
      scheduledAt: announcementForm.scheduledAt || undefined,
      views: 0,
      createdAt: new Date().toISOString(),
      createdBy: "current_admin"
    };
    setAnnouncements(prev => [...prev, newAnnouncement]);
    resetAnnouncementForm();
    setShowAnnouncementForm(false);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      targetAudience: announcement.targetAudience,
      scheduledAt: announcement.scheduledAt || ""
    });
    setShowAnnouncementForm(true);
  };

  const handleUpdateAnnouncement = () => {
    if (!editingAnnouncement) return;
    
    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === editingAnnouncement.id 
        ? { ...announcement, ...announcementForm, updatedAt: new Date().toISOString() }
        : announcement
    ));
    resetAnnouncementForm();
    setShowAnnouncementForm(false);
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    }
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setViewingAnnouncement(announcement);
  };

  const handleSendAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === id 
        ? { ...announcement, status: "sent" as const, sentAt: new Date().toISOString() }
        : announcement
    ));
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: "",
      content: "",
      type: "general",
      targetAudience: "all",
      scheduledAt: ""
    });
  };

  // Notification handlers
  const handleCreateNotification = () => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: notificationForm.title,
      message: notificationForm.message,
      type: notificationForm.type,
      status: "active",
      targetAudience: notificationForm.targetAudience,
      startDate: notificationForm.startDate,
      endDate: notificationForm.endDate || undefined,
      views: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
      createdBy: "current_admin"
    };
    setNotifications(prev => [...prev, newNotification]);
    resetNotificationForm();
    setShowNotificationForm(false);
  };

  const handleEditNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetAudience: notification.targetAudience,
      startDate: notification.startDate,
      endDate: notification.endDate || ""
    });
    setShowNotificationForm(true);
  };

  const handleUpdateNotification = () => {
    if (!editingNotification) return;
    
    setNotifications(prev => prev.map(notification => 
      notification.id === editingNotification.id 
        ? { ...notification, ...notificationForm }
        : notification
    ));
    resetNotificationForm();
    setShowNotificationForm(false);
    setEditingNotification(null);
  };

  const handleDeleteNotification = (id: string) => {
    if (window.confirm("Are you sure you want to delete this notification? This action cannot be undone.")) {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }
  };

  const handleViewNotification = (notification: Notification) => {
    setViewingNotification(notification);
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      title: "",
      message: "",
      type: "info",
      targetAudience: "all",
      startDate: "",
      endDate: ""
    });
  };

  // Email template handlers
  const handleCreateTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: templateForm.name,
      subject: templateForm.subject,
      description: templateForm.description,
      content: templateForm.content,
      category: templateForm.category,
      status: "draft",
      lastUsed: "",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: "current_admin"
    };
    setEmailTemplates(prev => [...prev, newTemplate]);
    resetTemplateForm();
    setShowTemplateForm(false);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      description: template.description,
      content: template.content,
      category: template.category
    });
    setShowTemplateForm(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    
    setEmailTemplates(prev => prev.map(template => 
      template.id === editingTemplate.id 
        ? { ...template, ...templateForm }
        : template
    ));
    resetTemplateForm();
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("Are you sure you want to delete this email template? This action cannot be undone.")) {
      setEmailTemplates(prev => prev.filter(template => template.id !== id));
    }
  };

  const handleViewTemplate = (template: EmailTemplate) => {
    setViewingTemplate(template);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      subject: "",
      description: "",
      content: "",
      category: "welcome"
    });
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
            <Button variant="outline" size="sm" onClick={() => setShowAnnouncementForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowNotificationForm(true)}>
              <Bell className="h-4 w-4 mr-2" />
              New Notification
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTemplateForm(true)}>
              <Mail className="h-4 w-4 mr-2" />
              New Template
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
                {announcements.filter(a => a.status === "sent").length}
              </div>
              <p className="text-sm text-gray-600">Sent Announcements</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {notifications.filter(n => n.status === "active").length}
              </div>
              <p className="text-sm text-gray-600">Active Notifications</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {emailTemplates.filter(t => t.status === "active").length}
              </div>
              <p className="text-sm text-gray-600">Active Templates</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {announcements.reduce((sum, a) => sum + a.views, 0)}
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
                        <Button variant="outline" size="sm" onClick={() => handleViewAnnouncement(announcement)}>
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
                        <Button variant="outline" size="sm" onClick={() => handleEditAnnouncement(announcement)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAnnouncement(announcement.id)}>
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
              {notifications.map((notification) => (
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
                        <Button variant="outline" size="sm" onClick={() => handleViewNotification(notification)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditNotification(notification)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNotification(notification.id)}>
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
              {emailTemplates.map((template) => (
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
                          <span>Last used: {template.lastUsed ? formatDate(template.lastUsed) : 'Never'}</span>
                          <span>Created: {formatDate(template.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleViewTemplate(template)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
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

        {/* Announcement Form Modal */}
        <Dialog open={showAnnouncementForm} onOpenChange={setShowAnnouncementForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title"
                />
              </div>
              <div>
                <Label htmlFor="announcement-content">Content</Label>
                <Textarea
                  id="announcement-content"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter announcement content"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="announcement-type">Type</Label>
                  <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm(prev => ({ ...prev, type: value as "general" | "maintenance" | "feature" | "urgent" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="announcement-audience">Target Audience</Label>
                  <Select value={announcementForm.targetAudience} onValueChange={(value) => setAnnouncementForm(prev => ({ ...prev, targetAudience: value as "all" | "organizers" | "attendees" | "admins" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="organizers">Organizers</SelectItem>
                      <SelectItem value="attendees">Attendees</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="announcement-schedule">Schedule (Optional)</Label>
                <Input
                  id="announcement-schedule"
                  type="datetime-local"
                  value={announcementForm.scheduledAt}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAnnouncementForm(false)}>
                  Cancel
                </Button>
                <Button onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingAnnouncement ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Form Modal */}
        <Dialog open={showNotificationForm} onOpenChange={setShowNotificationForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? "Edit Notification" : "Create New Notification"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notification-title">Title</Label>
                <Input
                  id="notification-title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                />
              </div>
              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notification message"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification-type">Type</Label>
                  <Select value={notificationForm.type} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value as "info" | "warning" | "error" | "success" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notification-audience">Target Audience</Label>
                  <Select value={notificationForm.targetAudience} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, targetAudience: value as "all" | "organizers" | "attendees" | "admins" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="organizers">Organizers</SelectItem>
                      <SelectItem value="attendees">Attendees</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification-start">Start Date</Label>
                  <Input
                    id="notification-start"
                    type="datetime-local"
                    value={notificationForm.startDate}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notification-end">End Date (Optional)</Label>
                  <Input
                    id="notification-end"
                    type="datetime-local"
                    value={notificationForm.endDate}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNotificationForm(false)}>
                  Cancel
                </Button>
                <Button onClick={editingNotification ? handleUpdateNotification : handleCreateNotification}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingNotification ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Template Form Modal */}
        <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Email Template" : "Create New Email Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select value={templateForm.category} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value as "welcome" | "event" | "payment" | "notification" | "marketing" | "reminder" | "promotional" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <Label htmlFor="template-content">Email Content (HTML)</Label>
                <Textarea
                  id="template-content"
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter HTML email content"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables like {`{{user_name}}`}, {`{{event_title}}`}, etc. for dynamic content
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTemplateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Modals */}
        {/* Announcement View Modal */}
        {viewingAnnouncement && (
          <Dialog open={!!viewingAnnouncement} onOpenChange={() => setViewingAnnouncement(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewingAnnouncement.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getStatusBadge(viewingAnnouncement.status)}>
                    {viewingAnnouncement.status}
                  </Badge>
                  <Badge className={getTypeBadge(viewingAnnouncement.type)}>
                    {viewingAnnouncement.type}
                  </Badge>
                  <Badge className={getAudienceBadge(viewingAnnouncement.targetAudience)}>
                    {viewingAnnouncement.targetAudience}
                  </Badge>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{viewingAnnouncement.content}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Created: {formatDate(viewingAnnouncement.createdAt)}</p>
                  <p>Views: {viewingAnnouncement.views.toLocaleString()}</p>
                  {viewingAnnouncement.scheduledAt && (
                    <p>Scheduled: {formatDate(viewingAnnouncement.scheduledAt)}</p>
                  )}
                  {viewingAnnouncement.sentAt && (
                    <p>Sent: {formatDate(viewingAnnouncement.sentAt)}</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Notification View Modal */}
        {viewingNotification && (
          <Dialog open={!!viewingNotification} onOpenChange={() => setViewingNotification(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewingNotification.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getStatusBadge(viewingNotification.status)}>
                    {viewingNotification.status}
                  </Badge>
                  <Badge className={getTypeBadge(viewingNotification.type)}>
                    {viewingNotification.type}
                  </Badge>
                  <Badge className={getAudienceBadge(viewingNotification.targetAudience)}>
                    {viewingNotification.targetAudience}
                  </Badge>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{viewingNotification.message}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Created: {formatDate(viewingNotification.createdAt)}</p>
                  <p>Views: {viewingNotification.views.toLocaleString()}</p>
                  <p>Clicks: {viewingNotification.clicks.toLocaleString()}</p>
                  <p>Start: {formatDate(viewingNotification.startDate)}</p>
                  {viewingNotification.endDate && (
                    <p>End: {formatDate(viewingNotification.endDate)}</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Email Template View Modal */}
        {viewingTemplate && (
          <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewingTemplate.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getStatusBadge(viewingTemplate.status)}>
                    {viewingTemplate.status}
                  </Badge>
                  <Badge className={getTypeBadge(viewingTemplate.category)}>
                    {viewingTemplate.category}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Subject:</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">{viewingTemplate.subject}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p className="text-sm">{viewingTemplate.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Email Content Preview:</h4>
                  <div 
                    className="border rounded p-4 max-h-96 overflow-y-auto text-sm"
                    dangerouslySetInnerHTML={{ __html: viewingTemplate.content }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>Created: {formatDate(viewingTemplate.createdAt)}</p>
                  <p>Usage: {viewingTemplate.usageCount.toLocaleString()} times</p>
                  <p>Last used: {viewingTemplate.lastUsed ? formatDate(viewingTemplate.lastUsed) : 'Never'}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col scrollbar-hide">
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
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
