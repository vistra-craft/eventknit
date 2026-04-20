import { useState } from 'react';
import { Calendar, Share2, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { AgendaBuilderStep } from './AgendaBuilderStep';
import { SocialConnectionsStep } from './SocialConnectionsStep';
import type { AgendaItem, SpeakerItem, ExhibitorItem, SponsorItem } from './types';

interface ExtrasStepProps {
  // AgendaBuilderStep props
  agenda: AgendaItem[];
  speakers: SpeakerItem[];
  exhibitors: ExhibitorItem[];
  sponsors: SponsorItem[];
  eventStartDate?: string;
  eventEndDate?: string;
  onAgendaUpdate: (
    field: 'agenda' | 'speakers' | 'exhibitors' | 'sponsors',
    value: AgendaItem[] | SpeakerItem[] | ExhibitorItem[] | SponsorItem[]
  ) => void;
  // SocialConnectionsStep props
  socialLinks: Record<string, string>;
  onSocialLinksChange: (links: Record<string, string>) => void;
}

export function ExtrasStep({
  agenda,
  speakers,
  exhibitors,
  sponsors,
  eventStartDate,
  eventEndDate,
  onAgendaUpdate,
  socialLinks,
  onSocialLinksChange,
}: ExtrasStepProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Count items for each section
  const programCount = agenda.length + speakers.length + exhibitors.length + sponsors.length;
  const socialCount = Object.values(socialLinks).filter(v => v.trim() !== '').length;

  const sections = [
    {
      id: 'program',
      icon: Calendar,
      title: 'Program & Schedule',
      description: 'Add sessions, speakers, exhibitors, and sponsors',
      count: programCount,
      countLabel: programCount === 1 ? 'item' : 'items',
    },
    {
      id: 'social',
      icon: Share2,
      title: 'Social Links',
      description: 'Add your social media profiles and website',
      count: socialCount,
      countLabel: socialCount === 1 ? 'link' : 'links',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Optional Extras</h2>
        <p className="text-sm text-muted-foreground">
          Expand any section below to add more details to your event
        </p>
      </div>

      {sections.map(section => {
        const isOpen = openSections.has(section.id);
        const Icon = section.icon;

        return (
          <Collapsible
            key={section.id}
            open={isOpen}
            onOpenChange={() => toggleSection(section.id)}
          >
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{section.title}</span>
                      <Badge variant="secondary" className="text-xs font-normal">
                        Optional
                      </Badge>
                      {section.count > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {section.count} {section.countLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t border-border/40 p-4 pt-6">
                  {section.id === 'program' && (
                    <AgendaBuilderStep
                      agenda={agenda}
                      speakers={speakers}
                      exhibitors={exhibitors}
                      sponsors={sponsors}
                      eventStartDate={eventStartDate}
                      eventEndDate={eventEndDate}
                      onUpdate={onAgendaUpdate}
                    />
                  )}
                  {section.id === 'social' && (
                    <SocialConnectionsStep
                      socialLinks={socialLinks}
                      onChange={onSocialLinksChange}
                    />
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
