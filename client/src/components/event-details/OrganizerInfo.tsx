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
          </div>
        </div>
    </section>
  );
};

              