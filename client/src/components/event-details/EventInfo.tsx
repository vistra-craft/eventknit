import { CheckCircle, Users, Music, Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EventData } from "@/types/event";

interface EventInfoProps {
  description: string;
  fullDescription?: string | null;
  requirements?: string[];
  ageRestriction?: string | null;
  speakers?: EventData['speakers'];
  startTime?: string | null;
  endTime?: string | null;
}

export const EventInfo = ({ description, fullDescription, requirements, ageRestriction, speakers, startTime, endTime }: EventInfoProps) => {
  return (
    <div className="space-y-8">
      {/* About */}
      <section>
        <h2 className="text-3xl font-bold mb-4">About This Event</h2>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p className="leading-relaxed whitespace-pre-line">
            {fullDescription || description}
          </p>
        </div>
      </section>

      {/* Key Highlights */}
      <Card className="p-6 bg-muted/30 border-none shadow-sm">
        <h3 className="text-xl font-bold mb-4">Key Highlights</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* We show these sections even if data is missing, as per user request */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Live Performances</h4>
              <p className="text-sm text-muted-foreground">Top artists performing live</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Capacity</h4>
              <p className="text-sm text-muted-foreground">Limited tickets available</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Duration</h4>
              <p className="text-sm text-muted-foreground">
                {startTime && endTime ? `${startTime} - ${endTime}` : 'See schedule below'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Rain or Shine</h4>
              <p className="text-sm text-muted-foreground">Event happens regardless of weather</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Important Information (Requirements) */}
      {(requirements?.length || ageRestriction) && (
        <Card className="p-6 border-border/50 shadow-sm">
          <h3 className="text-xl font-bold mb-4">Important Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {ageRestriction && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Age Restriction</h4>
                  <p className="text-sm text-muted-foreground">{ageRestriction}</p>
                </div>
              </div>
            )}
            
            {requirements?.map((req, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Requirement</h4>
                  <p className="text-sm text-muted-foreground">{req}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Event Schedule - Placeholder if no data */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Event Schedule</h2>
        <Card className="divide-y divide-border border-border/50 shadow-sm">
          <div className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">Doors Open</h4>
                <p className="text-muted-foreground">Check-in and registration</p>
              </div>
              <span className="font-medium text-primary">{startTime || 'TBA'}</span>
            </div>
          </div>
          <div className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">Main Event</h4>
                <p className="text-muted-foreground">Performances and activities</p>
              </div>
              <span className="font-medium text-primary">Following Opening</span>
            </div>
          </div>
          <div className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">Closing</h4>
                <p className="text-muted-foreground">Event ends</p>
              </div>
              <span className="font-medium text-primary">{endTime || 'TBA'}</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Speakers */}
      {speakers && speakers.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-6">Featured Speakers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {speakers.map((speaker, index) => (
              <Card key={index} className="p-4 flex items-start gap-4 hover:shadow-md transition-shadow border-border/50">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {speaker.image ? (
                    <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{speaker.name}</h4>
                  <p className="text-primary font-medium text-sm">{speaker.title}</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{speaker.bio}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
