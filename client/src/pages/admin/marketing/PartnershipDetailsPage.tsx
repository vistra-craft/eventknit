import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../AdminLayout";
import BackButton from "@/components/BackButton";
import {
  Handshake,
  Building2,
  Users,
  Star,
  Globe,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Share2,
  Printer
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

const PartnershipDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Mock data - in a real app, this would come from your API
  const mockPartnerships: Partnership[] = useMemo(() => [
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
    }
  ], []);

  useEffect(() => {
    // Simulate API call
    const foundPartnership = mockPartnerships.find(p => p.id === id);
    setPartnership(foundPartnership || null);
    setLoading(false);
  }, [id, mockPartnerships]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sponsor': return <Star className="h-5 w-5" />;
      case 'venue': return <Building2 className="h-5 w-5" />;
      case 'media': return <Globe className="h-5 w-5" />;
      case 'vendor': return <Handshake className="h-5 w-5" />;
      case 'influencer': return <Users className="h-5 w-5" />;
      default: return <Handshake className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sponsor': return 'bg-warning/10 text-warning';
      case 'venue': return 'bg-success/10 text-success';
      case 'media': return 'bg-primary/10 text-primary';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      case 'influencer': return 'bg-pink-100 text-pink-800';
      default: return 'bg-muted text-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'expired': return 'bg-destructive/10 text-destructive';
      case 'negotiating': return 'bg-primary/10 text-primary';
      case 'pending_approval': return 'bg-orange-100 text-orange-800';
      default: return 'bg-muted text-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'negotiating': return <Clock className="h-4 w-4" />;
      case 'pending_approval': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleDownload = () => {
    if (!partnership) return;
    
    const content = `
PARTNERSHIP AGREEMENT
====================

Partnership Name: ${partnership.name}
Organizer: ${partnership.organizer}
Type: ${partnership.type.toUpperCase()}
Status: ${partnership.status.replace('_', ' ').toUpperCase()}
Value: $${partnership.value.toLocaleString()}

Contact Information:
- Contact Person: ${partnership.contactPerson}
- Email: ${partnership.email}
- Phone: ${partnership.phone || 'N/A'}
- Website: ${partnership.website || 'N/A'}
- Location: ${partnership.location || 'N/A'}

Partnership Terms:
- Start Date: ${partnership.startDate}
- End Date: ${partnership.endDate || 'Ongoing'}
- Rating: ${partnership.rating ? `${partnership.rating}/5` : 'N/A'}

Description:
${partnership.description}

Purpose:
${partnership.purpose}

Benefits:
${partnership.benefits.map(benefit => `- ${benefit}`).join('\n')}

Events:
${partnership.events.map(event => `- ${event}`).join('\n')}

Additional Notes:
${partnership.notes || 'None'}

Approval Status: ${partnership.approvalStatus.toUpperCase()}
Terms Accepted: ${partnership.acceptedTerms ? 'Yes' : 'No'}

Generated on: ${new Date().toLocaleDateString()}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partnership-${partnership.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!partnership) return;
    
    const shareData = {
      title: `Partnership: ${partnership.name}`,
      text: `Partnership with ${partnership.organizer} - ${partnership.description}`,
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert('Partnership link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading partnership details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!partnership) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-base font-semibold text-foreground mb-2">Partnership Not Found</h2>
            <p className="text-muted-foreground mb-4">The partnership you're looking for doesn't exist.</p>
            <BackButton to="/admin/marketing/partnerships" label="Back to Partnerships" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isPrintMode ? 'print-mode' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton to="/admin/marketing/partnerships" label="Back to Partnerships" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Partnership Details</h1>
              <p className="text-muted-foreground">View and manage partnership information</p>
            </div>
          </div>
          
          {!isPrintMode && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          )}
        </div>

        {/* Document Header */}
        <div className="text-center mb-8 pb-6 border-b border-border">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
              EK
            </div>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2"><span className="text-primary">EventKnit</span></h1>
          <p className="text-muted-foreground text-lg mb-4">Connecting Events, Creating Opportunities</p>
          <div className="flex items-center justify-center space-x-4">
            <Badge className={`text-lg px-4 py-2 ${getTypeColor(partnership.type)}`}>
              {partnership.type.toUpperCase()} PARTNERSHIP AGREEMENT
            </Badge>
            <Badge className={`text-lg px-4 py-2 ${getStatusColor(partnership.status)}`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(partnership.status)}
                <span>{partnership.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </Badge>
          </div>
        </div>

        {/* Partnership Details */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Handshake className="h-5 w-5 mr-2" />
              Partnership Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Partnership Name</label>
                  <p className="text-lg font-semibold text-foreground">{partnership.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Organizer</label>
                  <p className="text-lg font-semibold text-foreground">{partnership.organizer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Partnership Type</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`${getTypeColor(partnership.type)} flex items-center space-x-1`}>
                      {getTypeIcon(partnership.type)}
                      <span>{partnership.type.charAt(0).toUpperCase() + partnership.type.slice(1)}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Partnership Value</label>
                  <p className="font-semibold text-success">${partnership.value.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Contact Person</label>
                  <p className="text-lg font-semibold text-foreground">{partnership.contactPerson}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                  <p className="text-lg font-semibold text-primary">{partnership.email}</p>
                </div>
                {partnership.phone && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <p className="text-lg font-semibold text-foreground">{partnership.phone}</p>
                  </div>
                )}
                {partnership.location && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Location</label>
                    <p className="text-lg font-semibold text-foreground">{partnership.location}</p>
                  </div>
                )}
                {partnership.website && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Website</label>
                    <p className="text-lg font-semibold text-primary">{partnership.website}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partnership Terms */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Partnership Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Start Date</label>
                <p className="text-lg font-semibold text-foreground">{new Date(partnership.startDate).toLocaleDateString()}</p>
              </div>
              {partnership.endDate && (
                <div>
                  <label className="text-sm font-medium text-foreground">End Date</label>
                  <p className="text-lg font-semibold text-foreground">{new Date(partnership.endDate).toLocaleDateString()}</p>
                </div>
              )}
              {partnership.rating && (
                <div>
                  <label className="text-sm font-medium text-foreground">Partnership Rating</label>
                  <div className="flex items-center space-x-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < partnership.rating! ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} 
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">({partnership.rating}/5)</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{partnership.description}</p>
          </CardContent>
        </Card>

        {/* Purpose */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Partnership Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{partnership.purpose}</p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Partnership Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {partnership.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Associated Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {partnership.events.map((event, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{event}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        {partnership.notes && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{partnership.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Document Footer */}
        <div className="text-center pt-8 border-t border-border">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Document ID: {partnership.id}</p>
              <p>Generated on: {new Date().toLocaleDateString()}</p>
              <p>Terms Accepted: {partnership.acceptedTerms ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="border-b border-border w-32 mb-2"></div>
                <p className="text-sm text-muted-foreground"><span className="text-primary">EventKnit</span> Representative</p>
              </div>
              <div className="text-center">
                <div className="border-b border-border w-32 mb-2"></div>
                <p className="text-sm text-muted-foreground">{partnership.contactPerson}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PartnershipDetailsPage;
