import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, Share2, ExternalLink, Plus, Minus, Clock, User, Mail, Building, Info, Settings, CheckCircle, Mic, Users2, Calendar as CalendarIcon, FileText, Network, Bell, BarChart3, Ticket, Badge as BadgeIcon, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventMap } from "@/components/EventMap";
import { useState } from "react";
import { useEvent } from "@/hooks/useEvent";
import { useMetaTags } from "@/hooks/useMetaTags";
import type { EventData } from "@/types/event";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  
  // Fetch event data using hook
  const { event, isLoading, error } = useEvent(id);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Event not found</h2>
            <p className="text-muted-foreground mb-4">{error || 'The event you are looking for does not exist.'}</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // TypeScript now knows event is EventData (not null)
  const eventData: EventData = event;

  // Set meta tags for social media sharing (Open Graph, Twitter Cards)
  // Normalize frontend URL (remove trailing slash if present)
  const getFrontendUrl = () => {
    const envUrl = import.meta.env.VITE_FRONTEND_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    return window.location.origin;
  };
  
  const frontendUrl = getFrontendUrl();
  
  // Validate ID exists
  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Invalid Event</h2>
            <p className="text-muted-foreground mb-4">Event ID is missing.</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }
  
  const eventUrl = `${frontendUrl}/event/${id}`;
  const eventImage = eventData.image 
    ? (eventData.image.startsWith('http') ? eventData.image : `${frontendUrl}${eventData.image}`)
    : undefined;
  
  const eventDescription = eventData.description 
    ? (eventData.description.length > 160 
        ? `${eventData.description.substring(0, 157)}...` 
        : eventData.description)
    : `Join us for ${eventData.title}${eventData.venue ? ` at ${eventData.venue}` : ''}${eventData.startDate ? ` on ${new Date(eventData.startDate).toLocaleDateString()}` : ''}`;

  useMetaTags({
    title: eventData.title,
    description: eventDescription,
    image: eventImage,
    url: eventUrl,
    type: 'website',
    siteName: 'EventKnit',
  });

  // Share functionality
  const shareUrl = eventUrl;
  const shareText = `Check out ${eventData.title} on EventKnit!${eventData.venue ? `\n📍 ${eventData.venue}` : ''}${eventData.startDate ? `\n📅 ${new Date(eventData.startDate).toLocaleDateString()}` : ''}\n\n${shareUrl}`;

  // Platform-specific share handlers
  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    // Twitter has 280 character limit, optimize text
    const maxTitleLength = 100;
    const twitterTitle = eventData.title.length > maxTitleLength 
      ? `${eventData.title.substring(0, maxTitleLength - 3)}...` 
      : eventData.title;
    const twitterText = `Check out ${twitterTitle} on EventKnit!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      prompt('Copy this link:', shareUrl);
    }
  };

  // Generic share handler (Web Share API - mobile fallback)
  const handleGenericShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventData.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard if Web Share API not available
      handleCopyLink();
    }
  };

  const updateQuantity = (ticketName: string, change: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [ticketName]: Math.max(0, (prev[ticketName] || 0) + change)
    }));
  };

  const handleRegisterClick = () => {
    // Navigate to the registration page first
    navigate(`/event/${id}/register`);
  };

  const handleEventFeatureClick = (section: string) => {
    // Navigate to user dashboard with the specific section
    navigate(`/user/dashboard?section=${section}`, {
      state: {
        eventData: eventData,
        message: `Welcome to ${eventData.title} - ${section.charAt(0).toUpperCase() + section.slice(1)}`
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 pt-24">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6 hover:border-primary hover:bg-primary/5 group transition-all duration-200 border-border bg-background/80 backdrop-blur-sm"
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
              {eventData.image && (
                <img
                  src={eventData.image}
                  alt={eventData.title}
                  className="w-full h-[400px] sm:h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
              )}
              {!eventData.image && (
                <div className="w-full h-[400px] sm:h-[450px] bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-0 mb-3 shadow-lg">
                  {eventData.category}
                </Badge>
                <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">{eventData.title}</h2>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {eventData.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {eventData.time}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Event Details Card */}
            <Card variant="gradient" className="shadow-xl overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Event Time & Date */}
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">When</p>
                    <p className="text-sm text-muted-foreground">
                      {eventData.date} • {eventData.time}
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
                      {eventData.venue}
                      <span className="block text-muted-foreground/80">{eventData.location}</span>
                    </p>
                  </div>
                </div>
                
                {/* Share Options - Hybrid Approach */}
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Share Event</p>
                  
                  {/* Platform-Specific Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp */}
                    <Button
                      variant="outline"
                      onClick={handleWhatsAppShare}
                      className="w-full group hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </Button>

                    {/* Facebook */}
                    <Button
                      variant="outline"
                      onClick={handleFacebookShare}
                      className="w-full group hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>

                    {/* Twitter/X */}
                    <Button
                      variant="outline"
                      onClick={handleTwitterShare}
                      className="w-full group hover:bg-black/5 hover:border-gray-400 hover:text-gray-900 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter
                    </Button>

                    {/* Copy Link */}
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="w-full group hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Generic Share Button (Mobile Web Share API) */}
                  {navigator.share && (
                <Button 
                  variant="outline" 
                      onClick={handleGenericShare}
                      className="w-full group hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <Share2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                      Share via...
                </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Event Map */}
            {eventData.venue && (
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <EventMap 
                  venue={eventData.venue} 
                  location={eventData.location} 
                  coordinates={eventData.coordinates ?? undefined}
                />
              </div>
            )}
          </div>

          {/* Right Column - Event Details & Tickets */}
          <div className="xl:col-span-2 space-y-8">
            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-destructive text-destructive-foreground border-0">
                  {eventData.category}
                </Badge>
                {eventData.ageRestriction && (
                  <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                    <Users className="w-3 h-3 mr-1" />
                    {eventData.ageRestriction}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold">{eventData.title}</h1>
              
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{eventData.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{eventData.time}</span>
                </div>
                <div className="text-sm text-orange-600 font-medium">
                  Doors: 5:30 PM CDT
                </div>
              </div>
              
              {/* Organizers Card */}
              <Card variant="gradient" className="shadow-lg overflow-hidden">
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
                      <h3 className="font-semibold">{eventData.organizerName || (eventData.organizer ? `${eventData.organizer.firstName} ${eventData.organizer.lastName}` : 'Unknown Organizer')}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Event Organizer</p>
                      <div className="flex gap-3 mt-3">
                        <Button variant="outline" size="sm" className="text-xs h-8 hover:bg-primary hover:text-primary-foreground">
                          <ExternalLink className="w-3 h-3 mr-1.5" />
                          Website
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8 hover:bg-primary hover:text-primary-foreground">
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
                {/* About This Event Card */}
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
                        {eventData.fullDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Important Information Card */}
                {(eventData.ageRestriction || eventData.requirements?.length) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Important Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {eventData.ageRestriction && (
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">Age Restriction</p>
                            <p className="text-muted-foreground text-sm">{eventData.ageRestriction}</p>
                          </div>
                        </div>
                      )}
                      {eventData.requirements?.map((req, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">Requirement {i + 1}</p>
                            <p className="text-muted-foreground text-sm">{req}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Additional Information Section */}
                <div className="space-y-6">
                  {/* FAQs */}
                  {eventData.faqs && eventData.faqs.length > 0 && (
                    <Card variant="minimal">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="w-5 h-5 text-primary" />
                          Frequently Asked Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {eventData.faqs.map((faq, index) => (
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
                  {eventData.speakers && eventData.speakers.length > 0 && (
                    <Card variant="minimal">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          Featured Speakers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {eventData.speakers.map((speaker) => (
                            <div key={speaker.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
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
                <Card variant="minimal">
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
                            {eventData.isPrivate ? 'Private Event' : 'Public Event'}
                          </p>
                        </div>
                        <Badge variant={eventData.isPrivate ? 'secondary' : 'default'}> 
                          {eventData.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                      </div>

                      {eventData.registrationDeadline && (
                        <div>
                          <h4 className="font-medium">Registration Deadline</h4>
                          <p className="text-sm text-muted-foreground">
                            {eventData.registrationDeadline}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium">Age Restriction</h4>
                        <p className="text-sm text-muted-foreground">
                          {eventData.ageRestriction}
                        </p>
                      </div>

                      {eventData.requirements && eventData.requirements.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Requirements</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {eventData.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
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

            {/* Event Features Navigation */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Event Features
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Explore all features and activities available for this event
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Speakers */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('speakers')}
                  >
                    <Mic className="w-5 h-5" />
                    <span className="text-sm font-medium">Speakers</span>
                  </Button>

                  {/* Exhibitors */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('exhibitors')}
                  >
                    <Users2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Exhibitors</span>
                  </Button>

                  {/* Agenda */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('agenda')}
                  >
                    <CalendarIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Agenda</span>
                  </Button>

                  {/* Submit Abstract */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('abstracts')}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Submit Abstract</span>
                  </Button>

                  {/* Networking */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('networking')}
                  >
                    <Network className="w-5 h-5" />
                    <span className="text-sm font-medium">Networking</span>
                  </Button>

                  {/* Notifications */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('notifications')}
                  >
                    <Bell className="w-5 h-5" />
                    <span className="text-sm font-medium">Notifications</span>
                  </Button>

                  {/* Analytics */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('analytics')}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-sm font-medium">Analytics</span>
                  </Button>

                  {/* My Event */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('my-event')}
                  >
                    <Ticket className="w-5 h-5" />
                    <span className="text-sm font-medium">My Event</span>
                  </Button>

                  {/* My Badge */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                    onClick={() => handleEventFeatureClick('my-badge')}
                  >
                    <BadgeIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">My Badge</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Ticket Selection */}
            <div className="w-full max-w-[280px] space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Tickets</h2>
              
              {eventData.ticketTypes?.map((ticket, index) => {
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
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          +${(ticket.price * 0.08).toFixed(2)} service fee
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xs">${ticket.price}</div>
                        <div className="text-[10px] text-muted-foreground">per ticket</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-muted-foreground">Quantity</span>
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
      <Footer />
    </div>
  );
};

export default EventDetails;
