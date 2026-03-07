import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Type,
  Layout,
  Save,
  Eye,
  Settings,
  Square,
  Image,
  QrCode,
  Plus,
  Trash2,
  Copy,
  Undo,
  Redo,
  Lock,
  Unlock,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  ChevronUp,
  ChevronDown,
  Sparkles,
  FileText,
  X,
  Award
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/useToast";
import { getEventById } from "@/lib/event-api";
import DraggableBadgeElement from "@/components/service-point/DraggableBadgeElement";
import {
  getBadgeTemplates,
  createBadgeTemplate,
  updateBadgeTemplate,
  deleteBadgeTemplate,
  duplicateBadgeTemplate,
  type BadgeTemplate,
  type BadgeElement,
  type BadgeSize,
  BADGE_SIZE_PRESETS,
  TEMPLATE_VARIABLES,
  replaceTemplateVariables,
  mmToPixels,
  generateElementId,
} from "@/lib/badge-template-api";

// Sample data for preview
const SAMPLE_DATA = {
  eventTitle: "Seamless East Africa 2025",
  eventDate: "July 2-3, 2025",
  eventVenue: "KICC, Nairobi",
  fullName: "Sarah Johnson",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah@techcorp.com",
  phone: "+254 700 123 456",
  company: "TechCorp Ltd",
  jobTitle: "Chief Technology Officer",
  ticketType: "VIP",
  ticketCategory: "Early Bird",
  registrationId: "REG-2025-0001",
  qrCode: "QR_SAMPLE_DATA",
  backupCode: "ABCD1234XY",
};

const FONT_FAMILIES = [
  "Inter",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
  "Trebuchet MS",
];

const COLOR_PALETTE = [
  "#000000", "#1a1a1a", "#333333", "#4a4a4a", "#666666", "#888888", "#aaaaaa", "#cccccc", "#e5e5e5", "#ffffff",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0d9488", "#0891b2", "#2563eb", "#4f46e5", "#7c3aed", "#db2777",
  "#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#99f6e4", "#a5f3fc", "#bfdbfe", "#c7d2fe", "#ddd6fe", "#fbcfe8",
];

const ServicePointTemplates: React.FC = () => {
  const { toast } = useToast();
  const { eventId } = useParams<{ eventId?: string }>();

  // Organizer context — resolved from the event when accessed via event-scoped URL
  const organizerIdRef = useRef<string | undefined>(undefined);
  const [eventTitle, setEventTitle] = useState<string | undefined>(undefined);

  // Templates state
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<BadgeTemplate | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editor state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);

  // History for undo/redo
  const [history, setHistory] = useState<BadgeTemplate[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getBadgeTemplates(
        organizerIdRef.current ? { organizerId: organizerIdRef.current } : undefined
      );
      if (response.success && response.data.templates) {
        setTemplates(response.data.templates);

        // Check for previously selected template in localStorage
        const savedTemplateId = localStorage.getItem('selectedBadgeTemplateId');
        const savedTemplate = savedTemplateId
          ? response.data.templates.find(t => t.id === savedTemplateId)
          : null;

        // Select saved template or first template by default
        const templateToSelect = savedTemplate || response.data.templates[0];
        if (templateToSelect) {
          setCurrentTemplate(templateToSelect);
          setHistory([templateToSelect]);
          setHistoryIndex(0);
        }
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // If accessed via event-scoped URL, fetch event to resolve organizerId first, then load templates
  useEffect(() => {
    if (!eventId) {
      loadTemplates();
      return;
    }
    getEventById(eventId)
      .then((res) => {
        if (res.success && res.data?.event) {
          organizerIdRef.current = res.data.event.organizerId;
          setEventTitle(res.data.event.title);
        }
      })
      .catch(() => { /* proceed without scope */ })
      .finally(() => loadTemplates());
  }, [eventId, loadTemplates]);

  // Save selected template to localStorage when it changes
  useEffect(() => {
    if (currentTemplate?.id) {
      localStorage.setItem('selectedBadgeTemplateId', currentTemplate.id);
    }
  }, [currentTemplate?.id]);

  // Keyboard shortcuts
  const [copiedElement, setCopiedElement] = useState<BadgeElement | null>(null);

  // History management - Define these before useEffect that uses them
  const pushToHistory = useCallback((template: BadgeTemplate) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), template]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCurrentTemplate(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCurrentTemplate(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const updateElementWithHistory = useCallback((elementId: string, updates: Partial<BadgeElement>) => {
    if (!currentTemplate) return;

    const updatedTemplate = {
      ...currentTemplate,
      elements: currentTemplate.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    };

    setCurrentTemplate(updatedTemplate);
    pushToHistory(updatedTemplate);
  }, [currentTemplate, pushToHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow keys - move element by 1mm
      if (selectedElement && currentTemplate && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const element = currentTemplate.elements.find(el => el.id === selectedElement);
        if (!element || element.isLocked) return;

        const delta = 1; // 1mm movement
        const updates: Partial<BadgeElement> = {};

        switch (e.key) {
          case 'ArrowUp':
            updates.y = Math.max(0, element.y - delta);
            break;
          case 'ArrowDown':
            updates.y = Math.min(currentTemplate.height - element.height, element.y + delta);
            break;
          case 'ArrowLeft':
            updates.x = Math.max(0, element.x - delta);
            break;
          case 'ArrowRight':
            updates.x = Math.min(currentTemplate.width - element.width, element.x + delta);
            break;
        }

        updateElementWithHistory(selectedElement, updates);
      }

      // Delete - delete selected element
      if (e.key === 'Delete' && selectedElement && currentTemplate) {
        e.preventDefault();
        const element = currentTemplate.elements.find(el => el.id === selectedElement);
        if (!element || element.isLocked) return;

        const updatedTemplate = {
          ...currentTemplate,
          elements: currentTemplate.elements.filter(el => el.id !== selectedElement),
        };
        setCurrentTemplate(updatedTemplate);
        pushToHistory(updatedTemplate);
        setSelectedElement(null);
        toast({ title: "Deleted", description: "Element removed" });
      }

      // Ctrl+C - Copy element
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElement && currentTemplate) {
        e.preventDefault();
        const element = currentTemplate.elements.find(el => el.id === selectedElement);
        if (element) {
          setCopiedElement(element);
          toast({ title: "Copied", description: "Element copied to clipboard" });
        }
      }

      // Ctrl+V - Paste element
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedElement && currentTemplate) {
        e.preventDefault();
        const newElement: BadgeElement = {
          ...copiedElement,
          id: generateElementId(),
          x: Math.min(currentTemplate.width - copiedElement.width, copiedElement.x + 5),
          y: Math.min(currentTemplate.height - copiedElement.height, copiedElement.y + 5),
        };

        const updatedTemplate = {
          ...currentTemplate,
          elements: [...currentTemplate.elements, newElement],
        };
        setCurrentTemplate(updatedTemplate);
        pushToHistory(updatedTemplate);
        setSelectedElement(newElement.id);
        toast({ title: "Pasted", description: "Element pasted" });
      }

      // Ctrl+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, currentTemplate, copiedElement, toast, undo, redo, pushToHistory, updateElementWithHistory]);

  // Template operations
  const handleSelectTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplate(template);
      setSelectedElement(null);
      setHistory([template]);
      setHistoryIndex(0);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const newTemplate: Omit<BadgeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> = {
        name: "New Template",
        description: "Custom badge template",
        width: 101.6,
        height: 76.2,
        sizePreset: '4x3' as BadgeSize,
        orientation: 'landscape',
        backgroundColor: "#ffffff",
        elements: [],
        isCustom: true,
        organizerId: organizerIdRef.current,
        eventId: eventId,
      };

      const response = await createBadgeTemplate(newTemplate);
      if (response.success) {
        await loadTemplates();
        setCurrentTemplate(response.data.template);
        setHistory([response.data.template]);
        setHistoryIndex(0);
        toast({ title: "Success", description: "Template created" });
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  };

  const handleDuplicateTemplate = async () => {
    if (!currentTemplate) return;
    try {
      const response = await duplicateBadgeTemplate(currentTemplate.id);
      if (response.success) {
        await loadTemplates();
        setCurrentTemplate(response.data.template);
        toast({ title: "Success", description: "Template duplicated" });
      }
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast({ title: "Error", description: "Failed to duplicate template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate || currentTemplate.isDefault) return;
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    try {
      await deleteBadgeTemplate(currentTemplate.id);
      await loadTemplates();
      setCurrentTemplate(templates[0] || null);
      toast({ title: "Success", description: "Template deleted" });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;

    try {
      setIsSaving(true);
      await updateBadgeTemplate(currentTemplate.id, currentTemplate);
      await loadTemplates();
      toast({ title: "Success", description: "Template saved" });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Element operations
  const addElement = (type: BadgeElement['type']) => {
    if (!currentTemplate) return;

    const newElement: BadgeElement = {
      id: generateElementId(),
      type,
      content: type === 'text' ? 'New Text' : type === 'qr' ? '{{qrCode}}' : type === 'ribbon' ? 'VIP' : '',
      x: 20,
      y: 20,
      width: type === 'qr' ? 24 : type === 'shape' ? 30 : type === 'ribbon' ? 40 : 50,
      height: type === 'qr' ? 24 : type === 'shape' ? 20 : type === 'ribbon' ? 12 : 10,
      fontSize: 14,
      fontFamily: "Inter",
      fontWeight: type === 'ribbon' ? "bold" : "normal",
      textAlign: type === 'ribbon' ? "center" : "left",
      color: type === 'ribbon' ? "#ffffff" : "#000000",
      backgroundColor: type === 'shape' ? "#e5e7eb" : "transparent",
      borderRadius: type === 'ribbon' ? 4 : 0,
      opacity: 1,
      rotation: 0,
      zIndex: currentTemplate.elements.length + 1,
      isVisible: true,
      isLocked: false,
      ribbonIcon: type === 'ribbon' ? 'crown' : undefined,
      ribbonGradient: type === 'ribbon' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
    };

    const updatedTemplate = {
      ...currentTemplate,
      elements: [...currentTemplate.elements, newElement],
    };

    setCurrentTemplate(updatedTemplate);
    pushToHistory(updatedTemplate);
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<BadgeElement>) => {
    if (!currentTemplate) return;

    const updatedTemplate = {
      ...currentTemplate,
      elements: currentTemplate.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    };

    setCurrentTemplate(updatedTemplate);
  };

  const deleteElement = (elementId: string) => {
    if (!currentTemplate) return;

    const updatedTemplate = {
      ...currentTemplate,
      elements: currentTemplate.elements.filter(el => el.id !== elementId),
    };

    setCurrentTemplate(updatedTemplate);
    pushToHistory(updatedTemplate);
    setSelectedElement(null);
  };

  const duplicateElement = (elementId: string) => {
    if (!currentTemplate) return;

    const element = currentTemplate.elements.find(el => el.id === elementId);
    if (!element) return;

    const newElement: BadgeElement = {
      ...element,
      id: generateElementId(),
      x: element.x + 5,
      y: element.y + 5,
      zIndex: currentTemplate.elements.length + 1,
    };

    const updatedTemplate = {
      ...currentTemplate,
      elements: [...currentTemplate.elements, newElement],
    };

    setCurrentTemplate(updatedTemplate);
    pushToHistory(updatedTemplate);
    setSelectedElement(newElement.id);
  };

  const moveElementLayer = (elementId: string, direction: 'up' | 'down') => {
    if (!currentTemplate) return;

    const elements = [...currentTemplate.elements];
    const index = elements.findIndex(el => el.id === elementId);
    if (index === -1) return;

    const newIndex = direction === 'up'
      ? Math.min(index + 1, elements.length - 1)
      : Math.max(index - 1, 0);

    if (newIndex === index) return;

    const [removed] = elements.splice(index, 1);
    elements.splice(newIndex, 0, removed);

    // Update zIndex for all elements
    const updatedElements = elements.map((el, i) => ({ ...el, zIndex: i + 1 }));

    const updatedTemplate = { ...currentTemplate, elements: updatedElements };
    setCurrentTemplate(updatedTemplate);
    pushToHistory(updatedTemplate);
  };

  const selectedElementData = currentTemplate?.elements.find(el => el.id === selectedElement);

  // Scale factor for canvas (mm to pixels)
  const scale = zoom / 100;
  const canvasWidth = currentTemplate ? mmToPixels(currentTemplate.width) * scale : 0;
  const canvasHeight = currentTemplate ? mmToPixels(currentTemplate.height) * scale : 0;

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton
              to={eventId ? `/admin/service-point/dashboard/${eventId}` : "/admin/service-point"}
              label={eventId ? "Back to Event" : "Back"}
            />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Badge Template Editor</h1>
              <p className="text-sm text-muted-foreground">
                {eventTitle
                  ? `Templates scoped to: ${eventTitle}`
                  : "Design and customize badge templates for your events"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              {isPreviewMode ? <Settings className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving || !currentTemplate}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Templates & Elements */}
          <div className="col-span-3 space-y-4">
            {/* Templates List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center">
                    <Layout className="w-4 h-4 mr-2" />
                    Templates
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleCreateTemplate}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {templates.map((template) => {
                    // Get gradient based on template name/type
                    const getTemplateGradient = () => {
                      const name = template.name.toLowerCase();
                      if (name.includes('vip') || name.includes('premium')) {
                        return 'from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border-blue-500/30';
                      }
                      if (name.includes('speaker') || name.includes('staff')) {
                        return 'from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border-purple-500/30';
                      }
                      if (name.includes('regular') || name.includes('standard')) {
                        return 'from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border-green-500/30';
                      }
                      return 'from-gray-500/10 to-gray-600/10 hover:from-gray-500/20 hover:to-gray-600/20 border-gray-500/30';
                    };

                    const gradient = getTemplateGradient();
                    const isActive = currentTemplate?.id === template.id;

                    return (
                      <div
                        key={template.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border bg-gradient-to-br ${
                          isActive
                            ? 'border-primary shadow-md ring-2 ring-primary/20'
                            : gradient
                        }`}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{template.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{template.description || 'Custom badge template'}</p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {template.isDefault && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">Default</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Add Elements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Elements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('text')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <Type className="w-5 h-5" />
                    <span className="text-xs">Text</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('qr')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">QR Code</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('image')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('shape')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <Square className="w-5 h-5" />
                    <span className="text-xs">Shape</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('ribbon')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <Award className="w-5 h-5" />
                    <span className="text-xs">Ribbon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Variables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-semibold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Dynamic Variables
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-40 overflow-y-auto">
                <div className="space-y-1">
                  {TEMPLATE_VARIABLES.slice(0, 8).map((variable) => (
                    <div
                      key={variable.key}
                      className="text-xs p-2 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(`{{${variable.key}}}`);
                        toast({ title: "Copied", description: `{{${variable.key}}} copied to clipboard` });
                      }}
                    >
                      <span className="font-mono text-primary">{`{{${variable.key}}}`}</span>
                      <span className="text-muted-foreground ml-2">→ {variable.example}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Canvas */}
          <div className="col-span-6">
            <Card className="h-full">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    {currentTemplate?.name || 'No Template Selected'}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Zoom</Label>
                      <div className="w-24">
                        <Slider
                          value={[zoom]}
                          onValueChange={([value]: number[]) => setZoom(value)}
                          min={50}
                          max={150}
                          step={10}
                        />
                      </div>
                      <span className="text-xs w-10">{zoom}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                        id="show-grid"
                      />
                      <Label htmlFor="show-grid" className="text-xs">Grid</Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-center min-h-[600px] bg-gradient-to-br from-muted/40 to-muted/60 overflow-auto">
                {currentTemplate ? (
                  <div
                    className="relative border-2 border-dashed border-gray-400 bg-white shadow-2xl transition-all duration-200 max-w-full hover:border-primary/50"
                    style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`,
                      maxWidth: '100%',
                      backgroundColor: currentTemplate.backgroundColor,
                      backgroundImage: showGrid && !isPreviewMode
                        ? 'repeating-linear-gradient(0deg, transparent, transparent 9px, #e5e5e5 9px, #e5e5e5 10px), repeating-linear-gradient(90deg, transparent, transparent 9px, #e5e5e5 9px, #e5e5e5 10px)'
                        : 'none',
                    }}
                  >
                    {currentTemplate.elements.map((element) => {
                      const content = isPreviewMode
                        ? replaceTemplateVariables(element.content, SAMPLE_DATA)
                        : element.content;

                      return (
                        <DraggableBadgeElement
                          key={element.id}
                          element={element}
                          scale={scale}
                          isSelected={selectedElement === element.id}
                          isPreviewMode={isPreviewMode}
                          content={content}
                          onSelect={setSelectedElement}
                          onUpdate={updateElement}
                          onUpdateComplete={() => pushToHistory(currentTemplate!)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select or create a template to start editing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Properties */}
          <div className="col-span-3 space-y-4">
            {selectedElementData && !isPreviewMode ? (
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-sm font-semibold">
                      <Settings className="w-4 h-4 mr-2" />
                      Element Properties
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {selectedElementData.type}
                    </Badge>
                  </div>
                  {/* Action buttons row - icon-only with hover tooltips */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateElementWithHistory(selectedElement!, { isLocked: !selectedElementData.isLocked })}
                      title={selectedElementData.isLocked ? 'Unlock element' : 'Lock element'}
                    >
                      {selectedElementData.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateElement(selectedElement!)}
                      title="Duplicate element"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteElement(selectedElement!)}
                      title="Delete element"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                      <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                      <TabsTrigger value="position" className="text-xs">Position</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 mt-4">
                      {selectedElementData.type === 'text' && (
                        <>
                          <div>
                            <Label className="text-xs mb-1.5 block">Content</Label>
                            <Input
                              value={selectedElementData.content}
                              onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                              onBlur={() => pushToHistory(currentTemplate!)}
                              className="h-8 text-sm"
                              placeholder="Enter text or {{variable}}"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs mb-1.5 block">Font Size</Label>
                              <Input
                                type="number"
                                value={selectedElementData.fontSize || 14}
                                onChange={(e) => updateElement(selectedElement!, { fontSize: parseInt(e.target.value) || 14 })}
                                onBlur={() => pushToHistory(currentTemplate!)}
                                className="h-8 text-sm"
                                min={6}
                                max={72}
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1.5 block">Font</Label>
                              <select
                                value={selectedElementData.fontFamily || 'Inter'}
                                onChange={(e) => updateElementWithHistory(selectedElement!, { fontFamily: e.target.value })}
                                className="w-full h-8 px-2 border border-border rounded text-sm bg-background"
                              >
                                {FONT_FAMILIES.map(font => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs mb-1.5 block">Alignment</Label>
                            <div className="flex gap-1">
                              {(['left', 'center', 'right'] as const).map((align) => (
                                <Button
                                  key={align}
                                  variant={selectedElementData.textAlign === align ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => updateElementWithHistory(selectedElement!, { textAlign: align })}
                                  className="flex-1 h-8"
                                >
                                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs mb-1.5 block">Weight</Label>
                            <div className="flex gap-1">
                              {(['normal', 'bold'] as const).map((weight) => (
                                <Button
                                  key={weight}
                                  variant={selectedElementData.fontWeight === weight ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => updateElementWithHistory(selectedElement!, { fontWeight: weight })}
                                  className="flex-1 h-8"
                                >
                                  {weight === 'bold' ? <Bold className="w-4 h-4" /> : 'Normal'}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {selectedElementData.type === 'qr' && (
                        <div>
                          <Label className="text-xs mb-1.5 block">QR Data Variable</Label>
                          <select
                            value={selectedElementData.content}
                            onChange={(e) => updateElementWithHistory(selectedElement!, { content: e.target.value })}
                            className="w-full h-8 px-2 border border-border rounded text-sm bg-background"
                          >
                            <option value="{{qrCode}}">QR Code</option>
                            <option value="{{backupCode}}">Backup Code</option>
                            <option value="{{registrationId}}">Registration ID</option>
                          </select>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="style" className="space-y-4 mt-4">
                      <div>
                        <Label className="text-xs mb-1.5 block">Text Color</Label>
                        <div className="grid grid-cols-10 gap-1">
                          {COLOR_PALETTE.slice(0, 20).map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded border transition-all ${
                                selectedElementData.color === color ? 'ring-2 ring-primary ring-offset-1' : 'border-gray-200'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => updateElementWithHistory(selectedElement!, { color })}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Background</Label>
                        <div className="grid grid-cols-10 gap-1">
                          {['transparent', ...COLOR_PALETTE.slice(0, 19)].map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded border transition-all ${
                                selectedElementData.backgroundColor === color ? 'ring-2 ring-primary ring-offset-1' : 'border-gray-200'
                              } ${color === 'transparent' ? 'bg-[url("data:image/svg+xml,%3Csvg%20width%3D%226%22%20height%3D%226%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%223%22%20height%3D%223%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%223%22%20height%3D%223%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E")]' : ''}`}
                              style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                              onClick={() => updateElementWithHistory(selectedElement!, { backgroundColor: color })}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Border Radius</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[selectedElementData.borderRadius || 0]}
                            onValueChange={([value]: number[]) => updateElement(selectedElement!, { borderRadius: value })}
                            onValueCommit={() => pushToHistory(currentTemplate!)}
                            min={0}
                            max={20}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{selectedElementData.borderRadius || 0}px</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Opacity</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[(selectedElementData.opacity || 1) * 100]}
                            onValueChange={([value]: number[]) => updateElement(selectedElement!, { opacity: value / 100 })}
                            onValueCommit={() => pushToHistory(currentTemplate!)}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-xs w-10">{Math.round((selectedElementData.opacity || 1) * 100)}%</span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="position" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs mb-1.5 block">X (mm)</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.x * 10) / 10}
                            onChange={(e) => updateElement(selectedElement!, { x: parseFloat(e.target.value) || 0 })}
                            onBlur={() => pushToHistory(currentTemplate!)}
                            className="h-8 text-sm"
                            step={0.5}
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">Y (mm)</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.y * 10) / 10}
                            onChange={(e) => updateElement(selectedElement!, { y: parseFloat(e.target.value) || 0 })}
                            onBlur={() => pushToHistory(currentTemplate!)}
                            className="h-8 text-sm"
                            step={0.5}
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">Width (mm)</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.width * 10) / 10}
                            onChange={(e) => updateElement(selectedElement!, { width: parseFloat(e.target.value) || 10 })}
                            onBlur={() => pushToHistory(currentTemplate!)}
                            className="h-8 text-sm"
                            step={0.5}
                            min={5}
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">Height (mm)</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.height * 10) / 10}
                            onChange={(e) => updateElement(selectedElement!, { height: parseFloat(e.target.value) || 5 })}
                            onBlur={() => pushToHistory(currentTemplate!)}
                            className="h-8 text-sm"
                            step={0.5}
                            min={3}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Rotation</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[selectedElementData.rotation || 0]}
                            onValueChange={([value]: number[]) => updateElement(selectedElement!, { rotation: value })}
                            onValueCommit={() => pushToHistory(currentTemplate!)}
                            min={-180}
                            max={180}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-xs w-10">{selectedElementData.rotation || 0}°</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Layer Order</Label>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveElementLayer(selectedElement!, 'up')}
                            className="flex-1 h-8"
                          >
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Forward
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveElementLayer(selectedElement!, 'down')}
                            className="flex-1 h-8"
                          >
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Back
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-sm font-semibold">
                    <Layout className="w-4 h-4 mr-2" />
                    Template Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentTemplate && (
                    <>
                      <div>
                        <Label className="text-xs mb-1.5 block">Template Name</Label>
                        <Input
                          value={currentTemplate.name}
                          onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Badge Size</Label>
                        <select
                          value={currentTemplate.sizePreset}
                          onChange={(e) => {
                            const preset = e.target.value as BadgeSize;
                            const size = BADGE_SIZE_PRESETS[preset];
                            setCurrentTemplate({
                              ...currentTemplate,
                              sizePreset: preset,
                              width: size.width,
                              height: size.height,
                            });
                          }}
                          className="w-full h-8 px-2 border border-border rounded text-sm bg-background"
                        >
                          {Object.entries(BADGE_SIZE_PRESETS).map(([key, value]) => (
                            <option key={key} value={key}>{value.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Background Color</Label>
                        <div className="grid grid-cols-10 gap-1">
                          {COLOR_PALETTE.slice(0, 20).map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded border transition-all ${
                                currentTemplate.backgroundColor === color ? 'ring-2 ring-primary ring-offset-1' : 'border-gray-200'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setCurrentTemplate({ ...currentTemplate, backgroundColor: color })}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 border-t space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleDuplicateTemplate}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate Template
                        </Button>
                        {!currentTemplate.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-destructive hover:text-destructive"
                            onClick={handleDeleteTemplate}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Template
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Elements List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-semibold">
                  <Layers className="w-4 h-4 mr-2" />
                  Layers ({currentTemplate?.elements.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {currentTemplate?.elements.slice().reverse().map((element) => (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedElement === element.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          {element.type === 'text' && <Type className="w-3 h-3" />}
                          {element.type === 'qr' && <QrCode className="w-3 h-3" />}
                          {element.type === 'image' && <Image className="w-3 h-3" />}
                          {element.type === 'shape' && <Square className="w-3 h-3" />}
                        </div>
                        <span className="text-xs truncate">
                          {element.type === 'text'
                            ? element.content.substring(0, 20) + (element.content.length > 20 ? '...' : '')
                            : element.type.charAt(0).toUpperCase() + element.type.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {element.isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default ServicePointTemplates;
