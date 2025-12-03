import { CheckCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EventData } from "@/types/event";

interface EventInfoProps {
  description: string;
  fullDescription?: string | null;
  requirements?: string[];
  ageRestriction?: string | null;
  speakers?: EventData['speakers'];
}

export const EventInfo = ({ description, fullDescription, requirements, ageRestriction, speakers }: EventInfoProps) => {
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


      {/* Important Information (Requirements) */}
      {(requirements?.length || ageRestriction) && (
        <Card className="p-6 rounded-2xl border-0 bg-white shadow-sm">
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


      {/* Speakers */}
      {speakers && speakers.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-6">Featured Speakers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {speakers.map((speaker, index) => (
              <Card key={index} className="p-4 flex items-start gap-4 rounded-2xl border-0 bg-white hover:shadow-md transition-shadow">
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
