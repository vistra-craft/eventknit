import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/hooks/useEvent";
import { useMetaTags } from "@/hooks/useMetaTags";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { EventHeroV2 } from "@/components/event-details/EventHeroV2";
import { EventSidebar } from "@/components/event-details/EventSidebar";
import { MobileActionBar } from "@/components/event-details/MobileActionBar";
import { EventDetailsSkeleton } from "@/components/event-details/EventDetailsSkeleton";
import { OrganizerInfo } from "@/components/event-details/OrganizerInfo";
import { EventTags } from "@/components/event-details/EventTags";
import { VenueSection } from "@/components/event-details/VenueSection";
import { RelatedEvents } from "@/components/event-details/RelatedEvents";
<<<<<<< Updated upstream
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Users, CheckCircle, Heart, Share2, Ticket, ArrowRight, AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card } from "@/components/ui/card";
=======
import { AgendaTimeline } from "@/components/event-details/AgendaTimeline";
import { SpeakersShowcase } from "@/components/event-details/SpeakersShowcase";
import { SponsorsShowcase } from "@/components/event-details/SponsorsShowcase";
import { ExhibitorsGrid } from "@/components/event-details/ExhibitorsGrid";
import { FAQsAccordion } from "@/components/event-details/FAQsAccordion";
import { Users, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────
>>>>>>> Stashed changes

const formatTimeForDisplay = (timeStr: string): string => {
  if (!timeStr) return "";
  if (/AM|PM/i.test(timeStr)) return timeStr;
  const m = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2];
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${min} ${period}`;
  }
  return timeStr;
};

/** Safely parse a JSON-encoded field that may arrive as a string or already parsed. */
function safeParse<T>(data: T | string | null | undefined): T | null {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  return data;
}

// ── component ────────────────────────────────────────────────

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { event, isLoading, error } = useEvent(id);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  // TODO: Check if user is already registered for this event
  const userAlreadyRegistered = false;

  // Registration status
  const isRegistrationClosed = (() => {
    if (!event) return false;
    const now = new Date();
    if (event.registrationDeadline && new Date(event.registrationDeadline) < now) return true;
    if (event.startDate && new Date(event.startDate) < now) return true;
    return false;
  })();

<<<<<<< Updated upstream
=======
  const isSoldOut =
    event?.availableSlots !== null &&
    event?.availableSlots !== undefined &&
    event.availableSlots <= 0;
>>>>>>> Stashed changes

  // Meta tags
  const getFrontendUrl = () => {
    const envUrl = import.meta.env.VITE_FRONTEND_URL;
    return envUrl ? envUrl.replace(/\/$/, "") : window.location.origin;
  };
  const frontendUrl = getFrontendUrl();
  const eventUrl = id ? `${frontendUrl}/event/${id}` : undefined;
  const eventImage = event?.image
    ? event.image.startsWith("http")
      ? event.image
      : `${frontendUrl}${event.image}`
    : undefined;
  const eventDescription = event?.description
    ? event.description.length > 160
      ? `${event.description.substring(0, 157)}...`
      : event.description
    : event?.title
      ? `Join us for ${event.title}${event.venue ? ` at ${event.venue}` : ""}${event.startDate ? ` on ${new Date(event.startDate).toLocaleDateString()}` : ""}`
      : undefined;

  useMetaTags({
    title: event?.title,
    description: eventDescription,
    image: eventImage,
    url: eventUrl,
    type: "website",
    siteName: "EventKnit",
  });

  const handleRegisterClick = () => {
    if (userAlreadyRegistered) {
<<<<<<< Updated upstream
      navigate('/my-tickets');
=======
      navigate("/my-tickets");
>>>>>>> Stashed changes
    } else {
      navigate(`/event/${id}/register`);
    }
  };

<<<<<<< Updated upstream
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


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-primary/5 via-background to-muted/10">
          <div className="text-center">
            <Loader size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
=======
  // ── loading state ──
  if (isLoading) return <EventDetailsSkeleton />;
>>>>>>> Stashed changes

  // ── error state ──
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

  // ── data parsing ──
  const agenda = safeParse(event.agenda);
  const hasAgenda = Array.isArray(agenda) && agenda.length > 0;

  const speakers = safeParse(event.speakers);
  const hasSpeakers = Array.isArray(speakers) && speakers.length > 0;

  const sponsors = safeParse(event.sponsors);
  const hasSponsors = Array.isArray(sponsors) && sponsors.length > 0;

  const exhibitors = safeParse(event.exhibitors);
  const hasExhibitors = Array.isArray(exhibitors) && exhibitors.length > 0;

  const faqs = safeParse(event.faqs);
  const hasFaqs = Array.isArray(faqs) && faqs.length > 0;

  const hasImportantInfo = !!(event.requirements?.length || event.ageRestriction);

  // About "Read More" logic
  const aboutContent = event.fullDescription || event.description || "";
  const plainAbout = aboutContent.replace(/<[^>]*>/g, "").trim();
  const shouldTruncateAbout = plainAbout.length > 500;

  const formattedDate =
    event.date || new Date(event.startDate).toLocaleDateString();
  const formattedTime =
    event.time ||
    (event.startTime
      ? formatTimeForDisplay(event.startTime)
      : "");

  // ── render ──
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
<<<<<<< Updated upstream
      
      <main className="flex-1 pb-8 bg-gradient-to-b from-primary/5 via-background to-muted/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24">
          <div className="space-y-6">
              <EventHero
                title={event.title}
                category={event.category}
                date={event.date || new Date(event.startDate).toLocaleDateString()}
                time={event.time || (event.startTime ? new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}
                venue={event.venue}
                location={event.location}
                image={event.image}
                isOnline={event.isOnline}
                onlineLink={event.onlineLink}
              />

              {/* Action bar: like/share left, register right */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                {/* Like + Share */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="h-9 w-9 rounded-full border border-border hover:bg-muted flex items-center justify-center transition-colors"
                    aria-label="Save event"
                  >
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="h-9 w-9 rounded-full border border-border hover:bg-muted flex items-center justify-center transition-colors"
                    aria-label="Share event"
                  >
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Register */}
                {isRegistrationClosed ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted border border-border text-sm font-medium text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Registration Closed
                  </div>
                ) : (
                  <Button onClick={handleRegisterClick} className="font-semibold">
                    <Ticket className="mr-2 h-4 w-4" />
                    {userAlreadyRegistered ? 'View My Ticket' : (event.isFree ? 'Register Free' : 'Register for Event')}
                  </Button>
                )}
              </div>

              {/* About Section */}
              <section>
                <h2 className="text-page-title mb-4">About This Event</h2>
                <RichTextContent
                  content={event.fullDescription || event.description || '<p>No description available.</p>'}
                  className="prose-lg text-muted-foreground leading-relaxed"
                />
              </section>

              {/* Event Agenda Summary */}
              <section>
                <h2 className="text-page-title mb-6">Event Schedule</h2>
                <Card className="border border-border bg-background rounded-2xl shadow-sm p-6">
                  <div className="space-y-3">
                    {(() => {
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
                  {shouldTruncateAbout && (
                    <div className="flex justify-center mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAboutExpanded(!aboutExpanded)}
                        className="text-primary hover:text-primary/80"
                      >
                        {aboutExpanded ? "Show Less" : "Read More"}
                      </Button>
                    </div>
                  )}
                </div>
              </AnimatedSection>

              {/* Agenda */}
              {hasAgenda && (
                <>
                  <SectionDivider />
                  <AnimatedSection>
                    <h2 className="text-2xl font-bold tracking-tight mb-1">Event Schedule</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Full detailed agenda for the event
                    </p>
                    <AgendaTimeline agenda={agenda!} eventStartDate={event.startDate} />
                  </AnimatedSection>
                </>
              )}

              {/* Speakers */}
              {hasSpeakers && (
                <>
                  <SectionDivider />
                  <AnimatedSection>
                    <h2 className="text-2xl font-bold tracking-tight mb-6">Featured Speakers</h2>
                    <SpeakersShowcase speakers={speakers!} />
                  </AnimatedSection>
                </>
              )}

              {/* Sponsors */}
              {hasSponsors && (
                <>
                  <SectionDivider />
                  <AnimatedSection>
                    <h2 className="text-2xl font-bold tracking-tight mb-6">Sponsors</h2>
                    <SponsorsShowcase sponsors={sponsors!} />
                  </AnimatedSection>
                </>
              )}

              {/* Exhibitors */}
              {hasExhibitors && (
                <>
                  <SectionDivider />
                  <AnimatedSection>
                    <h2 className="text-2xl font-bold tracking-tight mb-6">Exhibitors</h2>
                    <ExhibitorsGrid exhibitors={exhibitors!} />
                  </AnimatedSection>
                </>
              )}

              {/* FAQs */}
              {hasFaqs && (
                <>
                  <SectionDivider />
                  <AnimatedSection>
                    <h2 className="text-2xl font-bold tracking-tight mb-6">
                      Frequently Asked Questions
                    </h2>
                    <FAQsAccordion faqs={faqs!} />
                  </AnimatedSection>
                </>
              )}

              {/* Venue */}
              <SectionDivider />
              <AnimatedSection>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {event.isOnline ? "Event Access" : "Venue Information"}
                </h2>
                <VenueSection
                  venue={event.venue}
                  location={event.location}
                  coordinates={event.coordinates}
                  isOnline={event.isOnline}
                  onlineLink={event.onlineLink}
                />
              </AnimatedSection>

              {/* Important Information */}
              {(event.requirements?.length || event.ageRestriction) && (
                <section>
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
              <VenueSection
                venue={event.venue}
                location={event.location}
                coordinates={event.coordinates}
                isOnline={event.isOnline}
                onlineLink={event.onlineLink}
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
                  const safeSpeakers = speakersData as { name?: string; title?: string; image?: string }[];
                  return (
                    <section>
                      <h2 className="text-page-title mb-4">Featured Speakers</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {safeSpeakers.slice(0, 8).map((speaker, index: number) => (
                          <div key={index} className="p-4 flex flex-col items-center text-center rounded-lg border border-border bg-background shadow-sm transition-all">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 mb-3">
                              {speaker?.image ? (
                                <img src={speaker.image} alt={speaker.name || 'Speaker'} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                            <h4 className="text-card-title text-sm mb-1">{speaker?.name || 'Speaker'}</h4>
                            <p className="text-primary font-medium text-xs line-clamp-2">{speaker?.title || ''}</p>
                          </div>
                        ))}
                      </div>
                      {safeSpeakers.length > 8 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          + {safeSpeakers.length - 8} more speakers. View full speaker profiles in your attendee dashboard after registration.
                        </p>
                      )}
                    </section>
                  );
                }
                return null;
              })()}

              {/* Organizer Info */}
              <OrganizerInfo
                organizer={event.organizer}
                organizerName={event.organizerName}
                organizerDescription={event.organizerDescription}
                socialLinks={event.socialLinks}
              />

            </div>

<<<<<<< Updated upstream
          {/* Related Events - Full Width */}
          <section className="pt-6 border-t border-border/60 mt-6">
=======
            {/* ── Right column — sidebar (desktop) ── */}
            <div className="hidden lg:block" id="sidebar-cta">
              <EventSidebar
                event={event}
                isRegistrationClosed={isRegistrationClosed}
                userAlreadyRegistered={userAlreadyRegistered}
                onRegisterClick={handleRegisterClick}
              />
            </div>
          </div>
        </div>

        {/* ── Related Events (full width band) ── */}
        <div className="bg-muted/30 py-12 mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
>>>>>>> Stashed changes
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-page-title">You May Also Like</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    const el = document.querySelector('[data-section="events"]');
                    el?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
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
          </div>
        </div>
      </main>
<<<<<<< Updated upstream
=======

      {/* ── Mobile action bar ── */}
      <MobileActionBar
        event={event}
        isRegistrationClosed={isRegistrationClosed}
        isSoldOut={isSoldOut}
        userAlreadyRegistered={userAlreadyRegistered}
        onRegisterClick={handleRegisterClick}
      />

>>>>>>> Stashed changes
      <Footer />
    </div>
  );
};

/** Centered short divider between sections */
function SectionDivider() {
  return (
    <div className="py-10">
      <div className="max-w-xs mx-auto border-t border-border/20" />
    </div>
  );
}

export default EventDetails;
