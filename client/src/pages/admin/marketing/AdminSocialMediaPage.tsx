import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/EmptyState";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Share2,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Plus,
  Calendar,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share,
  TrendingUp,
  BarChart3,
  Edit,
  MoreHorizontal,
  Filter,
  Trash2
} from "lucide-react";
import { showErrorToast } from "@/lib/utils/error";
import {
  getSocialAccounts,
  getSocialPosts,
  getSocialMetrics,
  deleteSocialPost,
  type SocialAccount as ApiSocialAccount,
  type SocialPost as ApiSocialPost,
  type SocialMetrics,
} from "@/lib/social-media-api";

interface SocialPost {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
  content: string;
  media?: string;
  scheduledDate?: string;
  status: 'published' | 'scheduled' | 'draft';
  publishedDate?: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  reach: number;
  impressions: number;
}

interface SocialAccount {
  platform: string;
  name: string;
  followers: number;
  engagement: number;
  status: 'connected' | 'disconnected';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AdminSocialMediaPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  // API-driven state
  const [apiAccounts, setApiAccounts] = useState<ApiSocialAccount[]>([]);
  const [apiPosts, setApiPosts] = useState<ApiSocialPost[]>([]);
  const [apiMetrics, setApiMetrics] = useState<SocialMetrics | null>(null);
  const [, setLoadingAccounts] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [, setLoadingMetrics] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load social accounts from API
  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await getSocialAccounts();
      if (response.success && response.data) {
        setApiAccounts(response.data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to load social accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load social posts from API
  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await getSocialPosts({
        platform: selectedPlatform !== "all" ? selectedPlatform : undefined,
      });
      if (response.success && response.data) {
        setApiPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error("Failed to load social posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load social metrics from API
  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const response = await getSocialMetrics();
      if (response.success && response.data) {
        setApiMetrics(response.data);
      }
    } catch (error) {
      console.error("Failed to load social metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = (postId: string) => {
    setDeleteConfirm(postId);
  };

  const confirmDeletePost = async () => {
    if (!deleteConfirm) return;
    const postId = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const response = await deleteSocialPost(postId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Post deleted successfully.",
        });
        loadPosts();
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      showErrorToast(toast, error, "Failed to delete post. Please try again.");
    }
  };

  useEffect(() => {
    loadAccounts();
    loadPosts();
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform]);

  // Mock social accounts (used as fallback when API returns empty)
  const mockSocialAccounts: SocialAccount[] = [
    {
      platform: "facebook",
      name: "EventKnit Official",
      followers: 12500,
      engagement: 4.2,
      status: "connected",
      icon: Facebook,
      color: "bg-primary"
    },
    {
      platform: "twitter",
      name: "@eventknit",
      followers: 8900,
      engagement: 6.8,
      status: "connected",
      icon: Twitter,
      color: "bg-primary"
    },
    {
      platform: "instagram",
      name: "@eventknit",
      followers: 15600,
      engagement: 8.5,
      status: "connected",
      icon: Instagram,
      color: "bg-primary"
    },
    {
      platform: "linkedin",
      name: "EventKnit",
      followers: 3200,
      engagement: 3.1,
      status: "connected",
      icon: Linkedin,
      color: "bg-primary"
    },
    {
      platform: "youtube",
      name: "EventKnit Channel",
      followers: 2100,
      engagement: 12.3,
      status: "disconnected",
      icon: Youtube,
      color: "bg-destructive"
    }
  ];

  // Convert API accounts to display format
  const socialAccounts: SocialAccount[] = apiAccounts.length > 0
    ? apiAccounts.map(acc => ({
        platform: acc.platform.toLowerCase(),
        name: acc.accountName,
        followers: acc.followers || 0,
        engagement: 0, // Calculate from metrics if available
        status: acc.isActive ? "connected" as const : "disconnected" as const,
        icon: getPlatformIconComponent(acc.platform.toLowerCase()),
        color: getPlatformColorClass(acc.platform.toLowerCase()),
      }))
    : mockSocialAccounts;

  // Mock social posts (used as fallback)
  const mockSocialPosts: SocialPost[] = [
    {
      id: "1",
      platform: "facebook",
      content: "🎉 Early bird tickets for Tech Summit 2024 are now live! Get 30% off when you book before March 1st. Don't miss out on this incredible lineup of speakers! #TechSummit2024 #EarlyBird",
      media: "tech-summit-poster.jpg",
      status: "published",
      publishedDate: "2024-01-20",
      engagement: {
        likes: 245,
        comments: 32,
        shares: 18,
        views: 1250
      },
      reach: 3200,
      impressions: 4500
    },
    {
      id: "2",
      platform: "instagram",
      content: "Behind the scenes at our latest event setup! 📸 The team is working hard to make sure everything is perfect for our attendees. Swipe to see more! ✨",
      media: "behind-scenes.jpg",
      status: "published",
      publishedDate: "2024-01-18",
      engagement: {
        likes: 189,
        comments: 15,
        shares: 8
      },
      reach: 2800,
      impressions: 3200
    },
    {
      id: "3",
      platform: "twitter",
      content: "Just announced: @elonmusk will be speaking at Tech Summit 2024! 🚀 This is going to be incredible. Tickets selling fast!",
      status: "published",
      publishedDate: "2024-01-15",
      engagement: {
        likes: 456,
        comments: 89,
        shares: 67
      },
      reach: 5600,
      impressions: 8900
    },
    {
      id: "4",
      platform: "linkedin",
      content: "We're excited to announce our partnership with Microsoft for Tech Summit 2024. Together, we're bringing you the latest in AI and cloud computing innovations.",
      status: "scheduled",
      scheduledDate: "2024-02-01",
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0
      },
      reach: 0,
      impressions: 0
    }
  ];

  // Convert API posts to display format
  const socialPosts: SocialPost[] = apiPosts.length > 0
    ? apiPosts.map(post => ({
        id: post.id,
        platform: post.platform.toLowerCase() as SocialPost['platform'],
        content: post.content,
        media: post.mediaUrls?.[0],
        scheduledDate: post.scheduledAt ? new Date(post.scheduledAt).toISOString().split('T')[0] : undefined,
        status: post.status.toLowerCase() as SocialPost['status'],
        publishedDate: post.postedAt ? new Date(post.postedAt).toISOString().split('T')[0] : undefined,
        engagement: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views,
        },
        reach: post.reach || 0,
        impressions: post.impressions || 0,
      }))
    : mockSocialPosts;

  // Helper to get platform icon component
  function getPlatformIconComponent(platform: string): React.ComponentType<{ className?: string }> {
    switch (platform) {
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'youtube': return Youtube;
      default: return Share2;
    }
  }

  // Helper to get platform color class
  function getPlatformColorClass(platform: string): string {
    switch (platform) {
      case 'facebook': return "bg-primary";
      case 'twitter': return "bg-primary";
      case 'instagram': return "bg-primary";
      case 'linkedin': return "bg-primary";
      case 'youtube': return "bg-destructive";
      default: return "bg-muted";
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return "bg-primary";
      case 'twitter': return "bg-primary";
      case 'instagram': return "bg-primary";
      case 'linkedin': return "bg-primary";
      case 'youtube': return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return "bg-success/10 text-success dark:bg-success/20 dark:text-success";
      case 'scheduled': return "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary";
      case 'draft': return "bg-muted text-gray-800 dark:bg-gray-800 dark:text-muted-foreground";
      default: return "bg-muted text-gray-800 dark:bg-gray-800 dark:text-muted-foreground";
    }
  };

  // Use API metrics if available, otherwise calculate from local data
  const totalFollowers = apiMetrics?.totalPosts
    ? socialAccounts.reduce((sum, account) => sum + account.followers, 0)
    : socialAccounts.reduce((sum, account) => sum + account.followers, 0);
  const avgEngagement = apiMetrics?.engagementRate
    ? apiMetrics.engagementRate
    : socialAccounts.reduce((sum, account) => sum + account.engagement, 0) / socialAccounts.length;
  const totalReach = apiMetrics?.totalReach || socialPosts.reduce((sum, post) => sum + post.reach, 0);
  const totalImpressions = apiMetrics?.totalImpressions || socialPosts.reduce((sum, post) => sum + post.impressions, 0);

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Social Media</h1>
          <p className="text-muted-foreground">
            Manage your social media presence and engage with your audience
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "overview" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "posts" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "accounts" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Accounts
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "analytics" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Followers</p>
                    <p className="font-semibold text-foreground">{totalFollowers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                    <p className="font-semibold text-foreground">{avgEngagement.toFixed(1)}%</p>
                  </div>
                  <Heart className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                    <p className="font-semibold text-foreground">{totalReach.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                    <p className="font-semibold text-foreground">{totalImpressions.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base font-semibold text-foreground">
                <Share2 className="h-5 w-5 mr-2 text-primary" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {socialAccounts.map((account, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg ${account.color} flex items-center justify-center`}>
                        <account.icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge className={account.status === "connected" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                        {account.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{account.name}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{account.followers.toLocaleString()} followers</span>
                      <span>{account.engagement}% engagement</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base font-semibold text-foreground">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Recent Posts Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="flex items-start space-x-4 p-4 border border-border rounded-lg">
                    <div className={`w-8 h-8 rounded-lg ${getPlatformColor(post.platform)} flex items-center justify-center`}>
                      {getPlatformIcon(post.platform)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-semibold text-foreground">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</h4>
                        <Badge className={`text-xs ${getStatusColor(post.status)}`}>
                          {post.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {post.publishedDate || post.scheduledDate}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.content}</p>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4 text-destructive" />
                          <span>{post.engagement.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4 text-primary" />
                          <span>{post.engagement.comments}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share className="h-4 w-4 text-success" />
                          <span>{post.engagement.shares}</span>
                        </div>
                        {post.engagement.views && (
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4 text-purple-500" />
                            <span>{post.engagement.views}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">All Posts</CardTitle>
              <div className="flex items-center space-x-2">
                <select 
                  value={selectedPlatform} 
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="all">All Platforms</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPosts ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading posts...</p>
              </div>
            ) : socialPosts.length === 0 ? (
              <EmptyState
                icon={Share2}
                title="No Social Posts"
                description="Create and schedule posts to engage with your audience across all connected platforms."
                action={{
                  label: "Create Post",
                  onClick: () => {},
                  icon: Plus,
                }}
              />
            ) : (
            <div className="space-y-4">
              {socialPosts.map((post) => (
                <div key={post.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${getPlatformColor(post.platform)} flex items-center justify-center`}>
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} Post</h3>
                          <Badge className={`text-xs ${getStatusColor(post.status)}`}>
                            {post.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {post.publishedDate || post.scheduledDate}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-3">{post.content}</p>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4 text-destructive" />
                            <span>{post.engagement.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            <span>{post.engagement.comments}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share className="h-4 w-4 text-success" />
                            <span>{post.engagement.shares}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Reach: {post.reach.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Accounts Tab */}
      {activeTab === "accounts" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Social Media Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {socialAccounts.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${account.color} flex items-center justify-center`}>
                      <account.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {account.followers.toLocaleString()} followers • {account.engagement}% engagement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={account.status === "connected" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                      {account.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {account.status === "connected" ? "Manage" : "Connect"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">Social Media Analytics</h3>
            <p className="text-muted-foreground mb-4">
              Detailed analytics and insights for your social media performance
            </p>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Detailed Reports
            </Button>
          </CardContent>
        </Card>
      )}
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminSocialMediaPage;

