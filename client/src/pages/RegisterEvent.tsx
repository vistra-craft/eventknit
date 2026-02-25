import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, AlertCircle, Check, RefreshCw, User, Ticket, Minus, Plus, Crown, Clock, CheckCircle, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// App Components
import CheckoutHeader from "@/components/CheckoutHeader";

// Hooks & API
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { registerForEvent, registerAsGuest } from "@/lib/event-api";
import { setAccessToken } from "@/lib/api";
import { validatePromoCode } from "@/lib/promo-code-api";
import type { RegistrationField } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { isVIPTicket, hasDiscount, calculateDiscountPercentage, calculateTimeRemaining, isTicketTypeAvailable } from "@/utils/ticket-helpers";

interface FormData {
  [key: string]: string | number | boolean;
}

interface FormErrors {
  [key: string]: string;
}

const EventRegistration = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user: authUser } = useAuth();
  const { event, isLoading, error: eventError, fetchEvent } = useEvent();
  const [currentStep, setCurrentStep] = useState<'tickets' | 'registration' | 'confirmation'>('tickets');
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [isGuestRegistration, setIsGuestRegistration] = useState(false);
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);
  // Track if URL promo code has been processed
  const urlPromoApplied = useRef(false);
  // Consent state (operational consent is always true, so we don't need state for it)
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [demographicsConsent, setDemographicsConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  // Fetch event data
  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    }
  }, [eventId, fetchEvent]);

  // Auto-populate form data for authenticated users
  useEffect(() => {
    if (isAuthenticated && authUser && Object.keys(formData).length === 0) {
      setFormData({
        'guest-firstName': authUser.firstName || '',
        'guest-lastName': authUser.lastName || '',
        'guest-email': authUser.email || '',
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        email: authUser.email || '',
      });
    }
  }, [isAuthenticated, authUser, formData]);

  // Handle applying promo code - defined before useEffects that depend on it
  const handleApplyPromoCode = useCallback(async (codeToApply?: string) => {
    const code = codeToApply || promoCode;
    if (!code.trim() || !event || !eventId) return;

    setApplyingCode(true);
    setPromoError(null);

    try {
      // Calculate total amount from all selected tickets
      const totalAmount = event.ticketTypes?.reduce((sum, ticket) => {
        const qty = selectedTickets[ticket.name] || 0;
        return sum + (ticket.price * qty);
      }, 0) || 0;

      // Get the first selected ticket type for promo code validation (or null if none)
      const firstSelectedTicketType = Object.keys(selectedTickets).find(name => selectedTickets[name] > 0) || null;

      const response = await validatePromoCode(
        code.trim(),
        eventId,
        firstSelectedTicketType,
        totalAmount
      );

      if (response.success && response.data?.valid) {
        setAppliedDiscount({
          code: response.data.promoCode?.code || code.toUpperCase(),
          amount: response.data.discountAmount || 0,
        });
        setPromoError(null);
        // Update the input field if applying from URL
        if (codeToApply) {
          setPromoCode(code.toUpperCase());
        }
      } else {
        setAppliedDiscount(null);
        setPromoError(response.message || 'Invalid promo code');
      }
    } catch {
      setAppliedDiscount(null);
      setPromoError('Failed to validate promo code');
    } finally {
      setApplyingCode(false);
    }
  }, [promoCode, event, eventId, selectedTickets]);

  // Auto-apply promo code from URL parameter (?promo=CODE)
  useEffect(() => {
    const urlPromoCode = searchParams.get('promo');

    // Only apply if:
    // 1. URL has promo code
    // 2. Event is loaded
    // 3. We haven't already applied it
    // 4. No discount is currently applied
    if (urlPromoCode && event && !urlPromoApplied.current && !appliedDiscount) {
      // Set the promo code in input immediately for UX
      setPromoCode(urlPromoCode.toUpperCase());

      // If tickets are already selected (paid event with tickets), apply immediately
      const hasSelectedTickets = Object.values(selectedTickets).some(qty => qty > 0);
      const isPaidEvent = !event.isFree && event.price !== 0;

      if (isPaidEvent && hasSelectedTickets) {
        urlPromoApplied.current = true;
        handleApplyPromoCode(urlPromoCode);
      } else if (isPaidEvent && !event.ticketTypes?.length) {
        // Paid event with no ticket types - apply immediately
        urlPromoApplied.current = true;
        handleApplyPromoCode(urlPromoCode);
      }
    }
  }, [searchParams, event, selectedTickets, appliedDiscount, handleApplyPromoCode]);

  // Auto-apply URL promo code when tickets are first selected
  useEffect(() => {
    const urlPromoCode = searchParams.get('promo');
    const hasSelectedTickets = Object.values(selectedTickets).some(qty => qty > 0);

    // If URL has promo code, tickets just got selected, and we haven't applied yet
    if (urlPromoCode && hasSelectedTickets && !urlPromoApplied.current && !appliedDiscount && event && !event.isFree) {
      urlPromoApplied.current = true;
      handleApplyPromoCode(urlPromoCode);
    }
  }, [selectedTickets, searchParams, appliedDiscount, event, handleApplyPromoCode]);

  // Skip ticket step for events without ticket types
  useEffect(() => {
    if (event && (!event.ticketTypes || event.ticketTypes.length === 0) && currentStep === 'tickets') {
      setCurrentStep('registration');
    }
  }, [event, currentStep]);

  // Note: Guest checkout is now allowed - no authentication redirect

  // Update ticket quantity for a specific ticket type
  const updateTicketQuantity = (ticketName: string, change: number) => {
    setSelectedTickets((prev) => {
      const currentQty = prev[ticketName] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (newQty === 0) {
        const updated = { ...prev };
        delete updated[ticketName];
        return updated;
    }
      
      return { ...prev, [ticketName]: newQty };
    });
  };

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

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setAppliedDiscount(null);
    setPromoError(null);
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

      // Validate that at least one ticket is selected (if event has ticket types)
      if (event.ticketTypes && event.ticketTypes.length > 0) {
        const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
        if (totalTickets === 0) {
          setSubmitError('Please select at least one ticket');
          setSubmitting(false);
          return;
        }
    }

    try {
      // Prepare registration data
      const registrationData: Record<string, unknown> = {
        ...formData,
      };

      // Convert selectedTickets to tickets array format
      const tickets = Object.entries(selectedTickets)
        .filter(([, qty]) => qty > 0)
        .map(([ticketType, quantity]) => ({
          ticketType,
          quantity,
        }));

      // For backward compatibility, also set ticketType and quantity if only one ticket type
      const ticketType = tickets.length === 1 ? tickets[0].ticketType : undefined;
      const quantity = tickets.length === 1 ? tickets[0].quantity : undefined;

      // Extract email, firstName, lastName from form data for guest checkout
      // Try multiple strategies to find these fields
      let email = '';
      let firstName = '';
      let lastName = '';
      let phoneNumber = '';

      // Strategy 1: Look in registrationFields by type and common patterns
      if (event.registrationFields) {
        for (const field of event.registrationFields) {
          const value = (formData[field.id] as string)?.trim() || '';
          
          // Email field - check by type first
          if (field.type === 'email' && value && !email) {
            email = value;
          }
          
          // First name - check multiple patterns
          const fieldNameLower = field.name?.toLowerCase() || '';
          const fieldLabelLower = field.label?.toLowerCase() || '';
          const fieldIdLower = field.id?.toLowerCase() || '';
          
          if (!firstName && value) {
            if (fieldNameLower.includes('first') || 
                fieldLabelLower.includes('first') || 
                fieldIdLower.includes('first') ||
                fieldNameLower.includes('fname') ||
                fieldLabelLower.includes('fname') ||
                fieldIdLower.includes('fname')) {
              firstName = value;
            }
          }
          
          // Last name - check multiple patterns
          if (!lastName && value) {
            if (fieldNameLower.includes('last') || 
                fieldLabelLower.includes('last') || 
                fieldIdLower.includes('last') ||
                fieldNameLower.includes('lname') ||
                fieldLabelLower.includes('lname') ||
                fieldIdLower.includes('lname') ||
                fieldNameLower.includes('surname') ||
                fieldLabelLower.includes('surname') ||
                fieldIdLower.includes('surname')) {
              lastName = value;
            }
          }
          
          // Phone number
          if (field.type === 'tel' && value && !phoneNumber) {
            phoneNumber = value;
          }
        }
      }
      
      // Strategy 2: Check formData directly with common field names (including guest- prefixed)
      if (!email) {
        email = (formData['guest-email'] as string)?.trim() || 
                (formData.email as string)?.trim() || 
                (formData.Email as string)?.trim() || 
                (formData.EMAIL as string)?.trim() || '';
      }
      
      if (!firstName) {
        firstName = (formData['guest-firstName'] as string)?.trim() || 
                    (formData.firstName as string)?.trim() || 
                    (formData.first_name as string)?.trim() || 
                    (formData.fname as string)?.trim() || 
                    (formData.FirstName as string)?.trim() || '';
      }
      
      if (!lastName) {
        lastName = (formData['guest-lastName'] as string)?.trim() || 
                  (formData.lastName as string)?.trim() || 
                  (formData.last_name as string)?.trim() || 
                  (formData.lname as string)?.trim() || 
                  (formData.LastName as string)?.trim() || 
                  (formData.surname as string)?.trim() || '';
      }
      
      if (!phoneNumber) {
        phoneNumber = (formData.phoneNumber as string)?.trim() || 
                     (formData.phone as string)?.trim() || 
                     (formData.phone_number as string)?.trim() || 
                     (formData.tel as string)?.trim() || '';
      }

      // If user is not authenticated, use guest checkout
      if (!isAuthenticated) {
        // Validate required fields for guest checkout
        const missingFields: string[] = [];
        if (!email) missingFields.push('Email');
        if (!firstName) missingFields.push('First Name');
        if (!lastName) missingFields.push('Last Name');
        
        if (missingFields.length > 0) {
          setSubmitError(`Please fill in the required fields: ${missingFields.join(', ')}. These fields are required for guest registration.`);
          setSubmitting(false);
          return;
        }

        // Register as guest
        const response = await registerAsGuest(eventId, {
          email,
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          tickets: tickets.length > 0 ? tickets : undefined,
          ticketType, // Backward compatibility
          quantity, // Backward compatibility
          registrationData: Object.keys(registrationData).length > 0 ? registrationData : undefined,
          consent: {
            operationalConsent: true, // Always true - required for ticket delivery
            marketingConsent: marketingConsent,
            demographicsConsent: demographicsConsent,
            analyticsConsent: analyticsConsent,
          },
        });

        if (response.success && response.data) {
          const registration = response.data.registration;
          setIsGuestRegistration(response.data.user.isNewUser || true);

          // Store access token if provided (for guest users)
          if (response.data.accessToken) {
            setAccessToken(response.data.accessToken);
          }

          // Check if event is free
          const isFree = event.isFree || event.price === 0;

          if (isFree) {
            // Free event - redirect to confirmation page
            navigate(`/event/${eventId}/registration-confirmation`, {
              state: {
                eventId: eventId,
                eventTitle: event.title,
                eventDate: event.startDate,
                eventTime: event.startTime,
                eventLocation: event.location || event.venue,
                organizerName: event.organizerName || 
                  (event.organizer 
                    ? event.organizer.organizationName ||
                      `${event.organizer.firstName} ${event.organizer.lastName}`
                    : "Event host"),
                registrationId: registration.id,
                tickets: event.ticketTypes?.map(t => ({
                  name: t.name,
                  quantity: selectedTickets[t.name] || 0,
                  price: t.price
                })).filter(t => t.quantity > 0) || [],
                isGuestUser: !isAuthenticated,
                userEmail: email || authUser?.email,
                isFreeEvent: true,
                date: new Date().toISOString(),
                accessToken: response.data.accessToken, // Pass token to confirmation page
              },
              replace: true,
            });
          } else {
            // Calculate total price from all selected tickets
            const totalPrice = event.ticketTypes?.reduce((sum, ticket) => {
              const qty = selectedTickets[ticket.name] || 0;
              return sum + (ticket.price * qty);
            }, 0) || 0;

            // Paid event - navigate to payment page with registration ID
            navigate(`/event/${eventId}/payment`, {
              state: {
                registrationId: registration.id,
                eventId: eventId,
                eventTitle: event.title,
                tickets: event.ticketTypes?.map(t => ({
                  name: t.name,
                  quantity: selectedTickets[t.name] || 0,
                  price: t.price
                })).filter(t => t.quantity > 0) || [],
                totalPrice: totalPrice,
              }
            });
          }
        } else {
          throw new Error(response.message || 'Failed to register for event');
        }
      } else {
        // Authenticated user - use regular registration
      const response = await registerForEvent(eventId, {
        tickets: tickets.length > 0 ? tickets : undefined,
        ticketType, // Backward compatibility
        quantity, // Backward compatibility
        registrationData: Object.keys(registrationData).length > 0 ? registrationData : undefined,
        promoCode: appliedDiscount ? promoCode : undefined,
        consent: {
          operationalConsent: true, // Always true - required for ticket delivery
          marketingConsent: marketingConsent,
          demographicsConsent: demographicsConsent,
          analyticsConsent: analyticsConsent,
        },
      });

      if (response.success && response.data) {
        const registration = response.data.registration;

        // Check if event is free
        const isFree = event.isFree || event.price === 0;

        if (isFree) {
          // Free event - redirect to confirmation page
          navigate(`/event/${eventId}/registration-confirmation`, {
            state: {
              eventId: eventId,
              eventTitle: event.title,
              eventDate: event.startDate,
              eventTime: event.startTime,
              eventLocation: event.location || event.venue,
              organizerName: event.organizerName || 
                (event.organizer 
                  ? event.organizer.organizationName ||
                    `${event.organizer.firstName} ${event.organizer.lastName}`
                  : "Event host"),
              registrationId: registration.id,
              tickets: event.ticketTypes?.map(t => ({
                name: t.name,
                quantity: selectedTickets[t.name] || 0,
                price: t.price
              })).filter(t => t.quantity > 0) || [],
              isGuestUser: false,
              userEmail: authUser?.email,
              isFreeEvent: true,
              date: new Date().toISOString(),
            },
            replace: true,
          });
        } else {
          // Calculate total price from all selected tickets
          const subtotal = event.ticketTypes?.reduce((sum, ticket) => {
            const qty = selectedTickets[ticket.name] || 0;
            return sum + (ticket.price * qty);
          }, 0) || 0;
          const discount = appliedDiscount?.amount || 0;
          const totalPrice = subtotal - discount;

          // Paid event - navigate to payment page with registration ID
          navigate(`/event/${eventId}/payment`, {
            state: {
              registrationId: registration.id,
              eventId: eventId,
              eventTitle: event.title,
              tickets: event.ticketTypes?.map(t => ({
                name: t.name,
                quantity: selectedTickets[t.name] || 0,
                price: t.price
              })).filter(t => t.quantity > 0) || [],
              totalPrice: totalPrice,
              discount: discount,
              promoCode: appliedDiscount ? promoCode : undefined,
            }
          });
        }
      } else {
        throw new Error(response.message || 'Failed to register for event');
        }
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
                  <Checkbox
                    id={`${fieldId}-${option}`}
                    checked={formData[field.id] === option}
                    onCheckedChange={(checked) => handleInputChange(field.id, checked ? option : '')}
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
        <CheckoutHeader />
        <main className="flex-1 flex items-center justify-center py-12 bg-gradient-to-b from-primary/5 via-background to-muted/10">
          <div className="text-center space-y-4">
            <Loader size="lg" className="mx-auto" />
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CheckoutHeader />
        <main className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 via-background to-muted/10">
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
        <CheckoutHeader />
        <main className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 via-background to-muted/10">
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
                <Link to="/">
                  Browse Events
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate =
    event.date || (event.startDate ? new Date(event.startDate).toLocaleDateString() : "Date TBA");
  const formattedTime =
    event.time ||
    (event.startTime
      ? new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "");
  const eventLocation = event.location || event.venue || "Location TBA";
  const hasTicketTypes = !!(event.ticketTypes && event.ticketTypes.length > 0);
  // Step counts: ticket step + registration step + (payment if paid) + confirmation
  const totalSteps = (hasTicketTypes ? 1 : 0) + 1 + (event.isFree ? 1 : 2);
  const currentStepNumber = currentStep === 'tickets' ? 1 : hasTicketTypes ? 2 : 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader backLink={`/event/${eventId}`} backLabel="Back to Event" eventTitle={event.title} />

      <main className="flex-1 pt-6 pb-10 bg-gradient-to-b from-primary/5 via-background to-muted/10">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center py-4 -mt-2">
            <div className="flex items-center space-x-4">
              {hasTicketTypes && (
                <>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep === 'tickets' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                    }`}>1</div>
                    <span className={`ml-2 text-sm ${currentStep === 'tickets' ? 'font-medium' : 'text-muted-foreground'}`}>Tickets</span>
                  </div>
                  <div className="w-8 h-0.5 bg-muted"></div>
                </>
              )}
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep === 'registration' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>{hasTicketTypes ? 2 : 1}</div>
                <span className={`ml-2 text-sm ${currentStep === 'registration' ? 'font-medium' : 'text-muted-foreground'}`}>Registration</span>
              </div>
              <div className="w-8 h-0.5 bg-muted"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  {hasTicketTypes ? 3 : 2}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">{event.isFree ? 'Confirmation' : 'Payment'}</span>
              </div>
              {!event.isFree && (
                <>
                  <div className="w-8 h-0.5 bg-muted"></div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {hasTicketTypes ? 4 : 3}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">Confirmation</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <section className="rounded-2xl bg-background shadow-sm border border-border overflow-hidden">
            <div className="relative h-52 md:h-56 bg-muted">
              {event.image ? (
                <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                  Event image coming soon
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  {event.category || "Upcoming event"}
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold">{event.title}</h1>
              </div>
            </div>
            <div className="p-6 md:p-8 grid gap-6 md:grid-cols-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Date & time</p>
                  <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                  {formattedTime && <p className="text-sm">{formattedTime}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Location</p>
                  <p className="text-sm font-medium text-foreground">{eventLocation}</p>
                  {event.venue && <p className="text-sm">{event.venue}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Organizer</p>
                  <p className="text-sm font-medium text-foreground">
                    {event.organizerName ||
                      (event.organizer
                        ? event.organizer.organizationName ||
                          `${event.organizer.firstName} ${event.organizer.lastName}`
                        : "Event host")}
                  </p>
                  {typeof event.availableSlots === "number" && (
                    <span className="text-xs text-muted-foreground">{event.availableSlots} seats left</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-background shadow-sm border border-border">
            {currentStep === 'tickets' ? (
              /* ── STEP 1: TICKET SELECTION ── */
              <div className="p-6 md:p-8 space-y-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tickets</p>
                    <h2 className="text-2xl font-semibold text-foreground">Select your tickets</h2>
                    <p className="text-sm text-muted-foreground">Choose ticket types and quantities you'd like to purchase.</p>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Step 1 of {totalSteps}</span>
                  </div>
                </div>

                {event.ticketTypes && event.ticketTypes.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">Select Your Tickets</p>
                      <p className="text-sm text-muted-foreground">Choose ticket types and quantities you'd like to purchase</p>
                    </div>
                    <div className="space-y-3">
                      {event.ticketTypes.map((ticket, index) => {
                        const quantity = selectedTickets[ticket.name] || 0;
                        const isVip = isVIPTicket(ticket.name);
                        const availability = isTicketTypeAvailable({
                          availableFrom: ticket.availableFrom || undefined,
                          availableUntil: ticket.availableUntil || undefined,
                          isSoldOut: ticket.isSoldOut,
                        });
                        const isAvailable = availability.available;
                        const isSoldOut = availability.isSoldOut || false;
                        const discounted = hasDiscount({
                          originalPrice: ticket.originalPrice || undefined,
                          price: ticket.price,
                        });
                        const currency = event.currency || '$';

                        return (
                          <div
                            key={index}
                            className={`border rounded-xl p-4 transition-all duration-200 ${
                              isSoldOut
                                ? "border-red-200 bg-red-50/50 opacity-70"
                                : quantity > 0
                                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                : "border-border hover:border-primary/50"
                            } ${!isAvailable && !isSoldOut ? 'opacity-60' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-base">{ticket.name}</h4>
                                  {isSoldOut && (
                                    <Badge
                                      variant="destructive"
                                      className="bg-red-600 text-white hover:bg-red-700 text-[10px] px-2 h-5 font-semibold"
                                    >
                                      SOLD OUT
                                    </Badge>
                                  )}
                                  {!isSoldOut && isVip && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 text-[10px] px-1.5 h-5"
                                    >
                                      <Crown className="w-3 h-3 mr-1" /> VIP
                                    </Badge>
                                  )}
                                </div>
                                {ticket.features && ticket.features.length > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    {ticket.features.join(" • ")}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                {discounted && ticket.originalPrice ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted-foreground line-through">
                                      {currency} {ticket.originalPrice}
                                    </span>
                                    <span className="font-bold text-lg text-primary">
                                      {currency} {ticket.price}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="font-bold text-lg text-primary">
                                    {currency} {ticket.price}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {!isSoldOut && discounted && ticket.originalPrice && (
                                <Badge variant="destructive" className="text-[10px] h-5">
                                  {calculateDiscountPercentage(ticket.originalPrice, ticket.price)}% OFF
                                </Badge>
                              )}
                              {!isSoldOut && ticket.availableUntil && new Date(ticket.availableUntil) > new Date() && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                  <Clock className="w-3 h-3" />
                                  <span>Ends in {calculateTimeRemaining(ticket.availableUntil)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              <span className="text-sm">
                                {isSoldOut ? (
                                  <span className="text-red-600 font-semibold flex items-center gap-1">
                                    <X className="w-4 h-4" /> SOLD OUT
                                  </span>
                                ) : !isAvailable ? (
                                  <span className="text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {availability.reason}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-success">
                                    <CheckCircle className="w-3 h-3" /> Available
                                  </span>
                                )}
                              </span>

                              {/* Quantity Selector */}
                              <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                  variant="outline"
                                      size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateTicketQuantity(ticket.name, -1)}
                                  disabled={quantity === 0 || !isAvailable || isSoldOut}
                                    >
                                  <Minus className="h-4 w-4" />
                                    </Button>
                                <span className={`w-8 text-center font-medium text-sm ${isSoldOut ? 'text-muted-foreground' : ''}`}>
                                  {quantity}
                                </span>
                                    <Button
                                      type="button"
                                  variant="outline"
                                      size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateTicketQuantity(ticket.name, 1)}
                                  disabled={!isAvailable || isSoldOut || (ticket.quantity !== null && ticket.quantity !== undefined && quantity >= ticket.quantity)}
                                    >
                                  <Plus className="h-4 w-4" />
                                    </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Summary */}
                    {Object.values(selectedTickets).some(qty => qty > 0) && (
                      <div className="pt-4 mt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-base font-semibold">Total Tickets</span>
                          <span className="text-base font-semibold">
                            {Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold">Total Price</span>
                          <span className="text-xl font-bold text-primary">
                            {event.currency || '$'}{' '}
                            {event.ticketTypes?.reduce((sum, ticket) => {
                              const qty = selectedTickets[ticket.name] || 0;
                              return sum + (ticket.price * qty);
                            }, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {!event.isFree && Object.values(selectedTickets).some(qty => qty > 0) && (
                      <div className="pt-4 mt-2 border-t space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          Promo code
                        </Label>
                        {!appliedDiscount ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              placeholder="Enter code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleApplyPromoCode();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => handleApplyPromoCode()}
                              disabled={!promoCode.trim() || applyingCode}
                              variant="outline"
                            >
                              {applyingCode ? <Loader size="sm" /> : "Apply"}
                            </Button>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-success bg-success/5 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-success">
                              <CheckCircle className="w-4 h-4" />
                              {appliedDiscount.code}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-success">
                                -{event.currency || '$'} {appliedDiscount.amount.toFixed(2)}
                              </span>
                              <Button type="button" variant="ghost" size="sm" onClick={handleRemovePromoCode}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {promoError && (
                          <Alert variant="destructive" className="text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{promoError}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                  disabled={Object.values(selectedTickets).every(qty => !qty)}
                  onClick={() => setCurrentStep('registration')}
                >
                  Continue to Registration
                </Button>
              </div>
            ) : currentStep === 'registration' ? (
              /* ── STEP 2: REGISTRATION FORM ── */
              <div className="p-6 md:p-8 space-y-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registration</p>
                    <h2 className="text-2xl font-semibold text-foreground">Secure your spot</h2>
                    <p className="text-sm text-muted-foreground">Complete this short form to confirm your attendance.</p>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Step {currentStepNumber} of {totalSteps}</span>
                  </div>
                </div>

                {/* Read-only ticket summary */}
                {hasTicketTypes && Object.values(selectedTickets).some(qty => qty > 0) && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your tickets</p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('tickets')}
                        className="text-xs text-primary hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(selectedTickets)
                        .filter(([, qty]) => qty > 0)
                        .map(([name, qty]) => {
                          const ticket = event.ticketTypes?.find(t => t.name === name);
                          return (
                            <div key={name} className="flex justify-between text-sm">
                              <span className="text-foreground">{qty}× {name}</span>
                              {ticket && <span className="font-medium">{event.currency || '$'} {(ticket.price * qty).toFixed(2)}</span>}
                            </div>
                          );
                        })}
                    </div>
                    {!event.isFree && (
                      <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                        <span>Total</span>
                        <span className="text-primary">
                          {event.currency || '$'} {
                            event.ticketTypes?.reduce((sum, t) => sum + (t.price * (selectedTickets[t.name] || 0)), 0).toFixed(2)
                          }
                          {appliedDiscount && (
                            <span className="ml-2 text-success font-normal text-xs">(-{event.currency || '$'}{appliedDiscount.amount.toFixed(2)} promo)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleRegistrationSubmit} className="space-y-8" autoComplete="on">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      {/* Always show basic fields if not authenticated or if they're missing from custom fields */}
                      {(!isAuthenticated || (!event.registrationFields?.some(f => f.type === 'email'))) && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="guest-firstName" className="text-sm font-medium">
                              First Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="guest-firstName"
                              type="text"
                              placeholder="John"
                              value={formData['guest-firstName'] as string || ''}
                              onChange={(e) => handleInputChange('guest-firstName', e.target.value)}
                              required
                              className={`h-10 ${errors['guest-firstName'] ? "border-destructive" : ""}`}
                            />
                            {errors['guest-firstName'] && (
                              <p className="text-destructive text-sm">{errors['guest-firstName']}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="guest-lastName" className="text-sm font-medium">
                              Last Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="guest-lastName"
                              type="text"
                              placeholder="Doe"
                              value={formData['guest-lastName'] as string || ''}
                              onChange={(e) => handleInputChange('guest-lastName', e.target.value)}
                              required
                              className={`h-10 ${errors['guest-lastName'] ? "border-destructive" : ""}`}
                            />
                            {errors['guest-lastName'] && (
                              <p className="text-destructive text-sm">{errors['guest-lastName']}</p>
                            )}
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="guest-email" className="text-sm font-medium">
                              Email Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="guest-email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={formData['guest-email'] as string || ''}
                              onChange={(e) => handleInputChange('guest-email', e.target.value)}
                              required
                              className={`h-10 ${errors['guest-email'] ? "border-destructive" : ""}`}
                            />
                            {errors['guest-email'] && (
                              <p className="text-destructive text-sm">{errors['guest-email']}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Your ticket will be sent to this email address.
                            </p>
                          </div>
                        </>
                      )}

                      {/* Render Custom Fields */}
                      {event.registrationFields && event.registrationFields.length > 0 && event.registrationFields.map((field) => {
                        // Skip basic fields if we already rendered them manually above
                        if (!isAuthenticated && (
                          field.type === 'email' || 
                          field.name?.toLowerCase().includes('first') || 
                          field.name?.toLowerCase().includes('last')
                        )) {
                          return null;
                        }

                        // Long-form fields (textarea) span both columns
                        if (field.type === "textarea") {
                          return (
                            <div key={field.id} className="md:col-span-2 space-y-2">
                              {renderFormField(field)}
                            </div>
                          );
                        }
                        return (
                          <div key={field.id} className="space-y-2">
                            {renderFormField(field)}
                            {/* Helper text for email/phone */}
                            {field.type === "email" && (
                              <p className="text-xs text-muted-foreground">
                                We'll never share your email.
                              </p>
                            )}
                            {field.type === "tel" && (
                              <p className="text-xs text-muted-foreground">
                                Format: +1 (555) 123-4567
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Data Sharing Consent */}
                    <div className="pt-6 border-t space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Data Sharing Preferences</h3>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="marketingConsent"
                            checked={marketingConsent}
                            onCheckedChange={(checked) => setMarketingConsent(!!checked)}
                          />
                          <label htmlFor="marketingConsent" className="text-sm text-foreground cursor-pointer flex-1">
                            <span className="font-medium">Marketing emails</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              Receive updates about future events from this organizer
                            </span>
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="demographicsConsent"
                            checked={demographicsConsent}
                            onCheckedChange={(checked) => setDemographicsConsent(!!checked)}
                          />
                          <label htmlFor="demographicsConsent" className="text-sm text-foreground cursor-pointer flex-1">
                            <span className="font-medium">Demographic data</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              Share location, age, etc. to help improve future events
                            </span>
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="analyticsConsent"
                            checked={analyticsConsent}
                            onCheckedChange={(checked) => setAnalyticsConsent(!!checked)}
                          />
                          <label htmlFor="analyticsConsent" className="text-sm text-foreground cursor-pointer flex-1">
                            <span className="font-medium">Engagement analytics</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              Allow tracking of email opens and session views
                            </span>
                          </label>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        You can update these anytime.{" "}
                        <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                        .
                      </p>
                    </div>
                    
                    {/* Terms & Conditions */}
                    <div className="pt-6 border-t bg-primary/5 -mx-6 px-6">
                      <div className="flex items-start gap-3 mb-4">
                        <Checkbox
                          id="termsConsent"
                          required
                        />
                        <label htmlFor="termsConsent" className="text-sm text-muted-foreground">
                          I agree to the{" "}
                          <a href="#" className="text-primary hover:underline font-medium">
                            Terms and Conditions
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-primary hover:underline font-medium">
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
                    
                    <div className="flex flex-col sm:flex-row justify-end pt-2 gap-4">
                      {Object.values(selectedTickets).some(qty => qty > 0) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)} ticket{Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0) !== 1 ? 's' : ''} selected
                          </span>
                          {!event?.isFree && event?.price !== 0 && (
                            <span className="font-semibold text-foreground">
                              • {event.currency || '$'}{' '}
                              {event.ticketTypes?.reduce((sum, ticket) => {
                                const qty = selectedTickets[ticket.name] || 0;
                                return sum + (ticket.price * qty);
                              }, 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90 px-8 h-12 text-base font-semibold shadow-md"
                        disabled={submitting || loading || !!(event?.ticketTypes && event.ticketTypes.length > 0 && Object.values(selectedTickets).every(qty => qty === 0))}
                      >
                        {submitting ? (
                          <>
                            <Loader className="mr-2" />
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
              </div>
            ) : (
              <div className="p-8 text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-bounce">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">🎉 You're Going!</h3>
                  <p className="text-muted-foreground">
                    Your registration for <strong>{event.title}</strong> is confirmed.
                  </p>
                </div>
                {isGuestRegistration ? (
                  <div className="rounded-2xl border border-primary bg-primary/5 p-4 text-left space-y-2">
                    <p className="text-sm text-primary">
                      <strong>Check your email!</strong> We've sent a ticket confirmation (with QR code) and an optional account invitation.
                    </p>
                    <p className="text-xs text-primary">
                      Creating an account is optional but lets you manage future registrations faster.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    A confirmation email with your ticket has been sent to your registered email address.
                  </p>
                )}
                <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground space-y-1">
                  <p>
                    {formattedDate}
                    {formattedTime && ` at ${formattedTime}`} — {eventLocation}
                  </p>
                  <p>
                    Organized by{" "}
                    {event.organizerName ||
                      (event.organizer
                        ? event.organizer.organizationName ||
                          `${event.organizer.firstName} ${event.organizer.lastName}`
                        : "Event host")}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Link
                    to="/"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-semibold transition-colors duration-200"
                  >
                    Browse More Events
                  </Link>
                  <Link
                    to="/user/dashboard"
                    className="px-6 py-2 border border-border rounded-full text-foreground/80 hover:bg-muted/40 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default EventRegistration;
