import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/hooks/useEvent";
import { useMetaTags } from "@/hooks/useMetaTags";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventHero } from "@/components/event-details/EventHero";
import { TicketSelector } from "@/components/event-details/TicketSelector";
import { VenueSection } from "@/components/event-details/VenueSection";
import { OrganizerInfo } from "@/components/event-details/OrganizerInfo";
import { EventTags } from "@/components/event-details/EventTags";
import { RelatedEvents } from "@/components/event-details/RelatedEvents";
import { Loader2, Users, CheckCircle } from "lucide-react";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Fetch event data
  const { event, isLoading, error } = useEvent(id);
  
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

  const handleRegister = (quantities: Record<string, number>) => {
    // Find the first selected ticket to pass to register page
    const selectedTypes = Object.entries(quantities).filter((entry) => entry[1] > 0);
    
    if (selectedTypes.length > 0) {
        navigate(`/event/${id}/register`, { 
            state: { 
                selectedTickets: quantities,
                preSelectedType: selectedTypes[0][0],
                preSelectedQuantity: selectedTypes[0][1]
            } 
        });
    } else {
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
              />

              {/* About Section */}
              <section>
                <h2 className="text-3xl font-bold mb-4">About This Event</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="leading-relaxed whitespace-pre-line">
                    {event.fullDescription || event.description}
                  </p>
                </div>
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
              
              <EventTags tags={event.tags} />

              {/* Speakers (if any) */}
              {event.speakers && event.speakers.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold mb-4">Featured Speakers</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.speakers.map((speaker, index) => (
                      <div key={index} className="p-4 flex items-start gap-4 rounded-lg hover:bg-muted/30 transition-colors">
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
            </div>

            {/* Right Column - Tickets */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20 lg:self-start">
              {/* Get Tickets */}
              <section>
                <TicketSelector 
                  ticketTypes={event.ticketTypes}
                  onRegister={handleRegister}
                  currency={event.currency || '$'}
                />
              </section>
            </div>
          </div>

          {/* Related Events - Full Width */}
          <section className="pt-6 border-t border-border/60 mt-6">
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
