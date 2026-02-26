import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/hooks/useEvent";
import { useMetaTags } from "@/hooks/useMetaTags";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventHero } from "@/components/event-details/EventHero";
import { EventSidebar } from "@/components/event-details/EventSidebar";
import { MobileActionBar } from "@/components/event-details/MobileActionBar";
import { VenueSection } from "@/components/event-details/VenueSection";
import { OrganizerInfo } from "@/components/event-details/OrganizerInfo";
import { EventTags } from "@/components/event-details/EventTags";
import { RelatedEvents } from "@/components/event-details/RelatedEvents";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Users, CheckCircle, Calendar, MapPin, Globe, Video, ArrowRight, Building2, AlertCircle } from "lucide-react";
import { FAQsAccordion } from "@/components/event-details/FAQsAccordion";
import { RefundPolicy } from "@/components/event-details/RefundPolicy";
import ResaleListings from "@/components/event-details/ResaleListings";
import { ReportEventSection } from "@/components/event-details/ReportEventSection";
import { AgendaTimeline } from "@/components/event-details/AgendaTimeline";
import { SpeakersShowcase } from "@/components/event-details/SpeakersShowcase";
import { SponsorsShowcase } from "@/components/event-details/SponsorsShowcase";
import { ExhibitorsGrid } from "@/components/event-details/ExhibitorsGrid";
import { Loader } from "@/components/ui/loader";
import { getRegistrationStatus } from "@/lib/user-dashboard-api";
import { getVenueType } from "@/types/event";

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


const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { event, isLoading, error } = useEvent(id);

  const [userAlreadyRegistered, setUserAlreadyRegistered] = useState(false);
  const [existingRegistrationId, setExistingRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;

    getRegistrationStatus(id).then((response) => {
      if (response?.data?.isRegistered) {
        setUserAlreadyRegistered(true);
        setExistingRegistrationId(response.data.registrationId);
      }
    }).catch(() => {
      // Silently fail — non-critical check
    });
  }, [user, id]);

  const isRegistrationClosed = (() => {
    if (!event) return false;
    const now = new Date();
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (deadline < now) return true;
    }
    if (event.startDate) {
      const eventStart = new Date(event.startDate);
      if (eventStart < now) return true;
    }
    return false;
  })();

  // Check if event is sold out by checking ticket types first, then overall capacity
  const ticketAvailability = (() => {
    if (!event) return { isSoldOut: false, availableTicketCount: 0, totalTicketTypes: 0 };
    
    // If event has specific ticket types, check each one
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const totalTypes = event.ticketTypes.length;
      const soldOutCount = event.ticketTypes.filter(t => t.isSoldOut === true).length;
      const availableCount = totalTypes - soldOutCount;
      
      return {
        isSoldOut: soldOutCount === totalTypes, // All tickets sold out
        availableTicketCount: availableCount,
        totalTicketTypes: totalTypes,
        hasPartialAvailability: availableCount > 0 && soldOutCount > 0,
      };
    }
    
    // Fall back to checking overall capacity if no ticket types
    const capacitySoldOut = event.availableSlots !== null && event.availableSlots !== undefined && event.availableSlots <= 0;
    return {
      isSoldOut: capacitySoldOut,
      availableTicketCount: capacitySoldOut ? 0 : 1,
      totalTicketTypes: 1,
    };
  })();

  const isSoldOut = ticketAvailability.isSoldOut;

  // Meta tags
  const getFrontendUrl = () => {
    const envUrl = import.meta.env.VITE_FRONTEND_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');
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
    if (userAlreadyRegistered && existingRegistrationId) {
      navigate(`/user/tickets/${existingRegistrationId}`);
    } else {
      navigate(`/event/${id}/register`);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: event?.title, url }); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleSave = () => {
    // placeholder — wire to backend favourites when ready
  };

  // Derived display values
  const displayDate = event?.date || (event?.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '');
  const displayTime = event?.time || (event?.startTime ? formatTimeForDisplay(event.startTime) : '');
  const venueType = event ? getVenueType({ isOnline: event.isOnline, venue: event.venue, onlineLink: event.onlineLink }) : 'physical';

  const locationLabel = venueType === 'online'
    ? 'Online Event — link available after registration'
    : venueType === 'hybrid'
      ? `${event?.venue ? `${event.venue}, ${event?.location}` : event?.location} (also online)`
      : `${event?.venue ? `${event.venue}, ` : ''}${event?.location || ''}`;

  const LocationIcon = venueType === 'online' ? Globe : venueType === 'hybrid' ? Video : MapPin;

  // Lowest price for mobile price display
  const lowestPrice = event?.ticketTypes && event.ticketTypes.length > 0
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : event?.price ?? 0;


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader size="lg" className="mx-auto mb-4" />
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
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md px-4">
            <h2 className="text-page-title mb-4">Event not found</h2>
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

      <main className="flex-1 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">

          {/* Hero Image */}
          <EventHero
            title={event.title}
            image={event.image}
            onSave={handleSave}
            onShare={handleShare}
          />

          {/* Sold Out / Limited Availability Alert Banner */}
          {isSoldOut ? (
            <div className="mt-6 mb-4">
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-1">
                      This Event is Sold Out
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-200 leading-relaxed">
                      All tickets for this event have been claimed. Registration is no longer available.
                      {ticketAvailability.totalTicketTypes > 1 && ` All ${ticketAvailability.totalTicketTypes} ticket types are currently unavailable.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : ticketAvailability.hasPartialAvailability && (
            <div className="mt-6 mb-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
                      Limited Availability
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-200 leading-relaxed">
                      Some ticket types are sold out. Only {ticketAvailability.availableTicketCount} of {ticketAvailability.totalTicketTypes} ticket {ticketAvailability.availableTicketCount === 1 ? 'type is' : 'types are'} still available. Register soon to secure your spot.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-6">

            {/* ── LEFT COLUMN: content ── */}
            <div className="min-w-0">

              {/* Event Header */}
              <div className="space-y-3 pb-8 border-b border-border/40">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{event.title}</h1>

                {/* Organizer row */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">
                    By <span className="font-medium">{event.organizerName || event.organizer?.organizationName || event.organizer?.firstName || 'Organizer'}</span>
                  </p>
                </div>

                {/* Date + Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{displayDate}{displayTime ? ` at ${displayTime}` : ''}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LocationIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{locationLabel}</span>
                </div>

                {/* Mobile-only price display */}
                <div className="lg:hidden pt-1">
                  {event.isFree ? (
                    <span className="text-lg font-bold text-primary">Free</span>
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      {event.currency || '$'}{lowestPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* About Section */}
              <section className="pt-8 pb-8 border-b border-border/40">
                <h2 className="text-page-title mb-4">About This Event</h2>
                <RichTextContent
                  content={event.fullDescription || event.description || '<p>No description available.</p>'}
                  className="prose-lg text-muted-foreground leading-relaxed"
                />
              </section>

              {/* Event Schedule */}
              {(() => {
                let agendaData = event.agenda;
                if (typeof agendaData === 'string') {
                  try { agendaData = JSON.parse(agendaData); } catch { agendaData = null; }
                }
                if (!agendaData || !Array.isArray(agendaData) || agendaData.length === 0) return null;
                return (
                  <section className="pt-8 pb-8 border-b border-border/40">
                    <h2 className="text-page-title mb-6">Event Schedule</h2>
                    <AgendaTimeline
                      agenda={agendaData}
                      eventStartDate={event.startDate || event.date || ''}
                    />
                  </section>
                );
              })()}

              {/* Important Information */}
              {(event.requirements?.length || event.ageRestriction) && (
                <section className="pt-8 pb-8 border-b border-border/40">
                  <h3 className="text-section-header mb-4">Important Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {event.ageRestriction && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-card-title mb-1">Age Restriction</h4>
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
                          <h4 className="text-card-title mb-1">Requirement</h4>
                          <p className="text-sm text-muted-foreground">{req}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Venue Information */}
              <section className="pt-8 pb-8 border-b border-border/40">
                <VenueSection
                  venue={event.venue}
                  location={event.location}
                  coordinates={event.coordinates}
                  isOnline={event.isOnline}
                  onlineLink={event.onlineLink}
                />
              </section>

              {/* Tags */}
              <section className="pt-8 pb-8 border-b border-border/40">
                <EventTags
                  tags={Array.isArray(event.tags) ? event.tags : (event.tags ? [event.tags] : [])}
                  category={event.category}
                />
              </section>

              {/* Featured Speakers */}
              {(() => {
                let speakersData = event.speakers;
                if (typeof speakersData === 'string') {
                  try { speakersData = JSON.parse(speakersData); } catch { speakersData = null; }
                }
                if (!speakersData || !Array.isArray(speakersData) || speakersData.length === 0) return null;
                return (
                  <section className="pt-8 pb-8 border-b border-border/40">
                    <h2 className="text-page-title mb-6">Featured Speakers</h2>
                    <SpeakersShowcase speakers={speakersData} />
                  </section>
                );
              })()}

              {/* Sponsors */}
              {(() => {
                let sponsorsData = event.sponsors;
                if (typeof sponsorsData === 'string') {
                  try { sponsorsData = JSON.parse(sponsorsData); } catch { sponsorsData = null; }
                }
                if (!sponsorsData || !Array.isArray(sponsorsData) || sponsorsData.length === 0) return null;
                return (
                  <section className="pt-8 pb-8 border-b border-border/40">
                    <h2 className="text-page-title mb-6">Sponsors</h2>
                    <SponsorsShowcase sponsors={sponsorsData} />
                  </section>
                );
              })()}

              {/* Exhibitors */}
              {(() => {
                let exhibitorsData = event.exhibitors;
                if (typeof exhibitorsData === 'string') {
                  try { exhibitorsData = JSON.parse(exhibitorsData); } catch { exhibitorsData = null; }
                }
                if (!exhibitorsData || !Array.isArray(exhibitorsData) || exhibitorsData.length === 0) return null;
                return (
                  <section className="pt-8 pb-8 border-b border-border/40">
                    <h2 className="text-page-title mb-6">Exhibitors</h2>
                    <ExhibitorsGrid exhibitors={exhibitorsData} />
                  </section>
                );
              })()}

              {/* FAQs */}
              {(() => {
                let faqsData = event.faqs;
                if (typeof faqsData === 'string') {
                  try { faqsData = JSON.parse(faqsData); } catch { faqsData = null; }
                }
                const hasFaqs = faqsData && Array.isArray(faqsData) && faqsData.length > 0;
                if (!hasFaqs) return null;
                const safeFaqs = faqsData as { question: string; answer: string }[];
                return (
                  <section className="pt-8 pb-8 border-b border-border/40">
                    <h2 className="text-page-title mb-4">Frequently Asked Questions</h2>
                    <FAQsAccordion faqs={safeFaqs} />
                  </section>
                );
              })()}

              {/* Refund Policy */}
              {event.refundPolicy && (
                <section className="pt-8 pb-8 border-b border-border/40">
                  <RefundPolicy
                    refundPolicy={event.refundPolicy}
                    refundDeadlineDays={event.refundDeadlineDays}
                    refundPolicyText={event.refundPolicyText}
                  />
                </section>
              )}

              {/* Organizer Info */}
              <section className="pt-8 pb-8 border-b border-border/40">
                <OrganizerInfo
                  organizer={event.organizer}
                  organizerName={event.organizerName}
                  organizerDescription={event.organizerDescription}
                  socialLinks={event.socialLinks}
                />
              </section>

              {/* Resale Listings */}
              <ResaleListings eventId={event.id} />

              {/* Report Event */}
              <ReportEventSection eventId={event.id} />

            </div>

            {/* ── RIGHT COLUMN: sticky sidebar (desktop only) ── */}
            <div className="hidden lg:block">
              <EventSidebar
                event={event}
                isRegistrationClosed={isRegistrationClosed}
                userAlreadyRegistered={userAlreadyRegistered}
                onRegisterClick={handleRegisterClick}
              />
            </div>
          </div>

          {/* Related Events — full width below grid */}
          <section className="pt-8 border-t border-border/40 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-page-title">You May Also Like</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    const eventsSection = document.querySelector('[data-section="events"]');
                    if (eventsSection) {
                      eventsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

      {/* Mobile action bar */}
      <MobileActionBar
        event={event}
        isRegistrationClosed={isRegistrationClosed}
        isSoldOut={isSoldOut}
        userAlreadyRegistered={userAlreadyRegistered}
        onRegisterClick={handleRegisterClick}
      />

      <Footer />
    </div>
  );
};

export default EventDetails;
