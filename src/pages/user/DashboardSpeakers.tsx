import React from "react";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
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

const SpeakerCard: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
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
          
          <p className="text-sm text-muted-foreground mb-3">
            {speaker.company}
          </p>
          
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
            {speaker.bio}
          </p>
          
          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {speaker.expertise.slice(0, 2).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {speaker.expertise.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{speaker.expertise.length - 2}
              </Badge>
            )}
          </div>
          
          <div className="flex justify-center gap-2">
            {speaker.socialLinks?.twitter && (
              <Button variant="outline" size="sm" className="text-xs">
                Twitter
              </Button>
            )}
            {speaker.socialLinks?.linkedin && (
              <Button variant="outline" size="sm" className="text-xs">
                LinkedIn
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardSpeakers: React.FC<DashboardSpeakersProps> = ({ eventData }) => {
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
                <SpeakerCard key={speaker.id} speaker={speaker} />
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
    </div>
  );
};

export default DashboardSpeakers;

