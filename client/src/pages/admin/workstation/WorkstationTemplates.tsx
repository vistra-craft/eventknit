import React, { useState, useEffect, useCallback } from "react";
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
  X
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
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

const WorkstationTemplates: React.FC = () => {
  const { toast } = useToast();

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

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await getBadgeTemplates();
      if (response.success && response.data.templates) {
        setTemplates(response.data.templates);
        // Select first template by default
        if (response.data.templates.length > 0 && !currentTemplate) {
          setCurrentTemplate(response.data.templates[0]);
          setHistory([response.data.templates[0]]);
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
  };

  // History management
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
      content: type === 'text' ? 'New Text' : type === 'qr' ? '{{qrCode}}' : '',
      x: 20,
      y: 20,
      width: type === 'qr' ? 24 : type === 'shape' ? 30 : 50,
      height: type === 'qr' ? 24 : type === 'shape' ? 20 : 10,
      fontSize: 14,
      fontFamily: "Inter",
      fontWeight: "normal",
      textAlign: "left",
      color: "#000000",
      backgroundColor: type === 'shape' ? "#e5e7eb" : "transparent",
      borderRadius: 0,
      opacity: 1,
      rotation: 0,
      zIndex: currentTemplate.elements.length + 1,
      isVisible: true,
      isLocked: false,
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

  const updateElementWithHistory = (elementId: string, updates: Partial<BadgeElement>) => {
    if (!currentTemplate) return;

    const updatedTemplate = {
      ...currentTemplate,
      elements: currentTemplate.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    };

    setCurrentTemplate(updatedTemplate);
    pushToHistory(updatedTemplate);
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
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/workstation" label="Back" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Badge Template Editor</h1>
              <p className="text-sm text-muted-foreground">Design and customize badge templates for your events</p>
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
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                        currentTemplate?.id === template.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{template.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">Default</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('text')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <Type className="w-5 h-5" />
                    <span className="text-xs">Text</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('qr')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">QR Code</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('image')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('shape')}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                  >
                    <Square className="w-5 h-5" />
                    <span className="text-xs">Shape</span>
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
                          onValueChange={([value]) => setZoom(value)}
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
              <CardContent className="p-6 flex items-center justify-center min-h-[500px] bg-muted/30">
                {currentTemplate ? (
                  <div
                    className="relative border-2 border-dashed border-gray-300 bg-white shadow-lg transition-all duration-200"
                    style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`,
                      backgroundColor: currentTemplate.backgroundColor,
                      backgroundImage: showGrid && !isPreviewMode
                        ? 'repeating-linear-gradient(0deg, transparent, transparent 9px, #f0f0f0 9px, #f0f0f0 10px), repeating-linear-gradient(90deg, transparent, transparent 9px, #f0f0f0 9px, #f0f0f0 10px)'
                        : 'none',
                    }}
                  >
                    {currentTemplate.elements.map((element) => {
                      const content = isPreviewMode
                        ? replaceTemplateVariables(element.content, SAMPLE_DATA)
                        : element.content;

                      return (
                        <div
                          key={element.id}
                          className={`absolute cursor-pointer transition-all duration-100 ${
                            selectedElement === element.id && !isPreviewMode
                              ? 'ring-2 ring-primary ring-offset-1'
                              : ''
                          } ${element.isLocked ? 'cursor-not-allowed' : ''}`}
                          style={{
                            left: `${mmToPixels(element.x) * scale}px`,
                            top: `${mmToPixels(element.y) * scale}px`,
                            width: `${mmToPixels(element.width) * scale}px`,
                            height: `${mmToPixels(element.height) * scale}px`,
                            fontSize: `${(element.fontSize || 14) * scale}px`,
                            fontFamily: element.fontFamily || 'Inter',
                            fontWeight: element.fontWeight || 'normal',
                            textAlign: element.textAlign || 'left',
                            color: element.color || '#000000',
                            backgroundColor: element.backgroundColor || 'transparent',
                            borderRadius: `${(element.borderRadius || 0) * scale}px`,
                            opacity: element.opacity || 1,
                            transform: `rotate(${element.rotation || 0}deg)`,
                            zIndex: element.zIndex,
                            display: element.isVisible === false ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            padding: element.type === 'text' ? `${2 * scale}px` : 0,
                            overflow: 'hidden',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isPreviewMode && !element.isLocked) {
                              setSelectedElement(element.id);
                            }
                          }}
                        >
                          {element.type === 'text' && (
                            <span className="whitespace-pre-wrap break-words w-full">{content}</span>
                          )}
                          {element.type === 'qr' && (
                            <div className="w-full h-full bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-sm flex items-center justify-center">
                                <QrCode className="w-1/2 h-1/2 text-white" />
                              </div>
                            </div>
                          )}
                          {element.type === 'image' && (
                            <div className="w-full h-full bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                              <Image className="w-1/3 h-1/3 text-gray-400" />
                            </div>
                          )}
                          {element.type === 'shape' && (
                            <div className="w-full h-full" style={{ backgroundColor: element.backgroundColor }} />
                          )}
                        </div>
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <div className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Element Properties
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateElementWithHistory(selectedElement!, { isLocked: !selectedElementData.isLocked })}
                      >
                        {selectedElementData.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateElement(selectedElement!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteElement(selectedElement!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
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
                            onValueChange={([value]) => updateElement(selectedElement!, { borderRadius: value })}
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
                            onValueChange={([value]) => updateElement(selectedElement!, { opacity: value / 100 })}
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
                            onValueChange={([value]) => updateElement(selectedElement!, { rotation: value })}
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
                            className="w-full text-red-500 hover:text-red-600"
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
    </AdminLayout>
  );
};

export default WorkstationTemplates;
