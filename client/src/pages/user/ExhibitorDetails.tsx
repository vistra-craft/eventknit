import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Building2, MapPin, Phone, Mail, Globe, MessageCircle, Send } from 'lucide-react';
import BackButton from '@/components/BackButton';

interface Exhibitor {
  id: number;
  name: string;
  logo: string;
  description: string;
  category: string;
  sponsorType: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner';
  booth: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  products: string[];
  representatives: {
    name: string;
    position: string;
    avatar: string;
  }[];
}

const ExhibitorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock exhibitor data - in a real app, this would come from an API
  const exhibitor: Exhibitor = {
    id: parseInt(id || '1'),
    name: 'TechCorp Solutions',
    logo: '/api/placeholder/200/100',
    description: 'Leading provider of enterprise software solutions and digital transformation services. We help businesses streamline operations, enhance productivity, and drive innovation through cutting-edge technology.',
    category: 'Technology',
    sponsorType: 'gold',
    booth: 'A-15',
    website: 'https://techcorp.com',
    email: 'info@techcorp.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    products: [
      'Enterprise Resource Planning (ERP)',
      'Customer Relationship Management (CRM)',
      'Business Intelligence & Analytics',
      'Cloud Migration Services',
      'Digital Transformation Consulting'
    ],
    representatives: [
      {
        name: 'Sarah Johnson',
        position: 'Sales Director',
        avatar: '/api/placeholder/40/40'
      },
      {
        name: 'Michael Chen',
        position: 'Technical Lead',
        avatar: '/api/placeholder/40/40'
      }
    ]
  };

  const getSponsorTypeColor = (type: string) => {
    switch (type) {
      case 'platinum': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-600';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'partner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMessage('');
    setIsSubmitting(false);
    alert('Message sent successfully!');
  };

  const relatedExhibitors = [
    { id: 2, name: 'DataFlow Inc.', category: 'Technology', sponsorType: 'silver' as const },
    { id: 3, name: 'CloudTech Systems', category: 'Technology', sponsorType: 'bronze' as const },
    { id: 4, name: 'InnovateLab', category: 'Technology', sponsorType: 'partner' as const }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          
        {/* Back Button */}
        <div className="mb-6">
            <BackButton label="Back to Exhibitors" />
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Company Header */}
              <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-foreground">{exhibitor.name}</h1>
                        <Badge className={getSponsorTypeColor(exhibitor.sponsorType)}>
                          {exhibitor.sponsorType.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{exhibitor.description}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>Booth {exhibitor.booth}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{exhibitor.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products & Services */}
              <Card className="bg-card rounded-2xl shadow-lg border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">Products & Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exhibitor.products.map((product, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-foreground">{product}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Representatives */}
              <Card className="bg-card rounded-2xl shadow-lg border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">Team Representatives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {exhibitor.representatives.map((rep, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                        <Avatar
                          name={rep.name}
                          alt={rep.name}
                          size="md"
                          className="w-12 h-12"
                        />
                        <div>
                          <h4 className="font-semibold text-foreground">{rep.name}</h4>
                          <p className="text-sm text-muted-foreground">{rep.position}</p>
                        </div>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Contact Information */}
              <Card className="bg-card rounded-2xl shadow-lg border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exhibitor.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <a 
                        href={exhibitor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {exhibitor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{exhibitor.email}</span>
                    </div>
                  )}
                  {exhibitor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{exhibitor.phone}</span>
                  </div>
                  )}
                  {exhibitor.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{exhibitor.location}</span>
                </div>
                  )}
              </CardContent>
            </Card>

              {/* Send Message */}
              <Card className="bg-card rounded-2xl shadow-lg border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">Send Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <MessageCircle className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Related Exhibitors */}
              <Card className="bg-card rounded-2xl shadow-lg border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">Related Exhibitors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedExhibitors.map((related) => (
                    <div 
                      key={related.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => window.location.href = `/user/dashboard?section=exhibitors&view=${related.id}`}
                    >
                      <div>
                        <h4 className="font-medium text-foreground">{related.name}</h4>
                        <p className="text-sm text-muted-foreground">{related.category}</p>
                      </div>
                      <Badge className={getSponsorTypeColor(related.sponsorType)}>
                        {related.sponsorType.toUpperCase()}
                      </Badge>
                </div>
                  ))}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExhibitorDetails;
