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
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Event Details</h2>
                <p className="text-muted-foreground">
                  Don't miss the most anticipated game of the season as the top teams battle it out for the championship title. 
                  Experience the excitement live with amazing performances during halftime.
                </p>
                
              </div>
            </div>
            
            {/* Ticket Selection */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Select Your Tickets</h2>
                <div className="text-sm text-muted-foreground">Maximum 10</div>
              </div>
              
              <div className="space-y-4">
                {event.ticketTypes.map((ticket, index) => {
                  const quantity = ticketQuantities[ticket.name] || 0;
                  const isSelected = quantity > 0;
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium">{ticket.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            +${(ticket.price * 0.08).toFixed(2)} service fee included
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">${ticket.price}</div>
                          <div className="text-xs text-muted-foreground">per ticket</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          Subtotal: <span className="font-medium">${((ticket.price + ticket.price * 0.08) * quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(ticket.name, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center">{quantity}</span>
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
                    </div>
                  );
                })}
                
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Select tickets to continue
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;






// import { useParams, useNavigate } from "react-router-dom";
// import { ArrowLeft, Calendar, MapPin, Users, Share2, ExternalLink, Plus, Minus, Clock, Ticket } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import Navbar from "@/components/Navbar";
// import { EventMap } from "@/components/EventMap";
// import { useState } from "react";
// import { events } from "@/data/events";
// import type { EventItem } from "@/data/events";// // Create a map of event IDs to events
// const eventsById = events.reduce<Record<string, EventItem>>((acc, event) => {
//   acc[event.id] = event;
//   return acc;
// }, {});// const EventDetails = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
//   const event = id ? eventsById[id] : null;//   if (!event) {
//     return (
//       <div className="min-h-screen bg-background">
//         <Navbar />
//         <div className="flex items-center justify-center min-h-[60vh]">
//           <div className="text-center">
//             <h2 className="text-2xl font-bold mb-4">Event not found</h2>
//             <Button onClick={() => navigate('/')}>Back to Home</Button>
//           </div>
//         </div>
//       </div>
//     );
//   }//   const updateQuantity = (ticketName: string, change: number) => {
//     setTicketQuantities(prev => ({
//       ...prev,
//       [ticketName]: Math.max(0, (prev[ticketName] || 0) + change)
//     }));
//   };//   const getTotalPrice = () => {
//     return Object.entries(ticketQuantities).reduce((total, [ticketName, quantity]) => {
//       const ticket = event.ticketTypes.find(t => t.name === ticketName);
//       return total + (ticket ? ticket.price * quantity : 0);
//     }, 0);
//   };//   const getTotalQuantity = () => {
//     return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
//   };//   const handleGetTickets = () => {
//     navigate('/payment', { 
//       state: { 
//         event, 
//         ticketQuantities, 
//         totalPrice: getTotalPrice() + getTotalPrice() * 0.08 
//       } 
//     });
//   };//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
//       <Navbar />//       {/* Back Button */}
//       <div className="container mx-auto px-4 sm:px-6 pt-6">
//         <Button
//           variant="ghost"
//           onClick={() => navigate("/")}
//           className="mb-6 hover:bg-muted group transition-all duration-200"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
//           Back to Events
//         </Button>
//       </div>//       <div className="container mx-auto px-4 sm:px-6 pb-12 max-w-4xl">
//         {/* Event Header */}
//         <div className="mb-8">
//           <div className="flex items-center gap-3 mb-2">
//             <Badge className="bg-red-600 text-white border-0">
//               {event.category}
//             </Badge>
//             <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
//               <Users className="w-3 h-3 mr-1" />
//               {event.ageRestriction}
//             </Badge>
//           </div>
//           <h1 className="text-3xl sm:text-4xl font-bold mb-2">{event.title}</h1>
//           <div className="flex items-center gap-4 text-muted-foreground mb-6">
//             <div className="flex items-center gap-1">
//               <Calendar className="w-4 h-4" />
//               {event.date}
//             </div>
//             <div className="flex items-center gap-1">
//               <Clock className="w-4 h-4" />
//               {event.time} (Doors: 5:30 PM CDT)
//             </div>
//           </div>
//         </div>//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {/* Main Content */}
//           <div className="md:col-span-2 space-y-6">
//             {/* Event Image */}
//             <div className="relative overflow-hidden rounded-xl aspect-video">
//               <img 
//                 src={event.image} 
//                 alt={event.title}
//                 className="w-full h-full object-cover"
//                 loading="eager"
//               />
//             </div>//             {/* Event Description */}
//             <div className="space-y-4">
//               <h2 className="text-xl font-semibold">Event Details</h2>
//               <p className="text-muted-foreground">
//                 Don't miss the most anticipated game of the season as the top teams battle it out for the championship title. 
//                 Experience the excitement live with amazing performances during halftime.
//               </p>//               <div className="grid grid-cols-2 gap-4 pt-4">
//                 <div>
//                   <h3 className="font-medium">Duration</h3>
//                   <p className="text-sm text-muted-foreground">≈ 3 hours</p>
//                 </div>
//                 <div>
//                   <h3 className="font-medium">Venue</h3>
//                   <p className="text-sm text-muted-foreground">{event.venue}</p>
//                 </div>
//                 <div>
//                   <h3 className="font-medium">Location</h3>
//                   <p className="text-sm text-muted-foreground">{event.location}</p>
//                 </div>
//                 <div>
//                   <h3 className="font-medium">Capacity</h3>
//                   <p className="text-sm text-muted-foreground">20,000 seats</p>
//                 </div>
//               </div>
//             </div>//             {/* Venue Map */}
//             <div className="pt-4">
//               <h2 className="text-xl font-semibold mb-4">Location</h2>
//               <div className="rounded-xl overflow-hidden h-64">
//                 <EventMap 
//                   venue={event.venue} 
//                   location={event.location} 
//                   coordinates={event.coordinates}
//                 />
//               </div>
//               <div className="mt-2 flex justify-between items-center">
//                 <p className="text-sm text-muted-foreground">{event.venue}, {event.location}</p>
//                 <Button variant="ghost" size="sm" className="text-primary">
//                   <ExternalLink className="w-4 h-4 mr-2" />
//                   View on map
//                 </Button>
//               </div>
//             </div>
//           </div>//           {/* Ticket Selection */}
//           <div className="space-y-4">
//             <div className="sticky top-4 space-y-4">
//               <h2 className="text-xl font-semibold">Tickets</h2>//               {event.ticketTypes.map((ticket, index) => {
//                 const quantity = ticketQuantities[ticket.name] || 0;
//                 const isSelected = quantity > 0;//                 return (
//                   <div 
//                     key={index}
//                     className={p-4 border rounded-lg transition-all ${ //                       isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50' //                     }}
//                   >
//                     <div className="flex justify-between items-start mb-3">
//                       <div>
//                         <h3 className="font-medium">{ticket.name}</h3>
//                         <p className="text-sm text-muted-foreground">
//                           +${(ticket.price * 0.08).toFixed(2)} service fee
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <div className="font-bold">${ticket.price}</div>
//                         <div className="text-xs text-muted-foreground">per ticket</div>
//                       </div>
//                     </div>//                     <div className="flex items-center justify-between mt-2">
//                       <span className="text-sm">Quantity</span>
//                       <div className="flex items-center gap-2">
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           className="h-8 w-8 p-0 rounded-full"
//                           onClick={() => updateQuantity(ticket.name, -1)}
//                           disabled={!quantity}
//                         >
//                           <Minus className="w-3 h-3" />
//                         </Button>
//                         <span className="w-6 text-center">{quantity}</span>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           className="h-8 w-8 p-0 rounded-full"
//                           onClick={() => updateQuantity(ticket.name, 1)}
//                         >
//                           <Plus className="w-3 h-3" />
//                         </Button>
//                       </div>
//                     </div>//                     {isSelected && (
//                       <div className="mt-3 pt-3 border-t text-sm">
//                         <div className="flex justify-between">
//                           <span>Subtotal:</span>
//                           <span className="font-medium">
//                             ${((ticket.price + ticket.price * 0.08) * quantity).toFixed(2)}
//                           </span>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}//               {getTotalQuantity() > 0 ? (
//                 <div className="space-y-4">
//                   <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
//                     <div className="flex justify-between">
//                       <span>Subtotal ({getTotalQuantity()} ticket{getTotalQuantity() !== 1 ? 's' : ''}):</span>
//                       <span>${getTotalPrice().toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between text-sm text-muted-foreground">
//                       <span>Service fee (8%):</span>
//                       <span>${(getTotalPrice() * 0.08).toFixed(2)}</span>
//                     </div>
//                     <Separator className="my-2" />
//                     <div className="flex justify-between font-semibold">
//                       <span>Total:</span>
//                       <span>${(getTotalPrice() * 1.08).toFixed(2)}</span>
//                     </div>
//                   </div>//                   <Button 
//                     className="w-full h-12 text-base font-semibold"
//                     onClick={handleGetTickets}
//                   >
//                     <Ticket className="w-5 h-5 mr-2" />
//                     Get Tickets
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="text-center py-4 text-sm text-muted-foreground">
//                   Select tickets to continue
//                 </div>
//               )}//               <div className="text-xs text-muted-foreground text-center">
//                 *Service fees apply at checkout
//               </div>//               <Button variant="outline" className="w-full mt-2">
//                 <Share2 className="w-4 h-4 mr-2" />
//                 Share Event
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };// export default EventDetails;

