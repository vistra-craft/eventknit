import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Eye,
  Reply,
  Tag,
  X,
  Paperclip,
  Smile,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Globe,
  Flag,
  Settings,
  BarChart3,
  Bell,
  Zap,
  TrendingUp,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/EmptyState";
import {
  getSocialMessages,
  updateMessageStatus,
  addMessageResponse,
  type SocialMessage,
} from "@/lib/social-media-api";
import {
  getSupportInbox,
  getSupportStatistics,
  type SupportQuery as ApiSupportQuery,
} from "@/lib/support-api";
import {
  listContactQueries,
  getContactQuery,
  updateContactQueryStatus,
  replyToContactQuery,
  addContactQueryNote,
  type ContactQuery,
  type ContactQueryDetail,
  type ContactQueryStatus,
} from "@/lib/contact-api";
import { showErrorToast } from "@/lib/utils/error";
import type {
  SupportQuery,
  SupportResponse,
  SocialPlatform,
  QueryStatus,
  QueryPriority,
  QueryCategory,
  SupportMetrics
} from "@/types/support";
// Default metrics values
const defaultMetrics: SupportMetrics = {
  totalQueries: 0,
  newQueries: 0,
  inProgressQueries: 0,
  resolvedToday: 0,
  averageResponseTime: 0,
  customerSatisfaction: 0,
  platformBreakdown: {
    website: 0,
    whatsapp: 0,
    facebook: 0,
    instagram: 0,
    twitter: 0,
    linkedin: 0,
    email: 0
  },
  categoryBreakdown: {
    technical_support: 0,
    general_inquiry: 0,
    billing: 0,
    event_management: 0,
    account_issues: 0,
    feature_request: 0,
    complaint: 0,
    partnership: 0,
    other: 0
  },
  priorityBreakdown: {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0
  }
};

const SupportPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueryStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<QueryPriority | "all">("all");
  const [categoryFilter] = useState<QueryCategory | "all">("all");
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);

  // API-driven state
  const [socialMessages, setSocialMessages] = useState<SocialMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [, setLoadingQueries] = useState(true);
  const [, setLoadingStats] = useState(true);

  // Support queries from API
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics>(defaultMetrics);

  // Contact queries (website form submissions)
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([]);
  const [contactQueryTotal, setContactQueryTotal] = useState(0);
  const [loadingContactQueries, setLoadingContactQueries] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState<ContactQueryStatus | "all">("all");

  // Contact query detail / reply modal
  const [selectedContact, setSelectedContact] = useState<ContactQueryDetail | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactReply, setContactReply] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [sendingContactReply, setSendingContactReply] = useState(false);
  const [contactTab, setContactTab] = useState<"reply" | "note">("reply");
  const contactReplyRef = useRef<HTMLTextAreaElement | undefined>(undefined);

  // Load support queries from API
  const loadSupportQueries = async () => {
    try {
      setLoadingQueries(true);
      const response = await getSupportInbox();
      if (response.success && response.data) {
        const allQueries = response.data.queries || [];
        // Map API response to component types
        const mappedQueries: SupportQuery[] = allQueries.map((q: ApiSupportQuery) => ({
          id: q.id,
          platform: (q.platform?.toLowerCase() || q.channel || 'website') as SocialPlatform,
          senderName: q.senderName,
          senderHandle: q.senderHandle || q.senderEmail || '',
          senderId: q.id,
          message: q.message,
          status: q.status.toLowerCase().replace('_', '_') as QueryStatus,
          priority: q.priority.toLowerCase() as QueryPriority,
          category: (q.category || 'general_inquiry') as QueryCategory,
          assignedTo: q.assignedTo,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          tags: [],
          responses: [],
          metadata: {}
        }));

        setQueries(mappedQueries.filter(q => q.platform !== 'website'));
      }
    } catch (error) {
      console.error("Failed to load support queries:", error);
      showErrorToast(toast, error, "Failed to load support queries.");
    } finally {
      setLoadingQueries(false);
    }
  };

  // Load support statistics from API
  const loadSupportStats = async () => {
    try {
      setLoadingStats(true);
      const response = await getSupportStatistics();
      if (response.success && response.data) {
        const stats = response.data.statistics;
        setMetrics({
          ...defaultMetrics,
          totalQueries: stats.total,
          newQueries: stats.byStatus.new,
          inProgressQueries: stats.byStatus.inProgress,
          resolvedToday: stats.byStatus.resolved,
          averageResponseTime: Math.round(stats.averageResponseTime / 60000), // Convert ms to minutes
          customerSatisfaction: stats.resolutionRate / 20, // Convert percentage to 5-star scale
          platformBreakdown: { ...defaultMetrics.platformBreakdown, ...stats.byPlatform },
          priorityBreakdown: { ...defaultMetrics.priorityBreakdown, ...stats.byPriority }
        });
      }
    } catch (error) {
      console.error("Failed to load support statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load social media messages from API
  const loadSocialMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await getSocialMessages();
      if (response.success && response.data) {
        setSocialMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load social messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadContactQueries = async () => {
    try {
      setLoadingContactQueries(true);
      const res = await listContactQueries({
        search: contactSearch || undefined,
        status: contactStatusFilter !== "all" ? contactStatusFilter : undefined,
        limit: 50,
      });
      if (res.success && res.data) {
        setContactQueries(res.data.queries);
        setContactQueryTotal(res.data.total);
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to load website queries.");
    } finally {
      setLoadingContactQueries(false);
    }
  };

  const openContactDetail = async (id: string) => {
    try {
      const res = await getContactQuery(id);
      if (res.success && res.data) {
        setSelectedContact(res.data.query);
        setShowContactModal(true);
        setContactTab("reply");
        setContactReply("");
        setContactNote("");
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to load message details.");
    }
  };

  const handleContactReply = async () => {
    if (!selectedContact || !contactReply.trim()) return;
    setSendingContactReply(true);
    try {
      const res = await replyToContactQuery(selectedContact.id, contactReply.trim());
      if (res.success && res.data) {
        toast({ title: "Reply sent", description: `Email dispatched to ${selectedContact.email}` });
        setSelectedContact((prev) =>
          prev ? { ...prev, responses: [...prev.responses, res.data!.response] } : prev,
        );
        setContactReply("");
        loadContactQueries();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to send reply.");
    } finally {
      setSendingContactReply(false);
    }
  };

  const handleContactNote = async () => {
    if (!selectedContact || !contactNote.trim()) return;
    setSendingContactReply(true);
    try {
      const res = await addContactQueryNote(selectedContact.id, contactNote.trim());
      if (res.success && res.data) {
        toast({ title: "Note saved" });
        setSelectedContact((prev) =>
          prev ? { ...prev, responses: [...prev.responses, res.data!.response] } : prev,
        );
        setContactNote("");
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to save note.");
    } finally {
      setSendingContactReply(false);
    }
  };

  const handleContactStatusChange = async (id: string, status: ContactQueryStatus) => {
    try {
      await updateContactQueryStatus(id, status);
      setContactQueries((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
      if (selectedContact?.id === id) {
        setSelectedContact((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to update status.");
    }
  };

  useEffect(() => {
    loadSupportQueries();
    loadSupportStats();
    loadSocialMessages();
    loadContactQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case "whatsapp":
        return <MessageCircle className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "website":
        return <Globe className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: SocialPlatform) => {
    switch (platform) {
      case "whatsapp":
        return "bg-success/10 text-success border-success";
      case "facebook":
        return "bg-primary/10 text-primary border-primary";
      case "instagram":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "twitter":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "linkedin":
        return "bg-primary/10 text-primary border-primary";
      case "email":
        return "bg-muted text-gray-800 border-gray-200";
      case "website":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  const getStatusBadge = (status: QueryStatus) => {
    const variants = {
      new: "bg-primary/10 text-primary border-primary",
      in_progress: "bg-warning/10 text-warning border-warning",
      waiting_for_customer: "bg-orange-100 text-orange-800 border-orange-200",
      resolved: "bg-success/10 text-success border-success",
      closed: "bg-muted text-foreground border-border"
    };
    return variants[status] || "bg-muted text-foreground border-border";
  };

  const getPriorityBadge = (priority: QueryPriority) => {
    const variants = {
      low: "bg-success/10 text-success border-success",
      medium: "bg-warning/10 text-warning border-warning",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-destructive/10 text-destructive border-destructive"
    };
    return variants[priority] || "bg-muted text-foreground border-border";
  };

  const getPriorityIcon = (priority: QueryPriority) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-3 w-3" />;
      case "high":
        return <Flag className="h-3 w-3" />;
      case "medium":
        return <Clock className="h-3 w-3" />;
      case "low":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || query.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || query.platform === platformFilter;
    const matchesPriority = priorityFilter === "all" || query.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || query.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform && matchesPriority && matchesCategory;
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleUpdateStatus = (queryId: string, status: QueryStatus) => {
    setQueries(prev => prev.map(query =>
      query.id === queryId
        ? {
            ...query,
            status,
            updatedAt: new Date().toISOString(),
            ...(status === "resolved" && { resolvedAt: new Date().toISOString() })
          }
        : query
    ));
  };

  const handleUpdateSocialMessageStatus = async (messageId: string, status: string) => {
    try {
      const response = await updateMessageStatus(messageId, status);
      if (response.success) {
        toast({
          title: "Success",
          description: "Message status updated.",
        });
        loadSocialMessages();
      }
    } catch (error) {
      console.error("Failed to update message status:", error);
      showErrorToast(toast, error, "Failed to update status. Please try again.");
    }
  };

  const handleSendSocialMessageResponse = async (messageId: string, responseText: string) => {
    try {
      const response = await addMessageResponse(messageId, responseText, false);
      if (response.success) {
        toast({
          title: "Success",
          description: "Response sent successfully.",
        });
        loadSocialMessages();
        setResponseMessage("");
        setShowResponseModal(false);
      }
    } catch (error) {
      console.error("Failed to send response:", error);
      showErrorToast(toast, error, "Failed to send response. Please try again.");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedQuery || !responseMessage.trim()) return;

    const isSocialMediaMessage = socialMessages.some(m => m.id === selectedQuery.id);

    if (isSocialMediaMessage) {
      await handleSendSocialMessageResponse(selectedQuery.id, responseMessage);
      setSelectedQuery(null);
      return;
    }

    const newResponse: SupportResponse = {
      id: `resp_${Date.now()}`,
      queryId: selectedQuery.id,
      responderId: "current_user",
      responderName: "Current User",
      message: responseMessage,
      createdAt: new Date().toISOString(),
      isInternal: false,
      platform: selectedQuery.platform
    };

    setQueries(prev => prev.map(query =>
      query.id === selectedQuery.id
        ? {
            ...query,
            responses: [...query.responses, newResponse],
            status: "waiting_for_customer" as QueryStatus,
            updatedAt: new Date().toISOString()
          }
        : query
    ));

    setResponseMessage("");
    setShowResponseModal(false);
    setSelectedQuery(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendResponse();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">Support Center</h1>
          <p className="text-muted-foreground">Manage customer queries across all channels</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Metrics — always visible regardless of active tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New</p>
                <p className="text-2xl font-semibold text-primary">{metrics.newQueries}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold text-warning">{metrics.inProgressQueries}</p>
              </div>
              <div className="p-3 rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-semibold text-success">{metrics.resolvedToday}</p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-semibold text-purple-600">{metrics.averageResponseTime}m</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed inbox */}
      <Tabs defaultValue="social">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 gap-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="social"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Social Media
            {(queries.length + socialMessages.length) > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5 font-medium">
                {queries.length + socialMessages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="website"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium"
          >
            <Globe className="h-4 w-4 mr-2" />
            Website Queries
            {contactQueryTotal > 0 && (
              <span className="ml-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-1.5 py-0.5 font-medium">
                {contactQueryTotal}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview tab ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <TrendingUp className="h-5 w-5" />
                Platform Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(metrics.platformBreakdown).map(([platform, count]) => (
                  <div key={platform} className="text-center">
                    <div className="p-3 rounded-lg bg-muted mb-2 flex items-center justify-center">
                      {getPlatformIcon(platform as SocialPlatform)}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{platform}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Social Media tab ──────────────────────────────────────────── */}
        <TabsContent value="social" className="mt-6 space-y-4">
          {/* Filters */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search name, message, tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QueryStatus | "all")}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_for_customer">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as QueryPriority | "all")}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as SocialPlatform | "all")}>
                  <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Social inbox queries */}
          {filteredQueries.length > 0 && (
            <div className="space-y-3">
              {filteredQueries.map((query) => (
                <Card key={query.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            {getPlatformIcon(query.platform)}
                          </div>
                          <span className="font-semibold text-foreground truncate">{query.senderName}</span>
                          <span className="text-xs text-muted-foreground">@{query.senderHandle}</span>
                          <Badge className={`text-xs ${getPlatformColor(query.platform)}`}>{query.platform}</Badge>
                          <Badge className={`text-xs ${getStatusBadge(query.status)}`}>{query.status.replace('_', ' ')}</Badge>
                          <Badge className={`text-xs ${getPriorityBadge(query.priority)} flex items-center gap-1`}>
                            {getPriorityIcon(query.priority)}{query.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{query.message}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{getTimeAgo(query.createdAt)}</span>
                          <span>•</span>
                          <span>{query.responses.length} responses</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedQuery(query); setShowResponseModal(true); }}>
                          <Reply className="h-4 w-4 mr-1" />Reply
                        </Button>
                        <Select value={query.status} onValueChange={(v) => handleUpdateStatus(query.id, v as QueryStatus)}>
                          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="waiting_for_customer">Waiting</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Social media direct messages */}
          {loadingMessages ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Loading social media messages...</CardContent></Card>
          ) : socialMessages.length === 0 && filteredQueries.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No social media messages"
              description="Connect your social accounts to receive messages and mentions here."
              action={{ label: "Connect Account", onClick: () => navigate("/admin/social-media"), icon: Plus }}
            />
          ) : (
            <div className="space-y-3">
              {socialMessages.map((message) => (
                <Card key={message.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            {getPlatformIcon(message.platform.toLowerCase() as SocialPlatform)}
                          </div>
                          <span className="font-semibold text-foreground truncate">{message.senderName || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">@{message.senderHandle || 'unknown'}</span>
                          <Badge className={`text-xs ${getPlatformColor(message.platform.toLowerCase() as SocialPlatform)}`}>{message.platform}</Badge>
                          <Badge className={`text-xs ${getStatusBadge(message.status.toLowerCase() as QueryStatus)}`}>{message.status.replace('_', ' ')}</Badge>
                          <Badge className={`text-xs ${getPriorityBadge(message.priority.toLowerCase() as QueryPriority)} flex items-center gap-1`}>
                            {getPriorityIcon(message.priority.toLowerCase() as QueryPriority)}{message.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{message.content}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{getTimeAgo(message.createdAt)}</span>
                          <span>•</span>
                          <span>{message.responses?.length || 0} responses</span>
                          {message.assignedAgent && (
                            <><span>•</span><span>Assigned: {message.assignedAgent.firstName} {message.assignedAgent.lastName}</span></>
                          )}
                          <Badge variant="outline" className="text-xs"><Tag className="h-3 w-3 mr-1" />{message.messageType}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const queryFormat: SupportQuery = {
                              id: message.id,
                              platform: message.platform.toLowerCase() as SocialPlatform,
                              senderName: message.senderName || 'Unknown',
                              senderHandle: message.senderHandle || 'unknown',
                              senderId: message.id,
                              message: message.content,
                              status: message.status.toLowerCase() as QueryStatus,
                              priority: message.priority.toLowerCase() as QueryPriority,
                              category: "general_inquiry" as QueryCategory,
                              createdAt: message.createdAt,
                              updatedAt: message.updatedAt,
                              tags: [message.messageType],
                              responses: message.responses?.map(r => ({
                                id: r.id,
                                queryId: message.id,
                                responderId: r.respondedBy,
                                responderName: r.respondedByUser ? `${r.respondedByUser.firstName} ${r.respondedByUser.lastName}` : 'Agent',
                                message: r.response,
                                createdAt: r.createdAt,
                                isInternal: r.isInternal,
                                platform: message.platform.toLowerCase() as SocialPlatform,
                              })) || [],
                              metadata: {},
                            };
                            setSelectedQuery(queryFormat);
                            setShowResponseModal(true);
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />Reply
                        </Button>
                        <Select value={message.status} onValueChange={(v) => handleUpdateSocialMessageStatus(message.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="WAITING">Waiting</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Website Queries tab ───────────────────────────────────────── */}
        <TabsContent value="website" className="mt-6 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, subject..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadContactQueries()}
                className="pl-10"
              />
            </div>
            <Select value={contactStatusFilter} onValueChange={(v) => setContactStatusFilter(v as ContactQueryStatus | "all")}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING">Waiting</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadContactQueries}>Refresh</Button>
          </div>

          {/* Website / Contact Form Queries Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Website Queries</h2>
                <p className="text-sm text-muted-foreground">
                  Inquiries submitted via the public Contact Us form
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
                {contactQueryTotal} total
              </Badge>
            </div>

            {loadingContactQueries ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Loading website queries...
              </CardContent>
            </Card>
          ) : contactQueries.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No website queries yet"
              description="Messages submitted via the Contact Us form will appear here."
            />
          ) : (
            <div className="space-y-3">
              {contactQueries.map((cq) => (
                <Card
                  key={cq.id}
                  className="border-border bg-card hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => openContactDetail(cq.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 shrink-0">
                            <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-semibold text-foreground truncate">{cq.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{cq.email}</span>
                          <Badge
                            className={`text-xs ${getStatusBadge(cq.status.toLowerCase().replace("_", "_") as QueryStatus)}`}
                          >
                            {cq.status.replace("_", " ")}
                          </Badge>
                          <Badge
                            className={`text-xs ${getPriorityBadge(cq.priority.toLowerCase() as QueryPriority)} flex items-center gap-1`}
                          >
                            {getPriorityIcon(cq.priority.toLowerCase() as QueryPriority)}
                            {cq.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-0.5 truncate">
                          {cq.subject}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{cq.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{getTimeAgo(cq.createdAt)}</span>
                          <span>•</span>
                          <span>{cq._count?.responses ?? 0} replies</span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => openContactDetail(cq.id)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Select
                          value={cq.status}
                          onValueChange={(v) =>
                            handleContactStatusChange(cq.id, v as ContactQueryStatus)
                          }
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="WAITING">Waiting</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Query Detail + Reply Modal */}
      {showContactModal && selectedContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border">
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0 mt-0.5">
                    <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{selectedContact.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getTimeAgo(selectedContact.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Select
                    value={selectedContact.status}
                    onValueChange={(v) =>
                      handleContactStatusChange(selectedContact.id, v as ContactQueryStatus)
                    }
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="WAITING">Waiting</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setShowContactModal(false);
                      setSelectedContact(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Original message */}
              <div className="p-5 border-b border-border bg-muted/40">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Subject
                </p>
                <p className="text-sm font-medium text-foreground mb-3">
                  {selectedContact.subject}
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </p>
              </div>

              {/* Thread */}
              {selectedContact.responses.length > 0 && (
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                  {selectedContact.responses.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <div
                        className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                          r.isInternal
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-primary/10"
                        }`}
                      >
                        {r.isInternal ? (
                          <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {r.agent
                              ? `${r.agent.firstName} ${r.agent.lastName}`
                              : "Agent"}
                          </span>
                          {r.isInternal && (
                            <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                              Internal note
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(r.sentAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{r.response}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply / Note input */}
              <div className="p-5 border-t border-border space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={contactTab === "reply" ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setContactTab("reply")}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply via email
                  </Button>
                  <Button
                    size="sm"
                    variant={contactTab === "note" ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setContactTab("note")}
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Internal note
                  </Button>
                </div>

                {contactTab === "reply" ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      This reply will be sent to{" "}
                      <span className="font-medium text-foreground">{selectedContact.email}</span>
                    </p>
                    <Textarea
                      ref={contactReplyRef as React.RefObject<HTMLTextAreaElement>}
                      value={contactReply}
                      onChange={(e) => setContactReply(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!contactReply.trim() || sendingContactReply}
                        onClick={handleContactReply}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        {sendingContactReply ? "Sending..." : "Send reply"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Internal notes are only visible to your team, not the sender.
                    </p>
                    <Textarea
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                      placeholder="Add a note for your team..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!contactNote.trim() || sendingContactReply}
                        onClick={handleContactNote}
                      >
                        <Lock className="h-3.5 w-3.5 mr-1.5" />
                        {sendingContactReply ? "Saving..." : "Save note"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedQuery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:max-w-4xl h-[80vh] sm:h-[600px] flex flex-col mx-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getPlatformIcon(selectedQuery.platform)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Respond to {selectedQuery.senderName}</h3>
                    <p className="text-sm text-muted-foreground">via {selectedQuery.platform}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedQuery(null);
                    setResponseMessage("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Original Message */}
              <div className="p-4 border-b border-border bg-muted">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-card">
                    {getPlatformIcon(selectedQuery.platform)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{selectedQuery.senderName}</span>
                      <Badge className={`text-xs ${getPlatformColor(selectedQuery.platform)}`}>
                        {selectedQuery.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{getTimeAgo(selectedQuery.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground">{selectedQuery.message}</p>
                  </div>
                </div>
              </div>

              {/* Response History */}
              {selectedQuery.responses.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <h4 className="font-medium text-foreground">Response History</h4>
                  {selectedQuery.responses.map((response) => (
                    <div key={response.id} className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{response.responderName}</span>
                          <span className="text-xs text-muted-foreground">{getTimeAgo(response.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground">{response.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Response Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response..."
                      className="min-h-[100px] max-h-32 resize-none pr-20"
                      rows={3}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendResponse}
                    disabled={!responseMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SupportPage;

