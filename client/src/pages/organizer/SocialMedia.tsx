import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrganizerLayout from "./OrganizerLayout";
import {
  Share2,
  Plus,
  Send,
  BarChart3,
  Clock,
  CheckCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import {
  createSocialPost,
  getSocialPosts,
  publishSocialPost,
  getSocialMediaAnalytics,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/use-toast";

interface SocialPost {
  id: string;
  platform: "facebook" | "twitter" | "instagram" | "linkedin";
  content: string;
  status: string;
  scheduledAt?: string;
  postedAt?: string;
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
}

interface SocialAnalytics {
  total: {
    posts: number;
    impressions: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
  };
  byPlatform: Array<{
    platform: SocialPost["platform"];
    posts: number;
    impressions: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
  }>;
}

type CreatePostPayload = {
  eventId?: string;
  platform: SocialPost["platform"];
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
};

const SocialMedia = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<SocialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSocialPosts();
      if (response.success && response.data) {
        setPosts(response.data.posts || []);
      }
    } catch {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load social media posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await getSocialMediaAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data as SocialAnalytics);
      }
    } catch {
      console.error("Error fetching analytics:", error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics, fetchPosts]);

  const handleCreatePost = async (data: CreatePostPayload) => {
    try {
      const response = await createSocialPost(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Post created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchPosts();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      const response = await publishSocialPost(postId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Post published successfully",
        });
        fetchPosts();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<SocialPost["platform"], typeof Facebook> = {
      facebook: Facebook,
      twitter: Twitter,
      instagram: Instagram,
      linkedin: Linkedin,
    };
    const Icon = icons[platform as SocialPost["platform"]] || Share2;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "outline" | "default" | "destructive"; label: string }
    > = {
      draft: { variant: "outline", label: "Draft" },
      scheduled: { variant: "default", label: "Scheduled" },
      posted: { variant: "default", label: "Posted" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Social Media</h1>
            <p className="text-muted-foreground mt-1">
              Create and schedule social media posts
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Social Media Post</DialogTitle>
              </DialogHeader>
              <CreatePostForm
                onSubmit={handleCreatePost}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading posts...</div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No posts yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPlatformIcon(post.platform)}
                            <Badge variant="outline" className="capitalize">
                              {post.platform}
                            </Badge>
                            {getStatusBadge(post.status)}
                          </div>
                          <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
                          {post.scheduledAt && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {post.postedAt && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <CheckCircle className="h-3 w-3" />
                              <span>
                                Posted: {new Date(post.postedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>👁️ {post.impressions}</span>
                            <span>👍 {post.likes}</span>
                            <span>🔄 {post.shares}</span>
                            <span>💬 {post.comments}</span>
                            <span>👆 {post.clicks}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {post.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handlePublishPost(post.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading analytics...</div>
            ) : analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Total Posts</div>
                      <div className="text-2xl font-bold">{analytics.total.posts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Impressions</div>
                      <div className="text-2xl font-bold">{analytics.total.impressions}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Engagements</div>
                      <div className="text-2xl font-bold">
                        {analytics.total.likes + analytics.total.shares + analytics.total.comments}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Clicks</div>
                      <div className="text-2xl font-bold">{analytics.total.clicks}</div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">By Platform</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.byPlatform.map((platform) => (
                      <Card key={platform.platform}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 capitalize">
                            {getPlatformIcon(platform.platform)}
                            {platform.platform}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Posts</span>
                              <span className="font-semibold">{platform.posts}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Impressions</span>
                              <span className="font-semibold">{platform.impressions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Likes</span>
                              <span className="font-semibold">{platform.likes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Shares</span>
                              <span className="font-semibold">{platform.shares}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No analytics data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </OrganizerLayout>
  );
};

const CreatePostForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CreatePostPayload) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    platform: "facebook" as "facebook" | "twitter" | "instagram" | "linkedin",
    content: "",
    mediaUrls: "",
    scheduledAt: "",
    eventId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      mediaUrls: formData.mediaUrls
        ? formData.mediaUrls.split(",").map((url) => url.trim()).filter((url) => url)
        : undefined,
      scheduledAt: formData.scheduledAt || undefined,
      eventId: formData.eventId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">Platform *</Label>
        <Select
          value={formData.platform}
          onValueChange={(value: SocialPost["platform"]) => setFormData({ ...formData, platform: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows={6}
          placeholder="Write your post content..."
        />
      </div>
      <div>
        <Label htmlFor="mediaUrls">Media URLs (comma-separated)</Label>
        <Input
          id="mediaUrls"
          value={formData.mediaUrls}
          onChange={(e) => setFormData({ ...formData, mediaUrls: e.target.value })}
          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
        />
      </div>
      <div>
        <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="eventId">Event ID (Optional)</Label>
        <Input
          id="eventId"
          value={formData.eventId}
          onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
          placeholder="Link to specific event"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Post</Button>
      </div>
    </form>
  );
};

export default SocialMedia;

