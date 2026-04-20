import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Filter,
  RefreshCw,
  UserMinus,
} from "lucide-react";
import {
  createSegment,
  getOrganizerSegments,
  getSegmentById,
  updateSegmentMembers,
  removeMemberFromSegment,
  deleteSegment,
  sendToSegment,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from '@/lib/utils/error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, unknown>;
  memberCount?: number;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
}

const AttendeeSegmentation = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  interface SegmentMember {
    userId: string;
    user: {
      firstName?: string;
      lastName?: string;
      email?: string;
    } | undefined;
  }

  const [segmentMembers, setSegmentMembers] = useState<SegmentMember[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [confirmDeleteSegment, setConfirmDeleteSegment] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSegments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrganizerSegments();
      if (response.success && response.data) {
        const segmentData = Array.isArray(response.data.segments)
          ? response.data.segments
              .map((s) => {
                if (!s || typeof s !== "object") return null;
                if (!s.id || !s.name || !s.createdAt || !s.updatedAt) return null;
                return {
                  id: String(s.id),
                  name: String(s.name),
                  description: s.description,
                  criteria: s.criteria ?? {},
                  memberCount: s.memberCount,
                  eventId: s.eventId,
                  createdAt: String(s.createdAt),
                  updatedAt: String(s.updatedAt),
                } as Segment;
              })
              .filter((seg): seg is Segment => !!seg)
          : [];
        setSegments(segmentData);
      }
    } catch (error) {
      console.error("Error fetching segments:", error);
      showErrorToast(toast, error, 'Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const handleCreateSegment = async (data: {
    eventId?: string;
    name: string;
    description?: string;
    criteria: Record<string, unknown>;
  }) => {
    try {
      const response = await createSegment(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Segment created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchSegments();
      }
    } catch (error) {
      showErrorToast(toast, error, 'Failed to create segment');
    }
  };

  const handleUpdateMembers = async (segmentId: string) => {
    try {
      const response = await updateSegmentMembers(segmentId);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Updated: ${response.data.membersAdded} added, ${response.data.membersRemoved} removed`,
        });
        if (selectedSegment?.id === segmentId) {
          loadSegmentDetails(segmentId);
        }
      }
    } catch (error) {
      showErrorToast(toast, error, 'Failed to update segment members');
    }
  };

  const loadSegmentDetails = async (segmentId: string) => {
    try {
      const response = await getSegmentById(segmentId);
      if (response.success && response.data) {
        const segment = response.data.segment as unknown;
        const membersRaw = Array.isArray(response.data.members) ? response.data.members : [];
        if (segment && typeof segment === "object" && "id" in segment) {
          setSelectedSegment(segment as Segment);
        }
        const members = membersRaw
          .map((m) => {
            if (!m || typeof m !== "object") return null;
            const casted = m as Partial<SegmentMember>;
            if (!casted.userId) return null;
            return {
              userId: String(casted.userId),
              user: casted.user,
            };
          })
          .filter((m): m is SegmentMember => !!m?.userId);
        setSegmentMembers(members);
      }
    } catch (err) {
      console.error("Error loading segment details:", err);
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    try {
      const response = await deleteSegment(segmentId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Segment deleted successfully",
        });
        fetchSegments();
      }
    } catch (error) {
      showErrorToast(toast, error, 'Failed to delete segment');
    }
  };

  const handleSendMessage = async (segmentId: string, data: {
    subject: string;
    content: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) => {
    try {
      const response = await sendToSegment(segmentId, data);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Message sent to ${response.data.sent} recipients`,
        });
        setIsSendDialogOpen(false);
      }
    } catch (error) {
      showErrorToast(toast, error, 'Failed to send message');
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendee Segmentation</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage attendee segments for targeted communication
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Attendee Segment</DialogTitle>
              </DialogHeader>
              <CreateSegmentForm
                onSubmit={handleCreateSegment}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading segments...</div>
        ) : segments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No segments yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Segment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <Card key={segment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      {segment.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {segment.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {segment.memberCount || 0} members
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSegment(segment);
                        loadSegmentDetails(segment.id);
                      }}
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateMembers(segment.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSegment(segment);
                        setIsSendDialogOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeleteSegment(segment.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedSegment && (
          <Dialog
            open={!!selectedSegment}
            onOpenChange={(open) => !open && setSelectedSegment(null)}
          >
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedSegment.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedSegment.description && (
                  <p className="text-muted-foreground">{selectedSegment.description}</p>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Criteria</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(selectedSegment.criteria, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Members ({segmentMembers.length})</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateMembers(selectedSegment.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {segmentMembers.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No members in this segment</p>
                    ) : (
                      segmentMembers.map((member, index) => (
                        <div
                          key={member.userId || member.user?.email || `member-${index}`}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm">
                            {member.user?.firstName} {member.user?.lastName} ({member.user?.email})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMemberFromSegment(selectedSegment.id, member.userId)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {selectedSegment && (
          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message to Segment</DialogTitle>
              </DialogHeader>
              <SendMessageForm
                onSubmit={(data) => handleSendMessage(selectedSegment.id, data)}
                onCancel={() => setIsSendDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog open={!!confirmDeleteSegment} onOpenChange={() => setConfirmDeleteSegment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this segment?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. The segment will be permanently deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { handleDeleteSegment(confirmDeleteSegment!); setConfirmDeleteSegment(null); }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

const CreateSegmentForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { eventId?: string; name: string; description?: string; criteria: Record<string, unknown> }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventId, setEventId] = useState("");
  const [criteriaType, setCriteriaType] = useState("registration_date");
  const [criteriaValue, setCriteriaValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const criteria = {
      type: criteriaType,
      value: criteriaValue,
    };
    onSubmit({ eventId: eventId || undefined, name, description, criteria });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Segment Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., VIP Attendees"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this segment..."
        />
      </div>
      <div>
        <Label htmlFor="eventId">Event (Optional)</Label>
        <Input
          id="eventId"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          placeholder="Event ID"
        />
      </div>
      <div>
        <Label htmlFor="criteriaType">Criteria Type</Label>
        <Select value={criteriaType} onValueChange={setCriteriaType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="registration_date">Registration Date</SelectItem>
            <SelectItem value="ticket_type">Ticket Type</SelectItem>
            <SelectItem value="amount_spent">Amount Spent</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="criteriaValue">Criteria Value</Label>
        <Input
          id="criteriaValue"
          value={criteriaValue}
          onChange={(e) => setCriteriaValue(e.target.value)}
          placeholder="e.g., last_30_days"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Segment</Button>
      </div>
    </form>
  );
};

const SendMessageForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { subject: string; content: string; sendEmail?: boolean; sendNotification?: boolean }) => void;
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

export default AttendeeSegmentation;

