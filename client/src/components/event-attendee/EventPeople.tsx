/**
 * EventPeople — merged replacement for EventSpeakers + EventExhibitors tabs.
 * Shows sub-tab switcher only when both sections have content.
 */
import React, { useState } from "react";
import { Users, Building2 } from "lucide-react";
import { EventSpeakers } from "./EventSpeakers";
import { EventExhibitors } from "./EventExhibitors";
import type { Speaker, Exhibitor, Sponsor } from "./EventAttendeeView";

interface EventPeopleProps {
  speakers?: Speaker[];
  exhibitors?: Exhibitor[];
  sponsors?: Sponsor[];
}

type PeopleTab = "speakers" | "exhibitors";

export const EventPeople: React.FC<EventPeopleProps> = ({ speakers = [], exhibitors = [], sponsors = [] }) => {
  const hasSpeakers = speakers.length > 0;
  const hasExhibitors = exhibitors.length > 0 || (sponsors && sponsors.length > 0);
  const showSubTabs = hasSpeakers && hasExhibitors;

  const [activeTab, setActiveTab] = useState<PeopleTab>(hasSpeakers ? "speakers" : "exhibitors");

  return (
    <div>
      {/* Sub-tab switcher — only rendered when both sections have content */}
      {showSubTabs && (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-6">
          <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-lg w-fit">
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
              <Building2 className="w-3.5 h-3.5" />
              Exhibitors &amp; Sponsors
              <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {exhibitors.length + (sponsors?.length ?? 0)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {(!showSubTabs || activeTab === "speakers") && hasSpeakers && (
        <EventSpeakers speakers={speakers} />
      )}
      {(!showSubTabs || activeTab === "exhibitors") && hasExhibitors && (
        <EventExhibitors exhibitors={exhibitors} sponsors={sponsors} />
      )}
    </div>
  );
};

export default EventPeople;
