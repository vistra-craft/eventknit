import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building, Mail, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { EventData } from "@/types/event";

interface OrganizerInfoProps {
  organizer: EventData['organizer'];
  organizerName?: string;
  organizerDescription?: string | null;
}

export const OrganizerInfo = ({ organizer, organizerName, organizerDescription }: OrganizerInfoProps) => {
  const name = organizerName || (organizer ? `${organizer.firstName} ${organizer.lastName}` : 'Unknown Organizer');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Truncate description to 200 characters
  const TRUNCATE_LENGTH = 200;
  const shouldTruncate = organizerDescription && organizerDescription.length > TRUNCATE_LENGTH;
  const displayDescription = shouldTruncate && !isExpanded
    ? organizerDescription.substring(0, TRUNCATE_LENGTH) + '...'
    : organizerDescription;

  return (
    <section>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Placeholder */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-4 ring-primary/5">
            <Building className="w-10 h-10 text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{name}</h3>
              <p className="text-muted-foreground">
                Event Organizer
              </p>
            </div>

            {/* Organizer Description */}
            {organizerDescription && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {displayDescription}
                </p>
                {shouldTruncate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 text-primary hover:text-primary/80 p-0"
                  >
                    {isExpanded ? (
                      <>
                        Show Less
                        <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        See More
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button variant="outline" size="sm" className="h-9">
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
              {organizer?.organizationName && (
                <Button variant="ghost" size="sm" className="h-9">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {organizer.organizationName}
                </Button>
              )}
            </div>
          </div>
        </div>
    </section>
  );
};
