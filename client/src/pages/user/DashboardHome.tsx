import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Mic,
  Users2,
  Calendar as CalendarIcon,
  FileText,
  Badge as BadgeIcon,
  Clock,
  Star,
  Eye,
  MoreHorizontal,
  Share2,
  Copy,
  Download,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import EmptyState from "../../components/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { EventThumbnail } from "../../components/ui/event-thumbnail";
import { Avatar } from "../../components/ui/avatar";
import { getUserRegisteredEvents } from "../../lib/event-api";
import { useAuth } from "../../hooks/useAuth";
import { shareEvent } from "../../lib/utils/share";
import { downloadTicket } from "../../lib/utils/ticket";
import { useToast } from "../../hooks/use-toast";

interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
  venue?: string;
  description?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  category?: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardHomeProps {
  eventData?: EventData;
  user: User;
  registration?: Registration;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [previewEvent, setPreviewEvent] = useState<EventData | null>(null);
  const [userEvents, setUserEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [completedEvents, setCompletedEvents] = useState(0);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  
  // Get company affiliation from auth user if available
  const companyAffiliation = authUser?.companyAffiliation || null;

  const fetchUserEvents = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const response = await getUserRegisteredEvents({ page: pageNum, limit: 12 });
      if (response.success && response.data) {
        const newEvents = response.data.events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          type: event.type || 'In-Person',
          image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
          registrationDate: event.registrationDate,
          venue: event.venue || event.location,
          description: event.description || '',
          status: event.status || 'upcoming',
          category: event.category || '',
        }));

        if (append) {
          setUserEvents(prev => {
            const updated = [...prev, ...newEvents];
            // Update completed count from all loaded events
            setCompletedEvents(updated.filter(e => e.status === 'completed').length);
            return updated;
          });
        } else {
          setUserEvents(newEvents);
          // Update stats from first page load
          if (response.data.total !== undefined) {
            setTotalEvents(response.data.total);
          }
          // Count completed events from loaded events
          setCompletedEvents(newEvents.filter(e => e.status === 'completed').length);
        }

        setHasMore(response.data.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching user events:", error);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUserEvents(1, false);
  }, [fetchUserEvents]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchUserEvents(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, page, fetchUserEvents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'ongoing': return <Users className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };


  // Default view - My Events Overview
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Left Sidebar - User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-24 border border-border">
              <div className="text-right mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => navigate('/user/profile')}
                >
                  Edit Profile
                </Button>
              </div>
              
              <div className="text-center">
                <Avatar
                  src={(authUser as { profileImage?: string })?.profileImage || undefined}
                  name={user.name}
                  alt={user.name}
                  size="lg"
                />
                
                <h3 className="text-lg font-semibold text-foreground mb-1 mt-4">{user.name}</h3>
                {companyAffiliation && (
                  <p className="text-sm text-muted-foreground">{companyAffiliation}</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-primary">{totalEvents || userEvents.length}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-primary">
                      {completedEvents || userEvents.filter(e => e.status === 'completed').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - My Events */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-lg font-semibold text-foreground mb-2">My Events</h1>
              <p className="text-muted-foreground">
                Manage and explore all your registered events
              </p>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your events...</p>
              </div>
            ) : userEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden">
                    <EventThumbnail
                      src={event.image}
                      alt={event.title}
                      category={event.category || ''}
                      size="lg"
                    />
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className={`${getStatusColor(event.status || 'upcoming')} border-0`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(event.status || 'upcoming')}
                          <span className="capitalize">{event.status || 'upcoming'}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event.type}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        Registered: {new Date(event.registrationDate).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewEvent(event);
                          }}
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/event/${event.id}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Event Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
                                toast({
                                  title: "Copied",
                                  description: "Event link copied to clipboard",
                                });
                              } catch {
                                toast({
                                  title: "Error",
                                  description: "Failed to copy link",
                                  variant: "destructive",
                                });
                              }
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Event Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                              const shared = await shareEvent(event.title, event.id);
                              if (shared) {
                                toast({
                                  title: "Shared",
                                  description: "Event shared successfully",
                                });
                              } else {
                                toast({
                                  title: "Link Copied",
                                  description: "Event link copied to clipboard",
                                });
                              }
                            }}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              try {
                                downloadTicket({
                                  eventTitle: event.title,
                                  eventDate: event.date,
                                  eventLocation: event.location,
                                  attendeeName: user.name,
                                  attendeeEmail: user.email,
                                  ticketType: event.type || 'Standard',
                                  ticketId: `${event.id}-${Date.now()}`,
                                });
                                toast({
                                  title: "Downloaded",
                                  description: "Ticket downloaded successfully",
                                });
                              } catch {
                                toast({
                                  title: "Error",
                                  description: "Failed to download ticket",
                                  variant: "destructive",
                                });
                              }
                            }}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No Events Yet"
                description="You haven't registered for any events yet. Start exploring amazing events and register to attend!"
                action={{
                  label: "Browse Events",
                  onClick: () => navigate('/'),
                }}
              />
            )}

            {/* Infinite Scroll Loader */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more events...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Preview Dialog */}
      <Dialog 
        open={!!previewEvent} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>
              Preview event details
            </DialogDescription>
          </DialogHeader>
          {previewEvent && (
            <div className="space-y-6">
              {previewEvent.image && (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={previewEvent.image}
                    alt={previewEvent.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-lg font-semibold mb-2">{previewEvent.title}</h2>
                    <Badge className="bg-blue-500/90 text-white">
                      {previewEvent.status || 'Upcoming'}
                    </Badge>
                  </div>
                </div>
              )}
              {!previewEvent.image && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">{previewEvent.title}</h2>
                  <Badge className="bg-blue-500/90 text-white">
                    {previewEvent.status || 'Upcoming'}
                  </Badge>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{previewEvent.date}</p>
                    <p className="text-sm text-muted-foreground">
                      Registered on {new Date(previewEvent.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{previewEvent.venue || previewEvent.location}</p>
                    {previewEvent.venue && previewEvent.location && (
                      <p className="text-sm text-muted-foreground">{previewEvent.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{previewEvent.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {previewEvent.category}
                  </Badge>
                </div>
              </div>

              {previewEvent.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewEvent.description}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => {
                    setPreviewEvent(null);
                    window.location.href = '/user/dashboard?section=speakers';
                  }}
                >
                  <Mic className="w-5 h-5" />
                  <span className="font-medium text-xs">Speakers</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => {
                    setPreviewEvent(null);
                    window.location.href = '/user/dashboard?section=exhibitors';
                  }}
                >
                  <Users2 className="w-5 h-5" />
                  <span className="font-medium text-xs">Exhibitors</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => {
                    setPreviewEvent(null);
                    window.location.href = '/user/dashboard?section=agenda';
                  }}
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span className="font-medium text-xs">Agenda</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => {
                    setPreviewEvent(null);
                    window.location.href = '/user/dashboard?section=badge';
                  }}
                >
                  <BadgeIcon className="w-5 h-5" />
                  <span className="font-medium text-xs">My Badge</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => {
                    setPreviewEvent(null);
                    window.location.href = '/user/dashboard?section=abstracts';
                  }}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium text-xs">Abstracts</span>
                </Button>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewEvent(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setPreviewEvent(null);
                  window.open(`/event/${previewEvent.id}`, '_blank');
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Event
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardHome;
