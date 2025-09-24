import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrganizerLayout from "../OrganizerLayout";
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
  Filter
} from "lucide-react";

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

const SocialMediaPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  // Mock social accounts
  const socialAccounts: SocialAccount[] = [
    {
      platform: "facebook",
      name: "EventKnit Official",
      followers: 12500,
      engagement: 4.2,
      status: "connected",
      icon: Facebook,
      color: "bg-blue-600"
    },
    {
      platform: "twitter",
      name: "@eventknit",
      followers: 8900,
      engagement: 6.8,
      status: "connected",
      icon: Twitter,
      color: "bg-sky-500"
    },
    {
      platform: "instagram",
      name: "@eventknit",
      followers: 15600,
      engagement: 8.5,
      status: "connected",
      icon: Instagram,
      color: "bg-pink-600"
    },
    {
      platform: "linkedin",
      name: "EventKnit",
      followers: 3200,
      engagement: 3.1,
      status: "connected",
      icon: Linkedin,
      color: "bg-blue-700"
    },
    {
      platform: "youtube",
      name: "EventKnit Channel",
      followers: 2100,
      engagement: 12.3,
      status: "disconnected",
      icon: Youtube,
      color: "bg-red-600"
    }
  ];

  // Mock social posts
  const socialPosts: SocialPost[] = [
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
      case 'facebook': return "bg-blue-600";
      case 'twitter': return "bg-sky-500";
      case 'instagram': return "bg-pink-600";
      case 'linkedin': return "bg-blue-700";
      case 'youtube': return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return "bg-green-100 text-green-800";
      case 'scheduled': return "bg-blue-100 text-blue-800";
      case 'draft': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const totalFollowers = socialAccounts.reduce((sum, account) => sum + account.followers, 0);
  const avgEngagement = socialAccounts.reduce((sum, account) => sum + account.engagement, 0) / socialAccounts.length;
  const totalReach = socialPosts.reduce((sum, post) => sum + post.reach, 0);
  const totalImpressions = socialPosts.reduce((sum, post) => sum + post.impressions, 0);

  return (
    <OrganizerLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Social Media</h1>
          <p className="text-muted-foreground mt-1">
            Manage your social media presence and engage with your audience
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
                    <p className="text-2xl font-bold text-foreground">{totalFollowers.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-foreground">{avgEngagement.toFixed(1)}%</p>
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
                    <p className="text-2xl font-bold text-foreground">{totalReach.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-foreground">{totalImpressions.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
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
                      <Badge className={account.status === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {account.status}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{account.name}</h3>
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
              <CardTitle className="flex items-center">
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
                        <h4 className="font-medium text-foreground">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</h4>
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
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>{post.engagement.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span>{post.engagement.comments}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share className="h-4 w-4 text-green-500" />
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
              <CardTitle>All Posts</CardTitle>
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
                          <h3 className="font-medium text-foreground">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} Post</h3>
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
                            <Heart className="h-4 w-4 text-red-500" />
                            <span>{post.engagement.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            <span>{post.engagement.comments}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share className="h-4 w-4 text-green-500" />
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
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts Tab */}
      {activeTab === "accounts" && (
        <Card>
          <CardHeader>
            <CardTitle>Social Media Accounts</CardTitle>
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
                      <h3 className="font-medium text-foreground">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {account.followers.toLocaleString()} followers • {account.engagement}% engagement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={account.status === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
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
            <h3 className="text-lg font-medium text-foreground mb-2">Social Media Analytics</h3>
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
    </OrganizerLayout>
  );
};

export default SocialMediaPage;

