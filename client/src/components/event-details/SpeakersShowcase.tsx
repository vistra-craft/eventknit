import { useState } from "react";
import { ExternalLink, Linkedin, Twitter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Speaker {
  id?: string;
  name: string;
  title?: string;
  bio?: string;
  image?: string;
  company?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
}

interface SpeakersShowcaseProps {
  speakers: Speaker[];
}

export function SpeakersShowcase({ speakers }: SpeakersShowcaseProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {speakers.map((speaker, i) => (
          <SpeakerCard
            key={speaker.id || i}
            speaker={speaker}
            onSeeMore={() => setSelectedSpeaker(speaker)}
          />
        ))}
      </div>
      <SpeakerDialog
        speaker={selectedSpeaker}
        open={!!selectedSpeaker}
        onOpenChange={(open) => !open && setSelectedSpeaker(null)}
      />
    </>
  );
}

function SpeakerCard({ speaker, onSeeMore }: { speaker: Speaker; onSeeMore: () => void }) {
  const subtitle = [speaker.title, speaker.company].filter(Boolean).join(" at ");

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/40 bg-card hover:shadow-sm transition-shadow">
      <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex-shrink-0">
        {speaker.image ? (
          <img
            src={speaker.image}
            alt={speaker.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <SpeakerInitials name={speaker.name} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-foreground truncate">{speaker.name}</h4>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
        {speaker.bio && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {speaker.bio}
          </p>
        )}
        <SocialLinks speaker={speaker} className="mt-2" />
        {speaker.bio && speaker.bio.length > 120 && (
          <button
            onClick={onSeeMore}
            className="text-xs text-primary hover:underline font-medium mt-1"
          >
            See more
          </button>
        )}
      </div>
    </div>
  );
}

function SpeakerDialog({
  speaker,
  open,
  onOpenChange,
}: {
  speaker: Speaker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!speaker) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{speaker.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
              {speaker.image ? (
                <img
                  src={speaker.image}
                  alt={speaker.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <SpeakerInitials name={speaker.name} />
              )}
            </div>
          </div>
          {(speaker.title || speaker.company) && (
            <p className="text-sm font-medium text-muted-foreground text-center">
              {[speaker.title, speaker.company].filter(Boolean).join(" at ")}
            </p>
          )}
          {speaker.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">{speaker.bio}</p>
          )}
          <SocialLinks speaker={speaker} className="justify-center" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpeakerInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
      {initials}
    </div>
  );
}

function SocialLinks({ speaker, className }: { speaker: Speaker; className?: string }) {
  const links = [
    speaker.linkedin && { href: speaker.linkedin, icon: Linkedin, label: "LinkedIn" },
    speaker.twitter && { href: speaker.twitter, icon: Twitter, label: "Twitter" },
    speaker.website && { href: speaker.website, icon: ExternalLink, label: "Website" },
  ].filter(Boolean) as { href: string; icon: React.ComponentType<{ className?: string }>; label: string }[];

  if (links.length === 0) return null;

  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href.startsWith("http") ? link.href : `https://${link.href}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border/40 bg-background hover:bg-muted transition-colors"
          title={link.label}
        >
          <link.icon className="h-3 w-3 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}
