/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import OrganizerLayout from "./OrganizerLayout";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Clock,
  Send,
  Calendar,
} from "lucide-react";
import {
  createEventDraft,
  getOrganizerDrafts,
  updateDraft,
  scheduleDraft,
  publishDraft,
  deleteDraft,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/use-toast";

interface Draft {
  id: string;
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
  version: number;
  scheduledDate?: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
}

const EventDraftsManagement = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrganizerDrafts();
      if (response.success && response.data) {
        const drafts = Array.isArray(response.data.drafts)
          ? (response.data.drafts as unknown as Draft[])
          : [];
        setDrafts(drafts);
      }
    } catch (error) {
      console.error("Error fetching drafts:", error);
      toast({
        title: "Error",
        description: "Failed to load drafts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleCreateDraft = async (data: {
    eventId?: string;
    name: string;
    description?: string;
    eventData: Record<string, unknown>;
  }) => {
    try {
      const response = await createEventDraft(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Draft created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchDrafts();
      }
    } catch (error) {
      console.error("Error creating draft:", error);
      toast({
        title: "Error",
        description: "Failed to create draft",
        variant: "destructive",
      });
    }
  };

  const handlePublishDraft = async (draftId: string) => {
    if (!confirm("Are you sure you want to publish this draft? This will create a new event.")) return;

    try {
      const response = await publishDraft(draftId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Draft published successfully",
        });
        fetchDrafts();
      }
    } catch (error) {
      console.error("Error publishing draft:", error);
      toast({
        title: "Error",
        description: "Failed to publish draft",
        variant: "destructive",
      });
    }
  };

  const handleScheduleDraft = async (draftId: string, scheduledDate: string) => {
    try {
      const response = await scheduleDraft(draftId, { scheduledDate });
      if (response.success) {
        toast({
          title: "Success",
          description: "Draft scheduled successfully",
        });
        setIsScheduleDialogOpen(false);
        fetchDrafts();
      }
    } catch (error) {
      console.error("Error scheduling draft:", error);
      toast({
        title: "Error",
        description: "Failed to schedule draft",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      const response = await deleteDraft(draftId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Draft deleted successfully",
        });
        fetchDrafts();
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Event Drafts</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage event drafts before publishing
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Draft
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Event Draft</DialogTitle>
              </DialogHeader>
              <CreateDraftForm
                onSubmit={handleCreateDraft}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading drafts...</div>
        ) : drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No drafts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{draft.name}</CardTitle>
                      {draft.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {draft.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">v{draft.version}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {draft.scheduledDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Scheduled: {new Date(draft.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDraft(draft);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDraft(draft);
                          setIsScheduleDialogOpen(true);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePublishDraft(draft.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDraft(draft.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedDraft && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Draft</DialogTitle>
              </DialogHeader>
              <EditDraftForm
                draft={selectedDraft}
                onSubmit={async (data) => {
                  const response = await updateDraft(selectedDraft.id, data);
                  if (response.success) {
                    toast({ title: "Success", description: "Draft updated" });
                    setIsEditDialogOpen(false);
                    fetchDrafts();
                  }
                }}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedDraft(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {selectedDraft && (
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Draft Publication</DialogTitle>
              </DialogHeader>
              <ScheduleDraftForm
                onSubmit={(scheduledDate) => handleScheduleDraft(selectedDraft.id, scheduledDate)}
                onCancel={() => {
                  setIsScheduleDialogOpen(false);
                  setSelectedDraft(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </OrganizerLayout>
  );
};

const CreateDraftForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { eventId?: string; name: string; description?: string; eventData: Record<string, unknown> }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventId, setEventId] = useState("");
  const [eventDataJson, setEventDataJson] = useState("{}");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = JSON.parse(eventDataJson);
      onSubmit({ eventId: eventId || undefined, name, description, eventData });
    } catch (error) {
      alert("Invalid JSON in event data");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Draft Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Summer Conference Draft"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this draft..."
        />
      </div>
      <div>
        <Label htmlFor="eventId">Event ID (Optional)</Label>
        <Input
          id="eventId"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          placeholder="Link to existing event"
        />
      </div>
      <div>
        <Label htmlFor="eventData">Event Data (JSON) *</Label>
        <Textarea
          id="eventData"
          value={eventDataJson}
          onChange={(e) => setEventDataJson(e.target.value)}
          required
          rows={10}
          className="font-mono text-sm"
          placeholder='{"title": "Event Title", "description": "..."}'
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Draft</Button>
      </div>
    </form>
  );
};

const EditDraftForm = ({
  draft,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  onSubmit: (data: { name?: string; description?: string; eventData?: Record<string, unknown> }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState(draft.description || "");
  const [eventDataJson, setEventDataJson] = useState(JSON.stringify(draft.eventData, null, 2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = JSON.parse(eventDataJson);
      onSubmit({ name, description, eventData });
    } catch (error) {
      alert("Invalid JSON in event data");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Draft Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="eventData">Event Data (JSON) *</Label>
        <Textarea
          id="eventData"
          value={eventDataJson}
          onChange={(e) => setEventDataJson(e.target.value)}
          required
          rows={10}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Update Draft</Button>
      </div>
    </form>
  );
};

const ScheduleDraftForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (scheduledDate: string) => void;
  onCancel: () => void;
}) => {
  const [scheduledDate, setScheduledDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(scheduledDate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="scheduledDate">Scheduled Date & Time *</Label>
        <Input
          id="scheduledDate"
          type="datetime-local"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Schedule</Button>
      </div>
    </form>
  );
};

export default EventDraftsManagement;

