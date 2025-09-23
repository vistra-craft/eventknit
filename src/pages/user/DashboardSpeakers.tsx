import React, { useState } from "react";
import { Calendar, MapPin, Users, ArrowLeft, X, ExternalLink, Clock, Users2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { speakers, Speaker } from "../../data/speakers";

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
  venue?: string;
  description?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  category?: string;
}

interface DashboardSpeakersProps {
  eventData: EventData;
}

const SpeakerCard: React.FC<{ speaker: Speaker; onClick: () => void }> = ({ speaker, onClick }) => {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="text-center">
          <div className="relative mb-4">
            <img 
              src={speaker.avatar}
              alt={speaker.name}
              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-primary/10 group-hover:border-primary/30 transition-colors"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-card flex items-center justify-center">
              <span className="text-primary-foreground text-xs">✓</span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {speaker.name}
          </h3>
          
          <p className="text-sm font-medium text-primary mb-1">
            {speaker.position}
          </p>
          
          <p className="text-sm text-muted-foreground">
            {speaker.company}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const SpeakerModal: React.FC<{ speaker: Speaker; onClose: () => void }> = ({ speaker, onClose }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  
  const bioText = speaker.detailedBio || speaker.bio;
  const shouldTruncate = bioText.length > 200;
  const displayBio = shouldTruncate && !showFullBio ? bioText.substring(0, 200) + "..." : bioText;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        <div className="p-8 pb-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-6">
              <img 
                src={speaker.avatar}
                alt={speaker.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
              />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{speaker.name}</h2>
                <p className="text-lg font-medium text-primary mb-1">{speaker.position}</p>
                {speaker.country && (
                  <p className="text-sm text-muted-foreground mb-1">{speaker.country}</p>
                )}
                <p className="text-muted-foreground">{speaker.company}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Connect
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6"></div>

          {/* About Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">About me</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {displayBio}
            </p>
            {shouldTruncate && (
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary mt-2"
                onClick={() => setShowFullBio(!showFullBio)}
              >
                {showFullBio ? "See less" : "See more"}
              </Button>
            )}
          </div>

          {/* Additional Details */}
          {speaker.jobFunction && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">My job function is</span><br />
                {speaker.jobFunction}
              </p>
            </div>
          )}

          {speaker.interests && speaker.interests.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">I'd like to receive more details on</span><br />
                {speaker.interests.join(", ")}
              </p>
            </div>
          )}

          {speaker.businessAge && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">My Company has been in business for</span><br />
                {speaker.businessAge}
              </p>
            </div>
          )}

          {speaker.purchasingRole && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">My role in purchasing decisions is</span><br />
                {speaker.purchasingRole}
              </p>
            </div>
          )}

          {speaker.companySize && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">The number of employees at my organisation is</span><br />
                {speaker.companySize}
              </p>
            </div>
          )}

          {/* Contact Details */}
          {speaker.contactDetails && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Contact details</h3>
              <div className="space-y-2">
                {speaker.contactDetails.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    <a 
                      href={speaker.contactDetails.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {speaker.contactDetails.website}
                    </a>
                  </div>
                )}
                {speaker.contactDetails.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{speaker.contactDetails.email}</span>
                  </div>
                )}
                {speaker.contactDetails.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{speaker.contactDetails.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Speaking At */}
          {speaker.speakingAt && speaker.speakingAt.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Is speaking at</h3>
              <div className="space-y-4">
                {speaker.speakingAt.map((session, sessionIndex) => (
                  <div key={sessionIndex} className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">{session.session}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{session.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users2 className="w-4 h-4" />
                        <span>{session.stage}</span>
                      </div>
                    </div>
                    {session.panelists && session.panelists.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Panelists:</p>
                        <div className="space-y-1">
                          {session.panelists.map((panelist, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              {panelist}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardSpeakers: React.FC<DashboardSpeakersProps> = ({ eventData }) => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Left Sidebar - Event Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-24 border border-border">
              <div className="text-right mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
              </div>
              
              {/* Event Image */}
              <div className="mb-6">
                <img 
                  src={eventData.image}
                  alt={eventData.title}
                  className="w-full h-32 object-cover rounded-xl"
                />
              </div>
              
              {/* Event Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{eventData.title}</h3>
                  <p className="text-sm text-muted-foreground">{eventData.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{eventData.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{eventData.venue || eventData.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{eventData.type}</span>
                  </div>
                </div>
                
                {eventData.category && (
                  <div className="pt-4 border-t border-border">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {eventData.category}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Speakers Grid */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Event Speakers</h1>
              <p className="text-muted-foreground">
                Meet the industry experts and thought leaders speaking at this event
              </p>
            </div>

            {/* Speakers Grid - 4 per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {speakers.map((speaker) => (
                <SpeakerCard 
                  key={speaker.id} 
                  speaker={speaker} 
                  onClick={() => setSelectedSpeaker(speaker)}
                />
              ))}
            </div>

            {/* Empty State (if no speakers) */}
            {speakers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Speakers Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Speaker information will be available soon.
                </p>
              </div>
            )}
          </div>
        </div>
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

export default DashboardSpeakers;

