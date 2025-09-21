import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, Share2, ExternalLink, Plus, Minus, Clock, User, Mail, Building, Info, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { EventMap } from "@/components/EventMap";
import { useState, useEffect } from "react";
import { events } from "@/data/events";
import type { EventItem } from "@/data/events";

// Create a map of event IDs to events
const eventsById = events.reduce<Record<string, EventItem>>((acc, event) => {
  acc[event.id] = event;
  return acc;
}, {});

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [event, setEvent] = useState<EventItem | null>(null);
  
  useEffect(() => {
    if (id && eventsById[id]) {
      setEvent(eventsById[id]);
    }
  }, [id]);
  
  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Event not found</h2>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const updateQuantity = (ticketName: string, change: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [ticketName]: Math.max(0, (prev[ticketName] || 0) + change)
    }));
  };

  const handleRegisterClick = () => {
    // Calculate total price including service fee (8%)
    const totalPrice = Object.entries(ticketQuantities).reduce((total: number, [ticketName, quantity]: [string, number]) => {
      if (quantity === 0) return total;
      const ticket = event?.ticketTypes.find((t: { name: string }) => t.name === ticketName);
      return total + (ticket ? (ticket.price * 1.08) * quantity : 0);
    }, 0);

    // Filter out tickets with 0 quantity
    const selectedTickets = Object.entries(ticketQuantities)
      .filter(([_, qty]: [string, number]) => qty > 0)
      .map(([name, quantity]: [string, number]) => ({
        name,
        quantity,
        price: event?.ticketTypes.find((t: { name: string }) => t.name === name)?.price || 0
      }));

    navigate(`/event/${id}/payment`, {
      state: {
        eventId: id,
        eventTitle: event?.title,
        tickets: selectedTickets,
        totalPrice: parseFloat(totalPrice.toFixed(2))
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 pt-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-muted group transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Events
        </Button>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Event Poster and Venue Info */}
          <div className="xl:col-span-1 space-y-6">
            {/* Event Image with Overlay */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-[400px] sm:h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 mb-3 shadow-lg">
                  {event.category}
                </Badge>
                <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">{event.title}</h2>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {event.time}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Event Details Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Event Time & Date */}
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">When</p>
                    <p className="text-sm text-muted-foreground">
                      {event.date} • {event.time}
                      <span className="block text-xs mt-0.5 text-amber-500">Duration: 3 hours</span>
                    </p>
                  </div>
                </div>
                
                {/* Location & Venue */}
                <div className="flex items-start gap-3 pt-3 border-t border-muted/30">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Where</p>
                    <p className="text-sm text-muted-foreground">
                      {event.venue}
                      <span className="block text-muted-foreground/80">{event.location}</span>
                    </p>
                  </div>
                </div>
                
                {/* Share Button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-4 group hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <Share2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                  Share Event
                </Button>
              </div>
            </Card>

            {/* Event Map */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <EventMap 
                venue={event.venue} 
                location={event.location} 
                coordinates={event.coordinates}
              />
            </div>
          </div>

          {/* Right Column - Event Details & Tickets */}
          <div className="xl:col-span-2 space-y-8">
            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white border-0">
                  {event.category}
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  <Users className="w-3 h-3 mr-1" />
                  {event.ageRestriction}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold">{event.title}</h1>
              
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{event.time}</span>
                </div>
                <div className="text-sm text-orange-600 font-medium">
                  Doors: 5:30 PM CDT
                </div>
              </div>
              
              {/* Organizers Card */}
              <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    Organized By
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{event.organizer}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Event Organizer</p>
                      <div className="flex gap-3 mt-3">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          <ExternalLink className="w-3 h-3 mr-1.5" />
                          Website
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          <Mail className="w-3 h-3 mr-1.5" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Separator className="my-4" />
              
              <div className="space-y-8">
                {/* Event Details Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Event Details</h2>
                  <p className="text-muted-foreground">
                    {event.fullDescription}
                  </p>
                </div>

                {/* Additional Information Section */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Additional Information</h2>
                  
                  {/* FAQs */}
                  {event.faqs && event.faqs.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="w-5 h-5 text-primary" />
                          Frequently Asked Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {event.faqs.map((faq, index) => (
                            <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                              <h4 className="font-medium text-foreground">{faq.question}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Speakers */}
                  {event.speakers && event.speakers.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          Featured Speakers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {event.speakers.map((speaker, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{speaker.name}</h4>
                                <p className="text-sm text-muted-foreground">{speaker.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{speaker.bio}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </div>

                {/* Event Settings Section */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Event Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Event Type</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.isPrivate ? 'Private Event' : 'Public Event'}
                          </p>
                        </div>
                        <Badge variant={event.isPrivate ? 'secondary' : 'default'}> 
                          {event.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                      </div>

                      {event.registrationDeadline && (
                        <div>
                          <h4 className="font-medium">Registration Deadline</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.registrationDeadline}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium">Age Restriction</h4>
                        <p className="text-sm text-muted-foreground">
                          {event.ageRestriction}
                        </p>
                      </div>

                      {event.requirements && event.requirements.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Requirements</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {event.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Ticket Selection */}
            <div className="w-full max-w-[280px] space-y-2">
              <h2 className="text-sm font-semibold text-gray-700">Tickets</h2>
              
              {event.ticketTypes.map((ticket, index) => {
                const quantity = ticketQuantities[ticket.name] || 0;
                const isSelected = quantity > 0;
                
                return (
                  <div 
                    key={index}
                    className={`p-2 border rounded-md text-xs ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-xs">{ticket.name}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          +${(ticket.price * 0.08).toFixed(2)} service fee
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xs">${ticket.price}</div>
                        <div className="text-[10px] text-gray-400">per ticket</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-gray-500">Quantity</span>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 w-5 p-0 rounded-full"
                          onClick={() => updateQuantity(ticket.name, -1)}
                          disabled={!quantity}
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </Button>
                        <span className="w-4 text-center text-xs">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 w-5 p-0 rounded-full"
                          onClick={() => updateQuantity(ticket.name, 1)}
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-1.5 pt-1.5 border-t text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-medium">
                            ${((ticket.price + ticket.price * 0.08) * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-medium mt-4"
                onClick={handleRegisterClick}
              >
                Register Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
