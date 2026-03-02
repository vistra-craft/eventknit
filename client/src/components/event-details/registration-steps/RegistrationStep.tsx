import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { Link } from 'react-router-dom';
import type { EventData, RegistrationField } from '@/types/event';
import type { TicketSelection } from '../UnifiedRegistrationModal';
import { registerAsGuest } from '@/lib/event-api';

interface RegistrationStepProps {
  event: EventData;
  selectedTickets: TicketSelection;
  totalPrice: number;
  totalTickets: number;
  onContinue: (data: RegistrationData) => void;
}

export interface RegistrationData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  registrationData?: Record<string, string | boolean>;
  isNewUser?: boolean;
  requiresPasswordSetup?: boolean;
  registrationId?: string;
  [key: string]: unknown;
}

export const RegistrationStep = ({
  event,
  totalPrice,
  totalTickets,
  onContinue,
}: RegistrationStepProps) => {
  const { user, loginForModal, setAuthFromGuestResponse } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'guest'>(user ? 'login' : 'guest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Tracks whether this user just authenticated within this step
  const isAlreadyAuthenticated = useRef(!!user);

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Guest checkout form state
  const [guestData, setGuestData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // loginForModal authenticates without navigating away from the event page
      await loginForModal(loginData.email, loginData.password);
      // onContinue is triggered by the useEffect below once user state updates
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Login failed. Please check your email and password.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // When the user state changes (post-login or pre-populated), auto-advance if no custom fields
  useEffect(() => {
    if (!user || isLoading) return;

    setIsLoading(false);

    // Pre-fill any custom field form with profile data
    setFormData((prev) => ({
      ...prev,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
    }));

    // Auto-advance only for users who were already authenticated when the modal opened
    // (not for users who just logged in — they'll see the summary form and click Continue)
    if (isAlreadyAuthenticated.current && (!event.registrationFields || event.registrationFields.length === 0)) {
      onContinue({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || undefined,
        registrationData: {
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phoneNumber: user.phoneNumber || '',
        },
        isNewUser: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!guestData.firstName.trim() || !guestData.lastName.trim() || !guestData.email.trim()) {
      setError('First name, last name and email are required');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerAsGuest(event.id, {
        firstName: guestData.firstName.trim(),
        lastName: guestData.lastName.trim(),
        email: guestData.email.trim().toLowerCase(),
        phoneNumber: guestData.phoneNumber.trim() || undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      const { registration, user: guestUser, accessToken } = response.data;

      // Auto-login the guest without navigating away
      if (accessToken) {
        await setAuthFromGuestResponse(
          {
            id: guestUser.id,
            email: guestUser.email,
            firstName: guestUser.firstName,
            lastName: guestUser.lastName,
          },
          accessToken
        );
      }

      // Registration was already created by registerAsGuest — pass the ID through
      onContinue({
        userId: guestUser.id,
        email: guestUser.email,
        firstName: guestUser.firstName,
        lastName: guestUser.lastName,
        registrationId: registration.id,
        isNewUser: guestUser.isNewUser,
        requiresPasswordSetup: guestUser.requiresPasswordSetup,
        registrationData: {
          email: guestUser.email,
          firstName: guestUser.firstName,
          lastName: guestUser.lastName,
          phoneNumber: guestData.phoneNumber.trim() || '',
        },
      });
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Registration failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (formErrors[fieldId]) {
      setFormErrors((prev) => ({ ...prev, [fieldId]: '' }));
    }
  };

  const renderFormField = (field: RegistrationField) => {
    const fieldError = formErrors[field.id];
    const value = formData[field.id] || '';
    const fieldId = `field-${field.id}`;

    const fieldType = field.type as
      | 'text'
      | 'email'
      | 'phone'
      | 'textarea'
      | 'select'
      | 'radio'
      | 'checkbox';

    switch (fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type === 'phone' ? 'tel' : field.type}
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? 'border-destructive' : ''}
              required={field.required}
            />
            {fieldError && <p className="text-destructive text-sm mt-1">{fieldError}</p>}
            {field.type === 'email' && (
              <p className="text-xs text-muted-foreground">
                Your ticket will be sent to this email address.
              </p>
            )}
            {field.type === 'phone' && (
              <p className="text-xs text-muted-foreground">Format: +1 (555) 123-4567</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? 'border-destructive' : ''}
              rows={3}
              required={field.required}
            />
            {fieldError && <p className="text-destructive text-sm mt-1">{fieldError}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <select
              id={fieldId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && <p className="text-destructive text-sm mt-1">{fieldError}</p>}
          </div>
        );

      case 'radio':
        if (!field.options) return null;
        return (
          <div key={field.id} className="space-y-2">
            <Label className="block text-sm font-medium">
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
            {fieldError && <p className="text-destructive text-sm mt-1">{fieldError}</p>}
          </div>
        );

      case 'checkbox':
        if (!field.options) return null;
        return (
          <div key={field.id} className="space-y-2">
            <Label className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}-${option}`}
                    checked={formData[field.id] === option}
                    onCheckedChange={(checked) =>
                      handleInputChange(field.id, checked ? option : '')
                    }
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded focus:bg-muted"
                  />
                  <Label htmlFor={`${fieldId}-${option}`} className="text-sm font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {fieldError && <p className="text-destructive text-sm mt-1">{fieldError}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (event.registrationFields) {
      const missingFields: string[] = [];
      event.registrationFields.forEach((field) => {
        if (field.required && !formData[field.id]) {
          missingFields.push(field.label);
          setFormErrors((prev) => ({ ...prev, [field.id]: 'This field is required' }));
        }
      });

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    const getStringValue = (value: string | boolean | undefined): string | undefined =>
      typeof value === 'string' ? value : undefined;

    if (user) {
      onContinue({
        userId: user.id,
        email: user.email || getStringValue(formData.email as string | boolean | undefined),
        firstName: user.firstName || getStringValue(formData.firstName as string | boolean | undefined),
        lastName: user.lastName || getStringValue(formData.lastName as string | boolean | undefined),
        phoneNumber: user.phoneNumber || getStringValue(formData.phoneNumber as string | boolean | undefined),
        registrationData: formData,
        isNewUser: false,
      });
    } else {
      setError('Please log in or continue as guest to proceed');
    }
  };

  // --- Logged-in view ---
  if (user) {
    return (
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <Alert>
          <User className="h-4 w-4" />
          <AlertDescription>
            You're logged in as <strong>{user.email}</strong>
          </AlertDescription>
        </Alert>

        {/* Registration Summary */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="text-card-title mb-3">Registration Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event:</span>
              <span className="font-medium">{event.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tickets:</span>
              <span className="font-medium">{totalTickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-primary">
                {event.isFree ? 'Free' : `${event.currency || '$'} ${totalPrice.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Registration Fields */}
        {event.registrationFields && event.registrationFields.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-section-header mb-2">Additional Information</h3>
              <p className="text-card-description">
                Please complete the following information to finalize your registration.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.registrationFields.map((field) => {
                if (field.type === 'textarea') {
                  return <div key={field.id} className="md:col-span-2">{renderFormField(field)}</div>;
                }
                return <div key={field.id}>{renderFormField(field)}</div>;
              })}
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="pt-4 border-t bg-primary/5 -mx-4 px-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
              I agree to the{' '}
              <Link to="/terms-of-service" className="text-primary hover:underline font-medium">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>
              . I understand that my information will be used for event management purposes.
            </label>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <><Loader size="sm" className="mr-2" />Processing...</>
          ) : event.isFree ? (
            'Complete Registration'
          ) : (
            'Continue to Payment'
          )}
        </Button>
      </form>
    );
  }

  // --- Unauthenticated view: Login | Guest Checkout ---
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-header mb-2">
          {event.isFree ? 'Complete Your Registration' : 'Login or Continue as Guest'}
        </h3>
        <p className="text-card-description">
          {event.isFree
            ? 'Enter your details or log in to complete your free registration'
            : 'Enter your details or log in to continue to payment'}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'guest')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guest">Continue as Guest</TabsTrigger>
          <TabsTrigger value="login">Log In</TabsTrigger>
        </TabsList>

        {/* Guest Checkout */}
        <TabsContent value="guest" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            No account needed. We'll create one for you automatically.
          </p>
          <form onSubmit={handleGuestCheckout} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guest-firstName">First Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="guest-firstName"
                    placeholder="John"
                    className="pl-10"
                    value={guestData.firstName}
                    onChange={(e) => setGuestData({ ...guestData, firstName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="guest-lastName">Last Name</Label>
                <Input
                  id="guest-lastName"
                  placeholder="Doe"
                  value={guestData.lastName}
                  onChange={(e) => setGuestData({ ...guestData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="guest-email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={guestData.email}
                  onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your ticket confirmation will be sent here.
              </p>
            </div>

            <div>
              <Label htmlFor="guest-phone">Phone Number (Optional)</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guest-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="pl-10"
                  value={guestData.phoneNumber}
                  onChange={(e) => setGuestData({ ...guestData, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Custom registration fields for guests */}
            {event.registrationFields && event.registrationFields.length > 0 && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-card-title">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.registrationFields
                    .filter(
                      (field) =>
                        field.type !== 'email' &&
                        !field.name?.toLowerCase().includes('first') &&
                        !field.name?.toLowerCase().includes('last')
                    )
                    .map((field) => {
                      if (field.type === 'textarea') {
                        return (
                          <div key={field.id} className="md:col-span-2">
                            {renderFormField(field)}
                          </div>
                        );
                      }
                      return <div key={field.id}>{renderFormField(field)}</div>;
                    })}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Checkbox
                id="guest-terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <label htmlFor="guest-terms" className="text-sm text-muted-foreground leading-tight">
                I agree to the{' '}
                <Link to="/terms-of-service" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Email preview — lets the user visually confirm before submitting */}
            {guestData.email && (
              <div className="rounded-md border border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">
                    Ticket will be sent to{' '}
                    <strong className="text-foreground">{guestData.email}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline shrink-0"
                  onClick={() => document.getElementById('guest-email')?.focus()}
                >
                  Edit
                </button>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader size="sm" className="mr-2" />Processing...</>
              ) : event.isFree ? (
                'Register Free'
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </form>
        </TabsContent>

        {/* Login */}
        <TabsContent value="login" className="space-y-4 mt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="login-password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader size="sm" className="mr-2" />Logging in...</>
              ) : (
                'Login & Continue'
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};
