import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { stripHtml } from '@/lib/utils';
import {
  Calendar,
  ShieldCheck,
  Briefcase,
  Award,
  Mic2,
  ClipboardList,
  Eye,
  EyeOff,
  Link2,
  ChevronDown,
  MapPin,
  Users,
} from 'lucide-react';
import type {
  StepComponentProps,
  TicketType,
  AgendaItem,
  SpeakerItem,
  ExhibitorItem,
  SponsorItem,
  RegistrationField,
} from './types';
import { CURRENCIES, SESSION_TYPES, getTimezoneLabel } from './types';

interface ReviewStepProps extends StepComponentProps {
  ticketTypes: TicketType[];
  eventType: string;
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  tags: string[];
  requirements: string[];
  faqs: { question: string; answer: string }[];
  agenda: AgendaItem[];
  speakers: SpeakerItem[];
  exhibitors: ExhibitorItem[];
  sponsors: SponsorItem[];
  registrationFields: RegistrationField[];
  socialLinks: Record<string, string>;
  timezone: string;
  imagePreview: string | null;
}

const SPONSOR_LEVEL_COLORS: Record<string, string> = {
  platinum: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  gold: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  silver: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  bronze: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  title: 'bg-primary/10 text-primary',
  presenting: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  partner: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
};

/** Expandable agenda item for the review step */
function AgendaReviewItem({
  item,
  formatTime,
  speakerNames,
}: {
  item: AgendaItem;
  formatTime: (t: string) => string;
  speakerNames: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!(item.description || item.room || speakerNames.length > 0);
  const typeLabel = item.sessionType && item.sessionType !== 'other'
    ? SESSION_TYPES.find(t => t.value === item.sessionType)?.label
    : null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
      {/* Main row: time + title + badge */}
      <div className="flex items-start gap-2">
        {item.startTime && (
          <span className="text-xs text-muted-foreground tabular-nums w-14 shrink-0 pt-0.5">
            {formatTime(item.startTime)}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{item.title || 'Untitled session'}</span>
            {typeLabel && (
              <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel}</Badge>
            )}
          </div>
          {/* Time range */}
          {item.startTime && item.endTime && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(item.startTime)} – {formatTime(item.endTime)}
            </p>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {hasDetails && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? 'See less' : 'Show more'}
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5 pl-0 sm:pl-16">
              {item.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{stripHtml(item.description)}</p>
              )}
              {speakerNames.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3 shrink-0" />
                  <span>{speakerNames.join(', ')}</span>
                </div>
              )}
              {item.room && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{item.room}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Agenda section with show all / collapse for the review step */
function AgendaReviewSection({
  agenda,
  formatTime,
  speakers,
}: {
  agenda: AgendaItem[];
  formatTime: (t: string) => string;
  speakers: SpeakerItem[];
}) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 4;
  const visibleItems = showAll ? agenda : agenda.slice(0, INITIAL_COUNT);
  const hiddenCount = agenda.length - INITIAL_COUNT;

  // Build a lookup from speaker ID → name
  const speakerMap = new Map(speakers.filter(s => s.id).map(s => [s.id!, s.name]));

  return (
    <div className="md:col-span-2">
      <div className="flex items-center gap-2 mb-2.5">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {agenda.length} Session{agenda.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {visibleItems.map((item, i) => {
          // Resolve speaker names from IDs or legacy speakers array
          const names: string[] = [];
          if (item.speakerIds?.length) {
            for (const id of item.speakerIds) {
              const name = speakerMap.get(id);
              if (name) names.push(name);
            }
          } else if (item.speakers?.length) {
            names.push(...item.speakers);
          }

          return (
            <AgendaReviewItem
              key={item.id || i}
              item={item}
              formatTime={formatTime}
              speakerNames={names}
            />
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {showAll ? 'Show less' : `Show all ${agenda.length} sessions`}
          <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}

export function ReviewStep({
  eventData,
  ticketTypes,
  eventType,
  isPrivate,
  setIsPrivate,
  tags,
  requirements,
  faqs,
  agenda,
  speakers,
  exhibitors,
  sponsors,
  registrationFields,
  socialLinks,
  timezone,
  imagePreview,
}: ReviewStepProps) {
  const coverImage = imagePreview || eventData.image;
  const currency = eventData.currency || 'KES';
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const capacityNum = parseInt(eventData.capacity || '0', 10);
  const hasCapacity = !isNaN(capacityNum) && capacityNum > 0;

  const activeSocials = Object.entries(socialLinks).filter(([, v]) => v.trim());
  const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
  const hasProgram = agenda.length > 0 || speakers.length > 0 || exhibitors.length > 0 || sponsors.length > 0;
  const customRegFields = registrationFields.slice(3);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const d = new Date();
      d.setHours(parseInt(h), parseInt(m));
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Accent bar ── */}
      <div className={`h-1 rounded-full ${
        eventType === 'online' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
        eventType === 'hybrid' ? 'bg-gradient-to-r from-violet-500 to-blue-500' :
        'bg-gradient-to-r from-primary to-amber-500'
      }`} />

      {/* ── Cover + Identity ── */}
      {coverImage ? (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={coverImage}
            alt=""
            className="w-full h-48 sm:h-56 object-cover"
            style={{ objectPosition: `${eventData.imageFocalX}% ${eventData.imageFocalY}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {eventData.category && (
                <Badge className="bg-white/20 text-white border-0 text-[11px] backdrop-blur-sm">
                  {eventData.category}
                </Badge>
              )}
              <Badge className="bg-white/20 text-white border-0 text-[11px] capitalize backdrop-blur-sm">
                {eventType.replace('-', ' ')}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {eventData.title || 'Untitled Event'}
            </h2>
            {eventData.organizer && (
              <p className="text-sm text-white/80 mt-1">by {eventData.organizer}</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {eventData.category && (
              <Badge variant="outline" className="text-[11px]">{eventData.category}</Badge>
            )}
            <Badge variant="outline" className="text-[11px] capitalize">{eventType.replace('-', ' ')}</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold leading-tight">
            {eventData.title || 'Untitled Event'}
          </h2>
          {eventData.organizer && (
            <p className="text-sm text-muted-foreground mt-1">by {eventData.organizer}</p>
          )}
        </div>
      )}

      {/* ── Key Facts ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Date</p>
          <p className="text-sm font-medium">{formatDate(eventData.date) || '—'}</p>
          {eventData.endDate && eventData.endDate !== eventData.date && (
            <p className="text-xs text-muted-foreground">to {formatDate(eventData.endDate)}</p>
          )}
        </div>

        {(eventData.time || eventData.endTime) && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Time</p>
            <p className="text-sm font-medium">
              {formatTime(eventData.time)}
              {eventData.endTime && ` – ${formatTime(eventData.endTime)}`}
            </p>
          </div>
        )}

        {(eventType === 'in-person' || eventType === 'hybrid') && (eventData.venue || eventData.location) && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Venue</p>
            <p className="text-sm font-medium">{eventData.venue}</p>
            {eventData.location && <p className="text-xs text-muted-foreground">{eventData.location}</p>}
            {eventData.address && <p className="text-xs text-muted-foreground">{eventData.address}</p>}
          </div>
        )}

        {(eventType === 'online' || eventType === 'hybrid') && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Online</p>
            <p className="text-sm font-medium">{eventData.onlineLink ? 'Link provided' : 'Link pending'}</p>
          </div>
        )}

        {hasCapacity && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Capacity</p>
            <p className="text-sm font-medium tabular-nums">{capacityNum.toLocaleString()} spots</p>
          </div>
        )}

        {timezone && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Timezone</p>
            <p className="text-sm font-medium">{getTimezoneLabel(timezone)}</p>
          </div>
        )}

        {eventData.registrationDeadline && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Registration Closes</p>
            <p className="text-sm font-medium">{formatDate(eventData.registrationDeadline)}</p>
            {eventData.registrationDeadlineTime && eventData.registrationDeadlineTime !== '23:59' && (
              <p className="text-xs text-muted-foreground">at {formatTime(eventData.registrationDeadlineTime)}</p>
            )}
          </div>
        )}

        {eventData.ageRestriction && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Age Restriction</p>
            <p className="text-sm font-medium">{eventData.ageRestriction}</p>
          </div>
        )}

        {eventData.duration && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Duration</p>
            <p className="text-sm font-medium">{eventData.duration}</p>
          </div>
        )}
      </div>

      {/* ── Banner Image ── */}
      {eventData.bannerImage && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Banner Image</p>
          <img
            src={eventData.bannerImage}
            alt="Event banner"
            className="w-full h-24 object-cover rounded-lg"
          />
        </div>
      )}

      {/* ── Description ── */}
      {eventData.description && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Description</p>
          <div className="text-sm text-foreground/90 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            <RichTextContent content={eventData.description} className="text-sm" />
          </div>
        </div>
      )}

      {/* ── Tickets ── */}
      <div className="border-t border-border pt-6">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          Tickets · {ticketTypes.length}
        </p>
        <div className="space-y-2">
          {ticketTypes.map((ticket, i) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg bg-muted/40"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {ticket.name || `Ticket ${i + 1}`}
                  </span>
                  {ticket.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">{stripHtml(ticket.description)}</span>
                  )}
                  {ticket.features && ticket.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ticket.features.map((f, fi) => (
                        <span key={fi} className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
                {ticket.isComplementary && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 shrink-0">
                    Comp
                  </span>
                )}
                {ticket.isHidden && (
                  <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0 tabular-nums text-sm">
                {ticket.quantity && (
                  <span className="text-muted-foreground">
                    ×{parseInt(ticket.quantity, 10).toLocaleString()}
                  </span>
                )}
                <span className="font-medium min-w-[4rem] text-right">
                  {ticket.type === 'free' || ticket.isComplementary
                    ? 'Free'
                    : `${currencySymbol} ${parseFloat(ticket.price || '0').toLocaleString()}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Program & People ── */}
      {hasProgram && (
        <div className="border-t border-border pt-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4">Program</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agenda.length > 0 && (
              <AgendaReviewSection agenda={agenda} formatTime={formatTime} speakers={speakers} />
            )}

            {speakers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Mic2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {speakers.length} Speaker{speakers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {speakers.map((s, i) => (
                    <div key={s.id || i} className="flex items-center gap-2">
                      {s.image ? (
                        <img src={s.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                          {(s.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="leading-tight">
                        <p className="text-sm font-medium">{s.name}</p>
                        {s.title && <p className="text-[11px] text-muted-foreground">{s.title}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exhibitors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {exhibitors.length} Exhibitor{exhibitors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exhibitors.map((ex, i) => (
                    <div
                      key={ex.id || i}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 bg-card text-sm"
                    >
                      {ex.logo ? (
                        <img src={ex.logo} alt="" className="w-5 h-5 rounded object-contain" />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span>{ex.name}</span>
                      {ex.booth && (
                        <span className="text-[11px] text-muted-foreground">#{ex.booth}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sponsors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {sponsors.length} Sponsor{sponsors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sponsors.map((sp, i) => (
                    <span
                      key={sp.id || i}
                      className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full ${
                        SPONSOR_LEVEL_COLORS[sp.level || 'bronze'] || SPONSOR_LEVEL_COLORS.bronze
                      }`}
                    >
                      {sp.logo && (
                        <img src={sp.logo} alt="" className="w-4 h-4 rounded-full object-contain" />
                      )}
                      {sp.name}
                      <span className="text-[10px] opacity-70 capitalize">{sp.level}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tags, Requirements, FAQs ── */}
      {(tags.length > 0 || requirements.length > 0 || validFaqs.length > 0) && (
        <div className="border-t border-border pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tags.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {requirements.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Requirements</p>
                <div className="space-y-1.5">
                  {requirements.map(req => (
                    <div key={req} className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validFaqs.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  FAQs · {validFaqs.length}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {validFaqs.map((faq, i) => (
                    <div key={i} className="pl-3 border-l-2 border-primary/30">
                      <p className="text-sm font-medium">{faq.question}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Registration & Social ── */}
      {(customRegFields.length > 0 || activeSocials.length > 0) && (
        <div className="border-t border-border pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customRegFields.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Custom Registration Fields · {customRegFields.length}
                  </p>
                </div>
                <div className="space-y-1">
                  {customRegFields.map(field => (
                    <div key={field.id} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span>{field.label || 'Untitled field'}</span>
                      {field.required && (
                        <span className="text-[10px] text-destructive font-medium">Required</span>
                      )}
                      <span className="text-[11px] text-muted-foreground capitalize">· {field.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSocials.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Social Links</p>
                <div className="flex flex-wrap gap-2">
                  {activeSocials.map(([platform]) => (
                    <span
                      key={platform}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted capitalize"
                    >
                      <Link2 className="h-3 w-3" />
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Privacy Toggle ── */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            {isPrivate ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="private-toggle" className="text-sm font-medium cursor-pointer">
                {isPrivate ? 'Private Event' : 'Public Event'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPrivate
                  ? 'Only accessible via direct link'
                  : 'Visible to everyone on the platform'}
              </p>
            </div>
          </div>
          <Switch
            id="private-toggle"
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
        </div>
      </div>
    </div>
  );
}
