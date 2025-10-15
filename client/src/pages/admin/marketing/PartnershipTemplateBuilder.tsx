import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../AdminLayout";
import { 
  Building2,
  DollarSign,
  Edit,
  Trash2,
  Save,
  Eye,
  Download,
  ArrowLeft,
  GripVertical,
  Star,
  Mail,
  Calendar,
  Phone,
  Settings,
  Layout,
  Type,
  Image
} from "lucide-react";

interface TemplateField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'textarea' | 'select' | 'multiselect' | 'rating' | 'logo' | 'signature';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/multiselect
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface PartnershipTemplate {
  id: string;
  name: string;
  description: string;
  type: 'sponsor' | 'venue' | 'media' | 'vendor' | 'influencer';
  fields: TemplateField[];
  layout: 'professional' | 'modern' | 'minimal' | 'corporate';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  branding: {
    logo: string;
    companyName: string;
    tagline: string;
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const PartnershipTemplateBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<PartnershipTemplate | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [draggedField, setDraggedField] = useState<TemplateField | null>(null);
  
  // Default templates
  const [templates] = useState<PartnershipTemplate[]>([
    {
      id: "default-sponsor",
      name: "Default Sponsor Template",
      description: "Professional sponsor partnership template",
      type: "sponsor",
      fields: [
        { id: "company-name", type: "text", label: "Company Name", placeholder: "Enter company name", required: true, position: { x: 0, y: 0 }, size: { width: 200, height: 40 } },
        { id: "contact-person", type: "text", label: "Contact Person", placeholder: "Enter contact person", required: true, position: { x: 0, y: 60 }, size: { width: 200, height: 40 } },
        { id: "email", type: "email", label: "Email", placeholder: "Enter email address", required: true, position: { x: 0, y: 120 }, size: { width: 200, height: 40 } },
        { id: "phone", type: "phone", label: "Phone", placeholder: "Enter phone number", required: false, position: { x: 0, y: 180 }, size: { width: 200, height: 40 } },
        { id: "website", type: "text", label: "Website", placeholder: "Enter website URL", required: false, position: { x: 0, y: 240 }, size: { width: 200, height: 40 } },
        { id: "partnership-value", type: "number", label: "Partnership Value ($)", placeholder: "Enter partnership value", required: true, position: { x: 0, y: 300 }, size: { width: 200, height: 40 } },
        { id: "description", type: "textarea", label: "Partnership Description", placeholder: "Describe the partnership", required: true, position: { x: 0, y: 360 }, size: { width: 300, height: 100 } },
        { id: "benefits", type: "multiselect", label: "Benefits", placeholder: "Select benefits", required: true, position: { x: 0, y: 480 }, size: { width: 300, height: 80 }, options: ["Logo placement", "Speaking slot", "Booth space", "Social media mentions", "Press release", "Networking events"] },
        { id: "rating", type: "rating", label: "Partnership Rating", placeholder: "Rate the partnership", required: false, position: { x: 0, y: 580 }, size: { width: 200, height: 40 } },
        { id: "signature", type: "signature", label: "Digital Signature", placeholder: "Sign here", required: true, position: { x: 0, y: 640 }, size: { width: 300, height: 100 } }
      ],
      layout: "professional",
      colors: {
        primary: "#3B82F6",
        secondary: "#1E40AF",
        accent: "#F59E0B",
        background: "#FFFFFF"
      },
      branding: {
        logo: "/logo-placeholder.png",
        companyName: "EventKnit",
        tagline: "Connecting Events, Creating Opportunities"
      },
      isDefault: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    },
    {
      id: "default-venue",
      name: "Default Venue Template",
      description: "Professional venue partnership template",
      type: "venue",
      fields: [
        { id: "venue-name", type: "text", label: "Venue Name", placeholder: "Enter venue name", required: true, position: { x: 0, y: 0 }, size: { width: 200, height: 40 } },
        { id: "contact-person", type: "text", label: "Contact Person", placeholder: "Enter contact person", required: true, position: { x: 0, y: 60 }, size: { width: 200, height: 40 } },
        { id: "email", type: "email", label: "Email", placeholder: "Enter email address", required: true, position: { x: 0, y: 120 }, size: { width: 200, height: 40 } },
        { id: "phone", type: "phone", label: "Phone", placeholder: "Enter phone number", required: false, position: { x: 0, y: 180 }, size: { width: 200, height: 40 } },
        { id: "location", type: "text", label: "Location", placeholder: "Enter venue location", required: true, position: { x: 0, y: 240 }, size: { width: 200, height: 40 } },
        { id: "capacity", type: "number", label: "Venue Capacity", placeholder: "Enter venue capacity", required: true, position: { x: 0, y: 300 }, size: { width: 200, height: 40 } },
        { id: "partnership-value", type: "number", label: "Partnership Value ($)", placeholder: "Enter partnership value", required: true, position: { x: 0, y: 360 }, size: { width: 200, height: 40 } },
        { id: "description", type: "textarea", label: "Partnership Description", placeholder: "Describe the venue partnership", required: true, position: { x: 0, y: 420 }, size: { width: 300, height: 100 } },
        { id: "amenities", type: "multiselect", label: "Amenities", placeholder: "Select amenities", required: true, position: { x: 0, y: 540 }, size: { width: 300, height: 80 }, options: ["Parking", "Catering", "AV Equipment", "WiFi", "Accessibility", "Security"] },
        { id: "signature", type: "signature", label: "Digital Signature", placeholder: "Sign here", required: true, position: { x: 0, y: 640 }, size: { width: 300, height: 100 } }
      ],
      layout: "professional",
      colors: {
        primary: "#10B981",
        secondary: "#059669",
        accent: "#F59E0B",
        background: "#FFFFFF"
      },
      branding: {
        logo: "/logo-placeholder.png",
        companyName: "EventKnit",
        tagline: "Connecting Events, Creating Opportunities"
      },
      isDefault: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    }
  ]);

  const availableFieldTypes = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'phone', label: 'Phone', icon: Phone },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'number', label: 'Number', icon: DollarSign },
    { type: 'textarea', label: 'Text Area', icon: Type },
    { type: 'select', label: 'Select', icon: Settings },
    { type: 'multiselect', label: 'Multi Select', icon: Settings },
    { type: 'rating', label: 'Rating', icon: Star },
    { type: 'logo', label: 'Logo Upload', icon: Image },
    { type: 'signature', label: 'Signature', icon: Edit }
  ];

  const handleDragStart = (field: TemplateField) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newField = {
      ...draggedField,
      id: `${draggedField.type}-${Date.now()}`,
      position: { x, y }
    };

    if (selectedTemplate) {
      const updatedTemplate = {
        ...selectedTemplate,
        fields: [...selectedTemplate.fields, newField]
      };
      setSelectedTemplate(updatedTemplate);
    }
    setDraggedField(null);
  };

  // const handleFieldUpdate = (fieldId: string, updates: Partial<TemplateField>) => {
  //   if (!selectedTemplate) return;
  //
  //   const updatedTemplate = {
  //     ...selectedTemplate,
  //     fields: selectedTemplate.fields.map(field =>
  //       field.id === fieldId ? { ...field, ...updates } : field
  //     )
  //   };
  //   setSelectedTemplate(updatedTemplate);
  // };

  const handleFieldDelete = (fieldId: string) => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      fields: selectedTemplate.fields.filter(field => field.id !== fieldId)
    };
    setSelectedTemplate(updatedTemplate);
  };

  const renderFieldPreview = (field: TemplateField) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: field.position.x,
      top: field.position.y,
      width: field.size.width,
      height: field.size.height,
      border: '1px dashed #ccc',
      borderRadius: '4px',
      padding: '8px',
      backgroundColor: '#f9f9f9',
      cursor: 'move'
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div key={field.id} style={baseStyle}>
            <Label className="text-xs">{field.label} {field.required && '*'}</Label>
            <Input 
              placeholder={field.placeholder} 
              className="h-8 text-xs"
              disabled
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.id} style={baseStyle}>
            <Label className="text-xs">{field.label} {field.required && '*'}</Label>
            <Textarea 
              placeholder={field.placeholder} 
              className="h-16 text-xs resize-none"
              disabled
            />
          </div>
        );
      case 'select':
      case 'multiselect':
        return (
          <div key={field.id} style={baseStyle}>
            <Label className="text-xs">{field.label} {field.required && '*'}</Label>
            <Select disabled>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
            </Select>
          </div>
        );
      case 'rating':
        return (
          <div key={field.id} style={baseStyle}>
            <Label className="text-xs">{field.label} {field.required && '*'}</Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className="h-4 w-4 text-gray-300" />
              ))}
            </div>
          </div>
        );
      case 'signature':
        return (
          <div key={field.id} style={baseStyle}>
            <Label className="text-xs">{field.label} {field.required && '*'}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded h-16 flex items-center justify-center">
              <span className="text-xs text-gray-500">Signature Area</span>
            </div>
          </div>
        );
      default:
        return (
          <div key={field.id} style={baseStyle}>
            <Label className="text-xs">{field.label} {field.required && '*'}</Label>
            <div className="h-8 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500">{field.type}</span>
            </div>
          </div>
        );
    }
  };

  const renderProfessionalTemplate = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-eventknit rounded-lg flex items-center justify-center text-eventknit-foreground font-bold text-xl">
              EK
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2"><span className="text-eventknit">{selectedTemplate.branding.companyName}</span></h1>
          <p className="text-gray-600">{selectedTemplate.branding.tagline}</p>
          <div className="mt-4">
            <Badge className={`${selectedTemplate.type === 'sponsor' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {selectedTemplate.type.toUpperCase()} PARTNERSHIP AGREEMENT
            </Badge>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {selectedTemplate.fields.map(field => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea 
                    placeholder={field.placeholder} 
                    className="mt-1"
                    rows={3}
                    disabled
                  />
                ) : field.type === 'multiselect' ? (
                  <div className="mt-1 space-y-2">
                    {field.options?.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <input type="checkbox" disabled className="rounded" />
                        <span className="text-sm text-gray-600">{option}</span>
                      </div>
                    ))}
                  </div>
                ) : field.type === 'rating' ? (
                  <div className="mt-1 flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="h-5 w-5 text-yellow-400" />
                    ))}
                  </div>
                ) : field.type === 'signature' ? (
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg h-20 flex items-center justify-center">
                    <span className="text-gray-500">Digital Signature Area</span>
                  </div>
                ) : (
                  <Input 
                    placeholder={field.placeholder} 
                    className="mt-1"
                    disabled
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            This partnership agreement is generated by <span className="text-eventknit">EventKnit</span> Platform
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
                <Layout className="h-8 w-8 mr-3 text-primary" />
                Partnership Template Builder
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create and customize professional partnership templates
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        {isPreviewMode ? (
          /* Preview Mode */
          <div className="space-y-6">
            {renderProfessionalTemplate()}
          </div>
        ) : (
          /* Builder Mode */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Template Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {template.type === 'sponsor' ? <Star className="h-4 w-4 text-yellow-500" /> : <Building2 className="h-4 w-4 text-green-500" />}
                      <span className="font-medium text-sm">{template.name}</span>
                      {template.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Field Palette */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Field Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableFieldTypes.map(fieldType => (
                  <div
                    key={fieldType.type}
                    className="p-3 rounded-lg border border-border hover:border-primary/50 cursor-move transition-colors"
                    draggable
                    onDragStart={() => handleDragStart({
                      id: '',
                      type: fieldType.type as TemplateField['type'],
                      label: fieldType.label,
                      placeholder: `Enter ${fieldType.label.toLowerCase()}`,
                      required: false,
                      position: { x: 0, y: 0 },
                      size: { width: 200, height: 40 }
                    })}
                  >
                    <div className="flex items-center space-x-2">
                      <fieldType.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{fieldType.label}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Canvas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Template Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    {/* Template Info */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold">{selectedTemplate.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{selectedTemplate.type}</Badge>
                        <Badge variant="outline">{selectedTemplate.layout}</Badge>
                      </div>
                    </div>

                    {/* Drag and Drop Canvas */}
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[600px] relative bg-gray-50"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="text-center text-gray-500 mb-4">
                        Drag field types here to add them to your template
                      </div>
                      
                      {selectedTemplate.fields.map(field => renderFieldPreview(field))}
                    </div>

                    {/* Field Properties */}
                    {selectedTemplate.fields.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Field Properties</h4>
                        <div className="space-y-2">
                          {selectedTemplate.fields.map(field => (
                            <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{field.label}</span>
                                <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleFieldDelete(field.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Select a Template</h3>
                    <p className="text-muted-foreground">Choose a template from the left panel to start building</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PartnershipTemplateBuilder;
