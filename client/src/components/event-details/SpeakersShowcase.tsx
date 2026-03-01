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
      <div className="flex flex-wrap gap-5">
        {speakers.map((speaker, i) => (
          <SpeakerCard
            key={speaker.id || i}
            speaker={speaker}
            onClick={() => setSelectedSpeaker(speaker)}
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

function SpeakerCard({ speaker, onClick }: { speaker: Speaker; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center text-center w-[100px] transition-all duration-200"
    >
      <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
        {speaker.image ? (
          <img
            src={speaker.image}
            alt={speaker.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <SpeakerInitials name={speaker.name} />
        )}
      </div>
      <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors mt-1.5 w-full">
        {speaker.name}
      </h4>
      {(speaker.title || speaker.company) && (
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 w-full leading-tight">
          {speaker.title || speaker.company}
        </p>
      )}
    </button>
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
          <SocialLinks speaker={speaker} />
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
    <div className={`flex justify-center gap-2 ${className ?? ""}`}>
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
