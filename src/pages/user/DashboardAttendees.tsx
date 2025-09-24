import React, { useState } from "react";
import { Calendar, MapPin, Users, ArrowLeft, X, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { attendees, type Attendee } from "../../data/attendees";
import { SocialConnections } from "../../components/SocialConnections";

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

const eventData: EventData = {
  id: 1,
  title: "Tech Innovation Summit 2025",
  date: "March 15-17, 2025",
  location: "San Francisco, CA",
  type: "Conference",
  image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop",
  registrationDate: "2025-01-15",
  venue: "Moscone Convention Center",
  description: "Join industry leaders for three days of innovation, networking, and learning.",
  status: 'upcoming' as const,
  category: "Technology"
};

const AttendeeCard: React.FC<{ attendee: Attendee; onClick: () => void }> = ({ attendee, onClick }) => {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="text-center">
          <div className="relative mb-4">
            <img 
              src={attendee.avatar}
              alt={attendee.name}
              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-primary/10 group-hover:border-primary/30 transition-colors"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-card flex items-center justify-center">
              <span className="text-primary-foreground text-xs">✓</span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {attendee.name}
          </h3>
          
          <p className="text-sm font-medium text-primary mb-1">
            {attendee.position}
          </p>
          
          <p className="text-sm text-muted-foreground">
            {attendee.company}
          </p>

          {/* Networking Goals Preview */}
          {attendee.networkingGoals && attendee.networkingGoals.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                {attendee.networkingGoals.slice(0, 2).join(", ")}
                {attendee.networkingGoals.length > 2 && ` +${attendee.networkingGoals.length - 2} more`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AttendeeModal: React.FC<{ attendee: Attendee; onClose: () => void }> = ({ attendee, onClose }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  
  const bioText = attendee.detailedBio || attendee.bio;
  const shouldTruncate = bioText && bioText.length > 200;
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
                src={attendee.avatar}
                alt={attendee.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
              />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{attendee.name}</h2>
                <p className="text-lg font-medium text-primary mb-1">{attendee.position}</p>
                {attendee.country && (
                  <p className="text-sm text-muted-foreground mb-1">{attendee.country}</p>
                )}
                <p className="text-muted-foreground">{attendee.company}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6"></div>

          {/* About Section */}
          {bioText && (
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
          )}

          {/* Networking Goals */}
          {attendee.networkingGoals && attendee.networkingGoals.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">My networking goals are</span><br />
                {attendee.networkingGoals.join(", ")}
              </p>
            </div>
          )}

          {/* Looking For */}
          {attendee.lookingFor && attendee.lookingFor.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">I'm looking for</span><br />
                {attendee.lookingFor.join(", ")}
              </p>
            </div>
          )}

          {/* Additional Details */}
          {attendee.jobFunction && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">My job function is</span><br />
                {attendee.jobFunction}
              </p>
            </div>
          )}

          {attendee.interests && attendee.interests.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">I'd like to receive more details on</span><br />
                {attendee.interests.join(", ")}
              </p>
            </div>
          )}

          {attendee.businessAge && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">My Company has been in business for</span><br />
                {attendee.businessAge}
              </p>
            </div>
          )}

          {attendee.purchasingRole && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">My role in purchasing decisions is</span><br />
                {attendee.purchasingRole}
              </p>
            </div>
          )}

          {attendee.companySize && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">The number of employees at my organisation is</span><br />
                {attendee.companySize}
              </p>
            </div>
          )}

          {/* Social Connections */}
          <div className="mb-6">
            <SocialConnections 
              socialLinks={attendee.socialLinks}
              contactDetails={attendee.contactDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardAttendees: React.FC = () => {
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const handleVisibilityToggle = () => {
    setIsVisible(!isVisible);
    console.log(`Visibility ${!isVisible ? 'enabled' : 'disabled'}`);
  };

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

          {/* Main Content - Attendees Grid */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Event Attendees</h1>
                  <p className="text-muted-foreground">
                    Connect with fellow attendees, speakers, and exhibitors
                  </p>
                </div>
                
                {/* Visibility Toggle */}
                <Button
                  onClick={handleVisibilityToggle}
                  variant={isVisible ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isVisible ? 'Hide Visibility' : 'Show Visibility'}
                </Button>
              </div>

              {/* Visibility Warning */}
              {!isVisible && (
                <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                      <EyeOff className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1 text-foreground">Profile Hidden</p>
                      <p className="text-sm">
                        You won't be able to see other attendees' profiles while your visibility is disabled.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Attendees Grid - 4 per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {attendees.filter(attendee => attendee.isVisible).map((attendee) => (
                <AttendeeCard 
                  key={attendee.id} 
                  attendee={attendee} 
                  onClick={() => setSelectedAttendee(attendee)}
                />
              ))}
            </div>

            {/* Empty State (if no attendees) */}
            {attendees.filter(attendee => attendee.isVisible).length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Attendees Visible</h3>
                <p className="text-muted-foreground mb-6">
                  Enable your visibility to see and connect with other attendees at this event.
                </p>
                <Button 
                  onClick={handleVisibilityToggle} 
                  className="flex items-center gap-2 mx-auto"
                >
                  <Eye className="w-4 h-4" />
                  Enable Visibility
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendee Modal */}
      {selectedAttendee && (
        <AttendeeModal 
          attendee={selectedAttendee} 
          onClose={() => setSelectedAttendee(null)} 
        />
      )}
    </div>
  );
};

export default DashboardAttendees;