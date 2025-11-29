import { Button } from "@/components/ui/button";
import { Building, Mail, ExternalLink } from "lucide-react";
import type { EventData } from "@/types/event";

interface OrganizerInfoProps {
  organizer: EventData['organizer'];
  organizerName?: string;
}

export const OrganizerInfo = ({ organizer, organizerName }: OrganizerInfoProps) => {
  const name = organizerName || (organizer ? `${organizer.firstName} ${organizer.lastName}` : 'Unknown Organizer');

  return (
    <section className="py-8">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
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
      </div>
    </section>
  );
};
