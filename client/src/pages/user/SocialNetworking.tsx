/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, UserMinus, Users, Building2, Mail } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getFollowers, getFollowing, followUser, unfollowUser, getUserProfile } from "@/lib/user-dashboard-api";
import EmptyState from "@/components/EmptyState";

const SocialNetworking: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.id) {
      fetchSocialData();
    }
  }, [currentUser]);

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const [followersResponse, followingResponse, profileResponse] = await Promise.all([
        getFollowers(currentUser!.id, { page: 1, limit: 50 }),
        getFollowing(currentUser!.id, { page: 1, limit: 50 }),
        getUserProfile(currentUser!.id),
      ]);

      if (followersResponse.success && followersResponse.data) {
        setFollowers(followersResponse.data.followers || []);
      }

      if (followingResponse.success && followingResponse.data) {
        setFollowing(followingResponse.data.following || []);
      }

      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data.profile);
      }
    } catch (error) {
      console.error("Error fetching social data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string, currentlyFollowing: boolean) => {
    try {
      if (currentlyFollowing) {
        await unfollowUser(userId);
        toast({
          title: "Success",
          description: "Unfollowed user",
        });
      } else {
        await followUser(userId);
        toast({
          title: "Success",
          description: "Following user",
        });
      }
      fetchSocialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Social Networking</h1>
        <p className="text-muted-foreground">
          Connect with other attendees and organizers
        </p>
      </div>

      {/* Profile Stats */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {profile.followersCount || 0}
              </div>
              <p className="text-sm text-muted-foreground">Followers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {profile.followingCount || 0}
              </div>
              <p className="text-sm text-muted-foreground">Following</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {profile._count?.eventRegistrations || 0}
              </div>
              <p className="text-sm text-muted-foreground">Events Attended</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="followers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="followers">
            Followers ({followers.length})
          </TabsTrigger>
          <TabsTrigger value="following">
            Following ({following.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="space-y-4">
          {followers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Followers Yet"
              description="Start connecting with others to build your network!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followers.map((follower) => (
                <Card key={follower.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar
                        name={follower.firstName || follower.email || "User"}
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {follower.firstName} {follower.lastName || ""}
                        </h3>
                        {follower.organizationName && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {follower.organizationName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/user/profile/${follower.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/user/dashboard?section=messages`)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {following.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Not Following Anyone"
              description="Start following users to see their events and updates!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {following.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar
                        name={user.firstName || user.email || "User"}
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {user.firstName} {user.lastName || ""}
                        </h3>
                        {user.organizationName && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {user.organizationName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/user/profile/${user.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleFollowToggle(user.id, true)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialNetworking;
