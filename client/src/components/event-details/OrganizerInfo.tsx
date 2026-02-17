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

  const getTextLength = (html: string): number => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length;
  };

  const TRUNCATE_LENGTH = 200;
  const textLength = organizerDescription ? getTextLength(organizerDescription) : 0;
  const shouldTruncate = textLength > TRUNCATE_LENGTH;

  return (
<<<<<<< Updated upstream
    <section className="space-y-4">
      {/* Top row: avatar + name + subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/5">
          <Building className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground leading-tight">{name}</h3>
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
=======
    <div className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building className="w-7 h-7 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">{name}</h3>
          <p className="text-sm text-muted-foreground">Event Organizer</p>
        </div>

        {/* Social icons inline */}
        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <div className="hidden sm:flex gap-1.5 flex-shrink-0">
            {Object.entries(socialLinks).slice(0, 4).map(([platform, url]) => {
              if (!url || url.trim() === '') return null;
              const Icon = getSocialIcon(platform);
              return (
                <a
                  key={platform}
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border/40 bg-background hover:bg-muted transition-colors"
                  title={platform}
                >
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Description — expandable */}
      {organizerDescription && (
        <div className="mt-4">
          <div
            className="overflow-hidden transition-[grid-template-rows] duration-300"
            style={{
              display: "grid",
              gridTemplateRows: shouldTruncate && !isExpanded ? "0fr" : "1fr",
            }}
          >
            <div className={shouldTruncate && !isExpanded ? "min-h-0" : ""}>
              {shouldTruncate && !isExpanded ? (
                <div className="line-clamp-2">
                  <RichTextContent
                    content={organizerDescription}
                    className="text-sm text-muted-foreground leading-relaxed"
                  />
                </div>
              ) : (
                <RichTextContent
                  content={organizerDescription}
                  className="text-sm text-muted-foreground leading-relaxed"
                />
              )}
            </div>
          </div>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 text-xs text-primary hover:text-primary/80 p-0 mt-1"
            >
              {isExpanded ? (
                <>
                  Show Less
                  <ChevronUp className="w-3.5 h-3.5 ml-1" />
                </>
              ) : (
                <>
                  See More
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Mobile social links */}
      {socialLinks && Object.keys(socialLinks).length > 0 && (
        <div className="flex sm:hidden gap-1.5 mt-3">
          {Object.entries(socialLinks).map(([platform, url]) => {
            if (!url || url.trim() === '') return null;
            const Icon = getSocialIcon(platform);
            return (
              <a
                key={platform}
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border/40 bg-background hover:bg-muted transition-colors"
                title={platform}
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            );
          })}
        </div>
      )}
    </div>
>>>>>>> Stashed changes
  );
};

function getSocialIcon(platform: string): React.ComponentType<{ className?: string }> {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    tiktok: MessageCircle,
    website: Globe,
  };
  return map[platform.toLowerCase()] || ExternalLink;
}
