import { useState } from "react";
import { Users, ExternalLink, Linkedin, Twitter } from "lucide-react";
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

  if (speakers.length <= 4) {
    // Feature mode — larger cards
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {speakers.map((speaker, i) => (
            <SpeakerFeatureCard
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

  // Compact mode — horizontal scroll
  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
        {speakers.map((speaker, i) => (
          <SpeakerCompactCard
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

function SpeakerFeatureCard({ speaker, onClick }: { speaker: Speaker; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left group rounded-xl border border-border/40 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
    >
      <div className="h-48 bg-muted overflow-hidden">
        {speaker.image ? (
          <img
            src={speaker.image}
            alt={speaker.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <SpeakerInitials name={speaker.name} size="lg" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {speaker.name}
        </h4>
        {(speaker.title || speaker.company) && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {[speaker.title, speaker.company].filter(Boolean).join(" at ")}
          </p>
        )}
        {speaker.bio && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{speaker.bio}</p>
        )}
        <SocialLinks speaker={speaker} className="mt-3" />
      </div>
    </button>
  );
}

function SpeakerCompactCard({ speaker, onClick }: { speaker: Speaker; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left flex-shrink-0 w-[180px] snap-start group rounded-xl border border-border/40 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      <div className="h-32 bg-muted overflow-hidden">
        {speaker.image ? (
          <img
            src={speaker.image}
            alt={speaker.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <SpeakerInitials name={speaker.name} size="md" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {speaker.name}
        </h4>
        {speaker.title && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{speaker.title}</p>
        )}
      </div>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{speaker.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {speaker.image && (
            <div className="h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={speaker.image}
                alt={speaker.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {(speaker.title || speaker.company) && (
            <p className="text-sm font-medium text-muted-foreground">
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

function SpeakerInitials({ name, size }: { name: string; size: "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg";
  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold`}
    >
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
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border/40 bg-background hover:bg-muted transition-colors"
          title={link.label}
        >
          <link.icon className="h-3.5 w-3.5 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}
