/**
 * EventPeople — merged replacement for EventSpeakers + EventExhibitors tabs.
 * Reuses the same showcase components from event details page.
 * Shows sub-tab switcher only when both sections have content.
 */
import React, { useState } from "react";
import { Users, Building2 } from "lucide-react";
import { SpeakersShowcase } from "@/components/event-details/SpeakersShowcase";
import { SponsorsShowcase } from "@/components/event-details/SponsorsShowcase";
import { ExhibitorsGrid } from "@/components/event-details/ExhibitorsGrid";
import type { Speaker, Exhibitor, Sponsor } from "./EventAttendeeView";

interface EventPeopleProps {
  speakers?: Speaker[];
  exhibitors?: Exhibitor[];
  sponsors?: Sponsor[];
}

type PeopleTab = "speakers" | "exhibitors";

export const EventPeople: React.FC<EventPeopleProps> = ({ speakers = [], exhibitors = [], sponsors = [] }) => {
  const hasSpeakers = speakers.length > 0;
  const hasExhibitors = exhibitors.length > 0;
  const hasSponsors = sponsors.length > 0;
  const hasExhibitorsOrSponsors = hasExhibitors || hasSponsors;
  const showSubTabs = hasSpeakers && hasExhibitorsOrSponsors;

  const [activeTab, setActiveTab] = useState<PeopleTab>(hasSpeakers ? "speakers" : "exhibitors");

  return (
    <div>
      {/* Sub-tab switcher — only rendered when both sections have content */}
      {showSubTabs && (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-6">
          <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-lg w-fit overflow-x-auto">
            <button
              onClick={() => setActiveTab("speakers")}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                activeTab === "speakers"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Speakers
              <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {speakers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("exhibitors")}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                activeTab === "exhibitors"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Exhibitors &amp; Sponsors</span>
              <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {exhibitors.length + sponsors.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {(!showSubTabs || activeTab === "speakers") && hasSpeakers && (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Speakers</h2>
          <SpeakersShowcase speakers={speakers} />
        </div>
      )}
      {(!showSubTabs || activeTab === "exhibitors") && hasExhibitorsOrSponsors && (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
          {hasSponsors && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Sponsors</h2>
              <SponsorsShowcase sponsors={sponsors} />
            </div>
          )}
          {hasExhibitors && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Exhibitors</h2>
              <ExhibitorsGrid exhibitors={exhibitors} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventPeople;
