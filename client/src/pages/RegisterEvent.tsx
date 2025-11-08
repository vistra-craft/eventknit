import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Loader2, AlertCircle, Check, RefreshCw, User } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// App Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Hooks & API
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { registerForEvent } from "@/lib/event-api";
import type { EventData, RegistrationField } from "@/types/event";

interface FormData {
  [key: string]: string | number | boolean;
}

interface FormErrors {
  [key: string]: string;
}

const EventRegistration = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { event, isLoading, error: eventError, fetchEvent } = useEvent();
  const [currentStep, setCurrentStep] = useState<'registration' | 'confirmation'>('registration');
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<string>('');
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);

  // Fetch event data
  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    }
  }, [eventId, fetchEvent]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated && eventId) {
      // Redirect to login with return URL
      navigate(`/auth/signin?redirect=/event/${eventId}/register`);
    }
  }, [isAuthenticated, eventId, navigate]);

  // Set default ticket type
  useEffect(() => {
    if (event?.ticketTypes && event.ticketTypes.length > 0 && !selectedTicketType) {
      setSelectedTicketType(event.ticketTypes[0].name);
    }
  }, [event, selectedTicketType]);

  // Get error from event fetch or submit
  const error = eventError || submitError;
  const loading = isLoading;

  const handleInputChange = (fieldId: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: "",
      }));
    }
  };


  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    if (!event || !eventId) {
      setSubmitError('Event not found');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare registration data
      const registrationData: Record<string, unknown> = {
        ...formData,
      };

      // Determine ticket type and quantity
      const ticketType = selectedTicketType || (event.ticketTypes && event.ticketTypes.length > 0 ? event.ticketTypes[0].name : undefined);
      const quantity = ticketQuantity || 1;

      // Register for event
      const response = await registerForEvent(eventId, {
        ticketType,
        quantity,
        registrationData: Object.keys(registrationData).length > 0 ? registrationData : undefined,
      });

      if (response.success && response.data) {
        const registration = response.data.registration;

        // Check if event is free
        const isFree = event.isFree || event.price === 0;

        if (isFree) {
          // Free event - go directly to confirmation
          setCurrentStep('confirmation');
        } else {
          // Calculate total price
          const selectedTicket = event.ticketTypes?.find(t => t.name === ticketType);
          const ticketPrice = selectedTicket?.price || event.price || 0;
          const totalPrice = ticketPrice * quantity;

          // Paid event - navigate to payment page with registration ID
          navigate(`/event/${eventId}/payment`, {
            state: {
              registrationId: registration.id,
              eventId: eventId,
              eventTitle: event.title,
              tickets: event.ticketTypes?.map(t => ({
                name: t.name,
                quantity: t.name === ticketType ? quantity : 0,
                price: t.price
              })).filter(t => t.quantity > 0) || [],
              totalPrice: totalPrice,
            }
          });
        }
      } else {
        throw new Error(response.message || 'Failed to register for event');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Failed to register for event. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };


  const renderFormField = (field: RegistrationField) => {
    const fieldError = errors[field.id];
    const value = formData[field.id] || '';
    const fieldId = `field-${field.id}`;

    const fieldType = field.type as 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox';
    
    switch (fieldType) {
      case "text":
      case "email":
      case "tel":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="mb-1">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? "border-destructive" : ""}
            />
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="mb-1">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? "border-destructive" : ""}
              rows={3}
            />
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="block mb-1">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <select
              id={fieldId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case "radio":
        if (!field.options) return null;
        return (
          <div key={field.id} className="space-y-2">
            <Label className="block mb-1">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={String(value)}
              onValueChange={(val) => handleInputChange(field.id, val)}
              className="space-y-2"
            >
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                  <Label htmlFor={`${fieldId}-${option}`} className="text-sm font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case "checkbox":
        if (!field.options) return null;
        return (
          <div key={field.id} className="space-y-2">
            <Label className="block mb-1">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${fieldId}-${option}`}
                    name={field.name}
                    checked={formData[field.id] === option}
                    onChange={(e) => handleInputChange(field.id, e.target.checked ? option : '')}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <Label htmlFor={`${fieldId}-${option}`} className="text-sm font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Home
              </Button>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Event Not Found
            </h2>
            <p className="text-muted-foreground">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Home
              </Button>
              <Button asChild>
                <Link to="/browse-events">
                  Browse Events
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container max-w-4xl px-4 md:px-6">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="gap-2 hover:border-primary hover:bg-primary/5 transition-all duration-200"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Events
            </Button>
          </div>

          {/* Hero Section */}
          <div className="mb-10">
            <Card variant="default" className="w-full overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Event Image */}
                <div className="md:w-2/5 w-full h-64 md:h-auto relative">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image available</span>
                    </div>
                  )}
                  <Badge className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground">
                    {event.price === 0 ? 'Free' : `$${event.price}`}
                  </Badge>
                </div>
                {/* Event Details */}
                <div className="md:w-3/5 w-full p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h2 className="text-2xl font-bold tracking-tight mb-2">
                        {event.title}
                      </h2>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {event.availableSlots} spots left
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" size="sm" className="gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      Save
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4 4v16h16V4H4zm2 2h12v12H6V6zm3 3v6h6V9H9z" />
                      </svg>
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <span
              className={
                currentStep === "registration" ? "font-bold text-primary" : ""
              }
            >
              1. Registration Info
            </span>
            <span>→</span>
            <span
              className={
                currentStep === "confirmation" ? "font-bold text-primary" : ""
              }
            >
              2. Confirmation
            </span>
          </div>

          {/* Ticket Selection Section */}
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <div className="mb-10">
              {currentStep === "registration" && (
                <Card variant="default" className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      Select Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event.ticketTypes.map((ticket, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer ${
                            selectedTicketType === ticket.name 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTicketType(ticket.name)}
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold">{ticket.name}</h3>
                            {ticket.features && ticket.features.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {ticket.features.join(" • ")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">${ticket.price}</div>
                            <div className="text-sm text-muted-foreground">per ticket</div>
                          </div>
                          <div className="ml-4">
                            <input
                              type="radio"
                              name="selectedTicket"
                              value={ticket.name}
                              checked={selectedTicketType === ticket.name}
                              onChange={() => setSelectedTicketType(ticket.name)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedTicketType && (
                      <div className="mt-4 pt-4 border-t">
                        <Label htmlFor="quantity">Quantity</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                            disabled={ticketQuantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={ticketQuantity}
                            onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketQuantity(ticketQuantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Registration Form Section */}
          <div className="mb-10">
            {currentStep === "registration" && (
              <Card variant="default">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Registration Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleRegistrationSubmit}
                    className="space-y-6"
                    autoComplete="on"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {event.registrationFields && event.registrationFields.length > 0 && event.registrationFields.map((field) => {
                        // Long-form fields (textarea) span both columns
                        if (field.type === "textarea") {
                          return (
                            <div key={field.id} className="md:col-span-2">
                              {renderFormField(field)}
                            </div>
                          );
                        }
                        return (
                          <div key={field.id}>
                            {renderFormField(field)}
                            {/* Helper text for email/phone */}
                            {field.type === "email" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                We'll never share your email.
                              </p>
                            )}
                            {field.type === "tel" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Format: +1 (555) 123-4567
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Terms & Conditions */}
                    <div className="pt-6 border-t">
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="termsConsent"
                          required
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="termsConsent" className="text-sm text-muted-foreground">
                          I agree to the{" "}
                          <a href="#" className="text-primary hover:underline">
                            Terms and Conditions
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-primary hover:underline">
                            Privacy Policy
                          </a>
                          . I understand that my information will be used for event management purposes.
                        </label>
                      </div>
                    </div>
                    
                    {submitError && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between pt-6 border-t gap-4">
                      <Link
                        to={`/event/${eventId}`}
                        className="px-6 py-2 border border-border rounded-full text-foreground/80 hover:bg-accent transition-colors text-center"
                      >
                        Back to Event
                      </Link>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90 px-8"
                        disabled={submitting || loading}
                        autoFocus
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          event?.isFree || event?.price === 0
                            ? "Complete Registration"
                            : "Continue to Payment"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}


            {/* Confirmation Step */}
            {currentStep === "confirmation" && event && (
              <Card variant="default">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Registration Confirmed!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    You have successfully registered for{" "}
                    <strong>{event.title}</strong>. A confirmation email will be
                    sent to your registered email address.
                  </p>
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <h4 className="font-semibold mb-2">Event Details:</h4>
                    <p className="text-sm text-muted-foreground">
                      {event.date} at {event.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Organized by {event.organizerName || (event.organizer ? (event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}`) : 'Unknown Organizer')}
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Link
                      to="/browse-events"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-semibold transition-colors duration-200"
                    >
                      Browse More Events
                    </Link>
                    <Link
                      to="/user/dashboard"
                      className="px-6 py-2 border border-border rounded-full text-foreground/80 hover:bg-accent transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventRegistration;
