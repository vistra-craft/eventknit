import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/hooks/useEvent";
import { useMetaTags } from "@/hooks/useMetaTags";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventHero } from "@/components/event-details/EventHero";
import { TicketSelector } from "@/components/event-details/TicketSelector";
import { EventInfo } from "@/components/event-details/EventInfo";
import { VenueSection } from "@/components/event-details/VenueSection";
import { OrganizerInfo } from "@/components/event-details/OrganizerInfo";
import { RefundPolicy } from "@/components/event-details/RefundPolicy";
import { EventTags } from "@/components/event-details/EventTags";
import { RelatedEvents } from "@/components/event-details/RelatedEvents";
import { Loader2 } from "lucide-react";

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
        <EventHero 
          title={event.title}
          category={event.category}
          date={event.date || new Date(event.startDate).toLocaleDateString()}
          time={event.time || (event.startTime ? new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}
          venue={event.venue}
          location={event.location}
          image={event.image}
        />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10 mt-6">
          <section>
            <TicketSelector 
              ticketTypes={event.ticketTypes}
              onRegister={handleRegister}
              currency={event.currency || '$'}
            />
          </section>

          <section className="space-y-10">
            <EventInfo 
              description={event.description}
              fullDescription={event.fullDescription}
              requirements={event.requirements}
              ageRestriction={event.ageRestriction}
              speakers={event.speakers}
            />
            
            <VenueSection 
              venue={event.venue}
              location={event.location}
              coordinates={event.coordinates}
            />
            
            <OrganizerInfo 
              organizer={event.organizer}
              organizerName={event.organizerName}
            />

            <RefundPolicy />
            
            <EventTags tags={event.tags} />
          </section>

          <section className="pt-4 border-t border-border/60">
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
