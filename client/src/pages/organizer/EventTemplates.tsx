import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Copy, 
  Share2, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  Mic,
  Building2,
  Gift,
  Save
} from "lucide-react";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'number' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'attendee' | 'speaker' | 'exhibitor' | 'sponsor';
  fields: FormField[];
  isPublic: boolean;
  shareableLink: string;
  createdAt: string;
  updatedAt: string;
}

const EventTemplates = () => {
  const [activeTab, setActiveTab] = useState('attendee');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Standard Attendee Registration',
      description: 'Basic attendee registration form with contact information',
      type: 'attendee',
      fields: [
        { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter your first name' },
        { id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter your last name' },
        { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your.email@example.com' },
        { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'company', name: 'company', label: 'Company', type: 'text', required: false, placeholder: 'Your company name' },
        { id: 'jobTitle', name: 'jobTitle', label: 'Job Title', type: 'text', required: false, placeholder: 'Your job title' },
        { id: 'dietaryRestrictions', name: 'dietaryRestrictions', label: 'Dietary Restrictions', type: 'textarea', required: false, placeholder: 'Please specify any dietary restrictions...' }
      ],
      isPublic: true,
      shareableLink: 'https://eventknit.com/forms/attendee/1',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Speaker Application Form',
      description: 'Comprehensive speaker application with bio and presentation details',
      type: 'speaker',
      fields: [
        { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter your first name' },
        { id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter your last name' },
        { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your.email@example.com' },
        { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'company', name: 'company', label: 'Company/Organization', type: 'text', required: true, placeholder: 'Your company or organization' },
        { id: 'jobTitle', name: 'jobTitle', label: 'Job Title', type: 'text', required: true, placeholder: 'Your current job title' },
        { id: 'bio', name: 'bio', label: 'Professional Bio', type: 'textarea', required: true, placeholder: 'Tell us about your professional background and expertise...' },
        { id: 'presentationTitle', name: 'presentationTitle', label: 'Presentation Title', type: 'text', required: true, placeholder: 'Proposed presentation title' },
        { id: 'presentationDescription', name: 'presentationDescription', label: 'Presentation Description', type: 'textarea', required: true, placeholder: 'Describe your presentation content and key takeaways...' },
        { id: 'experience', name: 'experience', label: 'Speaking Experience', type: 'select', required: true, options: ['0-2 years', '3-5 years', '6-10 years', '10+ years'] },
        { id: 'socialMedia', name: 'socialMedia', label: 'Social Media Links', type: 'textarea', required: false, placeholder: 'LinkedIn, Twitter, etc.' }
      ],
      isPublic: true,
      shareableLink: 'https://eventknit.com/forms/speaker/2',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Exhibitor Registration Form',
      description: 'Complete exhibitor registration with booth preferences and company details',
      type: 'exhibitor',
      fields: [
        { id: 'companyName', name: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Your company name' },
        { id: 'contactFirstName', name: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true, placeholder: 'Primary contact first name' },
        { id: 'contactLastName', name: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true, placeholder: 'Primary contact last name' },
        { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'contact@company.com' },
        { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'website', name: 'website', label: 'Company Website', type: 'text', required: false, placeholder: 'https://www.company.com' },
        { id: 'industry', name: 'industry', label: 'Industry', type: 'select', required: true, options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Other'] },
        { id: 'companySize', name: 'companySize', label: 'Company Size', type: 'select', required: true, options: ['1-10 employees', '11-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees'] },
        { id: 'boothSize', name: 'boothSize', label: 'Preferred Booth Size', type: 'select', required: true, options: ['10x10 ft', '10x20 ft', '20x20 ft', '20x30 ft', 'Custom size'] },
        { id: 'products', name: 'products', label: 'Products/Services Description', type: 'textarea', required: true, placeholder: 'Describe the products or services you will be showcasing...' },
        { id: 'specialRequirements', name: 'specialRequirements', label: 'Special Requirements', type: 'textarea', required: false, placeholder: 'Any special setup requirements, electrical needs, etc.' },
        { id: 'marketingMaterials', name: 'marketingMaterials', label: 'Marketing Materials', type: 'checkbox', required: false, options: ['Brochures', 'Business Cards', 'Product Samples', 'Digital Displays', 'Giveaways'] }
      ],
      isPublic: true,
      shareableLink: 'https://eventknit.com/forms/exhibitor/3',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '4',
      name: 'Premium Exhibitor Package',
      description: 'Premium exhibitor registration with additional marketing opportunities',
      type: 'exhibitor',
      fields: [
        { id: 'companyName', name: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Your company name' },
        { id: 'contactFirstName', name: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true, placeholder: 'Primary contact first name' },
        { id: 'contactLastName', name: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true, placeholder: 'Primary contact last name' },
        { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'contact@company.com' },
        { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'website', name: 'website', label: 'Company Website', type: 'text', required: false, placeholder: 'https://www.company.com' },
        { id: 'industry', name: 'industry', label: 'Industry', type: 'select', required: true, options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Other'] },
        { id: 'sponsorshipLevel', name: 'sponsorshipLevel', label: 'Sponsorship Level', type: 'select', required: true, options: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Standard'] },
        { id: 'boothSize', name: 'boothSize', label: 'Preferred Booth Size', type: 'select', required: true, options: ['20x20 ft', '20x30 ft', '30x30 ft', '40x40 ft', 'Custom size'] },
        { id: 'marketingAddOns', name: 'marketingAddOns', label: 'Marketing Add-ons', type: 'checkbox', required: false, options: ['Logo on event website', 'Logo on event app', 'Logo on banners', 'Logo on badges', 'Social media mentions', 'Email blast inclusion'] },
        { id: 'products', name: 'products', label: 'Products/Services Description', type: 'textarea', required: true, placeholder: 'Describe the products or services you will be showcasing...' },
        { id: 'specialRequirements', name: 'specialRequirements', label: 'Special Requirements', type: 'textarea', required: false, placeholder: 'Any special setup requirements, electrical needs, etc.' }
      ],
      isPublic: true,
      shareableLink: 'https://eventknit.com/forms/exhibitor/4',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '5',
      name: 'Sponsor Application Form',
      description: 'Comprehensive sponsor application with partnership details and benefits',
      type: 'sponsor',
      fields: [
        { id: 'companyName', name: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Your company name' },
        { id: 'contactFirstName', name: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true, placeholder: 'Primary contact first name' },
        { id: 'contactLastName', name: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true, placeholder: 'Primary contact last name' },
        { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'contact@company.com' },
        { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'website', name: 'website', label: 'Company Website', type: 'text', required: false, placeholder: 'https://www.company.com' },
        { id: 'industry', name: 'industry', label: 'Industry', type: 'select', required: true, options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Other'] },
        { id: 'sponsorshipLevel', name: 'sponsorshipLevel', label: 'Desired Sponsorship Level', type: 'select', required: true, options: ['Title Sponsor', 'Platinum Sponsor', 'Gold Sponsor', 'Silver Sponsor', 'Bronze Sponsor'] },
        { id: 'budgetRange', name: 'budgetRange', label: 'Budget Range', type: 'select', required: true, options: ['$5,000 - $10,000', '$10,000 - $25,000', '$25,000 - $50,000', '$50,000 - $100,000', '$100,000+'] },
        { id: 'companyDescription', name: 'companyDescription', label: 'Company Description', type: 'textarea', required: true, placeholder: 'Tell us about your company and what you do...' },
        { id: 'marketingGoals', name: 'marketingGoals', label: 'Marketing Goals', type: 'textarea', required: true, placeholder: 'What are your primary marketing objectives for this event?' },
        { id: 'targetAudience', name: 'targetAudience', label: 'Target Audience', type: 'textarea', required: true, placeholder: 'Describe your ideal customer profile...' },
        { id: 'preferredBenefits', name: 'preferredBenefits', label: 'Preferred Benefits', type: 'checkbox', required: false, options: ['Logo placement', 'Speaking opportunity', 'Booth space', 'Digital marketing', 'Networking events', 'Custom packages'] },
        { id: 'additionalRequests', name: 'additionalRequests', label: 'Additional Requests', type: 'textarea', required: false, placeholder: 'Any specific requests or custom requirements...' }
      ],
      isPublic: true,
      shareableLink: 'https://eventknit.com/forms/sponsor/5',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '6',
      name: 'Startup Sponsor Package',
      description: 'Specialized sponsor application for startups and emerging companies',
      type: 'sponsor',
      fields: [
        { id: 'companyName', name: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Your company name' },
        { id: 'contactFirstName', name: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true, placeholder: 'Primary contact first name' },
        { id: 'contactLastName', name: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true, placeholder: 'Primary contact last name' },
        { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'contact@company.com' },
        { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'website', name: 'website', label: 'Company Website', type: 'text', required: false, placeholder: 'https://www.company.com' },
        { id: 'foundedYear', name: 'foundedYear', label: 'Year Founded', type: 'number', required: true, placeholder: '2020' },
        { id: 'employeeCount', name: 'employeeCount', label: 'Number of Employees', type: 'select', required: true, options: ['1-5', '6-10', '11-25', '26-50', '51-100'] },
        { id: 'fundingStage', name: 'fundingStage', label: 'Funding Stage', type: 'select', required: true, options: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Bootstrapped'] },
        { id: 'companyDescription', name: 'companyDescription', label: 'Company Description', type: 'textarea', required: true, placeholder: 'Tell us about your startup and what problem you solve...' },
        { id: 'targetMarket', name: 'targetMarket', label: 'Target Market', type: 'textarea', required: true, placeholder: 'Who are your ideal customers?' },
        { id: 'sponsorshipGoals', name: 'sponsorshipGoals', label: 'Sponsorship Goals', type: 'textarea', required: true, placeholder: 'What do you hope to achieve through sponsorship?' },
        { id: 'startupBenefits', name: 'startupBenefits', label: 'Preferred Startup Benefits', type: 'checkbox', required: false, options: ['Startup showcase booth', 'Pitch opportunity', 'Networking with investors', 'Mentorship sessions', 'Media coverage', 'Startup competition entry'] }
      ],
      isPublic: true,
      shareableLink: 'https://eventknit.com/forms/sponsor/6',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    }
  ]);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'attendee' as 'attendee' | 'speaker' | 'exhibitor' | 'sponsor',
    fields: [] as FormField[]
  });

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' }
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: ''
    };
    
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        fields: [...editingTemplate.fields, newField]
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        fields: [...newTemplate.fields, newField]
      });
    }
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        fields: editingTemplate.fields.map(field => 
          field.id === fieldId ? { ...field, ...updates } : field
        )
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        fields: newTemplate.fields.map(field => 
          field.id === fieldId ? { ...field, ...updates } : field
        )
      });
    }
  };

  const removeField = (fieldId: string) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        fields: editingTemplate.fields.filter(field => field.id !== fieldId)
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        fields: newTemplate.fields.filter(field => field.id !== fieldId)
      });
    }
  };

  const saveTemplate = () => {
    const template: Template = {
      id: editingTemplate?.id || `template_${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      type: newTemplate.type,
      fields: newTemplate.fields,
      isPublic: true,
      shareableLink: `https://eventknit.com/forms/${newTemplate.type}/${Date.now()}`,
      createdAt: editingTemplate?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? template : t));
    } else {
      setTemplates([...templates, template]);
    }

    setNewTemplate({ name: '', description: '', type: 'attendee', fields: [] });
    setEditingTemplate(null);
    setShowCreateForm(false);
  };

  const copyTemplate = (template: Template) => {
    const copiedTemplate: Template = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      shareableLink: `https://eventknit.com/forms/${template.type}/${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setTemplates([...templates, copiedTemplate]);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'attendee': return <Users className="h-5 w-5" />;
      case 'speaker': return <Mic className="h-5 w-5" />;
      case 'exhibitor': return <Building2 className="h-5 w-5" />;
      case 'sponsor': return <Gift className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTemplateColor = (type: string) => {
    switch (type) {
      case 'attendee': return 'bg-primary/10 text-primary';
      case 'speaker': return 'bg-primary/10 text-primary';
      case 'exhibitor': return 'bg-success/10 text-success';
      case 'sponsor': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderFormPreview = (template: Template) => {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getTemplateColor(template.type)}`}>
              {getTemplateIcon(template.type)}
            </div>
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {template.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label className="flex items-center gap-2">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              {renderFormField(field)}
            </div>
          ))}
          <div className="pt-4">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFormField = (field: FormField) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            rows={4}
            className="resize-none"
          />
        );
      case 'select':
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`preview_${field.id}_${option}`}
                  name={`preview_${field.id}`}
                  className="text-primary"
                />
                <Label htmlFor={`preview_${field.id}_${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`preview_${field.id}_${option}`}
                />
                <Label htmlFor={`preview_${field.id}_${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const filteredTemplates = templates.filter(template => template.type === activeTab);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-page-title">Event Templates</h1>
            <p className="text-muted-foreground mt-1 text-sm">Create and manage shareable forms for attendees, speakers, exhibitors, and sponsors</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Template Types Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setSelectedTemplate(null);
        }}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="attendee" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees
            </TabsTrigger>
            <TabsTrigger value="speaker" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Speakers
            </TabsTrigger>
            <TabsTrigger value="exhibitor" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Exhibitors
            </TabsTrigger>
            <TabsTrigger value="sponsor" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Sponsors
            </TabsTrigger>
          </TabsList>

          {/* Template Selection and Preview */}
          <TabsContent value={activeTab} className="space-y-6">
            {!selectedTemplate ? (
              /* Template Selection Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setSelectedTemplate(template)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getTemplateColor(template.type)}`}>
                            {getTemplateIcon(template.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {template.fields.length} fields
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(template);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            copyTemplate(template);
                          }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Shareable Link:</span>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(template.shareableLink);
                          }}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-muted p-2 rounded text-xs font-mono text-muted-foreground break-all">
                          {template.shareableLink}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(template.shareableLink);
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No {activeTab} templates yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first {activeTab} registration template</p>
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Template Preview */
              <div className="space-y-6">
                {/* Template Info Card */}
                <Card className="w-full max-w-2xl mx-auto">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTemplateColor(selectedTemplate.type)}`}>
                          {getTemplateIcon(selectedTemplate.type)}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>
                          <p className="text-sm text-muted-foreground">{selectedTemplate.fields.length} fields</p>
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
                        ← Back to Templates
                      </Button>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{selectedTemplate.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Shareable Link:</span>
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(selectedTemplate.shareableLink)}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-muted p-3 rounded text-sm font-mono text-muted-foreground break-all">
                        {selectedTemplate.shareableLink}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingTemplate(selectedTemplate)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Preview */}
                {renderFormPreview(selectedTemplate)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Template Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </CardTitle>
                  <Button variant="ghost" onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    setNewTemplate({ name: '', description: '', type: 'attendee', fields: [] });
                  }}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="templateType">Template Type</Label>
                    <Select value={newTemplate.type} onValueChange={(value: 'attendee' | 'speaker' | 'exhibitor' | 'sponsor') => setNewTemplate({ ...newTemplate, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendee">Attendee Registration</SelectItem>
                        <SelectItem value="speaker">Speaker Application</SelectItem>
                        <SelectItem value="exhibitor">Exhibitor Registration</SelectItem>
                        <SelectItem value="sponsor">Sponsor Application</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description</Label>
                  <Textarea
                    id="templateDescription"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Describe what this template is for"
                    rows={3}
                  />
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Form Fields</h3>
                    <Button onClick={addField} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(editingTemplate?.fields || newTemplate.fields).map((field) => (
                      <Card key={field.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Field Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              placeholder="Field label"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Field Type</Label>
                            <Select value={field.type} onValueChange={(value: FormField['type']) => updateField(field.id, { type: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                              placeholder="Placeholder text"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`required_${field.id}`}
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
                              />
                              <Label htmlFor={`required_${field.id}`}>Required</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(field.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    setNewTemplate({ name: '', description: '', type: 'attendee', fields: [] });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={saveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
};

export default EventTemplates;
