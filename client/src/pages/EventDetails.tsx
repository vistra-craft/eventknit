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
import { Loader2, Users, CheckCircle, Heart, Share2, Ticket, ArrowLeft, ArrowRight, Facebook, Twitter, Instagram, Linkedin, Youtube, Globe, Clock, Store } from "lucide-react";
import { Card } from "@/components/ui/card";

// Helper function to format time for display
const formatTimeForDisplay = (timeStr: string): string => {
  if (!timeStr) return '';
  
  // If already in readable format (contains AM/PM), return as is
  if (/AM|PM/i.test(timeStr)) {
    return timeStr;
  }
  
  // Try to parse as HH:MM or HH:MM:SS format
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${period}`;
  }
  
  return timeStr;
};

// Helper function to generate agenda summary
const generateAgendaSummary = (agenda: any[]) => {
  if (!agenda || agenda.length === 0) return null;
  
  // Group agenda items by session type
  const sessionGroups = new Map<string, { times: string[], count: number }>();
  
  agenda.forEach((item) => {
    const title = item.title || '';
    const lower = title.toLowerCase();
    
    let sessionType = 'Session';
    if (lower.includes('keynote')) sessionType = 'Keynote';
    else if (lower.includes('workshop')) sessionType = 'Workshop';
    else if (lower.includes('panel')) sessionType = 'Panel';
    else if (lower.includes('networking') || lower.includes('meet')) sessionType = 'Networking';
    else if (lower.includes('break') || lower.includes('coffee')) sessionType = 'Break';
    else if (lower.includes('lunch') || lower.includes('meal') || lower.includes('dinner') || lower.includes('breakfast')) sessionType = 'Meal';
    else if (lower.includes('registration') || lower.includes('check-in') || lower.includes('badge')) sessionType = 'Registration';
    else if (lower.includes('closing') || lower.includes('wrap') || lower.includes('remark')) sessionType = 'Closing';
    else if (lower.includes('intro') || lower.includes('welcome') || lower.includes('opening')) sessionType = 'Opening';
    else if (lower.includes('demo') || lower.includes('showcase')) sessionType = 'Demo';
    else if (lower.includes('qa') || lower.includes('q&a') || lower.includes('question')) sessionType = 'Q&A';
    
    if (!sessionGroups.has(sessionType)) {
      sessionGroups.set(sessionType, { times: [], count: 0 });
    }
    
    const group = sessionGroups.get(sessionType)!;
    if (item.startTime) {
      const formattedTime = formatTimeForDisplay(item.startTime);
      if (formattedTime && !group.times.includes(formattedTime)) {
        group.times.push(formattedTime);
      }
    }
    group.count += 1;
  });
  
  // Create summary text
  const summaryParts: string[] = [];
  
  sessionGroups.forEach((group, type) => {
    if (group.times.length === 0) {
      // If no times, just mention the type
      if (group.count === 1) {
        summaryParts.push(`${type}`);
      } else {
        summaryParts.push(`${group.count} ${type}s`);
      }
    } else if (group.times.length === 1) {
      summaryParts.push(`${type} at ${group.times[0]}`);
    } else if (group.times.length === 2) {
      summaryParts.push(`${type} at ${group.times[0]} & ${group.times[1]}`);
    } else if (group.count === 1) {
      summaryParts.push(`${type} at ${group.times[0]}`);
    } else {
      // Sort times and show range
      const sortedTimes = group.times.sort((a, b) => {
        // Try to parse both formats
        const parseTime = (time: string): number => {
          // Format with AM/PM
          const ampmMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (ampmMatch) {
            let hours = parseInt(ampmMatch[1], 10);
            const minutes = parseInt(ampmMatch[2], 10);
            const period = ampmMatch[3].toUpperCase();
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
          }
          // Format HH:MM
          const hhmmMatch = time.match(/(\d{1,2}):(\d{2})/);
          if (hhmmMatch) {
            const hours = parseInt(hhmmMatch[1], 10);
            const minutes = parseInt(hhmmMatch[2], 10);
            return hours * 60 + minutes;
          }
          return 0;
        };
        return parseTime(a) - parseTime(b);
      });
      summaryParts.push(`${type}s from ${sortedTimes[0]} to ${sortedTimes[sortedTimes.length - 1]}`);
    }
  });
  
  return summaryParts.length > 0 ? summaryParts.join(', ') : null;
};

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
                socialLinks={event.socialLinks}
              />

              
              {/* Social Links */}
              {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                <Card className="border-0 bg-card-surface shadow-sm p-6">
                  <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(event.socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      const platformKey = platform.toLowerCase();
                      const Icon = {
                        facebook: Facebook,
                        twitter: Twitter,
                        instagram: Instagram,
                        linkedin: Linkedin,
                        youtube: Youtube,
                        tiktok: Globe, // TikTok icon not available in lucide-react yet, using Globe as fallback
                        website: Globe
                      }[platformKey] || Globe;
                      
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
                          title={platformLabels[platformKey] || platform}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{platformLabels[platformKey] || platform}</span>
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

              {/* Event Agenda Summary */}
              <section>
                <h2 className="text-3xl font-bold mb-6">Event Schedule</h2>
                <Card className="border-0 bg-card-surface shadow-sm p-6">
                  <div className="space-y-3">
                    {(() => {
                      // Debug logging
                      console.log('Event object:', event);
                      console.log('Event.agenda:', event.agenda);
                      console.log('Event.agenda type:', typeof event.agenda);
                      console.log('Event.agenda is array?', Array.isArray(event.agenda));
                      console.log('Event.agenda length:', event.agenda?.length);
                      
                      // Handle different data formats
                      let agendaData = event.agenda;
                      
                      // If agenda is a string, try to parse it
                      if (typeof agendaData === 'string') {
                        try {
                          agendaData = JSON.parse(agendaData);
                        } catch (e) {
                          console.error('Failed to parse agenda string:', e);
                          agendaData = null;
                        }
                      }
                      
                      // Check if we have valid agenda data
                      const hasAgenda = agendaData && Array.isArray(agendaData) && agendaData.length > 0;
                      
                      if (hasAgenda) {
                        const summary = generateAgendaSummary(agendaData);
                        console.log('Generated Summary:', summary);
                        if (summary && summary.trim() !== '') {
                          return (
                            <>
                              <p className="text-muted-foreground leading-relaxed text-lg">
                                {summary}
                              </p>
                              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                                <strong>Full agenda with detailed session descriptions, speaker information, and session locations available in your attendee dashboard after registration.</strong>
                              </p>
                            </>
                          );
                        } else {
                          // If summary is empty/null, show a generic message
                          return (
                            <>
                              <p className="text-muted-foreground leading-relaxed text-lg">
                                Full schedule with multiple sessions and activities throughout the event.
                              </p>
                              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                                <strong>Full agenda with detailed session descriptions, speaker information, and session locations available in your attendee dashboard after registration.</strong>
                              </p>
                            </>
                          );
                        }
                      } else {
                        return (
                          <p className="text-muted-foreground">Full schedule will be available after registration.</p>
                        );
                      }
                    })()}
                  </div>
                </Card>
                {/* Agenda Details Hint */}
                <p className="text-sm text-center text-muted-foreground mt-2 italic">
                  * Full detailed agenda available after registration
                </p>
              </section>

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
              
              <EventTags 
                tags={Array.isArray(event.tags) ? event.tags : (event.tags ? [event.tags] : [])} 
                category={event.category} 
              />

              {/* Featured Speakers (Names/Titles Only) */}
              {(() => {
                // Debug logging
                console.log('Event.speakers:', event.speakers);
                console.log('Event.speakers type:', typeof event.speakers);
                console.log('Event.speakers is array?', Array.isArray(event.speakers));
                console.log('Event.speakers length:', event.speakers?.length);
                
                // Handle different data formats
                let speakersData = event.speakers;
                
                // If speakers is a string, try to parse it
                if (typeof speakersData === 'string') {
                  try {
                    speakersData = JSON.parse(speakersData);
                  } catch (e) {
                    console.error('Failed to parse speakers string:', e);
                    speakersData = null;
                  }
                }
                
                // Check if we have valid speakers data
                const hasSpeakers = speakersData && Array.isArray(speakersData) && speakersData.length > 0;
                
                if (hasSpeakers) {
                  return (
                    <section>
                      <h2 className="text-3xl font-bold mb-4">Featured Speakers</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {speakersData.slice(0, 8).map((speaker: any, index: number) => (
                          <div key={index} className="p-4 flex flex-col items-center text-center rounded-lg border-0 bg-card-surface shadow-sm hover:shadow-md hover:bg-primary/5 transition-all">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 mb-3">
                              {speaker?.image ? (
                                <img src={speaker.image} alt={speaker.name || 'Speaker'} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                            <h4 className="font-bold text-sm mb-1">{speaker?.name || 'Speaker'}</h4>
                            <p className="text-primary font-medium text-xs line-clamp-2">{speaker?.title || ''}</p>
                          </div>
                        ))}
                      </div>
                      {speakersData.length > 8 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          + {speakersData.length - 8} more speakers. View full speaker profiles in your attendee dashboard after registration.
                        </p>
                      )}
                    </section>
                  );
                }
                return null;
              })()}


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
                    {(() => {
                      // Debug logging
                      console.log('Event capacity:', event.capacity);
                      console.log('Event availableSlots:', event.availableSlots);
                      console.log('Event registrationCount:', event.registrationCount);
                      
                      // Always show capacity if it exists (this is the total, not available)
                      const capacity = event.capacity;
                      const registered = event.registrationCount || 0;
                      const available = event.availableSlots;
                      
                      return (
                        <>
                          {capacity !== null && capacity !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Capacity:</span>
                              <span className="font-medium">{capacity} attendees</span>
                            </div>
                          )}
                          {registered !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Registered:</span>
                              <span className="font-medium">{registered}</span>
                            </div>
                          )}
                          {available !== null && available !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Available:</span>
                              <span className="font-medium text-primary">{available} spots</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
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
