import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdminLayout from "../AdminLayout";
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
  Building2,
  Shield,
  AlertTriangle,
  Globe
} from "lucide-react";

interface SocialPost {
  id: string;
  organizer: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
  content: string;
  media?: string;
  scheduledDate?: string;
  status: 'published' | 'scheduled' | 'draft' | 'pending_approval';
  publishedDate?: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  reach: number;
  impressions: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

interface SocialAccount {
  platform: string;
  name: string;
  followers: number;
  engagement: number;
  growth: number;
  status: 'active' | 'inactive' | 'suspended';
}

const AdminSocialMediaPage = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");

  // Mock platform-wide social media data
  const socialPosts: SocialPost[] = [
    {
      id: "1",
      organizer: "Tech Events Co.",
      platform: "facebook",
      content: "🚀 Early bird tickets for Tech Summit 2024 are now live! Save 30% and join 10,000+ tech professionals. #TechSummit2024 #EarlyBird",
      status: "published",
      publishedDate: "2024-01-15",
      engagement: {
        likes: 1250,
        comments: 89,
        shares: 156,
        views: 15000
      },
      reach: 12500,
      impressions: 18000,
      approvalStatus: "approved"
    },
    {
      id: "2",
      organizer: "Music Events Ltd",
      platform: "instagram",
      content: "🎵 Behind the scenes at Music Festival 2024! Our team is working hard to bring you an unforgettable experience. Swipe to see the magic! ✨",
      media: "video",
      status: "published",
      publishedDate: "2024-01-20",
      engagement: {
        likes: 3400,
        comments: 234,
        shares: 89,
        views: 25000
      },
      reach: 22000,
      impressions: 28000,
      approvalStatus: "approved"
    },
    {
      id: "3",
      organizer: "Business Academy",
      platform: "linkedin",
      content: "📈 Join our Business Leadership Workshop and learn from industry experts. Limited seats available! Register now and transform your career.",
      status: "scheduled",
      scheduledDate: "2024-02-01",
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      },
      reach: 0,
      impressions: 0,
      approvalStatus: "pending"
    },
    {
      id: "4",
      organizer: "Wellness Corp",
      platform: "youtube",
      content: "🧘‍♀️ Wellness Expo 2024 - Transform Your Health Journey. Watch our latest video featuring top wellness experts and their insights.",
      media: "video",
      status: "published",
      publishedDate: "2024-01-18",
      engagement: {
        likes: 890,
        comments: 45,
        shares: 67,
        views: 12000
      },
      reach: 8500,
      impressions: 12000,
      approvalStatus: "approved"
    },
    {
      id: "5",
      organizer: "Entertainment Group",
      platform: "twitter",
      content: "🎭 Don't miss out on our Comedy Night! Laugh your way through the evening with top comedians. Tickets selling fast! #ComedyNight #LaughOutLoud",
      status: "draft",
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      },
      reach: 0,
      impressions: 0,
      approvalStatus: "pending"
    }
  ];

  const platformAccounts: SocialAccount[] = [
    {
      platform: "Facebook",
      name: "EventKnit Official",
      followers: 125000,
      engagement: 4.2,
      growth: 12.5,
      status: "active"
    },
    {
      platform: "Instagram",
      name: "@eventknit",
      followers: 89000,
      engagement: 6.8,
      growth: 18.3,
      status: "active"
    },
    {
      platform: "Twitter",
      name: "@EventKnit",
      followers: 67000,
      engagement: 3.1,
      growth: 8.7,
      status: "active"
    },
    {
      platform: "LinkedIn",
      name: "EventKnit",
      followers: 45000,
      engagement: 2.9,
      growth: 15.2,
      status: "active"
    },
    {
      platform: "YouTube",
      name: "EventKnit Channel",
      followers: 23000,
      engagement: 5.4,
      growth: 22.1,
      status: "active"
    }
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return Facebook;
      case "twitter":
        return Twitter;
      case "instagram":
        return Instagram;
      case "linkedin":
        return Linkedin;
      case "youtube":
        return Youtube;
      default:
        return Share2;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_approval":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPosts = socialPosts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === "all" || post.platform === filterPlatform;
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    const matchesApproval = filterApproval === "all" || post.approvalStatus === filterApproval;
    
    return matchesSearch && matchesPlatform && matchesStatus && matchesApproval;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
              <Share2 className="h-8 w-8 mr-3 text-primary" />
              Platform Social Media
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor and manage platform-wide social media presence
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "accounts"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "analytics"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Analytics
          </button>
        </div>

        {activeTab === "posts" && (
          <>
            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Platforms</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
                <select
                  value={filterApproval}
                  onChange={(e) => setFilterApproval(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Approval</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPosts.map((post) => {
                const PlatformIcon = getPlatformIcon(post.platform);
                return (
                  <Card key={post.id} className="border-border hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <PlatformIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground capitalize">{post.platform}</h3>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {post.organizer}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Badge className={getStatusColor(post.status)}>
                            {post.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getApprovalColor(post.approvalStatus)}>
                            {post.approvalStatus}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-foreground mb-4 line-clamp-3">{post.content}</p>

                      {post.media && (
                        <div className="mb-4">
                          <Badge variant="outline" className="text-xs">
                            {post.media}
                          </Badge>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Reach</p>
                          <p className="font-semibold">{post.reach.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Impressions</p>
                          <p className="font-semibold">{post.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Likes</p>
                          <p className="font-semibold">{post.engagement.likes.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Comments</p>
                          <p className="font-semibold">{post.engagement.comments.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {post.approvalStatus === "pending" && (
                            <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                              <Shield className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "accounts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformAccounts.map((account) => {
              const PlatformIcon = getPlatformIcon(account.platform);
              return (
                <Card key={account.platform} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <PlatformIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{account.platform}</h3>
                        <p className="text-sm text-muted-foreground">{account.name}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Followers</span>
                        <span className="font-medium">{account.followers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Engagement</span>
                        <span className="font-medium">{account.engagement}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Growth</span>
                        <span className="font-medium text-green-600">+{account.growth}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge className={account.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {account.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reach</p>
                      <p className="text-2xl font-bold">2.4M</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Engagement</p>
                      <p className="text-2xl font-bold">4.2%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Followers</p>
                      <p className="text-2xl font-bold">349K</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-primary" />
                  Top Performing Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {socialPosts
                    .filter(post => post.status === "published")
                    .sort((a, b) => b.engagement.likes - a.engagement.likes)
                    .slice(0, 3)
                    .map((post) => {
                      const PlatformIcon = getPlatformIcon(post.platform);
                      return (
                        <div key={post.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                          <PlatformIcon className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{post.content}</p>
                            <p className="text-xs text-muted-foreground">{post.organizer}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{post.engagement.likes.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">likes</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {filteredPosts.length === 0 && activeTab === "posts" && (
          <div className="text-center py-12">
            <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No posts found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSocialMediaPage;

