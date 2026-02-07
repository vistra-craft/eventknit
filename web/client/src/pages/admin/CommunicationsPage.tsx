import { useState, useEffect } from "react";
import { MessageSquare, Send, Mail, Bell, Search, Eye, Edit, Trash2, Plus, CheckCircle, AlertTriangle, X, Paperclip, Smile, Save, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "./AdminLayout";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/EmptyState";
import {
  getBulkMessages,
  createBulkMessage,
  updateBulkMessage,
  deleteBulkMessage,
  sendBulkMessage,
  cancelBulkMessage,
  type BulkMessage,
  type BulkMessageTargetAudience,
  type BulkMessageType,
} from "@/lib/bulk-message-api";
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "@/lib/email-template-api";

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
  subject?: string;
  description?: string;
  htmlContent: string;
  textContent?: string;
  category?: string;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Mock data removed - using bulk messages API instead
// Announcements and notifications are handled via bulk messages API
// Email templates now use email-template-api.ts

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  type: "sent" | "received";
}

const CommunicationsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  // Bulk Messages state
  const [bulkMessages, setBulkMessages] = useState<BulkMessage[]>([]);
  const [loadingBulkMessages, setLoadingBulkMessages] = useState(false);
  const [showBulkMessageForm, setShowBulkMessageForm] = useState(false);
  const [editingBulkMessage, setEditingBulkMessage] = useState<BulkMessage | null>(null);
  const [viewingBulkMessage, setViewingBulkMessage] = useState<BulkMessage | null>(null);
  const [bulkMessageForm, setBulkMessageForm] = useState({
    title: "",
    content: "",
    type: "announcement" as BulkMessageType,
    targetAudience: "ALL" as BulkMessageTargetAudience,
    eventId: "",
    channels: {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    },
    scheduledAt: "",
  });
  
  // State for announcements (using bulk messages API - these tabs can be removed or merged with bulk messages)
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  
  // State for notifications (using bulk messages API - these tabs can be removed or merged with bulk messages)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
  
  // State for email templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
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
    htmlContent: "",
    category: "notification" as string,
    isActive: true,
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
      draft: "bg-muted text-muted-foreground border-border",
      scheduled: "bg-primary/10 text-primary border-primary/20",
      sent: "bg-primary/10 text-primary border-primary/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20",
      active: "bg-primary/10 text-primary border-primary/20",
      inactive: "bg-muted text-muted-foreground border-border",
      expired: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return variants[status as keyof typeof variants] || "bg-muted text-muted-foreground border-border";
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      general: "bg-primary/10 text-primary border-primary/20",
      maintenance: "bg-warning/10 text-warning border-warning/20",
      feature: "bg-primary/10 text-primary border-primary/20",
      urgent: "bg-warning/10 text-warning border-warning/20",
      info: "bg-primary/10 text-primary border-primary/20",
      warning: "bg-warning/10 text-warning border-warning/20",
      error: "bg-destructive/10 text-destructive border-destructive/20",
      success: "bg-primary/10 text-primary border-primary/20",
      welcome: "bg-primary/10 text-primary border-primary/20",
      event: "bg-primary/10 text-primary border-primary/20",
      payment: "bg-primary/10 text-primary border-primary/20",
      notification: "bg-muted text-muted-foreground border-border",
      marketing: "bg-muted text-muted-foreground border-border"
    };
    return variants[type as keyof typeof variants] || "bg-muted text-muted-foreground border-border";
  };

  const getAudienceBadge = (audience: string) => {
    const variants = {
      all: "bg-muted text-muted-foreground border-border",
      organizers: "bg-primary/10 text-primary border-primary/20",
      attendees: "bg-primary/10 text-primary border-primary/20",
      admins: "bg-primary/10 text-primary border-primary/20"
    };
    return variants[audience as keyof typeof variants] || "bg-muted text-muted-foreground border-border";
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
  const loadEmailTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await getEmailTemplates();
      if (response.success && response.data) {
        setEmailTemplates(response.data.templates || []);
      }
    } catch (error) {
      console.error("Failed to load email templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await createEmailTemplate({
        name: templateForm.name,
        subject: templateForm.subject,
        description: templateForm.description,
        htmlContent: templateForm.htmlContent,
        category: templateForm.category,
        isActive: templateForm.isActive,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Email template created successfully.",
        });
        resetTemplateForm();
        setShowTemplateForm(false);
        loadEmailTemplates();
      }
    } catch (error) {
      console.error("Failed to create email template:", error);
      toast({
        title: "Error",
        description: "Failed to create email template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject || "",
      description: template.description || "",
      htmlContent: template.htmlContent,
      category: template.category || "notification",
      isActive: template.isActive,
    });
    setShowTemplateForm(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const response = await updateEmailTemplate(editingTemplate.id, {
        name: templateForm.name,
        subject: templateForm.subject,
        description: templateForm.description,
        htmlContent: templateForm.htmlContent,
        category: templateForm.category,
        isActive: templateForm.isActive,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Email template updated successfully.",
        });
        resetTemplateForm();
        setShowTemplateForm(false);
        setEditingTemplate(null);
        loadEmailTemplates();
      }
    } catch (error) {
      console.error("Failed to update email template:", error);
      toast({
        title: "Error",
        description: "Failed to update email template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this email template? This action cannot be undone.")) {
      try {
        const response = await deleteEmailTemplate(id);
        if (response.success) {
          toast({
            title: "Success",
            description: "Email template deleted successfully.",
          });
          loadEmailTemplates();
        }
      } catch (error) {
        console.error("Failed to delete email template:", error);
        toast({
          title: "Error",
          description: "Failed to delete email template. Please try again.",
          variant: "destructive",
        });
      }
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
      htmlContent: "",
      category: "notification",
      isActive: true,
    });
  };

  // Bulk Messages handlers
  const loadBulkMessages = async () => {
    try {
      setLoadingBulkMessages(true);
      const response = await getBulkMessages();
      if (response.success && response.data) {
        setBulkMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Failed to load bulk messages:", error);
      toast({
        title: "Error",
        description: "Failed to load bulk messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingBulkMessages(false);
    }
  };

  useEffect(() => {
    loadBulkMessages();
    loadEmailTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateBulkMessage = async () => {
    try {
      const response = await createBulkMessage({
        title: bulkMessageForm.title,
        content: bulkMessageForm.content,
        type: bulkMessageForm.type,
        targetAudience: bulkMessageForm.targetAudience,
        eventId: bulkMessageForm.eventId || undefined,
        channels: bulkMessageForm.channels,
        scheduledAt: bulkMessageForm.scheduledAt || undefined,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Bulk message created successfully.",
        });
        resetBulkMessageForm();
        setShowBulkMessageForm(false);
        loadBulkMessages();
      }
    } catch (error) {
      console.error("Failed to create bulk message:", error);
      toast({
        title: "Error",
        description: "Failed to create bulk message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBulkMessage = async () => {
    if (!editingBulkMessage) return;
    try {
      const response = await updateBulkMessage(editingBulkMessage.id, {
        title: bulkMessageForm.title,
        content: bulkMessageForm.content,
        type: bulkMessageForm.type,
        targetAudience: bulkMessageForm.targetAudience,
        eventId: bulkMessageForm.eventId || undefined,
        channels: bulkMessageForm.channels,
        scheduledAt: bulkMessageForm.scheduledAt || undefined,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Bulk message updated successfully.",
        });
        resetBulkMessageForm();
        setShowBulkMessageForm(false);
        setEditingBulkMessage(null);
        loadBulkMessages();
      }
    } catch (error) {
      console.error("Failed to update bulk message:", error);
      toast({
        title: "Error",
        description: "Failed to update bulk message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBulkMessage = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this bulk message? This action cannot be undone.")) {
      try {
        const response = await deleteBulkMessage(id);
        if (response.success) {
          toast({
            title: "Success",
            description: "Bulk message deleted successfully.",
          });
          loadBulkMessages();
        }
      } catch (error) {
        console.error("Failed to delete bulk message:", error);
        toast({
          title: "Error",
          description: "Failed to delete bulk message. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendBulkMessage = async (id: string) => {
    try {
      const response = await sendBulkMessage(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Bulk message sent successfully.",
        });
        loadBulkMessages();
      }
    } catch (error) {
      console.error("Failed to send bulk message:", error);
      toast({
        title: "Error",
        description: "Failed to send bulk message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelBulkMessage = async (id: string) => {
    try {
      const response = await cancelBulkMessage(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Bulk message cancelled successfully.",
        });
        loadBulkMessages();
      }
    } catch (error) {
      console.error("Failed to cancel bulk message:", error);
      toast({
        title: "Error",
        description: "Failed to cancel bulk message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditBulkMessage = (message: BulkMessage) => {
    setEditingBulkMessage(message);
    setBulkMessageForm({
      title: message.title,
      content: message.content,
      type: message.type,
      targetAudience: message.targetAudience,
      eventId: message.eventId || "",
      channels: {
        email: message.channels.email ?? true,
        sms: message.channels.sms ?? false,
        push: message.channels.push ?? true,
        inApp: message.channels.inApp ?? true,
      },
      scheduledAt: message.scheduledAt ? new Date(message.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setShowBulkMessageForm(true);
  };

  const handleViewBulkMessage = (message: BulkMessage) => {
    setViewingBulkMessage(message);
  };

  const resetBulkMessageForm = () => {
    setBulkMessageForm({
      title: "",
      content: "",
      type: "announcement",
      targetAudience: "ALL",
      eventId: "",
      channels: {
        email: true,
        sms: false,
        push: true,
        inApp: true,
      },
      scheduledAt: "",
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
            <h1 className="text-lg font-semibold text-foreground">Communications</h1>
            <p className="text-muted-foreground">Manage announcements, notifications, and email templates</p>
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
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-primary mb-2">
                {announcements.filter(a => a.status === "sent").length}
              </div>
              <p className="text-sm text-muted-foreground">Sent Announcements</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-primary mb-2">
                {notifications.filter(n => n.status === "active").length}
              </div>
              <p className="text-sm text-muted-foreground">Active Notifications</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-primary mb-2">
                {emailTemplates.filter(t => t.isActive).length}
              </div>
              <p className="text-sm text-muted-foreground">Active Templates</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-primary mb-2">
                {announcements.reduce((sum, a) => sum + a.views, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>
        </div>

        {/* Communications Tabs */}
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="bulk-messages">Bulk Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-6">
            {/* Filters */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
            {filteredAnnouncements.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No Announcements"
                description="Create your first announcement to communicate important updates, maintenance schedules, or new features to your users."
                action={{
                  label: "Create Announcement",
                  onClick: () => setShowAnnouncementForm(true),
                  icon: Plus,
                }}
              />
            ) : (
            <div className="space-y-3">
              {filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getTypeIcon(announcement.type)}
                          </div>
                          <h3 className="font-semibold text-foreground truncate">{announcement.title}</h3>
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
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{announcement.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Notifications List */}
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No Notifications"
                description="Set up system notifications to keep users informed about important updates, warnings, or information."
                action={{
                  label: "Create Notification",
                  onClick: () => setShowNotificationForm(true),
                  icon: Plus,
                }}
              />
            ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Bell className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
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
                        <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Email Templates List */}
            {loadingTemplates ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Loading email templates...</p>
                </CardContent>
              </Card>
            ) : emailTemplates.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No Email Templates"
                description="Create reusable email templates for welcome messages, event confirmations, payment receipts, and more to streamline your communications."
                action={{
                  label: "Create Template",
                  onClick: () => setShowTemplateForm(true),
                  icon: Plus,
                }}
              />
            ) : (
            <div className="space-y-3">
              {emailTemplates.map((template) => (
                <Card key={template.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          <Badge className={`text-xs ${template.isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge className={`text-xs ${getTypeBadge(template.category || 'notification')}`}>
                            {template.category || 'Notification'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.description || 'No description'}</p>
                        <p className="text-sm font-medium text-foreground mb-3">Subject: {template.subject || 'No subject'}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Usage: {template.usageCount.toLocaleString()}</span>
                          <span>Updated: {formatDate(template.updatedAt)}</span>
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
            )}
          </TabsContent>

          <TabsContent value="bulk-messages" className="space-y-6">
            {/* Bulk Messages Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Bulk Messages</h2>
                <p className="text-sm text-muted-foreground mt-1">Send messages to multiple users at once</p>
              </div>
              <Button onClick={() => { resetBulkMessageForm(); setShowBulkMessageForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Bulk Message
              </Button>
            </div>

            {/* Bulk Messages List */}
            {loadingBulkMessages ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Loading bulk messages...</p>
                </CardContent>
              </Card>
            ) : bulkMessages.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No Bulk Messages"
                description="Start communicating with your users by creating your first bulk message. Send announcements, updates, or marketing campaigns to all users or specific audiences."
                action={{
                  label: "Create Bulk Message",
                  onClick: () => setShowBulkMessageForm(true),
                  icon: Plus,
                }}
              />
            ) : (
              <div className="space-y-3">
                {bulkMessages.map((message) => (
                  <Card key={message.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground truncate">{message.title}</h3>
                            <Badge className={`text-xs ${getStatusBadge(message.status.toLowerCase())}`}>
                              {message.status}
                            </Badge>
                            <Badge className={`text-xs ${getTypeBadge(message.type)}`}>
                              {message.type}
                            </Badge>
                            <Badge className={`text-xs ${getAudienceBadge(message.targetAudience.toLowerCase())}`}>
                              {message.targetAudience}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{message.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Recipients: {message.totalRecipients.toLocaleString()}</span>
                            <span>Sent: {message.sentCount.toLocaleString()}</span>
                            {message.failedCount > 0 && (
                              <span className="text-destructive">Failed: {message.failedCount.toLocaleString()}</span>
                            )}
                            <span>Created: {formatDate(message.createdAt)}</span>
                            {message.scheduledAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Scheduled: {formatDate(message.scheduledAt)}
                              </span>
                            )}
                            {message.sentAt && (
                              <span>Sent: {formatDate(message.sentAt)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {message.channels.email && <Badge variant="secondary" className="text-xs">Email</Badge>}
                            {message.channels.sms && <Badge variant="secondary" className="text-xs">SMS</Badge>}
                            {message.channels.push && <Badge variant="secondary" className="text-xs">Push</Badge>}
                            {message.channels.inApp && <Badge variant="secondary" className="text-xs">In-App</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleViewBulkMessage(message)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {message.status === "DRAFT" && (
                            <>
                              <Button size="sm" onClick={() => handleSendBulkMessage(message.id)}>
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditBulkMessage(message)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </>
                          )}
                          {message.status === "SCHEDULED" && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelBulkMessage(message.id)}>
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBulkMessage(message.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                  value={templateForm.htmlContent}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, htmlContent: e.target.value }))}
                  placeholder="Enter HTML email content"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variables like {`{{user_name}}`}, {`{{event_title}}`}, etc. for dynamic content
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="template-active">Active Status</Label>
                  <p className="text-xs text-muted-foreground">Enable or disable this template</p>
                </div>
                <Switch
                  id="template-active"
                  checked={templateForm.isActive}
                  onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isActive: checked }))}
                />
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
                <div className="text-sm text-muted-foreground">
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
                <div className="text-sm text-muted-foreground">
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
                  <Badge className={viewingTemplate.isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}>
                    {viewingTemplate.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge className={getTypeBadge(viewingTemplate.category || 'notification')}>
                    {viewingTemplate.category || 'Notification'}
                  </Badge>
                  {viewingTemplate.isDefault && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">Default</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Subject:</h4>
                  <p className="text-sm bg-muted p-2 rounded">{viewingTemplate.subject || 'No subject'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p className="text-sm">{viewingTemplate.description || 'No description'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Email Content Preview:</h4>
                  <div
                    className="border rounded p-4 max-h-96 overflow-y-auto text-sm bg-background"
                    dangerouslySetInnerHTML={{ __html: viewingTemplate.htmlContent }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Created: {formatDate(viewingTemplate.createdAt)}</p>
                  <p>Last Updated: {formatDate(viewingTemplate.updatedAt)}</p>
                  <p>Usage: {viewingTemplate.usageCount.toLocaleString()} times</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Bulk Message Form Modal */}
        <Dialog open={showBulkMessageForm} onOpenChange={setShowBulkMessageForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBulkMessage ? "Edit Bulk Message" : "Create New Bulk Message"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-title">Title</Label>
                <Input
                  id="bulk-title"
                  value={bulkMessageForm.title}
                  onChange={(e) => setBulkMessageForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter message title"
                />
              </div>
              <div>
                <Label htmlFor="bulk-content">Content</Label>
                <Textarea
                  id="bulk-content"
                  value={bulkMessageForm.content}
                  onChange={(e) => setBulkMessageForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter message content"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulk-type">Type</Label>
                  <Select value={bulkMessageForm.type} onValueChange={(value) => setBulkMessageForm(prev => ({ ...prev, type: value as BulkMessageType }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="event_update">Event Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bulk-audience">Target Audience</Label>
                  <Select value={bulkMessageForm.targetAudience} onValueChange={(value) => setBulkMessageForm(prev => ({ ...prev, targetAudience: value as BulkMessageTargetAudience }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="ORGANIZERS">Organizers</SelectItem>
                      <SelectItem value="ATTENDEES">Attendees</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="SPECIFIC_EVENT">Specific Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {bulkMessageForm.targetAudience === "SPECIFIC_EVENT" && (
                <div>
                  <Label htmlFor="bulk-event-id">Event ID</Label>
                  <Input
                    id="bulk-event-id"
                    value={bulkMessageForm.eventId}
                    onChange={(e) => setBulkMessageForm(prev => ({ ...prev, eventId: e.target.value }))}
                    placeholder="Enter event ID"
                  />
                </div>
              )}
              <div>
                <Label>Delivery Channels</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="channel-email" className="cursor-pointer">Email</Label>
                    <Switch
                      id="channel-email"
                      checked={bulkMessageForm.channels.email}
                      onCheckedChange={(checked) => setBulkMessageForm(prev => ({ ...prev, channels: { ...prev.channels, email: checked } }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="channel-sms" className="cursor-pointer">SMS</Label>
                    <Switch
                      id="channel-sms"
                      checked={bulkMessageForm.channels.sms}
                      onCheckedChange={(checked) => setBulkMessageForm(prev => ({ ...prev, channels: { ...prev.channels, sms: checked } }))}
                      disabled={true}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="channel-push" className="cursor-pointer">Push</Label>
                    <Switch
                      id="channel-push"
                      checked={bulkMessageForm.channels.push}
                      onCheckedChange={(checked) => setBulkMessageForm(prev => ({ ...prev, channels: { ...prev.channels, push: checked } }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="channel-inapp" className="cursor-pointer">In-App</Label>
                    <Switch
                      id="channel-inapp"
                      checked={bulkMessageForm.channels.inApp}
                      onCheckedChange={(checked) => setBulkMessageForm(prev => ({ ...prev, channels: { ...prev.channels, inApp: checked } }))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="bulk-scheduled">Schedule (Optional)</Label>
                <Input
                  id="bulk-scheduled"
                  type="datetime-local"
                  value={bulkMessageForm.scheduledAt}
                  onChange={(e) => setBulkMessageForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to send immediately</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowBulkMessageForm(false); resetBulkMessageForm(); setEditingBulkMessage(null); }}>
                  Cancel
                </Button>
                <Button onClick={editingBulkMessage ? handleUpdateBulkMessage : handleCreateBulkMessage}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingBulkMessage ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Message View Modal */}
        {viewingBulkMessage && (
          <Dialog open={!!viewingBulkMessage} onOpenChange={() => setViewingBulkMessage(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewingBulkMessage.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getStatusBadge(viewingBulkMessage.status.toLowerCase())}>
                    {viewingBulkMessage.status}
                  </Badge>
                  <Badge className={getTypeBadge(viewingBulkMessage.type)}>
                    {viewingBulkMessage.type}
                  </Badge>
                  <Badge className={getAudienceBadge(viewingBulkMessage.targetAudience.toLowerCase())}>
                    {viewingBulkMessage.targetAudience}
                  </Badge>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{viewingBulkMessage.content}</p>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Recipients: {viewingBulkMessage.totalRecipients.toLocaleString()}</p>
                  <p>Sent: {viewingBulkMessage.sentCount.toLocaleString()}</p>
                  {viewingBulkMessage.failedCount > 0 && (
                    <p className="text-destructive">Failed: {viewingBulkMessage.failedCount.toLocaleString()}</p>
                  )}
                  <p>Created: {formatDate(viewingBulkMessage.createdAt)}</p>
                  {viewingBulkMessage.scheduledAt && (
                    <p>Scheduled: {formatDate(viewingBulkMessage.scheduledAt)}</p>
                  )}
                  {viewingBulkMessage.sentAt && (
                    <p>Sent: {formatDate(viewingBulkMessage.sentAt)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label>Channels:</Label>
                  {viewingBulkMessage.channels.email && <Badge variant="secondary">Email</Badge>}
                  {viewingBulkMessage.channels.sms && <Badge variant="secondary">SMS</Badge>}
                  {viewingBulkMessage.channels.push && <Badge variant="secondary">Push</Badge>}
                  {viewingBulkMessage.channels.inApp && <Badge variant="secondary">In-App</Badge>}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col scrollbar-hide">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Live Chat Support</h3>
                    <p className="text-sm text-muted-foreground">Chat with our support team</p>
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
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === "sent" ? "text-primary-foreground/70" : "text-muted-foreground"
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
