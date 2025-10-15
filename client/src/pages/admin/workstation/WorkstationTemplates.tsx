import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { 
  Type, 
  Layout, 
  Save, 
  Eye, 
  ArrowLeft,
  Settings,
  Grid,
  Square,
  Image,
  QrCode,
  Plus,
  Trash2,
  Copy,
  Download
} from "lucide-react";
import AdminLayout from "../AdminLayout";

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'shape' | 'logo';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  zIndex: number;
}

interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: TemplateElement[];
  isDefault: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

const WorkstationTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [templates, setTemplates] = useState<BadgeTemplate[]>([
    {
      id: "default",
      name: "Default Badge",
      description: "Standard event badge template",
      width: 300,
      height: 200,
      backgroundColor: "#ffffff",
      elements: [
        {
          id: "title",
          type: "text",
          content: "{{eventTitle}}",
          x: 20,
          y: 20,
          width: 260,
          height: 30,
          fontSize: 18,
          fontFamily: "Inter",
          fontWeight: "bold",
          color: "#000000",
          zIndex: 1
        },
        {
          id: "attendee",
          type: "text",
          content: "{{attendeeName}}",
          x: 20,
          y: 60,
          width: 260,
          height: 25,
          fontSize: 16,
          fontFamily: "Inter",
          fontWeight: "normal",
          color: "#333333",
          zIndex: 2
        },
        {
          id: "company",
          type: "text",
          content: "{{company}}",
          x: 20,
          y: 90,
          width: 260,
          height: 20,
          fontSize: 14,
          fontFamily: "Inter",
          fontWeight: "normal",
          color: "#666666",
          zIndex: 3
        },
        {
          id: "qr",
          type: "qr",
          content: "{{qrCode}}",
          x: 200,
          y: 120,
          width: 80,
          height: 80,
          zIndex: 4
        }
      ],
      isDefault: true,
      isCustom: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    }
  ]);

  const [currentTemplate, setCurrentTemplate] = useState<BadgeTemplate>(templates[0]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const fontFamilies = [
    "Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana", 
    "Courier New", "Impact", "Comic Sans MS", "Trebuchet MS"
  ];

  const colors = [
    "#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff",
    "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
    "#ff6600", "#6600ff", "#00ff66", "#ff0066", "#66ff00", "#0066ff"
  ];

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `element_${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : '',
      x: 50,
      y: 50,
      width: type === 'qr' ? 80 : 100,
      height: type === 'qr' ? 80 : 30,
      fontSize: 14,
      fontFamily: "Inter",
      fontWeight: "normal",
      color: "#000000",
      backgroundColor: "#ffffff",
      borderColor: "#cccccc",
      borderWidth: 1,
      borderRadius: 0,
      opacity: 1,
      rotation: 0,
      zIndex: currentTemplate.elements.length + 1
    };

    const updatedTemplate = {
      ...currentTemplate,
      elements: [...currentTemplate.elements, newElement]
    };

    setCurrentTemplate(updatedTemplate);
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<TemplateElement>) => {
    const updatedTemplate = {
      ...currentTemplate,
      elements: currentTemplate.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    };

    setCurrentTemplate(updatedTemplate);
  };

  const deleteElement = (elementId: string) => {
    const updatedTemplate = {
      ...currentTemplate,
      elements: currentTemplate.elements.filter(el => el.id !== elementId)
    };

    setCurrentTemplate(updatedTemplate);
    setSelectedElement(null);
  };

  const duplicateElement = (elementId: string) => {
    const element = currentTemplate.elements.find(el => el.id === elementId);
    if (!element) return;

    const duplicatedElement: TemplateElement = {
      ...element,
      id: `element_${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: currentTemplate.elements.length + 1
    };

    const updatedTemplate = {
      ...currentTemplate,
      elements: [...currentTemplate.elements, duplicatedElement]
    };

    setCurrentTemplate(updatedTemplate);
    setSelectedElement(duplicatedElement.id);
  };

  const saveTemplate = () => {
    const updatedTemplates = templates.map(t => 
      t.id === currentTemplate.id ? currentTemplate : t
    );
    setTemplates(updatedTemplates);
    
    // In a real app, this would save to the backend
    console.log('Template saved:', currentTemplate);
  };

  const selectedElementData = currentTemplate.elements.find(el => el.id === selectedElement);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/workstation')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workstation
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Editor</h1>
            <p className="text-gray-600 mt-2">Design and customize badge templates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Layout className="w-5 h-5 mr-2" />
                    Templates
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Create new template
                      const newTemplate: BadgeTemplate = {
                        id: `template_${Date.now()}`,
                        name: "New Template",
                        description: "Custom template",
                        width: 300,
                        height: 200,
                        backgroundColor: "#ffffff",
                        elements: [],
                        isDefault: false,
                        isCustom: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      setTemplates(prev => [...prev, newTemplate]);
                      setCurrentTemplate(newTemplate);
                      setSelectedTemplate(newTemplate.id);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTemplate === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setCurrentTemplate(template);
                        setSelectedElement(null);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {template.isCustom && (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Element Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Elements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('text')}
                    className="h-12 flex flex-col items-center justify-center space-y-1"
                  >
                    <Type className="w-4 h-4" />
                    <span className="text-xs">Text</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('qr')}
                    className="h-12 flex flex-col items-center justify-center space-y-1"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-xs">QR Code</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('image')}
                    className="h-12 flex flex-col items-center justify-center space-y-1"
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement('shape')}
                    className="h-12 flex flex-col items-center justify-center space-y-1"
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-xs">Shape</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Element Properties */}
            {selectedElementData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Properties
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateElement(selectedElement!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteElement(selectedElement!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Position & Size */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={selectedElementData.x}
                          onChange={(e) => updateElement(selectedElement!, { x: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={selectedElementData.y}
                          onChange={(e) => updateElement(selectedElement!, { y: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={selectedElementData.width}
                          onChange={(e) => updateElement(selectedElement!, { width: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={selectedElementData.height}
                          onChange={(e) => updateElement(selectedElement!, { height: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Text Properties */}
                    {selectedElementData.type === 'text' && (
                      <>
                        <div>
                          <Label className="text-xs">Content</Label>
                          <Input
                            value={selectedElementData.content}
                            onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Input
                              type="number"
                              value={selectedElementData.fontSize || 14}
                              onChange={(e) => updateElement(selectedElement!, { fontSize: parseInt(e.target.value) || 14 })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Font Family</Label>
                            <select
                              value={selectedElementData.fontFamily || 'Inter'}
                              onChange={(e) => updateElement(selectedElement!, { fontFamily: e.target.value })}
                              className="w-full h-8 px-2 border border-border rounded text-sm"
                            >
                              {fontFamilies.map(font => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Font Weight</Label>
                          <select
                            value={selectedElementData.fontWeight || 'normal'}
                            onChange={(e) => updateElement(selectedElement!, { fontWeight: e.target.value as 'normal' | 'bold' })}
                            className="w-full h-8 px-2 border border-border rounded text-sm"
                          >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Colors */}
                    <div>
                      <Label className="text-xs">Text Color</Label>
                      <div className="grid grid-cols-6 gap-1 mt-1">
                        {colors.map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded border ${
                              selectedElementData.color === color ? 'ring-2 ring-primary' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateElement(selectedElement!, { color })}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Background Color</Label>
                      <div className="grid grid-cols-6 gap-1 mt-1">
                        {colors.map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded border ${
                              selectedElementData.backgroundColor === color ? 'ring-2 ring-primary' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateElement(selectedElement!, { backgroundColor: color })}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <Label className="text-xs">Opacity</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedElementData.opacity || 1}
                        onChange={(e) => updateElement(selectedElement!, { opacity: parseFloat(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Canvas Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Template:</Label>
                      <span className="font-medium">{currentTemplate.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Size:</Label>
                      <span className="text-sm">{currentTemplate.width} × {currentTemplate.height}px</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {isPreviewMode ? 'Edit' : 'Preview'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveTemplate}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Export template
                        console.log('Exporting template:', currentTemplate);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canvas */}
            <Card>
              <CardContent className="p-6">
                <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <div
                    className="relative"
                    style={{
                      width: `${currentTemplate.width}px`,
                      height: `${currentTemplate.height}px`,
                      backgroundColor: currentTemplate.backgroundColor,
                      margin: '0 auto'
                    }}
                  >
                    {currentTemplate.elements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute cursor-pointer transition-all duration-200 ${
                          selectedElement === element.id ? 'ring-2 ring-primary' : ''
                        }`}
                        style={{
                          left: `${element.x}px`,
                          top: `${element.y}px`,
                          width: `${element.width}px`,
                          height: `${element.height}px`,
                          fontSize: `${element.fontSize || 14}px`,
                          fontFamily: element.fontFamily || 'Inter',
                          fontWeight: element.fontWeight || 'normal',
                          color: element.color || '#000000',
                          backgroundColor: element.backgroundColor || 'transparent',
                          borderColor: element.borderColor || 'transparent',
                          borderWidth: `${element.borderWidth || 0}px`,
                          borderStyle: 'solid',
                          borderRadius: `${element.borderRadius || 0}px`,
                          opacity: element.opacity || 1,
                          transform: `rotate(${element.rotation || 0}deg)`,
                          zIndex: element.zIndex
                        }}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        {element.type === 'text' && (
                          <div className="w-full h-full flex items-center justify-center text-center">
                            {element.content}
                          </div>
                        )}
                        {element.type === 'qr' && (
                          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        {element.type === 'image' && (
                          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                            <Image className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        {element.type === 'shape' && (
                          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                            <Square className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Element List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Grid className="w-5 h-5 mr-2" />
                  Elements ({currentTemplate.elements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentTemplate.elements.map((element, index) => (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                        selectedElement === element.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                          {element.type === 'text' && <Type className="w-3 h-3" />}
                          {element.type === 'qr' && <QrCode className="w-3 h-3" />}
                          {element.type === 'image' && <Image className="w-3 h-3" />}
                          {element.type === 'shape' && <Square className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {element.type === 'text' ? element.content : `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element`}
                          </p>
                          <p className="text-xs text-gray-600">
                            {element.x}, {element.y} • {element.width} × {element.height}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
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
