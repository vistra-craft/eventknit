import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, Calendar, MapPin, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import PhoneInput from "@/components/ui/PhoneInput";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { initializePayment, initializeGuestPayment, verifyPayment } from "@/lib/payment-api";
import { useAuth } from "@/hooks/useAuth";

// ── Brand icons ────────────────────────────────────────────────────────────

const VisaIcon = () => (
  <svg viewBox="0 0 52 17" className="h-4" aria-label="Visa" fill="none">
    <path
      d="M21.6 0.5L14.1 16.5H9.3L5.6 4.2C5.4 3.4 5.2 3.1 4.6 2.8C3.6 2.3 1.9 1.8 0.4 1.5L0.5 0.5H8.3C9.3 0.5 10.2 1.2 10.4 2.3L12.3 12.5L17 0.5H21.6ZM38.9 11.2C38.9 6.7 32.6 6.4 32.6 4.5C32.6 3.9 33.2 3.3 34.4 3.1C35 3 36.7 2.9 38.6 3.8L39.4 0.9C38.4 0.5 37.1 0.2 35.5 0.2C31.2 0.2 28.2 2.5 28.2 5.8C28.2 8.2 30.3 9.6 31.9 10.4C33.5 11.2 34.1 11.8 34.1 12.6C34.1 13.8 32.7 14.3 31.4 14.3C29.2 14.4 27.9 13.7 26.9 13.3L26.1 16.3C27.1 16.8 29 17.2 30.9 17.2C35.5 17.2 38.4 14.9 38.9 11.2ZM49.6 16.5H53.8L50.1 0.5H46.2C45.3 0.5 44.6 1.1 44.3 1.9L37.9 16.5H42.5L43.4 13.9H49.1L49.6 16.5ZM44.7 10.5L47 4.1L48.3 10.5H44.7ZM27.7 0.5L24 16.5H19.6L23.3 0.5H27.7Z"
      fill="#1A1F71"
    />
  </svg>
);

const MastercardIcon = () => (
  <svg viewBox="0 0 38 24" className="h-6" aria-label="Mastercard">
    <circle cx="13" cy="12" r="11.5" fill="#EB001B" />
    <circle cx="25" cy="12" r="11.5" fill="#F79E1B" />
    <path d="M19 3.9a11.5 11.5 0 0 1 0 16.2A11.5 11.5 0 0 1 19 3.9z" fill="#FF5F00" />
  </svg>
);

const MPesaIcon = () => (
  <svg viewBox="0 0 56 24" className="h-6" aria-label="M-Pesa" fill="none">
    <rect width="56" height="24" rx="4" fill="#00A651" />
    <text x="5" y="17" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="11" fill="white" letterSpacing="-0.3">
      M-PESA
    </text>
  </svg>
);

const PaystackIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5" aria-label="Paystack" fill="none">
    <rect width="32" height="32" rx="6" fill="#0BA4DB" />
    <path d="M8 12h16M8 16h12M8 20h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ── Diagonal decorations ───────────────────────────────────────────────────

const DiagonalStrips = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
    <svg className="absolute -top-px -left-px w-[420px] h-[420px] opacity-[0.065] dark:opacity-[0.035]">
      <defs>
        <linearGradient id="pay-tl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="url(#pay-tl-grad)" strokeWidth="1.2" fill="none">
        {Array.from({ length: 22 }, (_, i) => (
          <line key={i} x1={i * 22} y1="0" x2="0" y2={i * 22} />
        ))}
      </g>
    </svg>
    <svg className="absolute -bottom-px -right-px w-[380px] h-[380px] opacity-[0.05] dark:opacity-[0.025]">
      <defs>
        <linearGradient id="pay-br-grad" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="url(#pay-br-grad)" strokeWidth="1.2" fill="none">
        {Array.from({ length: 20 }, (_, i) => (
          <line key={i} x1={380 - i * 22} y1="380" x2="380" y2={380 - i * 22} />
        ))}
      </g>
    </svg>
  </div>
);

// ── Types ──────────────────────────────────────────────────────────────────

interface TicketType {
  name: string;
  quantity: number;
  price: number;
}

interface PaymentData {
  registrationId: string;
  eventId: string;
  eventSlug?: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  tickets: TicketType[];
  totalPrice: number;
  discount?: number;
  promoCode?: string;
  isNewUser?: boolean;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userPhone?: string;
}

interface GuestForm {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
}

type GuestErrors = Partial<Record<keyof GuestForm, string>>;

// ── Sanitization helpers ───────────────────────────────────────────────────

const sanitizeName = (v: string) =>
  v.replace(/[^a-zA-Z\s''-]/g, "").replace(/\s{2,}/g, " ").trimStart().slice(0, 60);

// ── Validation ─────────────────────────────────────────────────────────────

const NAME_RE = /^[a-zA-Z\s''-]+$/;

const validateGuestForm = (form: GuestForm): GuestErrors => {
  const errors: GuestErrors = {};
  const first = sanitizeName(form.firstName);
  const last = sanitizeName(form.lastName);
  const middle = sanitizeName(form.middleName);
  const phone = form.phone;

  if (!first) {
    errors.firstName = "First name is required.";
  } else if (first.length < 2) {
    errors.firstName = "Must be at least 2 characters.";
  } else if (!NAME_RE.test(first)) {
    errors.firstName = "Letters, spaces, hyphens and apostrophes only.";
  }

  if (!last) {
    errors.lastName = "Last name is required.";
  } else if (last.length < 2) {
    errors.lastName = "Must be at least 2 characters.";
  } else if (!NAME_RE.test(last)) {
    errors.lastName = "Letters, spaces, hyphens and apostrophes only.";
  }

  if (middle && middle.length < 2) {
    errors.middleName = "Must be at least 2 characters if provided.";
  } else if (middle && !NAME_RE.test(middle)) {
    errors.middleName = "Letters, spaces, hyphens and apostrophes only.";
  }

  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      errors.phone = "Phone number must have at least 10 digits.";
    }
  }

  return errors;
};

// ── Input field component ──────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}

const Field = ({ id, label, optional, error, children }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      {label}
      {optional && <span className="text-xs text-muted-foreground font-normal">(optional)</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const inputCls = (hasError: boolean) =>
  cn(
    "w-full h-11 px-3 rounded-xl border bg-background text-foreground text-sm outline-none transition-all duration-150",
    "placeholder:text-muted-foreground/50",
    "focus:border-primary focus:ring-2 focus:ring-primary/15",
    hasError
      ? "border-destructive ring-1 ring-destructive/20 focus:border-destructive focus:ring-destructive/20"
      : "border-border/70 hover:border-border"
  );

// ── Main component ─────────────────────────────────────────────────────────

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentData = location.state as PaymentData | undefined;

  const isGuest = !isAuthenticated;

  const [guestForm, setGuestForm] = useState<GuestForm>({
    firstName: paymentData?.userFirstName ?? "",
    lastName: paymentData?.userLastName ?? "",
    middleName: "",
    phone: paymentData?.userPhone ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<GuestErrors>({});

  const guestFormRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const setField = useCallback(<K extends keyof GuestForm>(key: K, value: GuestForm[K]) => {
    setGuestForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }, []);

  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");

  // Handle Paystack callback
  useEffect(() => {
    const handleCallback = async () => {
      const paymentRef = reference || trxref;
      if (!paymentRef) return;
      setVerifying(true);
      try {
        const verification = await verifyPayment(paymentRef);
        if (verification.success && verification.data.success) {
          navigate("/confirmation", {
            state: {
              eventId: paymentData?.eventId,
              eventTitle: paymentData?.eventTitle,
              tickets: paymentData?.tickets,
              totalPrice: paymentData?.totalPrice,
              paymentMethod: "paystack",
              paymentId: paymentRef,
              date: new Date().toISOString(),
              isFreeEvent: false,
              success: true,
              isNewUser: paymentData?.isNewUser,
            },
            replace: true,
          });
        } else {
          showError("Payment verification failed. Please try again or contact support.");
        }
      } catch (err: unknown) {
        showError(
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Failed to verify payment. Please contact support."
        );
      } finally {
        setVerifying(false);
      }
    };

    if (reference || trxref) handleCallback();
  }, [reference, trxref, paymentData, navigate, showError]);

  useEffect(() => {
    if (!paymentData && !reference && !trxref) navigate("/");
  }, [paymentData, reference, trxref, navigate]);

  // ── Verifying gate ───────────────────────────────────────────────────────

  if (verifying || (reference ?? trxref)) {
    return (
      <div className="min-h-screen bg-[#f8f7f6] dark:bg-background flex flex-col relative">
        <DiagonalStrips />
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-5" style={{ paddingTop: 72 }}>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader size="lg" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold">Verifying your payment…</p>
            <p className="text-sm text-muted-foreground">Please don't close this tab.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-[#f8f7f6] dark:bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center" style={{ paddingTop: 72 }}>
          <Loader size="lg" />
        </main>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────

  const { eventTitle, tickets: paymentTickets, eventDate, eventLocation } = paymentData;
  const subtotal = paymentTickets.reduce((sum: number, t: TicketType) => sum + t.price * t.quantity, 0);
  const discount = paymentData.discount ?? 0;
  const serviceFee = paymentData.totalPrice - subtotal + discount;

  // ── Pay handler ──────────────────────────────────────────────────────────

  const handlePay = async () => {
    if (!paymentData.registrationId) {
      showError("Registration data is missing. Please go back and try again.");
      return;
    }

    if (isGuest && !paymentData.userEmail) {
      showError("Session data is incomplete. Please go back and register again.");
      return;
    }

    if (isGuest) {
      const errors = validateGuestForm(guestForm);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        guestFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }
      setFieldErrors({});
    }

    setError(null);
    setLoading(true);

    try {
      const response = isAuthenticated
        ? await initializePayment(paymentData.registrationId)
        : await initializeGuestPayment(paymentData.registrationId, paymentData.userEmail!);

      if (response.success && response.data?.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        throw new Error(response.message ?? "Failed to initialize payment.");
      }
    } catch (err: unknown) {
      showError(
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f7f6] dark:bg-background flex flex-col relative">
      <DiagonalStrips />
      <Navbar />

      <main className="flex-1 pt-[72px] pb-16 lg:pb-10 relative z-10">

        {/* ── Sticky checkout header ── */}
        <div className="sticky top-[72px] z-20 bg-[#f8f7f6]/95 dark:bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 py-4">
            {/* Progress stepper */}
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-muted-foreground">Registration</span>
                </div>
                <div className="w-8 sm:w-14 h-0.5 bg-primary rounded-full" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold ring-4 ring-primary/15 shadow-sm shadow-primary/30">
                    2
                  </div>
                  <span className="text-sm font-semibold">Payment</span>
                </div>
                <div className="w-8 sm:w-14 h-0.5 bg-border rounded-full" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-card border-2 border-border text-muted-foreground flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-muted-foreground">Confirmation</span>
                </div>
              </div>
            </div>
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight">Complete Your Purchase</h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                Secure checkout — your payment is protected by Paystack
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-6 pb-8">

          {/* ── API error ── */}
          {error && (
            <div ref={errorRef}>
              <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* ── Two-column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

            {/* ── Left: Payment panel ── */}
            <div className="space-y-4">

              {/* Guest details form */}
              {isGuest && (
                <div ref={guestFormRef} className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="font-semibold text-base">Your Details</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Your ticket confirmation will be sent to you after payment.
                    </p>
                  </div>

                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="firstName" label="First Name" error={fieldErrors.firstName}>
                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Jane"
                        maxLength={60}
                        disabled={loading}
                        value={guestForm.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        className={inputCls(!!fieldErrors.firstName)}
                      />
                    </Field>
                    <Field id="lastName" label="Last Name" error={fieldErrors.lastName}>
                      <input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Doe"
                        maxLength={60}
                        disabled={loading}
                        value={guestForm.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        className={inputCls(!!fieldErrors.lastName)}
                      />
                    </Field>
                  </div>

                  {/* Middle name */}
                  <Field id="middleName" label="Middle Name" optional error={fieldErrors.middleName}>
                    <input
                      id="middleName"
                      type="text"
                      autoComplete="additional-name"
                      placeholder="e.g. Grace"
                      maxLength={60}
                      disabled={loading}
                      value={guestForm.middleName}
                      onChange={(e) => setField("middleName", e.target.value)}
                      className={inputCls(!!fieldErrors.middleName)}
                    />
                  </Field>

                  {/* Email — locked to registration, not editable */}
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-foreground">Email Address</p>
                    {paymentData.userEmail ? (
                      <>
                        <div className="flex items-center gap-2.5 h-11 px-3 rounded-xl border border-border/70 bg-muted/40 text-sm">
                          <Mail className="w-4 h-4 shrink-0 text-muted-foreground/60" />
                          <span className="truncate text-foreground">{paymentData.userEmail}</span>
                          <Lock className="w-3 h-3 shrink-0 ml-auto text-muted-foreground/40" />
                        </div>
                        <p className="text-xs text-muted-foreground/70">
                          Your ticket will be sent here. To change it, go back and re-register.
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2.5 h-11 px-3 rounded-xl border border-destructive/40 bg-destructive/5 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>No email found — please go back and register again.</span>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <Field id="phone" label="Phone Number" optional error={fieldErrors.phone}>
                    <PhoneInput
                      value={guestForm.phone}
                      onChange={(v) => setField("phone", v)}
                      placeholder="712 345 678"
                      disabled={loading}
                      className={cn(
                        "h-11 rounded-xl transition-all duration-150",
                        fieldErrors.phone
                          ? "border-destructive ring-1 ring-destructive/20"
                          : "border-border hover:border-border/80",
                        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
                      )}
                    />
                  </Field>
                </div>
              )}

              {/* Paystack card */}
              <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PaystackIcon />
                    </div>
                    Pay with Paystack
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    You'll be securely redirected to Paystack to complete your payment.
                    Paystack supports cards, bank transfer, and M-Pesa.
                  </p>
                </div>

                {/* Accepted methods */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accepted methods</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      <VisaIcon key="visa" />,
                      <MastercardIcon key="mc" />,
                      <MPesaIcon key="mpesa" />,
                    ].map((icon, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg border border-border bg-background shadow-sm">
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99]"
                  size="lg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader size="sm" />
                      Redirecting to Paystack…
                    </span>
                  ) : (
                    <>
                      Pay{" "}
                      <span className="ml-1">
                        <span className="text-xs align-top mt-[3px] inline-block opacity-80">KES </span>
                        <span>{paymentData.totalPrice.toLocaleString()}</span>
                      </span>
                    </>
                  )}
                </Button>

                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
                    <Lock className="w-3 h-3" />
                    <span>Secured by Paystack · End-to-end encrypted</span>
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    By continuing you agree to our{" "}
                    <Link to="/terms-of-service" className="text-blue-600 dark:text-blue-400 underline-offset-2 underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                      Terms of Service
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right: Sticky order summary ── */}
            <div className="sticky top-[208px] self-start space-y-4">
              <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">

                <h3 className="font-semibold text-sm text-center">Order Summary</h3>

                {/* Event info */}
                <div className="space-y-2 pb-4 border-b border-border">
                  <p className="font-semibold text-sm leading-tight">{eventTitle}</p>
                  {eventDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{eventDate}</span>
                    </div>
                  )}
                  {eventLocation && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{eventLocation}</span>
                    </div>
                  )}
                </div>

                {/* Tickets */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tickets</p>
                  {paymentTickets.map((ticket: TicketType, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <span className="font-medium">{ticket.quantity}× </span>
                        <span className="text-muted-foreground">{ticket.name}</span>
                      </div>
                      <span className="font-medium tabular-nums shrink-0 ml-2">
                        KES {(ticket.price * ticket.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing breakdown */}
                <div className="space-y-2 pt-3 border-t border-foreground/12">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums">KES {subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span className="flex items-center gap-1">
                        Discount
                        {paymentData.promoCode && (
                          <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-medium">
                            {paymentData.promoCode}
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums">−KES {discount.toLocaleString()}</span>
                    </div>
                  )}
                  {serviceFee > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Service fee</span>
                      <span className="tabular-nums">KES {serviceFee.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="pt-3 border-t-2 border-primary/20">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary tabular-nums">
                      <span className="text-xs font-medium align-top mt-1 inline-block mr-0.5 opacity-70">KES </span>
                      {paymentData.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Back link — uses slug when available */}
              <button
                onClick={() => navigate(`/event/${paymentData.eventSlug ?? paymentData.eventId}/register`)}
                disabled={loading}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1 disabled:opacity-40"
              >
                ← Back to registration
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;
