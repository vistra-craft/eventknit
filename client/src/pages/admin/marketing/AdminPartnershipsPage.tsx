import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Handshake, 
  Building2,
  Users,
  DollarSign,
  Plus,
  TrendingUp,
  BarChart3,
  Edit,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Settings,
  Star,
  Globe,
  Mail,
  MapPin,
  ExternalLink,
  Shield,
  Trash2,
  X,
  Eye,
  Save
} from "lucide-react";

interface Partnership {
  id: string;
  name: string;
  organizer: string;
  type: 'sponsor' | 'venue' | 'media' | 'vendor' | 'influencer';
  status: 'active' | 'pending' | 'expired' | 'negotiating' | 'pending_approval';
  contactPerson: string;
  email: string;
  phone?: string;
  website?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  value: number;
  description: string;
  purpose: string;
  benefits: string[];
  events: string[];
  rating?: number;
  notes?: string;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  acceptedTerms: boolean;
}

interface PartnershipTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AdminPartnershipsPage = () => {
  const [activeTab, setActiveTab] = useState("partnerships");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplateViewModalOpen, setIsTemplateViewModalOpen] = useState(false);
  const [isTemplateEditModalOpen, setIsTemplateEditModalOpen] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);
  const [deletingPartnership, setDeletingPartnership] = useState<Partnership | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PartnershipTemplate | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    organizer: "",
    type: "sponsor" as Partnership['type'],
    status: "pending" as Partnership['status'],
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    startDate: "",
    endDate: "",
    value: "",
    description: "",
    purpose: "",
    benefits: [] as string[],
    events: [] as string[],
    rating: "",
    notes: "",
    approvalStatus: "pending" as Partnership['approvalStatus'],
    acceptedTerms: false
  });
  
  const [newBenefit, setNewBenefit] = useState("");
  const [newEvent, setNewEvent] = useState("");
  
  // State for partnerships data
  const [partnerships, setPartnerships] = useState<Partnership[]>([
    {
      id: "1",
      name: "Microsoft Corporation",
      organizer: "Tech Events Co.",
      type: "sponsor",
      status: "active",
      contactPerson: "Sarah Johnson",
      email: "sarah.johnson@microsoft.com",
      phone: "+1 (555) 123-4567",
      website: "microsoft.com",
      location: "Redmond, WA",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      value: 500000,
      description: "Primary sponsor for Tech Summit 2024",
      purpose: "To establish Microsoft as the premier technology partner for major tech events, showcasing their latest innovations and building brand awareness among tech professionals.",
      benefits: ["Logo placement", "Speaking slot", "Booth space", "Social media mentions"],
      events: ["Tech Summit 2024"],
      rating: 5,
      notes: "Excellent partnership, very responsive team",
      approvalStatus: "approved",
      acceptedTerms: true
    },
    {
      id: "2",
      name: "Madison Square Garden",
      organizer: "Music Events Ltd",
      type: "venue",
      status: "active",
      contactPerson: "Mike Rodriguez",
      email: "mike.rodriguez@msg.com",
      phone: "+1 (555) 987-6543",
      website: "msg.com",
      location: "New York, NY",
      startDate: "2023-06-01",
      endDate: "2025-05-31",
      value: 1200000,
      description: "Exclusive venue partnership for major events",
      purpose: "To provide premium venue services for large-scale events, ensuring exceptional event experiences and establishing long-term venue partnerships.",
      benefits: ["Preferred rates", "Priority booking", "Marketing support", "Catering discounts"],
      events: ["Music Festival 2024", "Sports Expo 2024"],
      rating: 4,
      notes: "Great venue, professional staff",
      approvalStatus: "approved",
      acceptedTerms: true
    },
    {
      id: "3",
      name: "TechCrunch Media",
      organizer: "Business Academy",
      type: "media",
      status: "active",
      contactPerson: "Alex Chen",
      email: "alex.chen@techcrunch.com",
      phone: "+1 (555) 456-7890",
      website: "techcrunch.com",
      location: "San Francisco, CA",
      startDate: "2024-01-15",
      endDate: "2024-12-15",
      value: 250000,
      description: "Media partnership for event coverage",
      purpose: "To provide comprehensive media coverage and promotion for tech events, reaching a wider audience and increasing event visibility.",
      benefits: ["Event coverage", "Article features", "Social media promotion", "Press releases"],
      events: ["Tech Summit 2024", "Startup Pitch Event"],
      rating: 5,
      notes: "Amazing reach and engagement",
      approvalStatus: "approved",
      acceptedTerms: true
    },
    {
      id: "4",
      name: "Catering Plus",
      organizer: "Wellness Corp",
      type: "vendor",
      status: "pending",
      contactPerson: "Lisa Thompson",
      email: "lisa@cateringplus.com",
      phone: "+1 (555) 234-5678",
      website: "cateringplus.com",
      location: "Los Angeles, CA",
      startDate: "2024-02-01",
      endDate: "2024-11-30",
      value: 150000,
      description: "Exclusive catering partner",
      purpose: "To provide high-quality catering services for events, ensuring excellent food experiences and supporting event success.",
      benefits: ["Preferred rates", "Custom menus", "Event planning", "Staff support"],
      events: ["All Events"],
      rating: 4,
      notes: "Waiting for contract approval",
      approvalStatus: "pending",
      acceptedTerms: true
    },
    {
      id: "5",
      name: "Tech Influencer Network",
      organizer: "Entertainment Group",
      type: "influencer",
      status: "negotiating",
      contactPerson: "David Park",
      email: "david@techinfluencers.com",
      website: "techinfluencers.com",
      location: "Austin, TX",
      startDate: "2024-03-01",
      endDate: "2024-08-31",
      value: 300000,
      description: "Influencer marketing partnership",
      purpose: "To leverage influencer networks for event promotion and brand awareness, reaching younger demographics and increasing social media engagement.",
      benefits: ["Social media posts", "Event attendance", "Content creation", "Brand mentions"],
      events: ["Tech Summit 2024"],
      rating: 3,
      notes: "Negotiating terms and deliverables",
      approvalStatus: "pending",
      acceptedTerms: false
    },
    {
      id: "6",
      name: "Event Security Solutions",
      organizer: "Event Masters",
      type: "vendor",
      status: "pending_approval",
      contactPerson: "Robert Wilson",
      email: "robert@eventsecurity.com",
      phone: "+1 (555) 345-6789",
      website: "eventsecurity.com",
      location: "Chicago, IL",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      value: 200000,
      description: "Security services partnership",
      purpose: "To provide comprehensive security services for events, ensuring attendee safety and event security compliance.",
      benefits: ["Security personnel", "Equipment rental", "Emergency planning", "Risk assessment"],
      events: ["All Events"],
      rating: 4,
      notes: "New partnership proposal",
      approvalStatus: "pending",
      acceptedTerms: true
    }
  ]);

  // CRUD Functions
  const validateForm = () => {
    const requiredFields = ['name', 'organizer', 'contactPerson', 'email', 'startDate', 'value', 'description', 'purpose'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    if (!formData.acceptedTerms) {
      alert('You must accept the partnership terms and conditions to proceed');
      return false;
    }
    
    if (formData.value && parseFloat(formData.value) <= 0) {
      alert('Partnership value must be greater than 0');
      return false;
    }
    
    if (formData.rating && (parseFloat(formData.rating) < 1 || parseFloat(formData.rating) > 5)) {
      alert('Rating must be between 1 and 5');
      return false;
    }
    
    return true;
  };

  const handleCreatePartnership = () => {
    if (!validateForm()) return;
    
    const newPartnership: Partnership = {
      id: Date.now().toString(),
      name: formData.name,
      organizer: formData.organizer,
      type: formData.type,
      status: formData.status,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      location: formData.location || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      value: parseFloat(formData.value) || 0,
      description: formData.description,
      purpose: formData.purpose,
      benefits: formData.benefits,
      events: formData.events,
      rating: formData.rating ? parseFloat(formData.rating) : undefined,
      notes: formData.notes || undefined,
      approvalStatus: formData.approvalStatus,
      acceptedTerms: formData.acceptedTerms
    };
    
    setPartnerships([...partnerships, newPartnership]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const handleEditPartnership = () => {
    if (!validateForm()) return;
    if (!editingPartnership) return;
    
    const updatedPartnerships = partnerships.map(p => 
      p.id === editingPartnership.id 
        ? {
            ...p,
            name: formData.name,
            organizer: formData.organizer,
            type: formData.type,
            status: formData.status,
            contactPerson: formData.contactPerson,
            email: formData.email,
            phone: formData.phone || undefined,
            website: formData.website || undefined,
            location: formData.location || undefined,
            startDate: formData.startDate,
            endDate: formData.endDate || undefined,
            value: parseFloat(formData.value) || 0,
            description: formData.description,
            benefits: formData.benefits,
            events: formData.events,
            rating: formData.rating ? parseFloat(formData.rating) : undefined,
            notes: formData.notes || undefined,
            approvalStatus: formData.approvalStatus
          }
        : p
    );
    
    setPartnerships(updatedPartnerships);
    resetForm();
    setIsEditModalOpen(false);
    setEditingPartnership(null);
  };

  const handleDeletePartnership = () => {
    if (!deletingPartnership) return;
    
    setPartnerships(partnerships.filter(p => p.id !== deletingPartnership.id));
    setIsDeleteModalOpen(false);
    setDeletingPartnership(null);
  };

  const handleCopyPartnership = (partnership: Partnership) => {
    setFormData({
      name: `${partnership.name} (Copy)`,
      organizer: partnership.organizer,
      type: partnership.type,
      status: "pending",
      contactPerson: partnership.contactPerson,
      email: partnership.email,
      phone: partnership.phone || "",
      website: partnership.website || "",
      location: partnership.location || "",
      startDate: "",
      endDate: "",
      value: partnership.value.toString(),
      description: partnership.description,
      purpose: partnership.purpose,
      benefits: [...partnership.benefits],
      events: [...partnership.events],
      rating: partnership.rating?.toString() || "",
      notes: partnership.notes || "",
      approvalStatus: "pending",
      acceptedTerms: false
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (partnership: Partnership) => {
    setEditingPartnership(partnership);
    setFormData({
      name: partnership.name,
      organizer: partnership.organizer,
      type: partnership.type,
      status: partnership.status,
      contactPerson: partnership.contactPerson,
      email: partnership.email,
      phone: partnership.phone || "",
      website: partnership.website || "",
      location: partnership.location || "",
      startDate: partnership.startDate,
      endDate: partnership.endDate || "",
      value: partnership.value.toString(),
      description: partnership.description,
      purpose: partnership.purpose,
      benefits: [...partnership.benefits],
      events: [...partnership.events],
      rating: partnership.rating?.toString() || "",
      notes: partnership.notes || "",
      approvalStatus: partnership.approvalStatus,
      acceptedTerms: partnership.acceptedTerms
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (partnership: Partnership) => {
    setDeletingPartnership(partnership);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      organizer: "",
      type: "sponsor",
      status: "pending",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      location: "",
      startDate: "",
      endDate: "",
      value: "",
      description: "",
      purpose: "",
      benefits: [],
      events: [],
      rating: "",
      notes: "",
      approvalStatus: "pending",
      acceptedTerms: false
    });
    setNewBenefit("");
    setNewEvent("");
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addEvent = () => {
    if (newEvent.trim()) {
      setFormData(prev => ({
        ...prev,
        events: [...prev.events, newEvent.trim()]
      }));
      setNewEvent("");
    }
  };

  const removeEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index)
    }));
  };

  // Template Functions
  const handleViewTemplate = (template: PartnershipTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateViewModalOpen(true);
  };

  const handleEditTemplate = (template: PartnershipTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateEditModalOpen(true);
  };

  const handleCopyTemplate = (template: PartnershipTemplate) => {
    // Create a copy of the template with a new name
    const copiedTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      description: `Copy of ${template.description}`
    };
    
    // In a real app, you would save this to your templates array
    alert(`Template "${copiedTemplate.name}" copied successfully!`);
  };

  const handleCreateFromTemplate = (template: PartnershipTemplate) => {
    // Pre-fill form with template data
    setFormData({
      name: "",
      organizer: "",
      type: template.type as Partnership['type'],
      status: "pending",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      location: "",
      startDate: "",
      endDate: "",
      value: "",
      description: "",
      purpose: "",
      benefits: [],
      events: [],
      rating: "",
      notes: "",
      approvalStatus: "pending",
      acceptedTerms: false
    });
    setIsCreateModalOpen(true);
  };

  // Mock partnership templates
  const partnershipTemplates: PartnershipTemplate[] = [
    {
      id: "1",
      name: "Sponsorship Package",
      description: "Create a comprehensive sponsorship package",
      type: "sponsor",
      icon: Star,
      color: "bg-warning/50"
    },
    {
      id: "2",
      name: "Venue Partnership",
      description: "Set up a venue partnership agreement",
      type: "venue",
      icon: Building2,
      color: "bg-primary/50"
    },
    {
      id: "3",
      name: "Media Partnership",
      description: "Create a media partnership proposal",
      type: "media",
      icon: Globe,
      color: "bg-success/50"
    },
    {
      id: "4",
      name: "Vendor Agreement",
      description: "Set up a vendor partnership",
      type: "vendor",
      icon: Handshake,
      color: "bg-purple-500"
    },
    {
      id: "5",
      name: "Influencer Contract",
      description: "Create an influencer partnership",
      type: "influencer",
      icon: Users,
      color: "bg-pink-500"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sponsor': return <Star className="h-4 w-4" />;
      case 'venue': return <Building2 className="h-4 w-4" />;
      case 'media': return <Globe className="h-4 w-4" />;
      case 'vendor': return <Handshake className="h-4 w-4" />;
      case 'influencer': return <Users className="h-4 w-4" />;
      default: return <Handshake className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sponsor': return "bg-warning/10 text-warning";
      case 'venue': return "bg-primary/10 text-primary";
      case 'media': return "bg-success/10 text-success";
      case 'vendor': return "bg-muted text-muted-foreground";
      case 'influencer': return "bg-muted text-muted-foreground";
      default: return "bg-muted text-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-success/10 text-success";
      case 'pending': return "bg-warning/10 text-warning";
      case 'expired': return "bg-destructive/10 text-destructive";
      case 'negotiating': return "bg-primary/10 text-primary";
      case 'pending_approval': return "bg-warning/10 text-warning";
      default: return "bg-muted text-foreground";
    }
  };

  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'approved': return "bg-success/10 text-success";
      case 'pending': return "bg-warning/10 text-warning";
      case 'rejected': return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'negotiating': return <Settings className="h-4 w-4" />;
      case 'pending_approval': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredPartnerships = partnerships.filter(partnership => {
    const matchesSearch = partnership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || partnership.type === filterType;
    const matchesStatus = filterStatus === "all" || partnership.status === filterStatus;
    const matchesApproval = filterApproval === "all" || partnership.approvalStatus === filterApproval;
    
    return matchesSearch && matchesType && matchesStatus && matchesApproval;
  });

  const totalValue = partnerships.reduce((sum, partnership) => sum + partnership.value, 0);
  const activePartnerships = partnerships.filter(p => p.status === 'active').length;
  const pendingPartnerships = partnerships.filter(p => p.status === 'pending' || p.status === 'pending_approval').length;
  const avgRating = partnerships.filter(p => p.rating).reduce((sum, partnership) => sum + (partnership.rating || 0), 0) / partnerships.filter(p => p.rating).length;

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Platform Partnerships
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage platform-wide strategic partnerships
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Partnership
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto scrollbar-hide">
                <DialogHeader>
                  <DialogTitle>Create New Partnership</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Partnership Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter partnership name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="organizer">Organizer *</Label>
                      <Input
                        id="organizer"
                        value={formData.organizer}
                        onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                        placeholder="Enter organizer name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Partnership['type'] }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sponsor">Sponsor</SelectItem>
                          <SelectItem value="venue">Venue</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="influencer">Influencer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Partnership['status'] }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="negotiating">Negotiating</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPerson">Contact Person *</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="Enter website URL"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter location"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value">Value ($) *</Label>
                      <Input
                        id="value"
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Enter partnership value"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating (1-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                        placeholder="Enter rating"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter partnership description"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="purpose">Purpose of Partnership *</Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                      placeholder="What is the main purpose and objective of this partnership?"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Benefits</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newBenefit}
                          onChange={(e) => setNewBenefit(e.target.value)}
                          placeholder="Add a benefit"
                          onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                        />
                        <Button type="button" onClick={addBenefit} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.benefits.map((benefit, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {benefit}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeBenefit(index)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Events</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newEvent}
                          onChange={(e) => setNewEvent(e.target.value)}
                          placeholder="Add an event"
                          onKeyPress={(e) => e.key === 'Enter' && addEvent()}
                        />
                        <Button type="button" onClick={addEvent} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.events.map((event, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {event}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeEvent(index)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter additional notes"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="acceptedTerms"
                      checked={formData.acceptedTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptedTerms: checked as boolean }))}
                    />
                    <Label htmlFor="acceptedTerms" className="text-sm">
                      I accept the partnership terms and conditions *
                    </Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="approvalStatus">Approval Status *</Label>
                    <Select value={formData.approvalStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, approvalStatus: value as Partnership['approvalStatus'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-6 pb-4">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePartnership}>
                      Create Partnership
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab("partnerships")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "partnerships" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Partnerships
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "templates" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "analytics" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Partnerships Tab */}
        {activeTab === "partnerships" && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Partnerships</p>
                      <p className="font-semibold text-foreground">{activePartnerships}</p>
                    </div>
                    <Handshake className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="font-semibold text-foreground">{pendingPartnerships}</p>
                    </div>
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <p className="font-semibold text-foreground">${totalValue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                      <p className="font-semibold text-foreground">{avgRating.toFixed(1)}</p>
                    </div>
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search partnerships..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Types</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="venue">Venue</option>
                  <option value="media">Media</option>
                  <option value="vendor">Vendor</option>
                  <option value="influencer">Influencer</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
                <select 
                  value={filterApproval} 
                  onChange={(e) => setFilterApproval(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Approval</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Partnerships List */}
            <div className="space-y-4">
              {filteredPartnerships.map((partnership) => (
                <Card key={partnership.id} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getTypeIcon(partnership.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{partnership.name}</h3>
                            <Badge className={`text-xs ${getTypeColor(partnership.type)}`}>
                              {partnership.type}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(partnership.status)}`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(partnership.status)}
                                <span>{partnership.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                            <Badge className={`text-xs ${getApprovalColor(partnership.approvalStatus)}`}>
                              {partnership.approvalStatus}
                            </Badge>
                            {partnership.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-warning" />
                                <span className="text-sm font-medium">{partnership.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2 font-medium flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {partnership.organizer}
                          </p>
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{partnership.contactPerson}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{partnership.email}</span>
                            </div>
                            {partnership.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{partnership.location}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-3">{partnership.description}</p>
                          <div className="flex items-center space-x-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <span className="ml-1 font-medium">{partnership.startDate}</span>
                            </div>
                            {partnership.endDate && (
                              <div>
                                <span className="text-muted-foreground">End:</span>
                                <span className="ml-1 font-medium">{partnership.endDate}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Value:</span>
                              <span className="ml-1 font-medium">${partnership.value.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Events:</span>
                              <span className="ml-1 font-medium">{partnership.events.length}</span>
                            </div>
                          </div>
                          {partnership.benefits.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-muted-foreground">Benefits:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {partnership.benefits.slice(0, 3).map((benefit, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {benefit}
                                  </Badge>
                                ))}
                                {partnership.benefits.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{partnership.benefits.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/marketing/partnerships/${partnership.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            title="View Partnership Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {partnership.website && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            title="Visit Website"
                          >
                            <a href={`https://${partnership.website}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {partnership.approvalStatus === "pending" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-success hover:text-success"
                            title="Approve Partnership"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditModal(partnership)}
                          title="Edit Partnership"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopyPartnership(partnership)}
                          title="Copy Partnership"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteModal(partnership)}
                          title="Delete Partnership"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Partnership Templates</CardTitle>
                <div className="flex space-x-2">
                  <Link to="/admin/marketing/partnerships/templates/builder">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnershipTemplates.map((template) => (
                  <div key={template.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center`}>
                        <template.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewTemplate(template)}
                          title="View Template"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                          title="Edit Template"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCopyTemplate(template)}
                          title="Copy Template"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-medium text-foreground mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">{template.type}</Badge>
                      <span className="text-xs text-muted-foreground">Default Template</span>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Partnership
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Platform Partnership Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics and insights for platform-wide partnership performance
              </p>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Reports
              </Button>
            </CardContent>
          </Card>
        )}

        {filteredPartnerships.length === 0 && activeTab === "partnerships" && (
          <div className="text-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No partnerships found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
        
        {/* Edit Partnership Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto scrollbar-hide">
            <DialogHeader>
              <DialogTitle>Edit Partnership</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Partnership Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter partnership name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-organizer">Organizer *</Label>
                  <Input
                    id="edit-organizer"
                    value={formData.organizer}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                    placeholder="Enter organizer name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Partnership['type'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sponsor">Sponsor</SelectItem>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="influencer">Influencer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Partnership['status'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-contactPerson">Contact Person *</Label>
                  <Input
                    id="edit-contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Start Date *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-value">Value ($) *</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter partnership value"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rating">Rating (1-5)</Label>
                  <Input
                    id="edit-rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                    placeholder="Enter rating"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter partnership description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-purpose">Purpose of Partnership *</Label>
                <Textarea
                  id="edit-purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="What is the main purpose and objective of this partnership?"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Benefits</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder="Add a benefit"
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                    />
                    <Button type="button" onClick={addBenefit} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {benefit}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeBenefit(index)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Events</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newEvent}
                      onChange={(e) => setNewEvent(e.target.value)}
                      placeholder="Add an event"
                      onKeyPress={(e) => e.key === 'Enter' && addEvent()}
                    />
                    <Button type="button" onClick={addEvent} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.events.map((event, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {event}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeEvent(index)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  rows={2}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-acceptedTerms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptedTerms: checked as boolean }))}
                />
                <Label htmlFor="edit-acceptedTerms" className="text-sm">
                  I accept the partnership terms and conditions *
                </Label>
              </div>
              
              <div>
                <Label htmlFor="edit-approvalStatus">Approval Status *</Label>
                <Select value={formData.approvalStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, approvalStatus: value as Partnership['approvalStatus'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-6 pb-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditPartnership}>
                  Update Partnership
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Partnership</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete the partnership "{deletingPartnership?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeletePartnership}>
                  Delete Partnership
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Template View Modal */}
        <Dialog open={isTemplateViewModalOpen} onOpenChange={setIsTemplateViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                View Template: {selectedTemplate?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-lg ${selectedTemplate.color} flex items-center justify-center`}>
                    <selectedTemplate.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                    <p className="text-muted-foreground">{selectedTemplate.description}</p>
                    <Badge variant="outline" className="mt-2">{selectedTemplate.type}</Badge>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Template Preview</h4>
                  <div className="bg-card border rounded-lg p-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold mx-auto mb-2">
                        EK
                      </div>
                      <h4 className="font-semibold"><span className="text-primary">EventKnit</span> Partnership Agreement</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.type.toUpperCase()} Template</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Partnership Name:</span>
                        <span className="font-medium">[Your Partnership Name]</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact Person:</span>
                        <span className="font-medium">[Contact Name]</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">[Email Address]</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Partnership Value:</span>
                        <span className="font-medium">$[Amount]</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTemplateViewModalOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handleCreateFromTemplate(selectedTemplate)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Partnership
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Template Edit Modal */}
        <Dialog open={isTemplateEditModalOpen} onOpenChange={setIsTemplateEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Edit Template: {selectedTemplate?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      defaultValue={selectedTemplate.name}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type">Template Type</Label>
                    <Select defaultValue={selectedTemplate.type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sponsor">Sponsor</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="influencer">Influencer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    defaultValue={selectedTemplate.description}
                    placeholder="Enter template description"
                    rows={3}
                  />
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Template Fields</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Partnership Name</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Contact Person</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Email Address</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Partnership Value</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Description</span>
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTemplateEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    alert('Template updated successfully!');
                    setIsTemplateEditModalOpen(false);
                  }}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default AdminPartnershipsPage;
