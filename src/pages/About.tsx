import { ArrowLeft, Calendar, MapPin, Users, Share2, ExternalLink, Plus, Minus, Clock, Info, Star, Heart, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventItem } from "@/data/events";

interface TicketType {
  name: string;
  price: number;
  features?: string[];
}

interface Organizer {
  name: string;
  bio: string;
  avatar: string;
  contact: string;
}

interface EventData extends Omit<EventItem, 'organizer' | 'ticketTypes'> {
  organizer: Organizer;
  ticketTypes: TicketType[];
  endTime?: string;
  doorsOpen?: string;
  dresscode?: string;
  specialInstructions?: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
}

interface EventMapProps {
  venue: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Mock event data for demonstration
const mockEvent: EventData = {
  id: "1",
  title: "Summer Music Festival 2025",
  description: "Join us for an unforgettable evening of live music featuring local and international artists. This year's lineup includes indie rock, jazz fusion, and electronic music acts that will keep you dancing all night long. The festival will feature multiple stages, food trucks, craft beer gardens, and interactive art installations. Come early to explore the vendor marketplace and grab some exclusive merchandise. This is a family-friendly event with activities for all ages, including a dedicated kids' zone with face painting and games. Don't miss this incredible celebration of music and community!",
  fullDescription: "Join us for an unforgettable evening of live music featuring local and international artists. This year's lineup includes indie rock, jazz fusion, and electronic music acts that will keep you dancing all night long. The festival will feature multiple stages, food trucks, craft beer gardens, and interactive art installations. Come early to explore the vendor marketplace and grab some exclusive merchandise. This is a family-friendly event with activities for all ages, including a dedicated kids' zone with face painting and games. Don't miss this incredible celebration of music and community! Additional details include multiple food vendors, VIP areas, and after-parties.",
  category: "Music",
  date: "July 15, 2025",
  time: "6:00 PM",
  endTime: "11:00 PM",
  duration: "5 hours",
  doorsOpen: "5:30 PM",
  venue: "Riverside Park Amphitheater",
  location: "123 River Road, Downtown, City 12345",
  price: "$45-85",
  rating: 4.8,
  ageRestriction: "All ages welcome",
  dresscode: "Casual outdoor attire recommended",
  specialInstructions: "Please bring blankets or chairs for lawn seating. No outside food or drinks allowed.",
  image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=600&fit=crop",
  coordinates: { lat: 40.7128, lng: -74.0060 },
  organizer: {
    name: "City Events Co.",
    bio: "Bringing the community together through amazing events since 2010.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    contact: "contact@cityeventsco.com"
  },
  ticketTypes: [
    { name: "General Admission", price: 45 },
    { name: "VIP Experience", price: 85 },
    { name: "Student Discount", price: 25 }
  ]
};

interface EventRegistrationFormProps {
  event: EventData;
}

// Event Registration Form Component
const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({ event }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: ""
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Registration submitted:", { ...formData, eventId: event.id });
    // Add actual registration logic here (e.g., API call)
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleInputChange}
          placeholder="Enter your full name"
          required
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email"
          required
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="Enter your phone number"
          className="w-full"
        />
      </div>
      <Button type="submit" className="w-full h-12 text-lg font-semibold">
        Register for Event
      </Button>
    </form>
  );
};

// Event Map Component (Placeholder - integrate with a real map library like Google Maps or Leaflet if needed)
const EventMap: React.FC<EventMapProps> = ({ venue, location, coordinates }) => {
  return (
    <div className="h-48 bg-muted flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium">{venue}</p>
        <p className="text-sm">{location}</p>
        <p className="text-xs mt-1">Lat: {coordinates.lat}, Lng: {coordinates.lng}</p>
      </div>
    </div>
  );
};

const EventDetails: React.FC = () => {
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'tickets' | 'registration'>('tickets');
  const [event] = useState<EventData>(mockEvent);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [attendeeCount] = useState(() => Math.floor(Math.random() * 500) + 50);

  const navigate = (path: string): void => {
    console.log('Navigate to:', path);
    // Implement actual navigation logic (e.g., using React Router)
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const updateQuantity = (ticketName: string, change: number): void => {
    setTicketQuantities((prev) => ({
      ...prev,
      [ticketName]: Math.max(0, (prev[ticketName] || 0) + change)
    }));
  };

  const getTotalPrice = (): number => {
    return Object.entries(ticketQuantities).reduce((total, [ticketName, quantity]) => {
      const ticket = event.ticketTypes.find((t) => t.name === ticketName);
      return total + (ticket ? ticket.price * quantity : 0);
    }, 0);
  };

  const getTotalQuantity = (): number => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getEventDescription = (): string => {
    return event.description || "The organizer hasn't provided a description for this event yet. Check back later for more details!";
  };

  const shouldTruncateDescription = (text: string): boolean => {
    return text.length > 300;
  };

  const getTruncatedDescription = (text: string): string => {
    if (!shouldTruncateDescription(text)) return text;
    return isDescriptionExpanded ? text : `${text.substring(0, 300)}...`;
  };

  interface FormattedDate {
    weekday: string;
    date: string;
    time: string;
  }

  const formatEventDate = (dateString: string): FormattedDate => {
    try {
      const date = new Date(dateString);
      return {
        weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
        date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleDateString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      };
    } catch {
      return {
        weekday: '',
        date: dateString,
        time: event.time || 'Time TBA'
      };
    }
  };

  const eventDate = formatEventDate(event.date);
  const description = getEventDescription();
  const totalPrice = getTotalPrice();
  const totalQuantity = getTotalQuantity();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">EventHub</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Browse Events
              </Button>
              <Button className="bg-blue-500 text-white hover:bg-blue-600">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 z-10" />
        <img 
          src={event.image || "/api/placeholder/1200/600"} 
          alt={event.title}
          className="w-full h-[60vh] object-cover"
          loading="eager"
        />
        
        {/* Hero Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white">
          <div className="container mx-auto max-w-7xl">
            <Button
              variant="secondary"
              onClick={() => navigate("/")}
              className="mb-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
            
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {event.category || 'General Event'}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>{attendeeCount.toLocaleString()} interested</span>
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  {event.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">{eventDate.weekday}</div>
                      <div className="text-sm">{eventDate.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{event.time || eventDate.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">{event.venue || 'Venue TBA'}</div>
                      <div className="text-sm">{event.location || 'Location details coming soon'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 ${isFavorited ? 'text-red-400' : 'text-white'}`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Event Info & Details */}
          <div className="xl:col-span-2 space-y-8">
            {/* Event Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  About This Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {getTruncatedDescription(description)}
                  </p>
                  {shouldTruncateDescription(description) && (
                    <Button
                      variant="link"
                      className="p-0 h-auto mt-2 text-primary"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Read More
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* About Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{eventDate.weekday}</p>
                    <p className="text-muted-foreground">{eventDate.date}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Start Time</p>
                    <p className="text-muted-foreground">{event.time || eventDate.time}</p>
                  </div>
                  {event.endTime && (
                    <div>
                      <p className="font-semibold">End Time</p>
                      <p className="text-muted-foreground">{event.endTime}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Doors open: {event.doorsOpen || '30 minutes before start time'}
                  </div>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{event.venue || 'Venue TBA'}</p>
                    <p className="text-muted-foreground">
                      {event.location || 'Address will be provided closer to the event date'}
                    </p>
                  </div>
                  {event.venue && (
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Maps
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Event Info */}
            {(event.ageRestriction || event.dresscode || event.specialInstructions) && (
              <Card>
                <CardHeader>
                  <CardTitle>Important Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.ageRestriction && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Age Restriction</p>
                        <p className="text-muted-foreground text-sm">{event.ageRestriction}</p>
                      </div>
                    </div>
                  )}
                  {event.dresscode && (
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Dress Code</p>
                        <p className="text-muted-foreground text-sm">{event.dresscode}</p>
                      </div>
                    </div>
                  )}
                  {event.specialInstructions && (
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Special Instructions</p>
                        <p className="text-muted-foreground text-sm">{event.specialInstructions}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Organizer Info */}
            {event.organizer && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={event.organizer.avatar} alt={event.organizer.name} />
                      <AvatarFallback>
                        {event.organizer.name?.split(' ').map(n => n[0]).join('') || 'OR'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{event.organizer.name || 'Event Organizer'}</p>
                      {event.organizer.bio && (
                        <p className="text-muted-foreground text-sm mt-1">{event.organizer.bio}</p>
                      )}
                      {event.organizer.contact && (
                        <Button variant="outline" size="sm" className="mt-3">
                          Contact Organizer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tickets & Registration */}
          <div className="xl:col-span-1 space-y-6">
            {/* Tab Navigation */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button 
                variant="ghost" 
                className={`flex-1 ${activeTab === 'tickets' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setActiveTab('tickets')}
              >
                Buy Tickets
              </Button>
              <Button 
                variant="ghost" 
                className={`flex-1 ${activeTab === 'registration' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setActiveTab('registration')}
              >
                Register
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'tickets' ? (
              /* Tickets Section */
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Select Tickets</h3>
                    <p className="text-xs text-muted-foreground">MAX 10 TICKETS</p>
                  </div>

                  {/* Ticket Types */}
                  <div className="space-y-4">
                    {event.ticketTypes?.length > 0 ? event.ticketTypes.map((ticket, index) => (
                      <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{ticket.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                +${(ticket.price * 0.08).toFixed(2)} service fee
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">${ticket.price}</p>
                            </div>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              Subtotal: ${((ticket.price + ticket.price * 0.08) * (ticketQuantities[ticket.name] || 0)).toFixed(2)}
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(ticket.name, -1)}
                                disabled={!ticketQuantities[ticket.name]}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold">
                                {ticketQuantities[ticket.name] || 0}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(ticket.name, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Ticket information is not available yet.</p>
                        <p className="text-sm mt-2">Please check back later or contact the organizer.</p>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  {getTotalQuantity() > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>Subtotal ({totalQuantity} ticket{totalQuantity !== 1 ? 's' : ''})</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Service fees</span>
                        <span>${(totalPrice * 0.08).toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center font-semibold text-lg">
                        <span>Total</span>
                        <span>${(totalPrice + totalPrice * 0.08).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full h-12 text-lg font-semibold"
                    disabled={totalQuantity === 0 || !event.ticketTypes?.length}
                  >
                    {totalQuantity === 0 ? 'Select Tickets' : 'Proceed to Checkout'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Registration Section */
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Event Registration</h3>
                    <Badge variant="outline">Free</Badge>
                  </div>
                  <EventRegistrationForm event={event} />
                </CardContent>
              </Card>
            )}

            {/* Event Map */}
            {event.coordinates && (
              <div className="rounded-lg overflow-hidden">
                <EventMap 
                  venue={event.venue || 'Event Location'} 
                  location={event.location || 'Location TBA'} 
                  coordinates={event.coordinates}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;