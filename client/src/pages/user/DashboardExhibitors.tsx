import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { Building2, MapPin, Mail, Globe } from 'lucide-react';
import ExhibitorDetailsModal from '../../components/ExhibitorDetailsModal';
import { getEventById } from '../../lib/event-api';

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface DashboardExhibitorsProps {
  eventData: EventData;
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

const DashboardExhibitors: React.FC<DashboardExhibitorsProps> = ({ eventData }) => {
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const totalPages = Math.ceil(exhibitors.length / limit);
  const exhibitorsStartIndex = (page - 1) * limit;
  const exhibitorsEndIndex = exhibitorsStartIndex + limit;
  const paginatedExhibitors = exhibitors.slice(exhibitorsStartIndex, exhibitorsEndIndex);

  useEffect(() => {
    const fetchExhibitors = async () => {
      try {
        setLoading(true);
        const response = await getEventById(eventData.id.toString());
        if (response.success && response.data?.event?.exhibitors) {
          // Transform exhibitors data to display format
          const eventExhibitors = response.data.event.exhibitors.map((exhibitor: any, index: number) => ({
            id: index + 1,
            name: exhibitor.name || 'Exhibitor',
            logo: exhibitor.logo || '/api/placeholder/200/100',
            category: 'Exhibitor',
            sponsorType: 'partner' as const,
            booth: exhibitor.booth || '',
            description: exhibitor.description || '',
            website: undefined,
            email: exhibitor.contactEmail,
            phone: undefined,
            location: undefined,
            products: [],
            representatives: [],
          }));
          setExhibitors(eventExhibitors);
        } else {
          setExhibitors([]);
        }
      } catch (error) {
        console.error("Error fetching exhibitors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitors();
  }, [eventData.id]);

  const handleExhibitorClick = (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExhibitor(null);
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
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading exhibitors...</p>
                  </div>
                ) : exhibitors.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {exhibitorsStartIndex + 1}-{Math.min(exhibitorsEndIndex, exhibitors.length)} of {exhibitors.length} exhibitors
                      </div>
                      <Select value={limit.toString()} onValueChange={(value) => {
                        setLimit(parseInt(value, 10));
                        setPage(1);
                      }}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="24">24</SelectItem>
                          <SelectItem value="48">48</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {paginatedExhibitors.map((exhibitor) => (
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
                                {exhibitor.logo && exhibitor.logo !== '/api/placeholder/200/100' ? (
                                  <img src={exhibitor.logo} alt={exhibitor.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <Building2 className="w-6 h-6 text-muted-foreground" />
                                )}
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
                            {exhibitor.booth && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>Booth {exhibitor.booth}</span>
                              </div>
                            )}

                            {/* Contact Actions */}
                            {(exhibitor.website || exhibitor.email) && (
                              <div className="flex gap-2">
                                {exhibitor.website && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(exhibitor.website, '_blank');
                                    }}
                                  >
                                    <Globe className="w-3 h-3 mr-1" />
                                    Website
                                  </Button>
                                )}
                                {exhibitor.email && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.href = `mailto:${exhibitor.email}`;
                                    }}
                                  >
                                    <Mail className="w-3 h-3 mr-1" />
                                    Contact
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(newPage) => {
                          setPage(newPage);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  )}
                </>
                ) : (
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