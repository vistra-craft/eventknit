import React, { useState, useEffect } from "react";
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
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/EmptyState";
import {
  getSocialMessages,
  assignMessage,
  updateMessageStatus,
  addMessageResponse,
  type SocialMessage,
} from "@/lib/social-media-api";
import {
  getSupportInbox,
  getSupportStatistics,
  type SupportQuery as ApiSupportQuery,
} from "@/lib/support-api";
import type {
  SupportQuery,
  SupportResponse,
  SocialPlatform,
  QueryStatus,
  QueryPriority,
  QueryCategory,
  SupportAgent,
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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueryStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<QueryPriority | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<QueryCategory | "all">("all");
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
  const [websiteQueries, setWebsiteQueries] = useState<SupportQuery[]>([]);
  const [agents] = useState<SupportAgent[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics>(defaultMetrics);

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

        // Split by platform
        const social = mappedQueries.filter(q => q.platform !== 'website');
        const website = mappedQueries.filter(q => q.platform === 'website');

        setQueries(social);
        setWebsiteQueries(website);
      }
    } catch (error) {
      console.error("Failed to load support queries:", error);
      toast({
        title: "Error",
        description: "Failed to load support queries.",
        variant: "destructive",
      });
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

  useEffect(() => {
    loadSupportQueries();
    loadSupportStats();
    loadSocialMessages();
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
        return "bg-green-100 text-green-800 border-green-200";
      case "facebook":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "instagram":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "twitter":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "linkedin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "email":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "website":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadge = (status: QueryStatus) => {
    const variants = {
      new: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
      waiting_for_customer: "bg-orange-100 text-orange-800 border-orange-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityBadge = (priority: QueryPriority) => {
    const variants = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[priority] || "bg-gray-100 text-gray-800 border-gray-200";
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

  const handleAssignQuery = (queryId: string, agentId: string) => {
    setQueries(prev => prev.map(query =>
      query.id === queryId
        ? {
            ...query,
            assignedTo: agentId,
            assignedAt: new Date().toISOString(),
            status: "in_progress" as QueryStatus,
            updatedAt: new Date().toISOString()
          }
        : query
    ));
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

  // API handlers for social media messages
  const handleAssignSocialMessage = async (messageId: string, agentId: string) => {
    try {
      const response = await assignMessage(messageId, agentId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Message assigned successfully.",
        });
        loadSocialMessages();
      }
    } catch (error) {
      console.error("Failed to assign message:", error);
      toast({
        title: "Error",
        description: "Failed to assign message. Please try again.",
        variant: "destructive",
      });
    }
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
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignWebsiteQuery = (queryId: string, agentId: string) => {
    setWebsiteQueries(prev => prev.map(query => 
      query.id === queryId 
        ? { 
            ...query, 
            assignedTo: agentId, 
            assignedAt: new Date().toISOString(),
            status: "in_progress" as QueryStatus,
            updatedAt: new Date().toISOString()
          }
        : query
    ));
  };

  const handleUpdateWebsiteQueryStatus = (queryId: string, status: QueryStatus) => {
    setWebsiteQueries(prev => prev.map(query => 
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

  const handleSendResponse = async () => {
    if (!selectedQuery || !responseMessage.trim()) return;

    // Check if this is a social media message (from API)
    const isSocialMediaMessage = socialMessages.some(m => m.id === selectedQuery.id);

    if (isSocialMediaMessage) {
      // Use API to send response
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

    // Check if it's a website query
    const isWebsiteQuery = selectedQuery.platform === "website";

    if (isWebsiteQuery) {
      setWebsiteQueries(prev => prev.map(query =>
        query.id === selectedQuery.id
          ? {
              ...query,
              responses: [...query.responses, newResponse],
              status: "waiting_for_customer" as QueryStatus,
              updatedAt: new Date().toISOString()
            }
          : query
      ));
    } else {
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
    }

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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Support Center</h1>
            <p className="text-gray-600">Manage customer queries from all social media platforms</p>
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Query
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Queries</p>
                  <p className="font-semibold text-blue-600">{metrics.newQueries}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="font-semibold text-yellow-600">{metrics.inProgressQueries}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="font-semibold text-green-600">{metrics.resolvedToday}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="font-semibold text-purple-600">{metrics.averageResponseTime}m</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <TrendingUp className="h-5 w-5" />
              Platform Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(metrics.platformBreakdown).map(([platform, count]) => (
                <div key={platform} className="text-center">
                  <div className="p-3 rounded-lg bg-gray-50 mb-2">
                    {getPlatformIcon(platform as SocialPlatform)}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{count}</p>
                  <p className="text-xs text-gray-600 capitalize">{platform}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search queries, names, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QueryStatus | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_for_customer">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={platformFilter} onValueChange={(value) => setPlatformFilter(value as SocialPlatform | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as QueryPriority | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as QueryCategory | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                  <SelectItem value="technical_support">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="event_management">Event Management</SelectItem>
                  <SelectItem value="account_issues">Account Issues</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Support Queries List */}
        <div className="space-y-3">
          {filteredQueries.map((query) => (
            <Card key={query.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getPlatformIcon(query.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate">{query.senderName}</h3>
                        <p className="text-sm text-gray-600 truncate">@{query.senderHandle}</p>
                      </div>
                      <Badge className={`text-xs ${getPlatformColor(query.platform)}`}>
                        {query.platform}
                      </Badge>
                      <Badge className={`text-xs ${getStatusBadge(query.status)}`}>
                        {query.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityBadge(query.priority)} flex items-center gap-1`}>
                        {getPriorityIcon(query.priority)}
                        {query.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{query.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span>{getTimeAgo(query.createdAt)}</span>
                      <span>•</span>
                      <span>{query.responses.length} responses</span>
                      {query.assignedTo && (
                        <>
                          <span>•</span>
                          <span>Assigned to: {agents.find(a => a.id === query.assignedTo)?.name}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {query.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedQuery(query);
                        setShowResponseModal(true);
                      }}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Select 
                      value={query.assignedTo || ""} 
                      onValueChange={(value) => handleAssignQuery(query.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={query.status} 
                      onValueChange={(value) => handleUpdateStatus(query.id, value as QueryStatus)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
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

        {/* Social Media Messages Section (API-driven) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Social Media Messages</h2>
              <p className="text-sm text-gray-600">Mentions and messages from connected social media platforms</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              {socialMessages.length} messages
            </Badge>
          </div>

          {loadingMessages ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading social media messages...</p>
              </CardContent>
            </Card>
          ) : socialMessages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No Social Media Messages"
              description="Connect your social media accounts to receive and manage messages and mentions from your audience."
              action={{
                label: "Connect Account",
                onClick: () => window.location.href = "/admin/social-media",
                icon: Plus,
              }}
            />
          ) : (
            <div className="space-y-3">
              {socialMessages.map((message) => (
                <Card key={message.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getPlatformIcon(message.platform.toLowerCase() as SocialPlatform)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-foreground truncate">{message.senderName || 'Unknown'}</h3>
                            <p className="text-sm text-gray-600 truncate">@{message.senderHandle || 'unknown'}</p>
                          </div>
                          <Badge className={`text-xs ${getPlatformColor(message.platform.toLowerCase() as SocialPlatform)}`}>
                            {message.platform}
                          </Badge>
                          <Badge className={`text-xs ${getStatusBadge(message.status.toLowerCase() as QueryStatus)}`}>
                            {message.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityBadge(message.priority.toLowerCase() as QueryPriority)} flex items-center gap-1`}>
                            {getPriorityIcon(message.priority.toLowerCase() as QueryPriority)}
                            {message.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{message.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span>{getTimeAgo(message.createdAt)}</span>
                          <span>•</span>
                          <span>{message.responses?.length || 0} responses</span>
                          {message.assignedAgent && (
                            <>
                              <span>•</span>
                              <span>Assigned to: {message.assignedAgent.firstName} {message.assignedAgent.lastName}</span>
                            </>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {message.messageType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Convert to SupportQuery format for the modal
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
                                platform: message.platform.toLowerCase() as SocialPlatform
                              })) || [],
                              metadata: {}
                            };
                            setSelectedQuery(queryFormat);
                            setShowResponseModal(true);
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Select
                          value={message.assignedTo || ""}
                          onValueChange={(value) => handleAssignSocialMessage(message.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={message.status}
                          onValueChange={(value) => handleUpdateSocialMessageStatus(message.id, value)}
                        >
                          <SelectTrigger className="w-32">
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

        {/* Website Queries Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Website Queries</h2>
              <p className="text-sm text-gray-600">Customer inquiries submitted through the website contact form</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              {websiteQueries.length} queries
            </Badge>
          </div>
          
          <div className="space-y-3">
            {websiteQueries.map((query) => (
              <Card key={query.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getPlatformIcon(query.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground truncate">{query.senderName}</h3>
                          <p className="text-sm text-gray-600 truncate">{query.senderHandle}</p>
                        </div>
                        <Badge className={`text-xs ${getPlatformColor(query.platform)}`}>
                          {query.platform}
                        </Badge>
                        <Badge className={`text-xs ${getStatusBadge(query.status)}`}>
                          {query.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityBadge(query.priority)} flex items-center gap-1`}>
                          {getPriorityIcon(query.priority)}
                          {query.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{query.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>{getTimeAgo(query.createdAt)}</span>
                        <span>•</span>
                        <span>{query.responses.length} responses</span>
                        {query.assignedTo && (
                          <>
                            <span>•</span>
                            <span>Assigned to: {agents.find(a => a.id === query.assignedTo)?.name}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {query.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedQuery(query);
                          setShowResponseModal(true);
                        }}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Select 
                        value={query.assignedTo || ""} 
                        onValueChange={(value) => handleAssignWebsiteQuery(query.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={query.status} 
                        onValueChange={(value) => handleUpdateWebsiteQueryStatus(query.id, value as QueryStatus)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
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
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedQuery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getPlatformIcon(selectedQuery.platform)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Respond to {selectedQuery.senderName}</h3>
                    <p className="text-sm text-gray-600">via {selectedQuery.platform}</p>
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
              <div className="p-4 border-b border-border bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white">
                    {getPlatformIcon(selectedQuery.platform)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{selectedQuery.senderName}</span>
                      <Badge className={`text-xs ${getPlatformColor(selectedQuery.platform)}`}>
                        {selectedQuery.platform}
                      </Badge>
                      <span className="text-xs text-gray-500">{getTimeAgo(selectedQuery.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{selectedQuery.message}</p>
                  </div>
                </div>
              </div>

              {/* Response History */}
              {selectedQuery.responses.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <h4 className="font-medium text-gray-900">Response History</h4>
                  {selectedQuery.responses.map((response) => (
                    <div key={response.id} className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{response.responderName}</span>
                          <span className="text-xs text-gray-500">{getTimeAgo(response.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{response.message}</p>
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
    </AdminLayout>
  );
};

export default SupportPage;

