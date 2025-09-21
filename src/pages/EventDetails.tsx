import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, Share2, ExternalLink, Plus, Minus, Clock, DollarSign, User, Phone, Mail, Building, Ticket, Info, Star, Award, Shield, Accessibility, Car } from "lucide-react";
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
  const [activeSection, setActiveSection] = useState<string>('info');
  
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

  const getTotalPrice = () => {
    return Object.entries(ticketQuantities).reduce((total, [ticketName, quantity]) => {
      const ticket = event.ticketTypes.find(t => t.name === ticketName);
      return total + (ticket ? ticket.price * quantity : 0);
    }, 0);
  };

  const getTotalQuantity = () => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const handleGetTickets = () => {
    navigate('/payment', { 
      state: { 
        event, 
        ticketQuantities, 
        totalPrice: getTotalPrice() + getTotalPrice() * 0.08 
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
            
            {/* Enhanced Venue Info Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{event.venue}</h3>
                    <p className="text-muted-foreground">{event.location}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                      Venue Info
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Maps
                    </Button>
                  </div>

                  {/* Quick venue stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">20K</div>
                      <div className="text-xs text-muted-foreground">Capacity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">✓</div>
                      <div className="text-xs text-muted-foreground">Accessible</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Map */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <EventMap 
                venue={event.venue} 
                location={event.location} 
                coordinates={event.coordinates}
              />
            </div>

            {/* Share Button with Animation */}
            <Button variant="outline" className="w-full group hover:bg-primary hover:text-primary-foreground transition-all duration-200">
              <Share2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
              Share Event
            </Button>
          </div>

          {/* Right Column - Modern Event Details & Tickets */}
          <div className="xl:col-span-2 space-y-8">
            {/* Hero Event Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-8 border border-primary/20">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground border-0 shadow-md">
                    {event.category}
                  </Badge>
                  <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                    <Users className="w-3 h-3 mr-1" />
                    {event.ageRestriction}
                  </Badge>
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {event.title}
                </h1>
                
                {/* Key Info Pills */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="bg-card rounded-full px-4 py-2 border shadow-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{event.date}</span>
                  </div>
                  <div className="bg-card rounded-full px-4 py-2 border shadow-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{event.time}</span>
                  </div>
                  <div className="bg-orange-50 border-orange-200 rounded-full px-4 py-2 border shadow-sm">
                    <span className="text-orange-700 text-sm font-medium">Doors: 5:30 PM CDT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tabs Section */}
            <div className="bg-card rounded-2xl shadow-xl border-0 overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b bg-muted/30">
                {[
                  { id: 'info', label: 'Event Info', icon: Info },
                  { id: 'organizer', label: 'Organizer', icon: User },
                  { id: 'venue', label: 'Venue', icon: Building },
                  { id: 'pricing', label: 'Pricing', icon: DollarSign }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-200 relative ${
                      activeSection === tab.id
                        ? 'text-primary bg-card border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeSection === 'info' && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900">Duration</p>
                          <p className="text-sm text-blue-700">≈ 3 hours</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">Level</p>
                          <p className="text-sm text-green-700">All welcome</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-900">Policy</p>
                          <p className="text-sm text-purple-700">Transfers OK</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'organizer' && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">NBA Entertainment</h4>
                        <p className="text-muted-foreground mb-3">Official Event Organizer</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>+1 (555) 123-4567</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>support@nbaevents.com</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'venue' && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold">{event.venue}</h4>
                      <p className="text-muted-foreground">{event.location}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="font-bold">20,000</div>
                        <div className="text-xs text-muted-foreground">Seats</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Car className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="font-bold">$15</div>
                        <div className="text-xs text-muted-foreground">Parking</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Accessibility className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="font-bold">Yes</div>
                        <div className="text-xs text-muted-foreground">Accessible</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <MapPin className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="font-bold">Central</div>
                        <div className="text-xs text-muted-foreground">Location</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'pricing' && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    {event.ticketTypes.map((ticket, index) => (
                      <div key={index} className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border">
                        <div>
                          <span className="font-semibold">{ticket.name}</span>
                          <div className="text-sm text-muted-foreground">
                            +${(ticket.price * 0.08).toFixed(2)} service fee
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-primary">${ticket.price}</div>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                      *Service fees apply at checkout
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Ticket Selection */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card to-primary/5 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Select Your Tickets</h3>
                    <p className="opacity-90">Choose your perfect seats</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Maximum</div>
                    <div className="text-2xl font-bold">10</div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {event.ticketTypes.map((ticket, index) => {
                  const quantity = ticketQuantities[ticket.name] || 0;
                  const isSelected = quantity > 0;
                  
                  return (
                    <Card 
                      key={index} 
                      className={`transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                        isSelected 
                          ? 'border-primary shadow-lg shadow-primary/20 bg-gradient-to-r from-primary/5 to-primary/10' 
                          : 'border-2 hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-xl">{ticket.name}</h4>
                              {isSelected && (
                                <Badge className="bg-primary text-primary-foreground animate-in slide-in-from-left-2">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              +${(ticket.price * 0.08).toFixed(2)} service fee included
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary">${ticket.price}</div>
                            <div className="text-sm text-muted-foreground">per ticket</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">
                            Subtotal: <span className="text-primary">${((ticket.price + ticket.price * 0.08) * quantity).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="h-10 w-10 p-0 rounded-full transition-all duration-200"
                              onClick={() => updateQuantity(ticket.name, -1)}
                              disabled={!quantity}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <div className="w-12 h-10 flex items-center justify-center">
                              <span className={`text-xl font-bold ${isSelected ? 'text-primary' : ''}`}>
                                {quantity}
                              </span>
                            </div>
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="h-10 w-10 p-0 rounded-full transition-all duration-200"
                              onClick={() => updateQuantity(ticket.name, 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Enhanced Order Summary */}
                {getTotalQuantity() > 0 && (
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 space-y-4 border border-primary/20 animate-in slide-in-from-bottom-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Order Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Subtotal ({getTotalQuantity()} ticket{getTotalQuantity() !== 1 ? 's' : ''})</span>
                        <span className="font-semibold">${getTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Service fees (8%)</span>
                        <span>${(getTotalPrice() * 0.08).toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-xl font-bold text-primary">
                        <span>Total</span>
                        <span>${(getTotalPrice() + getTotalPrice() * 0.08).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 transform ${
                    getTotalQuantity() > 0 
                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:scale-[1.02] shadow-lg shadow-primary/30' 
                      : ''
                  }`}
                  disabled={getTotalQuantity() === 0}
                  onClick={handleGetTickets}
                >
                  <Ticket className="w-5 h-5 mr-3" />
                  {getTotalQuantity() === 0 ? 'Select Tickets to Continue' : `Secure ${getTotalQuantity()} Ticket${getTotalQuantity() !== 1 ? 's' : ''}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;