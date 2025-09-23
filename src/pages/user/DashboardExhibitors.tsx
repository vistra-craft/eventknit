import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import ExhibitorDetailsModal from '../../components/ExhibitorDetailsModal';

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
  company?: string;
  designation?: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardExhibitorsProps {
  eventData: EventData;
  user: User;
  registration?: Registration;
}

interface Exhibitor {
  id: number;
  name: string;
  logo: string;
  category: string;
  sponsorType: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner';
  booth: string;
  description: string;
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

const DashboardExhibitors: React.FC<DashboardExhibitorsProps> = ({ eventData, user, registration }) => {
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExhibitorClick = (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExhibitor(null);
  };

  // Mock exhibitors data
  const exhibitors: Exhibitor[] = [
    {
      id: 1,
      name: 'TechCorp Solutions',
      logo: '/api/placeholder/200/100',
      category: 'Technology',
      sponsorType: 'gold',
      booth: 'A-15',
      description: 'Leading provider of enterprise software solutions and digital transformation services.',
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
    },
    {
      id: 2,
      name: 'DataFlow Inc.',
      logo: '/api/placeholder/200/100',
      category: 'Technology',
      sponsorType: 'silver',
      booth: 'B-22',
      description: 'Advanced data analytics and business intelligence solutions for modern enterprises.',
      website: 'https://dataflow.com',
      email: 'contact@dataflow.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      products: [
        'Data Analytics Platform',
        'Business Intelligence Tools',
        'Machine Learning Solutions',
        'Data Visualization',
        'Predictive Analytics'
      ],
      representatives: [
        {
          name: 'Emily Rodriguez',
          position: 'Data Scientist',
          avatar: '/api/placeholder/40/40'
        }
      ]
    },
    {
      id: 3,
      name: 'CloudTech Systems',
      logo: '/api/placeholder/200/100',
      category: 'Technology',
      sponsorType: 'bronze',
      booth: 'C-08',
      description: 'Cloud infrastructure and migration services for scalable business operations.',
      website: 'https://cloudtech.com',
      email: 'hello@cloudtech.com',
      phone: '+1 (555) 345-6789',
      location: 'Austin, TX',
      products: [
        'Cloud Migration Services',
        'Infrastructure as a Service',
        'DevOps Solutions',
        'Container Orchestration',
        'Cloud Security'
      ],
      representatives: [
        {
          name: 'David Kim',
          position: 'Cloud Architect',
          avatar: '/api/placeholder/40/40'
        },
        {
          name: 'Lisa Wang',
          position: 'DevOps Engineer',
          avatar: '/api/placeholder/40/40'
        }
      ]
    },
    {
      id: 4,
      name: 'InnovateLab',
      logo: '/api/placeholder/200/100',
      category: 'Technology',
      sponsorType: 'partner',
      booth: 'D-12',
      description: 'Innovation consulting and digital transformation solutions.',
      website: 'https://innovatelab.com',
      email: 'info@innovatelab.com',
      phone: '+1 (555) 456-7890',
      location: 'Seattle, WA',
      products: [
        'Digital Transformation Consulting',
        'Innovation Strategy',
        'Product Development',
        'Technology Assessment',
        'Change Management'
      ],
      representatives: [
        {
          name: 'Alex Thompson',
          position: 'Innovation Consultant',
          avatar: '/api/placeholder/40/40'
        }
      ]
    },
    {
      id: 5,
      name: 'SecureNet Pro',
      logo: '/api/placeholder/200/100',
      category: 'Security',
      sponsorType: 'gold',
      booth: 'A-20',
      description: 'Enterprise cybersecurity solutions and threat protection services.',
      website: 'https://securenetpro.com',
      email: 'security@securenetpro.com',
      phone: '+1 (555) 567-8901',
      location: 'Boston, MA',
      products: [
        'Cybersecurity Solutions',
        'Threat Detection',
        'Security Monitoring',
        'Incident Response',
        'Security Training'
      ],
      representatives: [
        {
          name: 'Rachel Green',
          position: 'Security Specialist',
          avatar: '/api/placeholder/40/40'
        },
        {
          name: 'James Wilson',
          position: 'Threat Analyst',
          avatar: '/api/placeholder/40/40'
        }
      ]
    },
    {
      id: 6,
      name: 'MobileFirst',
      logo: '/api/placeholder/200/100',
      category: 'Mobile',
      sponsorType: 'silver',
      booth: 'B-15',
      description: 'Mobile app development and cross-platform solutions.',
      website: 'https://mobilefirst.com',
      email: 'dev@mobilefirst.com',
      phone: '+1 (555) 678-9012',
      location: 'Los Angeles, CA',
      products: [
        'Mobile App Development',
        'Cross-Platform Solutions',
        'UI/UX Design',
        'App Testing',
        'App Store Optimization'
      ],
      representatives: [
        {
          name: 'Maria Garcia',
          position: 'Mobile Developer',
          avatar: '/api/placeholder/40/40'
        }
      ]
    }
  ];

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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technology': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'mobile': return 'bg-green-100 text-green-800';
      case 'finance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Event Card Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={eventData.image} 
                      alt={eventData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{eventData.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{eventData.location}</p>
                    <p className="text-muted-foreground text-sm">{eventData.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-foreground">Exhibitors</CardTitle>
                <p className="text-muted-foreground">
                  Discover companies and organizations showcasing their products and services.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {exhibitors.map((exhibitor) => (
                    <Card 
                      key={exhibitor.id} 
                      className="bg-muted/30 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => handleExhibitorClick(exhibitor)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Logo and Basic Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">
                                {exhibitor.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {exhibitor.description}
                              </p>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getSponsorTypeColor(exhibitor.sponsorType)}>
                              {exhibitor.sponsorType.toUpperCase()}
                            </Badge>
                            <Badge className={getCategoryColor(exhibitor.category)}>
                              {exhibitor.category}
                            </Badge>
                          </div>

                          {/* Booth Info */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>Booth {exhibitor.booth}</span>
                          </div>

                          {/* Contact Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (exhibitor.website) {
                                  window.open(exhibitor.website, '_blank');
                                }
                              }}
                            >
                              <Globe className="w-3 h-3 mr-1" />
                              Website
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (exhibitor.email) {
                                  window.location.href = `mailto:${exhibitor.email}`;
                                }
                              }}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Empty State */}
                {exhibitors.length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Exhibitors Yet</h3>
                    <p className="text-muted-foreground">
                      Exhibitor information will be available closer to the event date.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Exhibitor Details Modal */}
      {selectedExhibitor && (
        <ExhibitorDetailsModal
          exhibitor={selectedExhibitor}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DashboardExhibitors;