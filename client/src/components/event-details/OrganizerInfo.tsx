import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Building, ExternalLink, ChevronDown, ChevronUp, Facebook, Twitter, Instagram, Linkedin, Youtube, Globe, MessageCircle } from "lucide-react";
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

  // Strip HTML tags to get text length for truncation logic
  const getTextLength = (html: string): number => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length;
  };

  const TRUNCATE_LENGTH = 200;
  const textLength = organizerDescription ? getTextLength(organizerDescription) : 0;
  const shouldTruncate = textLength > TRUNCATE_LENGTH;

  return (
    <section className="space-y-4">
      {/* Top row: avatar + name + subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex-shrink-0 ring-2 ring-primary/5 overflow-hidden">
          {organizer?.avatar ? (
            <img
              src={organizer.avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Building className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-section-header leading-tight">{name}</h3>
          <p className="text-xs text-muted-foreground">Event Organizer</p>
        </div>
      </div>

      {/* Organizer Description */}
      {organizerDescription && (
        <div className="space-y-2">
          <div className={shouldTruncate && !isExpanded ? "line-clamp-3" : ""}>
            <RichTextContent
              content={organizerDescription}
              className="text-sm text-muted-foreground leading-relaxed"
            />
          </div>
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

      {/* Social Links */}
      {socialLinks && Object.keys(socialLinks).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url || url.trim() === '') return null;
                  
                  const platformLower = platform.toLowerCase();
                  const iconMap: Record<string, React.ReactNode> = {
                    facebook: <Facebook className="w-4 h-4" />,
                    twitter: <Twitter className="w-4 h-4" />,
                    instagram: <Instagram className="w-4 h-4" />,
                    linkedin: <Linkedin className="w-4 h-4" />,
                    youtube: <Youtube className="w-4 h-4" />,
                    tiktok: <MessageCircle className="w-4 h-4" />,
                    website: <Globe className="w-4 h-4" />,
                  };
                  
                  const Icon = iconMap[platformLower] || <ExternalLink className="w-4 h-4" />;
                  
                  const platformLabels: Record<string, string> = {
                    facebook: 'Facebook',
                    twitter: 'Twitter / X',
                    instagram: 'Instagram',
                    linkedin: 'LinkedIn',
                    youtube: 'YouTube',
                    tiktok: 'TikTok',
                    website: 'Website'
                  };
                  
                  return (
                    <a
                      key={platform}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background hover:bg-muted transition-colors"
                      title={platformLabels[platformLower] || platform}
                    >
                      {Icon}
                    </a>
                  );
          })}
        </div>
      )}
    </section>
  );
};

              