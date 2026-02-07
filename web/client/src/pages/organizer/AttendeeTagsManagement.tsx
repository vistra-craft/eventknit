/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizerLayout from "./OrganizerLayout";
import { Tag, Plus, Trash2, Users, Mail, X } from "lucide-react";
import {
  createTag,
  getOrganizerTags,
  tagUser,
  untagUser,
  getTaggedUsers,
  deleteTag,
  sendToTaggedUsers,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";

interface AttendeeTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  taggedCount?: number;
  createdAt: string;
  updatedAt: string;
}

const AttendeeTagsManagement = () => {
  const [tags, setTags] = useState<AttendeeTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<AttendeeTag | null>(null);
  interface TaggedUser {
    userId: string;
    eventId?: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    notes?: string | null;
  }

  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tags");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTagUserDialogOpen, setIsTagUserDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrganizerTags();
      if (response.success && response.data) {
        setTags(response.data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const loadTaggedUsers = useCallback(async () => {
    if (!selectedTag) return;
    try {
      const response = await getTaggedUsers(selectedTag.id);
      if (response.success && response.data) {
        const users = Array.isArray(response.data.users)
          ? response.data.users
              .map((u) => {
                if (!u || typeof u !== "object") return null;
                const raw = u as Record<string, unknown>;
                if (!raw.userId && !raw.user) return null;
                return {
                  userId: raw.userId ? String(raw.userId) : "",
                  eventId: typeof raw.eventId === "string" ? raw.eventId : undefined,
                  user: raw.user as TaggedUser["user"],
                  notes: typeof raw.notes === "string" ? raw.notes : null,
                } as TaggedUser;
              })
              .filter((t): t is TaggedUser => !!t)
          : [];
        setTaggedUsers(users);
      }
    } catch (error) {
      console.error("Error loading tagged users:", error);
    }
  }, [selectedTag]);

  useEffect(() => {
    if (selectedTag && activeTab === "users") {
      loadTaggedUsers();
    }
  }, [selectedTag, activeTab, loadTaggedUsers]);

  const handleCreateTag = async (data: {
    name: string;
    description?: string;
    color?: string;
  }) => {
    try {
      const response = await createTag(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Tag created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchTags();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive",
      });
    }
  };

  const handleTagUser = async (tagId: string, data: {
    userId: string;
    eventId?: string;
    notes?: string;
  }) => {
    try {
      const response = await tagUser(tagId, data);
      if (response.success) {
        toast({
          title: "Success",
          description: "User tagged successfully",
        });
        setIsTagUserDialogOpen(false);
        if (selectedTag?.id === tagId) {
          loadTaggedUsers();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to tag user",
        variant: "destructive",
      });
    }
  };

  const handleUntagUser = async (tagId: string, userId: string, eventId?: string) => {
    try {
      const response = await untagUser(tagId, { userId, eventId });
      if (response.success) {
        toast({
          title: "Success",
          description: "User untagged successfully",
        });
        loadTaggedUsers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to untag user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const response = await deleteTag(tagId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Tag deleted successfully",
        });
        fetchTags();
        if (selectedTag?.id === tagId) {
          setSelectedTag(null);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (tagId: string, data: {
    subject: string;
    content: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) => {
    try {
      const response = await sendToTaggedUsers(tagId, data);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Message sent to ${response.data.sent} recipients`,
        });
        setIsSendDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendee Tags</h1>
            <p className="text-muted-foreground mt-1">
              Organize and categorize attendees with tags
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
              </DialogHeader>
              <CreateTagForm
                onSubmit={handleCreateTag}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tags">All Tags</TabsTrigger>
            {selectedTag && (
              <TabsTrigger value="users">
                {selectedTag.name} - Users
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tags" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading tags...</div>
            ) : tags.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tags yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <Card
                    key={tag.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTag(tag);
                      setActiveTab("users");
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color || "#3b82f6" }}
                          />
                          <CardTitle className="text-lg">{tag.name}</CardTitle>
                        </div>
                      </div>
                      {tag.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {tag.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{tag.taggedCount || 0} users</span>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTag(tag);
                              setIsTagUserDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTag(tag);
                              setIsSendDialogOpen(true);
                            }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTag(tag.id)}
                          >
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

          <TabsContent value="users" className="space-y-4">
            {selectedTag ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedTag.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {taggedUsers.length} tagged users
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsTagUserDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tag User
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsSendDialogOpen(true)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>

                {taggedUsers.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No users tagged yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {taggedUsers.map((taggedUser, index) => (
                      <Card key={taggedUser.userId || taggedUser.user?.email || `tagged-${index}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                {taggedUser.user?.firstName} {taggedUser.user?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {taggedUser.user?.email}
                              </p>
                              {typeof taggedUser.notes === "string" && taggedUser.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {taggedUser.notes}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUntagUser(
                                  selectedTag.id,
                                  taggedUser.userId,
                                  taggedUser.eventId
                                )
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a tag to view users</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {selectedTag && (
          <>
            <Dialog open={isTagUserDialogOpen} onOpenChange={setIsTagUserDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tag User</DialogTitle>
                </DialogHeader>
                <TagUserForm
                  onSubmit={(data) => handleTagUser(selectedTag.id, data)}
                  onCancel={() => setIsTagUserDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Message to Tagged Users</DialogTitle>
                </DialogHeader>
                <SendMessageForm
                  onSubmit={(data) => handleSendMessage(selectedTag.id, data)}
                  onCancel={() => setIsSendDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </OrganizerLayout>
  );
};

const CreateTagForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; description?: string; color?: string }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, color });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tag Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., VIP"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this tag..."
        />
      </div>
      <div>
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#3b82f6"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Tag</Button>
      </div>
    </form>
  );
};

const TagUserForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { userId: string; eventId?: string; notes?: string }) => void;
  onCancel: () => void;
}) => {
  const [userId, setUserId] = useState("");
  const [eventId, setEventId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId,
      eventId: eventId || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="userId">User ID *</Label>
        <Input
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          placeholder="Enter user ID"
        />
      </div>
      <div>
        <Label htmlFor="eventId">Event ID (Optional)</Label>
        <Input
          id="eventId"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          placeholder="Link to specific event"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this tag..."
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Tag User</Button>
      </div>
    </form>
  );
};

const SendMessageForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    subject: string;
    content: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) => void;
  onCancel: () => void;
}) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ subject, content, sendEmail, sendNotification });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="content">Message *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendEmail"
            checked={sendEmail}
            onCheckedChange={(checked) => setSendEmail(!!checked)}
          />
          <Label htmlFor="sendEmail">Send Email</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendNotification"
            checked={sendNotification}
            onCheckedChange={(checked) => setSendNotification(!!checked)}
          />
          <Label htmlFor="sendNotification">Send In-App Notification</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Send Message</Button>
      </div>
    </form>
  );
};

export default AttendeeTagsManagement;

