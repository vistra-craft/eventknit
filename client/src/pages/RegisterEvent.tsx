import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, AlertCircle, Check, RefreshCw, User, Minus, Plus, CheckCircle, X, ShieldCheck, Tag } from "lucide-react";
import { Loader, LoadingText } from "@/components/ui/loader";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// App Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Hooks & API
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { registerForEvent, registerAsGuest } from "@/lib/event-api";
import { validatePromoCode } from "@/lib/promo-code-api";
import type { RegistrationField } from "@/types/event";
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
  const urlPromoApplied = useRef(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [dataShareConsent, setDataShareConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    if (eventId) fetchEvent(eventId);
  }, [eventId, fetchEvent]);

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

  const handleApplyPromoCode = useCallback(async (codeToApply?: string) => {
    const code = codeToApply || promoCode;
    if (!code.trim() || !event || !eventId) return;
    setApplyingCode(true);
    setPromoError(null);
    try {
      const totalAmount = event.ticketTypes?.reduce((sum, ticket) => {
        const qty = selectedTickets[ticket.name] || 0;
        return sum + (ticket.price * qty);
      }, 0) || 0;
      const firstSelectedTicketType = Object.keys(selectedTickets).find(name => selectedTickets[name] > 0) || null;
      const response = await validatePromoCode(code.trim(), event?.id ?? eventId, firstSelectedTicketType, totalAmount);
      if (response.success && response.data?.valid) {
        setAppliedDiscount({
          code: response.data.promoCode?.code || code.toUpperCase(),
          amount: response.data.discountAmount || 0,
        });
        setPromoError(null);
        if (codeToApply) setPromoCode(code.toUpperCase());
      } else {
        setAppliedDiscount(null);
        setPromoError(response.message || 'Invalid promo code');
      }
    } catch {
      setAppliedDiscount(null);
      setPromoError('Unable to validate promo code. Please check your connection and try again.');
    } finally {
      setApplyingCode(false);
    }
  }, [promoCode, event, eventId, selectedTickets]);

  useEffect(() => {
    const urlPromoCode = searchParams.get('promo');
    if (urlPromoCode && event && event.hasPromoCodes && !urlPromoApplied.current && !appliedDiscount) {
      setPromoCode(urlPromoCode.toUpperCase());
      const hasSelectedTickets = Object.values(selectedTickets).some(qty => qty > 0);
      const isPaidEvent = !event.isFree && event.price !== 0;
      if (isPaidEvent && hasSelectedTickets) {
        urlPromoApplied.current = true;
        handleApplyPromoCode(urlPromoCode);
      } else if (isPaidEvent && !event.ticketTypes?.length) {
        urlPromoApplied.current = true;
        handleApplyPromoCode(urlPromoCode);
      }
    }
  }, [searchParams, event, selectedTickets, appliedDiscount, handleApplyPromoCode]);

  useEffect(() => {
    const urlPromoCode = searchParams.get('promo');
    const hasSelectedTickets = Object.values(selectedTickets).some(qty => qty > 0);
    if (urlPromoCode && hasSelectedTickets && !urlPromoApplied.current && !appliedDiscount && event && !event.isFree && event.hasPromoCodes) {
      urlPromoApplied.current = true;
      handleApplyPromoCode(urlPromoCode);
    }
  }, [selectedTickets, searchParams, appliedDiscount, event, handleApplyPromoCode]);

  useEffect(() => {
    if (event && (!event.ticketTypes || event.ticketTypes.length === 0) && currentStep === 'tickets') {
      setCurrentStep('registration');
    }
  }, [event, currentStep]);

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

  const error = eventError || submitError;
  const loading = isLoading;

  const handleInputChange = (fieldId: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: "" }));
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

    if (!termsConsent || !dataShareConsent) {
      setSubmitError('Please accept the required consent checkboxes to continue.');
      setSubmitting(false);
      return;
    }

    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
      if (totalTickets === 0) {
        setSubmitError('Please select at least one ticket');
        setSubmitting(false);
        return;
      }
    }

    try {
      const registrationData: Record<string, unknown> = { ...formData };
      const tickets = Object.entries(selectedTickets)
        .filter(([, qty]) => qty > 0)
        .map(([ticketType, quantity]) => ({ ticketType, quantity }));
      const ticketType = tickets.length === 1 ? tickets[0].ticketType : undefined;
      const quantity = tickets.length === 1 ? tickets[0].quantity : undefined;

      let email = '';
      let firstName = '';
      let lastName = '';
      let phoneNumber = '';

      if (event.registrationFields) {
        for (const field of event.registrationFields) {
          const value = (formData[field.id] as string)?.trim() || '';
          if (field.type === 'email' && value && !email) email = value;
          const fieldNameLower = field.name?.toLowerCase() || '';
          const fieldLabelLower = field.label?.toLowerCase() || '';
          const fieldIdLower = field.id?.toLowerCase() || '';
          if (!firstName && value) {
            if (fieldNameLower.includes('first') || fieldLabelLower.includes('first') || fieldIdLower.includes('first') ||
                fieldNameLower.includes('fname') || fieldLabelLower.includes('fname') || fieldIdLower.includes('fname')) {
              firstName = value;
            }
          }
          if (!lastName && value) {
            if (fieldNameLower.includes('last') || fieldLabelLower.includes('last') || fieldIdLower.includes('last') ||
                fieldNameLower.includes('lname') || fieldLabelLower.includes('lname') || fieldIdLower.includes('lname') ||
                fieldNameLower.includes('surname') || fieldLabelLower.includes('surname') || fieldIdLower.includes('surname')) {
              lastName = value;
            }
          }
          if (field.type === 'phone' && value && !phoneNumber) phoneNumber = value;
        }
      }

      if (!email) email = (formData['guest-email'] as string)?.trim() || (formData.email as string)?.trim() || (formData.Email as string)?.trim() || '';
      if (!firstName) firstName = (formData['guest-firstName'] as string)?.trim() || (formData.firstName as string)?.trim() || (formData.first_name as string)?.trim() || '';
      if (!lastName) lastName = (formData['guest-lastName'] as string)?.trim() || (formData.lastName as string)?.trim() || (formData.last_name as string)?.trim() || (formData.surname as string)?.trim() || '';
      if (!phoneNumber) phoneNumber = (formData.phoneNumber as string)?.trim() || (formData.phone as string)?.trim() || '';

      if (!isAuthenticated) {
        const missingFields: string[] = [];
        if (!email) missingFields.push('Email');
        if (!firstName) missingFields.push('First Name');
        if (!lastName) missingFields.push('Last Name');
        if (missingFields.length > 0) {
          setSubmitError(`Please fill in the required fields: ${missingFields.join(', ')}.`);
          setSubmitting(false);
          return;
        }

        const response = await registerAsGuest(event.id, {
          email, firstName, lastName,
          phoneNumber: phoneNumber || undefined,
          tickets: tickets.length > 0 ? tickets : undefined,
          ticketType, quantity,
          registrationData: Object.keys(registrationData).length > 0 ? registrationData : undefined,
          consent: { marketingConsent },
        });

        if (response.success && response.data) {
          const registration = response.data.registration;
          setIsGuestRegistration(response.data.user.isNewUser || true);
          const isFree = event.isFree || event.price === 0;
          if (isFree) {
            navigate(`/event/${eventId}/registration-confirmation`, {
              state: {
                eventId, eventTitle: event.title, eventDate: event.startDate, eventTime: event.startTime,
                eventLocation: event.location || event.venue,
                organizerName: event.organizerName || (event.organizer ? event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}` : "Event host"),
                registrationId: registration.id,
                tickets: event.ticketTypes?.map(t => ({ name: t.name, quantity: selectedTickets[t.name] || 0, price: t.price })).filter(t => t.quantity > 0) || [],
                isGuestUser: !isAuthenticated, isNewUser: response.data.user.isNewUser,
                userEmail: email || authUser?.email, isFreeEvent: true, date: new Date().toISOString(),
              }, replace: true,
            });
          } else {
            const calculatedTotalPrice = event.ticketTypes?.reduce((sum, ticket) => {
              const qty = selectedTickets[ticket.name] || 0;
              return sum + (ticket.price * qty);
            }, 0) || 0;
            const totalPrice = Number(registration.totalAmount ?? calculatedTotalPrice);

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
                isNewUser: response.data.user.isNewUser,
                userEmail: email || authUser?.email,
                userFirstName: firstName || undefined,
                userLastName: lastName || undefined,
                userPhone: phoneNumber || undefined,
              }
            });
          }
        } else {
          throw new Error(response.message || 'Registration failed. Please try again.');
        }
      } else {
        const response = await registerForEvent(event.id, {
          tickets: tickets.length > 0 ? tickets : undefined,
          ticketType, quantity,
          registrationData: Object.keys(registrationData).length > 0 ? registrationData : undefined,
          promoCode: appliedDiscount ? promoCode : undefined,
          consent: { marketingConsent },
        });

        if (response.success && response.data) {
          const registration = response.data.registration;
          const isFree = event.isFree || event.price === 0;
          if (isFree) {
            navigate(`/event/${eventId}/registration-confirmation`, {
              state: {
                eventId, eventTitle: event.title, eventDate: event.startDate, eventTime: event.startTime,
                eventLocation: event.location || event.venue,
                organizerName: event.organizerName || (event.organizer ? event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}` : "Event host"),
                registrationId: registration.id,
                tickets: event.ticketTypes?.map(t => ({ name: t.name, quantity: selectedTickets[t.name] || 0, price: t.price })).filter(t => t.quantity > 0) || [],
                isGuestUser: false, userEmail: authUser?.email, isFreeEvent: true, date: new Date().toISOString(),
              }, replace: true,
            });
          } else {
            const subtotalAmt = event.ticketTypes?.reduce((sum, ticket) => sum + (ticket.price * (selectedTickets[ticket.name] || 0)), 0) || 0;
            const discountAmt = appliedDiscount?.amount || 0;
            navigate(`/event/${eventId}/payment`, {
              state: {
                registrationId: registration.id, eventId, eventTitle: event.title,
                tickets: event.ticketTypes?.map(t => ({ name: t.name, quantity: selectedTickets[t.name] || 0, price: t.price })).filter(t => t.quantity > 0) || [],
                totalPrice: subtotalAmt - discountAmt, discount: discountAmt,
                promoCode: appliedDiscount ? promoCode : undefined,
              }
            });
          }
        } else {
          throw new Error(response.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Something went wrong with your registration. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (field: RegistrationField) => {
    const fieldError = errors[field.id];
    const value = formData[field.id] || '';
    const fieldId = `field-${field.id}`;
    const fieldType = field.type as 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox';

    switch (fieldType) {
      case "text":
      case "email":
      case "phone":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            <Input id={fieldId} type={field.type} placeholder={field.placeholder} value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? "border-destructive" : ""} />
            {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          </div>
        );
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            <Textarea id={fieldId} placeholder={field.placeholder} value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? "border-destructive" : ""} rows={3} />
            {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          </div>
        );
      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="block">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            <select id={fieldId} value={String(value)} onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select an option</option>
              {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          </div>
        );
      case "radio":
        if (!field.options) return null;
        return (
          <div key={field.id} className="space-y-2">
            <Label className="block">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            <RadioGroup value={String(value)} onValueChange={(val) => handleInputChange(field.id, val)} className="space-y-2">
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                  <Label htmlFor={`${fieldId}-${option}`} className="text-sm font-normal">{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          </div>
        );
      case "checkbox":
        if (!field.options) return null;
        return (
          <div key={field.id} className="space-y-2">
            <Label className="block">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            <div className="space-y-2">
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox id={`${fieldId}-${option}`} checked={formData[field.id] === option}
                    onCheckedChange={(checked) => handleInputChange(field.id, checked ? option : '')} />
                  <Label htmlFor={`${fieldId}-${option}`} className="text-sm font-normal">{option}</Label>
                </div>
              ))}
            </div>
            {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-background" style={{ paddingTop: 72 }}>
          <LoadingText text="Loading event details..." size="md" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 bg-background" style={{ paddingTop: 72 }}>
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
              <Button onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
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
        <main className="flex-1 flex items-center justify-center p-4 bg-background" style={{ paddingTop: 72 }}>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Event Not Found</h2>
            <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
            <div className="flex justify-center gap-4 pt-2">
              <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
              <Button asChild><Link to="/">Browse Events</Link></Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const formattedDate = event.date || (event.startDate ? new Date(event.startDate).toLocaleDateString() : "Date TBA");
  const formattedTime = event.time || (event.startTime ? new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
  const eventLocation = event.location || event.venue || "Location TBA";
  const hasTicketTypes = !!(event.ticketTypes && event.ticketTypes.length > 0);
  const currency = event.currency || 'KES';
  const hasSelectedAnyTicket = Object.values(selectedTickets).some(qty => qty > 0);
  const totalTicketCount = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const subtotalAmount = event.ticketTypes?.reduce((sum, t) => sum + (t.price * (selectedTickets[t.name] || 0)), 0) || 0;
  const discountAmount = appliedDiscount?.amount || 0;
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);

  const stepperSteps = [
    ...(hasTicketTypes ? [{ label: 'Tickets', key: 'tickets' }] : []),
    { label: 'Registration', key: 'registration' },
    { label: event.isFree ? 'Confirmation' : 'Payment', key: 'payment' },
    ...(!event.isFree ? [{ label: 'Confirmation', key: 'done' }] : []),
  ];

  const getStepStatus = (key: string): 'completed' | 'active' | 'upcoming' => {
    if (key === 'tickets') return currentStep !== 'tickets' ? 'completed' : 'active';
    if (key === 'registration') {
      if (currentStep === 'confirmation') return 'completed';
      return currentStep === 'registration' ? 'active' : 'upcoming';
    }
    return 'upcoming';
  };

  const submitLabel = event.isFree || event.price === 0 ? 'Complete Registration' : 'Continue to Payment';

  // ── Shared sub-components (inline, using closure state) ───────────────────

  const OrderSummaryPanel = ({ showCta, isForm }: { showCta: boolean; isForm?: boolean }) => (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl shadow-black/[0.06] dark:shadow-black/20">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm text-center font-semibold text-foreground">Order Summary</h3>
      </div>

      {/* Event recap */}
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <p className="text-sm font-medium text-foreground line-clamp-1">{event.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3 shrink-0" />
          {formattedDate}{formattedTime ? ` · ${formattedTime}` : ''}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 shrink-0" />
          {eventLocation}
        </p>
      </div>

      {/* Line items */}
      <div className="px-5 py-4 min-h-[72px]">
        {hasSelectedAnyTicket ? (
          <div className="space-y-2">
            {Object.entries(selectedTickets)
              .filter(([, qty]) => qty > 0)
              .map(([name, qty]) => {
                const t = event.ticketTypes?.find(tt => tt.name === name);
                return (
                  <div key={name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground flex-1 min-w-0 truncate">{qty}× {name}</span>
                    <span className="font-medium text-foreground shrink-0">
                      {t?.price === 0 ? 'Free' : `${currency} ${((t?.price || 0) * qty).toLocaleString()}`}
                    </span>
                  </div>
                );
              })}
            {currentStep === 'registration' && (
              <button type="button" onClick={() => setCurrentStep('tickets')}
                className="text-xs text-primary hover:underline mt-1 block">
                Change tickets
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">No tickets selected yet</p>
        )}
      </div>

      {/* Promo code — tickets step only, paid events only */}
      {currentStep === 'tickets' && !event.isFree && event.hasPromoCodes && hasSelectedAnyTicket && (
        <div className="px-5 pb-4 border-t border-border pt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Promo code
          </p>
          {!appliedDiscount ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 h-9 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromoCode(); } }}
              />
              <Button type="button" variant="outline" size="sm" className="h-9 px-3 shrink-0"
                onClick={() => handleApplyPromoCode()} disabled={!promoCode.trim() || applyingCode}>
                {applyingCode ? <Loader size="sm" /> : 'Apply'}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-success/40 bg-success/5 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle className="w-3.5 h-3.5" />
                {appliedDiscount.code}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-success">-{currency} {appliedDiscount.amount.toLocaleString()}</span>
                <button type="button" onClick={handleRemovePromoCode} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          {promoError && <p className="text-xs text-destructive">{promoError}</p>}
        </div>
      )}

      {/* Read-only promo line on registration step */}
      {currentStep === 'registration' && appliedDiscount && (
        <div className="px-5 pb-3 border-t border-border pt-3">
          <div className="flex items-center justify-between text-xs text-success">
            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {appliedDiscount.code}</span>
            <span>-{currency} {appliedDiscount.amount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Totals */}
      {hasSelectedAnyTicket && (
        <div className="px-5 py-4 border-t border-border space-y-2 bg-muted/10">
          {!event.isFree && subtotalAmount !== totalAmount && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{currency} {subtotalAmount.toLocaleString()}</span>
            </div>
          )}
          {appliedDiscount && (
            <div className="flex justify-between text-sm text-success">
              <span>Discount</span>
              <span>−{currency} {discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t-2 border-primary/20">
            <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {totalAmount === 0 ? 'Free' : `${currency} ${totalAmount.toLocaleString()}`}
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      {showCta && (
        <div className="px-5 pb-5 pt-4 space-y-2">
          {isForm ? (
            <Button
              type="submit"
              className="w-full h-11 font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200"
              disabled={submitting || loading || !termsConsent || !dataShareConsent || !!(hasTicketTypes && Object.values(selectedTickets).every(qty => qty === 0))}
            >
              {submitting ? <><Loader size="sm" className="mr-2" />Processing…</> : submitLabel}
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full h-11 font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200"
              disabled={!hasSelectedAnyTicket}
              onClick={() => setCurrentStep('registration')}
            >
              Continue to Registration
            </Button>
          )}
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Secure checkout</span>
          </div>
        </div>
      )}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[88px] pb-16 lg:pb-10 bg-[#f8f7f6] dark:bg-background">
        <div className="max-w-5xl mx-auto px-4 space-y-5">

          {/* Stepper */}
          <div className="flex items-start justify-center pt-4 pb-2">
            {stepperSteps.map((step, i) => {
              const status = getStepStatus(step.key);
              const isLast = i === stepperSteps.length - 1;
              const isCompleted = status === 'completed';
              const isActive = status === 'active';
              return (
                <div key={step.key} className="flex items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                      isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                      isActive    ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25 ring-4 ring-primary/15' :
                                    'bg-background border-border text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : <span>{i + 1}</span>}
                    </div>
                    <span className={`mt-2 text-xs font-medium whitespace-nowrap hidden sm:block transition-colors duration-300 ${
                      isActive ? 'text-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                    }`}>{step.label}</span>
                  </div>
                  {!isLast && (
                    <div className="mt-[17px] mx-2 sm:mx-3 w-12 sm:w-20 h-0.5 rounded-full overflow-hidden bg-border">
                      <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'w-full bg-primary' : 'w-0'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Event header card — full width across all steps */}
          <section className="rounded-2xl bg-background shadow-sm border border-border overflow-hidden">
            <div className="relative h-44 md:h-52 bg-muted">
              {event.image ? (
                <img src={event.image} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                  No event image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
                <p className="text-[11px] uppercase tracking-widest text-white/70 font-medium">
                  {event.category || "Upcoming event"}
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold leading-tight">{event.title}</h1>
              </div>
            </div>
            <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 border-t border-border bg-muted/20">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground leading-none mb-0.5">Date & Time</p>
                  <p className="text-sm font-medium text-foreground truncate">{formattedDate}{formattedTime ? ` · ${formattedTime}` : ''}</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-7 bg-border mx-4 shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground leading-none mb-0.5">Location</p>
                  <p className="text-sm font-medium text-foreground truncate">{eventLocation}</p>
                  {event.venue && event.venue !== eventLocation && <p className="text-xs text-muted-foreground truncate">{event.venue}</p>}
                </div>
              </div>
              <div className="hidden sm:block w-px h-7 bg-border mx-4 shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground leading-none mb-0.5">Organizer</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.organizerName || (event.organizer ? event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}` : "Event host")}
                  </p>
                  {typeof event.availableSlots === "number" && (
                    <p className="text-xs text-muted-foreground">{event.availableSlots} seats left</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── STEP 1: TICKET SELECTION ─────────────────────────────────── */}
          {currentStep === 'tickets' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

              {/* Left — ticket tiers */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">Select Tickets</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Choose the option that works for you.</p>
                </div>

                {/* Pricing-tier grid — echoes subscription plan layouts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.ticketTypes && event.ticketTypes.length > 0 ? (
                    event.ticketTypes.map((ticket, index) => {
                      const qty = selectedTickets[ticket.name] || 0;
                      const isVip = isVIPTicket(ticket.name);
                      const availability = isTicketTypeAvailable({
                        availableFrom: ticket.availableFrom || undefined,
                        availableUntil: ticket.availableUntil || undefined,
                        isSoldOut: ticket.isSoldOut,
                      });
                      const isAvailable = availability.available;
                      const isSoldOut = availability.isSoldOut || false;
                      const discounted = hasDiscount({ originalPrice: ticket.originalPrice || undefined, price: ticket.price });
                      const atLimit = ticket.quantity !== null && ticket.quantity !== undefined && qty >= ticket.quantity;
                      const isLowStock = !!(ticket.quantity !== null && ticket.quantity !== undefined && ticket.quantity <= 10);

                      // Tier color system — full strings required for Tailwind purge
                      const tierPalette = [
                        { stripe: 'bg-sky-500',     dot: 'bg-sky-400',     label: 'text-sky-600 dark:text-sky-400',     activeBorder: 'border-sky-400/60',     activeShadow: 'shadow-sky-500/[0.08]',     tier: 'Standard' },
                        { stripe: 'bg-emerald-500', dot: 'bg-emerald-400', label: 'text-emerald-600 dark:text-emerald-400', activeBorder: 'border-emerald-400/60', activeShadow: 'shadow-emerald-500/[0.08]', tier: 'Popular'  },
                        { stripe: 'bg-violet-500',  dot: 'bg-violet-400',  label: 'text-violet-600 dark:text-violet-400',  activeBorder: 'border-violet-400/60',  activeShadow: 'shadow-violet-500/[0.08]',  tier: 'Premium'  },
                      ];
                      const vipPalette = { stripe: 'bg-amber-500', dot: 'bg-amber-400', label: 'text-amber-600 dark:text-amber-400', activeBorder: 'border-amber-400/60', activeShadow: 'shadow-amber-500/[0.08]', tier: 'VIP' };
                      const palette = isVip ? vipPalette : tierPalette[index % tierPalette.length];

                      return (
                        <div
                          key={index}
                          className={`group relative rounded-2xl bg-card overflow-hidden flex flex-col transition-all duration-300 ease-out ${
                            isSoldOut
                              ? 'border border-border/40 opacity-60 cursor-not-allowed'
                              : qty > 0
                                ? `cursor-pointer border-2 ${palette.activeBorder} shadow-lg ${palette.activeShadow} hover:scale-[1.02] hover:shadow-xl hover:z-10 active:scale-[0.98]`
                                : `cursor-pointer border border-border/60 hover:border-border hover:scale-[1.02] hover:shadow-lg hover:shadow-black/[0.07] hover:z-10 active:scale-[0.98]`
                          } ${!isAvailable && !isSoldOut ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {/* Diagonal corner splash — brightens on hover via group */}
                          <div className="absolute top-0 right-0 w-[100px] h-[100px] overflow-hidden rounded-tr-2xl pointer-events-none">
                            <div className={`absolute top-3 -right-8 w-[100px] h-[100px] rotate-45 ${palette.stripe} opacity-[0.18] dark:opacity-[0.10] transition-opacity duration-200 group-hover:opacity-[0.30] dark:group-hover:opacity-[0.18]`} />
                          </div>

                          {/* 2px top color accent line */}
                          <div className={`h-[2px] w-full shrink-0 ${palette.stripe}`} />

                          <div className="p-5 flex flex-col flex-1">
                            {/* Tier label row */}
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${palette.label}`}>
                                {palette.tier}
                              </p>
                              {isSoldOut && (
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 font-medium">Sold out</span>
                              )}
                              {!isSoldOut && discounted && ticket.originalPrice && (
                                <span className={`text-[10px] font-semibold ${palette.label}`}>
                                  -{calculateDiscountPercentage(ticket.originalPrice, ticket.price)}% off
                                </span>
                              )}
                            </div>

                            {/* Ticket name */}
                            <h4 className="font-bold text-xl text-foreground leading-tight pr-10">{ticket.name}</h4>

                            {/* Price — the visual hero */}
                            <div className="mt-4 mb-4">
                              {discounted && ticket.originalPrice && (
                                <p className="text-xs text-muted-foreground/40 line-through tabular-nums mb-0.5">
                                  {currency} {Number(ticket.originalPrice).toLocaleString()}
                                </p>
                              )}
                              {ticket.price === 0 ? (
                                <span className="text-3xl font-bold text-success">Free</span>
                              ) : (
                                <div className="flex items-start gap-1 tabular-nums">
                                  <span className="text-sm text-muted-foreground/50 mt-1.5 font-medium">{currency}</span>
                                  <span className={`text-3xl font-bold tracking-tight leading-none ${isSoldOut ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                                    {ticket.price.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <p className="text-[11px] text-muted-foreground/40 mt-0.5">per ticket</p>
                            </div>

                            {/* Features — dotted list using tier color */}
                            {ticket.features && ticket.features.length > 0 && (
                              <ul className="space-y-1.5 mb-3 flex-1">
                                {ticket.features.map((f) => (
                                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className={`w-1 h-1 rounded-full shrink-0 ${palette.dot}`} />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Countdown */}
                            {!isSoldOut && ticket.availableUntil && new Date(ticket.availableUntil) > new Date() && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
                                Ends in {calculateTimeRemaining(ticket.availableUntil)}
                              </p>
                            )}

                            {/* Unavailability */}
                            {!isSoldOut && !isAvailable && (
                              <p className="text-[11px] text-destructive mb-2">{availability.reason}</p>
                            )}

                            {/* Bottom: scarcity + stepper */}
                            <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                              <span className={`text-xs shrink-0 ${
                                isSoldOut ? 'text-muted-foreground/40' :
                                isLowStock ? 'text-destructive font-medium' :
                                'text-muted-foreground/50'
                              }`}>
                                {isSoldOut
                                  ? 'Unavailable'
                                  : isLowStock && ticket.quantity
                                    ? `Only ${ticket.quantity} left`
                                    : ticket.quantity
                                      ? `${ticket.quantity} available`
                                      : ''}
                              </span>

                              {!isSoldOut && isAvailable && (
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateTicketQuantity(ticket.name, -1)}
                                    disabled={qty === 0}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 ${
                                      qty === 0
                                        ? 'text-foreground/15 cursor-not-allowed'
                                        : 'text-foreground/50 hover:text-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className={`w-6 text-center text-sm font-semibold tabular-nums select-none transition-colors duration-150 ${
                                    qty > 0 ? 'text-foreground' : 'text-foreground/20'
                                  }`}>
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateTicketQuantity(ticket.name, 1)}
                                    disabled={atLimit}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 ${
                                      atLimit
                                        ? 'text-foreground/15 cursor-not-allowed'
                                        : 'text-foreground/50 hover:text-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center">
                      <p className="text-sm text-muted-foreground">No ticket types available for this event.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Right — sticky order summary (desktop only) */}
              <div className="hidden lg:block">
                <div className="sticky top-[96px]">
                  <OrderSummaryPanel showCta={true} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: REGISTRATION FORM ────────────────────────────────── */}
          {currentStep === 'registration' && (
            <form onSubmit={handleRegistrationSubmit} autoComplete="on">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

                {/* Left — form fields */}
                <section className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
                  <div className="px-6 py-5 border-b border-border bg-gradient-to-b from-muted/40 to-transparent">
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">Your Details</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">We'll use this to confirm your registration and send your tickets.</p>
                  </div>

                  <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      {(!isAuthenticated || (!event.registrationFields?.some(f => f.type === 'email'))) && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="guest-firstName" className="text-sm font-medium">First Name <span className="text-destructive">*</span></Label>
                            <Input id="guest-firstName" type="text" placeholder="John"
                              value={formData['guest-firstName'] as string || ''}
                              onChange={(e) => handleInputChange('guest-firstName', e.target.value)}
                              required className={`h-10 ${errors['guest-firstName'] ? "border-destructive" : ""}`} />
                            {errors['guest-firstName'] && <p className="text-destructive text-sm">{errors['guest-firstName']}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="guest-lastName" className="text-sm font-medium">Last Name <span className="text-destructive">*</span></Label>
                            <Input id="guest-lastName" type="text" placeholder="Doe"
                              value={formData['guest-lastName'] as string || ''}
                              onChange={(e) => handleInputChange('guest-lastName', e.target.value)}
                              required className={`h-10 ${errors['guest-lastName'] ? "border-destructive" : ""}`} />
                            {errors['guest-lastName'] && <p className="text-destructive text-sm">{errors['guest-lastName']}</p>}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="guest-email" className="text-sm font-medium">Email Address <span className="text-destructive">*</span></Label>
                            <Input id="guest-email" type="email" placeholder="your.email@example.com"
                              value={formData['guest-email'] as string || ''}
                              onChange={(e) => handleInputChange('guest-email', e.target.value)}
                              required className={`h-10 ${errors['guest-email'] ? "border-destructive" : ""}`} />
                            {errors['guest-email'] && <p className="text-destructive text-sm">{errors['guest-email']}</p>}
                            <p className="text-xs text-muted-foreground">Your ticket will be sent to this email address.</p>
                          </div>
                        </>
                      )}

                      {event.registrationFields && event.registrationFields.length > 0 && event.registrationFields.map((field) => {
                        if (!isAuthenticated && (field.type === 'email' || field.name?.toLowerCase().includes('first') || field.name?.toLowerCase().includes('last'))) return null;
                        if (field.type === "textarea") {
                          return <div key={field.id} className="md:col-span-2 space-y-2">{renderFormField(field)}</div>;
                        }
                        return (
                          <div key={field.id} className="space-y-2">
                            {renderFormField(field)}
                            {field.type === "email" && <p className="text-xs text-muted-foreground">We'll never share your email.</p>}
                            {field.type === "phone" && <p className="text-xs text-muted-foreground">Format: +1 (555) 123-4567</p>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Consent */}
                    <div className="pt-2 border-t border-border space-y-4">
                      <h3 className="text-sm font-semibold text-foreground pt-2">Consent & Data Sharing</h3>
                      <div className="flex items-start gap-3">
                        <Checkbox id="termsConsent" checked={termsConsent} onCheckedChange={(c) => setTermsConsent(!!c)} className="mt-0.5" />
                        <label htmlFor="termsConsent" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          I agree to EventKnit's{" "}
                          <Link to="/terms-of-service" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>{" "}
                          and have read the{" "}
                          <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>.{" "}
                          <span className="text-destructive">*</span>
                        </label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox id="dataShareConsent" checked={dataShareConsent} onCheckedChange={(c) => setDataShareConsent(!!c)} className="mt-0.5" />
                        <label htmlFor="dataShareConsent" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          I understand that my registration details will be shared with the event organizer to facilitate my attendance.{" "}
                          <span className="text-destructive">*</span>
                        </label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox id="marketingConsent" checked={marketingConsent} onCheckedChange={(c) => setMarketingConsent(!!c)} className="mt-0.5" />
                        <label htmlFor="marketingConsent" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          I agree to receive marketing communications from this event organizer about future events and updates.
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You can update your preferences anytime.{" "}
                        <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
                      </p>
                    </div>

                    {submitError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}

                    {/* Mobile-only submit button */}
                    <div className="lg:hidden pt-2">
                      <Button type="submit" className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] transition-all duration-200"
                        disabled={submitting || loading || !termsConsent || !dataShareConsent || !!(hasTicketTypes && Object.values(selectedTickets).every(qty => qty === 0))}>
                        {submitting ? <><Loader size="sm" className="mr-2" />Processing…</> : submitLabel}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Secure checkout</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Right — sticky order summary + desktop submit */}
                <div className="hidden lg:block">
                  <div className="sticky top-[96px]">
                    <OrderSummaryPanel showCta={true} isForm={true} />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ── INLINE CONFIRMATION (fallback before redirect) ───────────── */}
          {currentStep === 'confirmation' && (
            <section className="rounded-2xl bg-background shadow-sm border border-border">
              <div className="p-8 text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-bounce">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">You're Going!</h3>
                  <p className="text-muted-foreground">Your registration for <strong>{event.title}</strong> is confirmed.</p>
                </div>
                {isGuestRegistration ? (
                  <div className="rounded-2xl border border-primary bg-primary/5 p-4 text-left space-y-2">
                    <p className="text-sm text-primary"><strong>Check your email!</strong> We've sent a ticket confirmation (with QR code) and an optional account invitation.</p>
                    <p className="text-xs text-primary">Creating an account is optional but lets you manage future registrations faster.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">A confirmation email with your ticket has been sent to your registered email address.</p>
                )}
                <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground space-y-1">
                  <p>{formattedDate}{formattedTime && ` at ${formattedTime}`} — {eventLocation}</p>
                  <p>Organized by {event.organizerName || (event.organizer ? event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}` : "Event host")}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Link to="/" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-semibold transition-colors duration-200">Browse More Events</Link>
                  <Link to="/user/dashboard" className="px-6 py-2 border border-border rounded-full text-foreground/80 hover:bg-muted/40 transition-colors">Go to Dashboard</Link>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Mobile sticky bottom bar — tickets step only */}
      {currentStep === 'tickets' && hasSelectedAnyTicket && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border">
          <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-lg mx-auto">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{totalTicketCount} ticket{totalTicketCount !== 1 ? 's' : ''}</p>
              <p className="text-base font-bold text-primary leading-tight tabular-nums">
                {totalAmount === 0 ? 'Free' : `${currency} ${totalAmount.toLocaleString()}`}
              </p>
            </div>
            <Button
              size="lg"
              className="h-11 px-6 font-semibold shrink-0"
              onClick={() => setCurrentStep('registration')}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default EventRegistration;
