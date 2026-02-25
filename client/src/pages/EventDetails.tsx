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
import { Users, CheckCircle, Calendar, MapPin, Globe, Video, ArrowRight, Building2, Award } from "lucide-react";
import { FAQsAccordion } from "@/components/event-details/FAQsAccordion";
import { RefundPolicy } from "@/components/event-details/RefundPolicy";
import ResaleListings from "@/components/event-details/ResaleListings";
import { ReportEventSection } from "@/components/event-details/ReportEventSection";
import { Loader } from "@/components/ui/loader";
import { Card } from "@/components/ui/card";
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

// Helper function to generate agenda summary
const generateAgendaSummary = (agenda: { title?: string; startTime?: string }[] | null | undefined) => {
  if (!agenda || agenda.length === 0) return null;

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

  const summaryParts: string[] = [];

  sessionGroups.forEach((group, type) => {
    if (group.times.length === 0) {
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
      const sortedTimes = group.times.sort((a, b) => {
        const parseTime = (time: string): number => {
          const ampmMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (ampmMatch) {
            let hours = parseInt(ampmMatch[1], 10);
            const minutes = parseInt(ampmMatch[2], 10);
            const period = ampmMatch[3].toUpperCase();
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
          }
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

  const isSoldOut = event?.availableSlots !== null && event?.availableSlots !== undefined && event?.availableSlots <= 0;

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

              {/* Event Agenda Summary */}
              {(() => {
                let agendaData = event.agenda;
                if (typeof agendaData === 'string') {
                  try { agendaData = JSON.parse(agendaData); } catch { agendaData = null; }
                }
                const hasAgenda = agendaData && Array.isArray(agendaData) && agendaData.length > 0;
                if (!hasAgenda) return null;

                const summary = generateAgendaSummary(agendaData);
                return (
                  <section className="pt-8 pb-8 border-b border-border/40">
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
                const hasSpeakers = speakersData && Array.isArray(speakersData) && speakersData.length > 0;
                if (!hasSpeakers) return null;
                const safeSpeakers = speakersData as { name?: string; title?: string; image?: string }[];
                return (
                  <section className="pt-8 pb-8 border-b border-border/40">
                    <h2 className="text-page-title mb-4">Featured Speakers</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {safeSpeakers.slice(0, 6).map((speaker, index: number) => (
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
                    {safeSpeakers.length > 6 && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        + {safeSpeakers.length - 6} more speakers. Full profiles available after registration.
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
                  <section className="pt-8 pb-8 border-b border-border/40">
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
                  <section className="pt-8 pb-8 border-b border-border/40">
                    <h2 className="text-page-title mb-4">Exhibitors</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {safeExhibitors.slice(0, 9).map((exhibitor, index: number) => (
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
                    {safeExhibitors.length > 9 && (
                      <p className="text-sm text-muted-foreground mt-3 text-center">
                        + {safeExhibitors.length - 9} more exhibitors. Full details available after registration.
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
