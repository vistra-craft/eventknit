import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building, Mail, ExternalLink, ChevronDown, ChevronUp, Facebook, Twitter, Instagram, Linkedin, Youtube, Globe } from "lucide-react";
import type { EventData } from "@/types/event";

interface OrganizerInfoProps {
  organizer: EventData['organizer'];
  organizerName?: string;
  organizerDescription?: string | null;
  socialLinks?: Record<string, string> | null;
}

export const OrganizerInfo = ({ organizer, organizerName, organizerDescription, socialLinks }: OrganizerInfoProps) => {
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
            
            {/* Social Links */}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url || url.trim() === '') return null;
                  
                  const platformLower = platform.toLowerCase();
                  const iconMap: Record<string, React.ReactNode> = {
                    facebook: <Facebook className="w-4 h-4" />,
                    twitter: <Twitter className="w-4 h-4" />,
                    instagram: <Instagram className="w-4 h-4" />,
                    linkedin: <Linkedin className="w-4 h-4" />,
                    youtube: <Youtube className="w-4 h-4" />,
                    website: <Globe className="w-4 h-4" />,
                  };
                  
                  const Icon = iconMap[platformLower] || <ExternalLink className="w-4 h-4" />;
                  
                  return (
                    <a
                      key={platform}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card-surface hover:bg-primary/10 hover:border-primary transition-colors"
                      title={platform}
                    >
                      {Icon}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
    </section>
  );
};
