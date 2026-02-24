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
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Users, CheckCircle, Heart, Share2, Ticket, ArrowRight, AlertCircle, Building2, Award } from "lucide-react";
import { FAQsAccordion } from "@/components/event-details/FAQsAccordion";
import { RefundPolicy } from "@/components/event-details/RefundPolicy";
import { Loader } from "@/components/ui/loader";
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
const generateAgendaSummary = (agenda: { title?: string; startTime?: string }[] | null | undefined) => {
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

  // Check if registration is open
  const isRegistrationClosed = (() => {
    if (!event) return false;
    const now = new Date();

    // Check if registration deadline has passed
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (deadline < now) return true;
    }

    // Check if event has already started
    if (event.startDate) {
      const eventStart = new Date(event.startDate);
      if (eventStart < now) return true;
    }

    return false;
  })();


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
      navigate('/user/tickets');
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

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-primary/5 via-background to-muted/10">
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

              {/* Event Agenda Summary - only show when agenda is configured */}
              {(() => {
                let agendaData = event.agenda;
                if (typeof agendaData === 'string') {
                  try { agendaData = JSON.parse(agendaData); } catch { agendaData = null; }
                }
                const hasAgenda = agendaData && Array.isArray(agendaData) && agendaData.length > 0;
                if (!hasAgenda) return null;

                const summary = generateAgendaSummary(agendaData);
                return (
                  <section>
                    <h2 className="text-page-title mb-6">Event Schedule</h2>
                    <Card className="border border-border bg-background rounded-2xl shadow-sm p-6">
                      <div className="space-y-3">
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {summary && summary.trim() !== ''
                            ? summary
                            : 'Full schedule with multiple sessions and activities throughout the event.'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                          <strong>Full agenda with detailed session descriptions, speaker information, and session locations available in your attendee dashboard after registration.</strong>
                        </p>
                      </div>
                    </Card>
                    <p className="text-sm text-center text-muted-foreground mt-2 italic">
                      * Full detailed agenda available after registration
                    </p>
                  </section>
                );
              })()}

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

              {/* Featured Speakers */}
              {(() => {
                let speakersData = event.speakers;
                if (typeof speakersData === 'string') {
                  try { speakersData = JSON.parse(speakersData); } catch { speakersData = null; }
                }
                const hasSpeakers = speakersData && Array.isArray(speakersData) && speakersData.length > 0;
                if (!hasSpeakers) return null;
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
                        + {safeSpeakers.length - 8} more speakers. Full profiles available after registration.
                      </p>
                    )}
                  </section>
                );
              })()}

              {/* Sponsors */}
              {(() => {
                let sponsorsData = event.sponsors;
                if (typeof sponsorsData === 'string') {
                  try { sponsorsData = JSON.parse(sponsorsData); } catch { sponsorsData = null; }
                }
                const hasSponsors = sponsorsData && Array.isArray(sponsorsData) && sponsorsData.length > 0;
                if (!hasSponsors) return null;
                const safeSponsors = sponsorsData as { name?: string; level?: string; logo?: string; website?: string }[];

                // Group by level
                const tierOrder = ['title', 'presenting', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'partner', 'media', 'technology', 'community', 'associate'];
                const tierLabels: Record<string, string> = {
                  title: 'Title Sponsor', presenting: 'Presenting', diamond: 'Diamond', platinum: 'Platinum',
                  gold: 'Gold', silver: 'Silver', bronze: 'Bronze', partner: 'Partner',
                  media: 'Media Partner', technology: 'Technology Partner', community: 'Community', associate: 'Associate',
                };
                const grouped: Record<string, typeof safeSponsors> = {};
                safeSponsors.forEach(s => {
                  const tier = (s.level || 'associate').toLowerCase();
                  if (!grouped[tier]) grouped[tier] = [];
                  grouped[tier].push(s);
                });
                const orderedTiers = tierOrder.filter(t => grouped[t]?.length > 0);

                return (
                  <section>
                    <h2 className="text-page-title mb-4">Sponsors</h2>
                    <div className="space-y-6">
                      {orderedTiers.map(tier => (
                        <div key={tier}>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" />
                            {tierLabels[tier] || tier}
                          </p>
                          <div className="flex flex-wrap gap-4">
                            {grouped[tier].map((sponsor, i) => (
                              <a
                                key={i}
                                href={sponsor.website ? (sponsor.website.startsWith('http') ? sponsor.website : `https://${sponsor.website}`) : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:shadow-md transition-all"
                              >
                                {sponsor.logo ? (
                                  <img src={sponsor.logo} alt={sponsor.name || 'Sponsor'} className="w-10 h-10 rounded-lg object-contain" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-primary" />
                                  </div>
                                )}
                                <span className="text-sm font-medium text-foreground">{sponsor.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {/* Exhibitors */}
              {(() => {
                let exhibitorsData = event.exhibitors;
                if (typeof exhibitorsData === 'string') {
                  try { exhibitorsData = JSON.parse(exhibitorsData); } catch { exhibitorsData = null; }
                }
                const hasExhibitors = exhibitorsData && Array.isArray(exhibitorsData) && exhibitorsData.length > 0;
                if (!hasExhibitors) return null;
                const safeExhibitors = exhibitorsData as { name?: string; logo?: string; category?: string; booth?: string }[];
                return (
                  <section>
                    <h2 className="text-page-title mb-4">Exhibitors</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {safeExhibitors.slice(0, 12).map((exhibitor, index: number) => (
                        <div key={index} className="p-3 flex flex-col items-center text-center rounded-lg border border-border bg-background shadow-sm">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 mb-2">
                            {exhibitor?.logo ? (
                              <img src={exhibitor.logo} alt={exhibitor.name || 'Exhibitor'} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Building2 className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <h4 className="text-card-title text-xs mb-0.5 line-clamp-1">{exhibitor?.name || 'Exhibitor'}</h4>
                          {exhibitor?.category && (
                            <p className="text-[10px] text-muted-foreground">{exhibitor.category}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {safeExhibitors.length > 12 && (
                      <p className="text-sm text-muted-foreground mt-3 text-center">
                        + {safeExhibitors.length - 12} more exhibitors. Full details available after registration.
                      </p>
                    )}
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
                  <section>
                    <h2 className="text-page-title mb-4">Frequently Asked Questions</h2>
                    <Card className="border border-border bg-background rounded-2xl shadow-sm p-6">
                      <FAQsAccordion faqs={safeFaqs} />
                    </Card>
                  </section>
                );
              })()}

              {/* Refund Policy */}
              {event.refundPolicy && (
                <section>
                  <RefundPolicy
                    refundPolicy={event.refundPolicy}
                    refundDeadlineDays={event.refundDeadlineDays}
                    refundPolicyText={event.refundPolicyText}
                  />
                </section>
              )}

              {/* Organizer Info */}
              <OrganizerInfo
                organizer={event.organizer}
                organizerName={event.organizerName}
                organizerDescription={event.organizerDescription}
                socialLinks={event.socialLinks}
              />

            </div>

          {/* Related Events - Full Width */}
          <section className="pt-6 border-t border-border/60 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-page-title">You May Also Like</h2>
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
      <Footer />
    </div>
  );
};

export default EventDetails;

                 