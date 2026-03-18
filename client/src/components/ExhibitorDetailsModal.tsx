import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar } from './ui/avatar';
import { X, Building2, MapPin, Phone, Mail, Globe, Send } from 'lucide-react';
import { SocialConnections } from './SocialConnections';
import { RichTextContent } from '@/components/ui/RichTextContent';

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
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      website?: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
    };
    contactDetails?: {
      website?: string;
      email?: string;
      phone?: string;
    };
  }[];
}

interface ExhibitorDetailsModalProps {
  exhibitor: Exhibitor;
  isOpen: boolean;
  onClose: () => void;
}

const ExhibitorDetailsModal: React.FC<ExhibitorDetailsModalProps> = ({ exhibitor, isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSponsorTypeColor = (type: string) => {
    switch (type) {
      case 'platinum': return 'bg-muted text-muted-foreground';
      case 'gold': return 'bg-warning/10 text-warning';
      case 'silver': return 'bg-muted text-muted-foreground';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'partner': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setMessage('');
    // Show success message or handle success
  };


  // Mock related exhibitors data
  const relatedExhibitors = [
    {
      id: 2,
      name: 'DataFlow Inc.',
      category: 'Technology',
      sponsorType: 'silver' as const,
    },
    {
      id: 3,
      name: 'CloudTech Systems',
      category: 'Technology',
      sponsorType: 'bronze' as const,
    },
    {
      id: 4,
      name: 'InnovateLab',
      category: 'Technology',
      sponsorType: 'partner' as const,
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-background rounded-2xl shadow-2xl border border-border max-w-3xl w-full mx-4 max-h-[95vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Exhibitor Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 pb-12">
          <div className="space-y-6">
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
                    <RichTextContent content={exhibitor.description} className="text-muted-foreground mb-4" />
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
                <CardTitle className="text-lg font-bold text-foreground">Products & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exhibitor.products.map((product, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">{product}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exhibitor.email && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Email</p>
                        <a href={`mailto:${exhibitor.email}`} className="text-sm text-primary hover:underline">
                          {exhibitor.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {exhibitor.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Phone</p>
                        <a href={`tel:${exhibitor.phone}`} className="text-sm text-primary hover:underline">
                          {exhibitor.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {exhibitor.website && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Website</p>
                        <a href={exhibitor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                  {exhibitor.location && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">{exhibitor.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Representatives */}
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Team Representatives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {exhibitor.representatives.map((rep, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar
                          name={rep.name}
                          alt={rep.name}
                          size="md"
                          className="w-12 h-12"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{rep.name}</h4>
                          <p className="text-sm text-muted-foreground">{rep.position}</p>
                        </div>
                      </div>
                      
                      {/* Social Connections for Representative */}
                      {(rep.socialLinks || rep.contactDetails) && (
                        <div className="ml-16">
                          <SocialConnections 
                            socialLinks={rep.socialLinks}
                            contactDetails={rep.contactDetails}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Send Message */}
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSubmitting}
                      className="px-6"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
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
  );
};

export default ExhibitorDetailsModal;
