import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import EmptyState from '../../components/EmptyState';
import { Award, Globe, Mail, Loader2 } from 'lucide-react';
import { getEventById } from '../../lib/event-api';

interface EventData {
  id: number | string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface DashboardSponsorsProps {
  eventData: EventData;
}

interface Sponsor {
  id: number;
  name: string;
  logo: string;
  level: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner';
  description?: string;
  website?: string;
}

const DashboardSponsors: React.FC<DashboardSponsorsProps> = ({ eventData }) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const response = await getEventById(eventData.id.toString());
        if (response.success && response.data?.event?.sponsors) {
          // Transform sponsors data to display format
          const eventSponsors = response.data.event.sponsors.map((sponsor: any, index: number) => ({
            id: index + 1,
            name: sponsor.name || 'Sponsor',
            logo: sponsor.logo || '/api/placeholder/200/100',
            level: (sponsor.level?.toLowerCase() as 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner') || 'partner',
            description: sponsor.description,
            website: sponsor.website,
          }));
          setSponsors(eventSponsors);
        } else {
          setSponsors([]);
        }
      } catch (error) {
        console.error('Error fetching sponsors:', error);
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [eventData.id]);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'platinum': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
      case 'bronze': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'partner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'platinum':
      case 'gold':
      case 'silver':
      case 'bronze':
        return <Award className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Group sponsors by level
  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    const level = sponsor.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  // Order levels by importance
  const levelOrder = ['platinum', 'gold', 'silver', 'bronze', 'partner'];

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
                <CardTitle className="text-2xl font-bold text-foreground">Event Sponsors</CardTitle>
                <p className="text-muted-foreground">
                  Our valued sponsors who make this event possible.
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading sponsors...</p>
                  </div>
                ) : sponsors.length > 0 ? (
                  <div className="space-y-8">
                    {levelOrder.map((level) => {
                      const levelSponsors = groupedSponsors[level];
                      if (!levelSponsors || levelSponsors.length === 0) return null;

                      return (
                        <div key={level} className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Badge className={`${getLevelColor(level)} text-sm font-semibold px-3 py-1`}>
                              {getLevelIcon(level)}
                              <span className="ml-1">{level.toUpperCase()}</span>
                            </Badge>
                            <div className="flex-1 h-px bg-border"></div>
                            <span className="text-sm text-muted-foreground">
                              {levelSponsors.length} {levelSponsors.length === 1 ? 'sponsor' : 'sponsors'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {levelSponsors.map((sponsor) => (
                              <Card 
                                key={sponsor.id}
                                className="bg-muted/30 border border-border hover:shadow-lg transition-all duration-200"
                              >
                                <CardContent className="p-6">
                                  <div className="space-y-4">
                                    {/* Logo */}
                                    <div className="flex justify-center">
                                      <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                        {sponsor.logo && sponsor.logo !== '/api/placeholder/200/100' ? (
                                          <img 
                                            src={sponsor.logo} 
                                            alt={sponsor.name} 
                                            className="w-full h-full object-contain rounded-lg p-2"
                                          />
                                        ) : (
                                          <Award className="w-12 h-12 text-muted-foreground" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Name */}
                                    <div className="text-center">
                                      <h3 className="font-semibold text-foreground text-lg">
                                        {sponsor.name}
                                      </h3>
                                    </div>

                                    {/* Description */}
                                    {sponsor.description && (
                                      <p className="text-sm text-muted-foreground text-center line-clamp-3">
                                        {sponsor.description}
                                      </p>
                                    )}

                                    {/* Actions */}
                                    {sponsor.website && (
                                      <div className="flex justify-center gap-2 pt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1"
                                          onClick={() => window.open(sponsor.website, '_blank')}
                                        >
                                          <Globe className="w-4 h-4 mr-2" />
                                          Website
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Award}
                    title="No Sponsors Yet"
                    description="Sponsor information will be available closer to the event date."
                    size="sm"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSponsors;

