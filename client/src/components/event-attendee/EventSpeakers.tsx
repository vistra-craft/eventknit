import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, Linkedin, Twitter, Globe, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Speaker } from "./EventAttendeeView";

interface EventSpeakersProps {
  speakers: Speaker[];
}

interface SpeakerSession {
  session: string;
  date: string;
  time: string;
  stage: string;
}

interface ExtendedSpeaker extends Speaker {
  country?: string;
  detailedBio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  contactDetails?: {
    email?: string;
    phone?: string;
  };
  speakingAt?: SpeakerSession[];
}

// Speaker Card Component
const SpeakerCard: React.FC<{
  speaker: Speaker;
  onClick: () => void;
}> = ({ speaker, onClick }) => {
  return (
    <Card
      className="group cursor-pointer border border-border bg-background rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300"
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <Avatar
          src={speaker.image}
          name={speaker.name}
          alt={speaker.name}
          size="lg"
          className="mx-auto mb-4 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all"
        />

        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {speaker.name}
        </h3>

        <p className="text-sm text-primary mt-1 line-clamp-1">
          {speaker.title}
        </p>

        {speaker.company && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {speaker.company}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Speaker Modal Component
const SpeakerModal: React.FC<{
  speaker: ExtendedSpeaker;
  onClose: () => void;
}> = ({ speaker, onClose }) => {
  const [showFullBio, setShowFullBio] = useState(false);

  const bioText = speaker.detailedBio || speaker.bio || '';
  const shouldTruncate = bioText.length > 300;
  const displayBio = shouldTruncate && !showFullBio
    ? bioText.substring(0, 300) + '...'
    : bioText;

  const hasSocialLinks = speaker.socialLinks &&
    (speaker.socialLinks.linkedin || speaker.socialLinks.twitter || speaker.socialLinks.website);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={speaker.image}
                name={speaker.name}
                alt={speaker.name}
                size="xl"
                className="ring-4 ring-primary/20"
              />
              <div>
                <h2 className="text-xl font-bold text-foreground">{speaker.name}</h2>
                <p className="text-primary font-medium">{speaker.title}</p>
                {speaker.country && (
                  <p className="text-sm text-muted-foreground">{speaker.country}</p>
                )}
                {speaker.company && (
                  <p className="text-sm text-muted-foreground">{speaker.company}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6" />

          {/* Bio */}
          {bioText && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">About</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {displayBio}
              </p>
              {shouldTruncate && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary mt-2"
                  onClick={() => setShowFullBio(!showFullBio)}
                >
                  {showFullBio ? 'Show less' : 'Read more'}
                </Button>
              )}
            </div>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Connect</h3>
              <div className="flex gap-2">
                {speaker.socialLinks?.linkedin && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={speaker.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {speaker.socialLinks?.twitter && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={speaker.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                )}
                {speaker.socialLinks?.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={speaker.socialLinks.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Contact */}
          {speaker.contactDetails?.email && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Contact</h3>
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${speaker.contactDetails.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {speaker.contactDetails.email}
                </a>
              </Button>
            </div>
          )}

          {/* Speaking At */}
          {speaker.speakingAt && speaker.speakingAt.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Speaking At</h3>
              <div className="space-y-3">
                {speaker.speakingAt.map((session, idx) => (
                  <Card key={idx} className="border-0 bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-foreground mb-2">{session.session}</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{session.stage}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const EventSpeakers: React.FC<EventSpeakersProps> = ({ speakers }) => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<ExtendedSpeaker | null>(null);

  if (!speakers || speakers.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎤</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Speakers Coming Soon</h2>
          <p className="text-muted-foreground">
            Speaker information will be announced soon. Check back for updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Speakers</h1>
        <p className="text-muted-foreground">
          Meet the experts and thought leaders speaking at this event
        </p>
        <Badge variant="secondary" className="mt-2">
          {speakers.length} {speakers.length === 1 ? 'Speaker' : 'Speakers'}
        </Badge>
      </div>

      {/* Speakers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {speakers.map((speaker, index) => (
          <SpeakerCard
            key={speaker.id || index}
            speaker={speaker}
            onClick={() => setSelectedSpeaker(speaker as ExtendedSpeaker)}
          />
        ))}
      </div>

      {/* Speaker Modal */}
      {selectedSpeaker && (
        <SpeakerModal
          speaker={selectedSpeaker}
          onClose={() => setSelectedSpeaker(null)}
        />
      )}
    </div>
  );
};

export default EventSpeakers;
