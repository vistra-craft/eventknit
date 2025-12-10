import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/hooks/useEvent";
import { useMetaTags } from "@/hooks/useMetaTags";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventHero } from "@/components/event-details/EventHero";
import { VenueSection } from "@/components/event-details/VenueSection";
import { OrganizerInfo } from "@/components/event-details/OrganizerInfo";
import { EventTags } from "@/components/event-details/EventTags";
import { RelatedEvents } from "@/components/event-details/RelatedEvents";
import { Loader2, Users, CheckCircle, Heart, Share2, Ticket, ArrowLeft, ArrowRight, Facebook, Twitter, Instagram, Linkedin, Youtube, Globe, CalendarDays, Clock, Store } from "lucide-react";
import { Card } from "@/components/ui/card";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Fetch event data
  const { event, isLoading, error } = useEvent(id);
  
  // TODO: Check if user is already registered for this event
  const userAlreadyRegistered = false;
  
  // Meta tags logic
  const getFrontendUrl = () => {
    const envUrl = import.meta.env.VITE_FRONTEND_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, '');
    }
    return window.location.origin;
  };
  
  const frontendUrl = getFrontendUrl();
  const eventUrl = id ? `${frontendUrl}/event/${id}` : undefined;
  const eventImage = event?.image 
    ? (event.image.startsWith('http') ? event.image : `${frontendUrl}${event.image}`)
    : undefined;
  
  const eventDescription = event?.description 
    ? (event.description.length > 160 
        ? `${event.description.substring(0, 157)}...` 
        : event.description)
    : event?.title 
      ? `Join us for ${event.title}${event.venue ? ` at ${event.venue}` : ''}${event.startDate ? ` on ${new Date(event.startDate).toLocaleDateString()}` : ''}`
      : undefined;
  
  useMetaTags({
    title: event?.title,
    description: eventDescription,
    image: eventImage,
    url: eventUrl,
    type: 'website',
    siteName: 'EventKnit',
  });

  const handleRegisterClick = () => {
    if (userAlreadyRegistered) {
      // Navigate to my tickets page
      navigate('/my-tickets');
    } else {
      // Navigate to registration page
      navigate(`/event/${id}/register`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-primary/5 via-background to-muted/10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-primary/5 via-background to-muted/10">
          <div className="text-center max-w-md px-4">
            <h2 className="text-2xl font-bold mb-4">Event not found</h2>
            <p className="text-muted-foreground mb-6">{error || 'The event you are looking for does not exist.'}</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pb-12 bg-gradient-to-b from-primary/5 via-background to-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="gap-2 border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral transition-colors"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Hero, Organizer, About, Important Info, Refund Policy, Venue, Tags */}
            <div className="lg:col-span-2 space-y-6">
              <EventHero 
                title={event.title}
                category={event.category}
                date={event.date || new Date(event.startDate).toLocaleDateString()}
                time={event.time || (event.startTime ? new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}
                venue={event.venue}
                location={event.location}
                image={event.image}
              />


              {/* Organizer Info */}
              <OrganizerInfo 
                organizer={event.organizer}
                organizerName={event.organizerName}
                organizerDescription={event.organizerDescription}
              />

              
              {/* Social Links */}
              {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                <Card className="border-0 bg-card-surface shadow-sm p-6">
                  <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(event.socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      const Icon = {
                        facebook: Facebook,
                        twitter: Twitter,
                        instagram: Instagram,
                        linkedin: Linkedin,
                        youtube: Youtube,
                        tiktok: Globe,
                        website: Globe
                      }[platform.toLowerCase()] || Globe;
                      
                      const platformLabels: Record<string, string> = {
                        facebook: 'Facebook',
                        twitter: 'Twitter / X',
                        instagram: 'Instagram',
                        linkedin: 'LinkedIn',
                        youtube: 'YouTube',
                        tiktok: 'TikTok',
                        website: 'Website'
                      };
                      
                      return (
                        <a
                          key={platform}
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all hover:shadow-md"
                          title={platformLabels[platform.toLowerCase()] || platform}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{platformLabels[platform.toLowerCase()] || platform}</span>
                        </a>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* About Section */}
              <section>
                <h2 className="text-3xl font-bold mb-4">About This Event</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="leading-relaxed whitespace-pre-line">
                    {event.fullDescription || event.description || 'No description available.'}
                  </p>
                </div>
              </section>

              {/* Event Agenda */}
              {event.agenda && event.agenda.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold mb-6">Event Agenda</h2>
                  <div className="space-y-4">
                    {event.agenda.map((item, index) => (
                      <Card key={index} className="border-0 bg-card-surface shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-shrink-0 w-32 flex flex-col justify-center text-center sm:text-left sm:border-r border-border/50 pr-4">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                              <Clock className="w-4 h-4" />
                              <span>{item.startTime}</span>
                            </div>
                            <span className="text-muted-foreground text-sm pl-6 sm:pl-0 block">
                              to {item.endTime}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                            {item.description && (
                              <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
                            )}
                            {item.speakers && item.speakers.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">
                                  {item.speakers.map(s => {
                                      // If speaker is an ID string, try to find name in event.speakers if available, else show ID
                                      // Or if speaker is object (agenda builder might store objects)
                                      return typeof s === 'string' ? s : (s as any).name || 'Speaker';
                                  }).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Important Information */}
              {(event.requirements?.length || event.ageRestriction) && (
                <section>
                  <h3 className="text-xl font-bold mb-4">Important Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                      {event.ageRestriction && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Age Restriction</h4>
                            <p className="text-sm text-muted-foreground">{event.ageRestriction}</p>
                          </div>
                        </div>
                      )}
                      
                      {event.requirements?.map((req, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Requirement</h4>
                            <p className="text-sm text-muted-foreground">{req}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* Venue Information */}
              <VenueSection 
                venue={event.venue}
                location={event.location}
                coordinates={event.coordinates}
              />
              
              <EventTags tags={event.tags} />

              {/* Speakers (if any) */}
              {event.speakers && event.speakers.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold mb-4">Featured Speakers</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.speakers.map((speaker, index) => (
                      <div key={index} className="p-4 flex items-start gap-4 rounded-lg border-0 bg-white shadow-sm hover:shadow-md hover:bg-primary/5 transition-all">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {speaker.image ? (
                            <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{speaker.name}</h4>
                          <p className="text-primary font-medium text-sm">{speaker.title}</p>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{speaker.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}


              {/* Exhibitors & Sponsors */}
              {( (event.exhibitors && event.exhibitors.length > 0) || (event.sponsors && event.sponsors.length > 0) ) && (
                  <section className="space-y-8">
                    {/* Exhibitors */}
                    {event.exhibitors && event.exhibitors.length > 0 && (
                      <div>
                         <h2 className="text-3xl font-bold mb-4">Exhibitors</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {event.exhibitors.map((exhibitor, idx) => (
                              <Card key={idx} className="p-4 border-0 bg-card-surface shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                     <Store className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold">{exhibitor.name}</h4>
                                    {exhibitor.description && <p className="text-xs text-muted-foreground line-clamp-1">{exhibitor.description}</p>}
                                  </div>
                                </div>
                              </Card>
                            ))}
                         </div>
                      </div>
                    )}

                    {/* Sponsors */}
                    {event.sponsors && event.sponsors.length > 0 && (
                      <div>
                        <h2 className="text-3xl font-bold mb-4">Sponsors</h2>
                         <div className="flex flex-wrap gap-6 items-center">
                            {event.sponsors.map((sponsor, idx) => (
                              <div key={idx} className="text-center group">
                                <div className="w-24 h-24 rounded-full bg-white shadow-sm border flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform">
                                   {sponsor.logo ? (
                                     <img src={sponsor.logo} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                                   ) : (
                                     <span className="text-xl font-bold text-primary">{sponsor.name.charAt(0)}</span>
                                   )}
                                </div>
                                <span className="text-sm font-medium">{sponsor.name}</span>
                                <span className="block text-xs text-muted-foreground uppercase">{sponsor.level}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </section>
              )}

            </div>

            {/* Right Column - Action Button and Info */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20 lg:self-start">
              {/* Primary Action Card */}
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all p-6">
                <div className="space-y-4">
                  {/* Price Display */}
                  {!event.isFree && (
                    <div className="text-center pb-4 border-b">
                      <p className="text-sm text-muted-foreground mb-1">Starting from</p>
                      <p className="text-3xl font-bold text-primary">
                        {event.currency || '$'}
                        {event.ticketTypes && event.ticketTypes.length > 0
                          ? Math.min(...event.ticketTypes.map(t => t.price))
                          : event.price || 0}
                      </p>
                    </div>
                  )}

                  {/* Register Button */}
                  <Button
                    size="lg"
                    variant="default"
                    className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                    onClick={handleRegisterClick}
                  >
                    <Ticket className="mr-2 h-5 w-5" />
                    {userAlreadyRegistered ? 'View My Ticket' : (event.isFree ? 'Register Free' : 'Register for Event')}
                  </Button>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral">
                      <Heart className="w-4 h-4" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>

                  {/* Event Stats */}
                  <div className="pt-4 border-t space-y-2 text-sm">
                    {event.capacity && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span className="font-medium">{event.capacity} attendees</span>
                      </div>
                    )}
                    {event.registrationCount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registered:</span>
                        <span className="font-medium">{event.registrationCount}</span>
                      </div>
                    )}
                    {event.availableSlots && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-medium text-primary">{event.availableSlots} spots</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

            </div>
          </div>

          {/* Related Events - Full Width */}
          <section className="pt-6 border-t border-border/60 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">You May Also Like</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/');
                  // Scroll to events section after navigation
                  setTimeout(() => {
                    const eventsSection = document.querySelector('[data-section="events"]');
                    if (eventsSection) {
                      eventsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="gap-2 text-primary hover:bg-accent-coral hover:text-white transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <RelatedEvents 
              currentEventId={event.id}
              category={event.category || undefined}
              tags={event.tags}
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetails;
