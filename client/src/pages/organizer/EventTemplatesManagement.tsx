/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import OrganizerLayout from "./OrganizerLayout";
import {
  FileText,
  Plus,
  Copy,
  Share2,
  Eye,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import {
  createEventTemplate,
  getOrganizerTemplates,
  getPublicTemplates,
  deleteTemplate,
  shareTemplate,
  applyTemplate,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";

interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
  isPublic: boolean;
  shareToken?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const EventTemplatesManagement = () => {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-templates");
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const [myTemplatesRes, publicTemplatesRes] = await Promise.all([
        getOrganizerTemplates(),
        getPublicTemplates(),
      ]);

      if (myTemplatesRes.success && myTemplatesRes.data) {
        const templatesData = Array.isArray(myTemplatesRes.data.templates)
          ? (myTemplatesRes.data.templates as unknown as EventTemplate[])
          : [];
        setTemplates(templatesData);
      }

      if (publicTemplatesRes.success && publicTemplatesRes.data) {
        const publicTemplatesData = Array.isArray(publicTemplatesRes.data.templates)
          ? (publicTemplatesRes.data.templates as unknown as EventTemplate[])
          : [];
        setPublicTemplates(publicTemplatesData);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateTemplate = async (data: {
    name: string;
    description?: string;
    eventData: Record<string, unknown>;
    isPublic?: boolean;
  }) => {
    try {
      const response = await createEventTemplate(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Template created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await deleteTemplate(templateId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleShareTemplate = async (templateId: string) => {
    try {
      const response = await shareTemplate(templateId);
      if (response.success && response.data) {
        navigator.clipboard.writeText(response.data.shareUrl);
        toast({
          title: "Success",
          description: "Share link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing template:", error);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive",
      });
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await applyTemplate(templateId);
      if (response.success && response.data) {
        // Navigate to create event page with template data
        window.location.href = `/organizer/create-event?template=${templateId}`;
      }
    } catch (error) {
      console.error("Error using template:", error);
      toast({
        title: "Error",
        description: "Failed to use template",
        variant: "destructive",
      });
    }
  };

  const renderTemplateCard = (template: EventTemplate, isPublic: boolean = false) => (
    <Card key={template.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {template.isPublic ? (
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>Version {template.version}</span>
          <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTemplate(template);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {!isPublic && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareTemplate(template.id)}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTemplate(template.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={() => handleUseTemplate(template.id)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Use
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Event Templates</h1>
            <p className="text-muted-foreground mt-1">
              Save and reuse event configurations
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Event Template</DialogTitle>
              </DialogHeader>
              <CreateTemplateForm
                onSubmit={handleCreateTemplate}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-templates">My Templates</TabsTrigger>
            <TabsTrigger value="public-templates">Public Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="my-templates" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading templates...</div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No templates yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => renderTemplateCard(template))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public-templates" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading templates...</div>
            ) : publicTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No public templates available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTemplates.map((template) => renderTemplateCard(template, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedTemplate && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedTemplate.description && (
                  <p className="text-muted-foreground">{selectedTemplate.description}</p>
                )}
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(selectedTemplate.eventData, null, 2)}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </OrganizerLayout>
  );
};

const CreateTemplateForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; description?: string; eventData: Record<string, unknown>; isPublic?: boolean }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [eventDataJson, setEventDataJson] = useState("{}");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = JSON.parse(eventDataJson);
      onSubmit({ name, description, eventData, isPublic });
    } catch (error) {
      alert("Invalid JSON in event data");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Conference Template"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this template..."
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
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="isPublic">Make this template public</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Template</Button>
      </div>
    </form>
  );
};

export default EventTemplatesManagement;

