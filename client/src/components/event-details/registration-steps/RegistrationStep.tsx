import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Lock, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EventData, RegistrationField } from '@/types/event';
import type { TicketSelection } from '../UnifiedRegistrationModal';

interface RegistrationStepProps {
  event: EventData;
  selectedTickets: TicketSelection;
  totalPrice: number;
  totalTickets: number;
  onContinue: (data: RegistrationData) => void;
}

interface RegistrationData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  registrationData?: Record<string, string | boolean>;
  [key: string]: unknown;
}

export const RegistrationStep = ({
  event,
  totalPrice,
  totalTickets,
  onContinue,
}: RegistrationStepProps) => {
  const { user, login, register: registerUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(user ? 'login' : 'register');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isAuthenticated] = useState(!!user);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(loginData.email, loginData.password);
      // Login updates the user state via dispatch, check user from hook
      // We'll use useEffect to watch for user changes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Watch for user changes after login/register
  useEffect(() => {
    if (user && isAuthenticated && !isLoading) {
      setIsLoading(false);
      // Pre-fill form data with user info
      const updatedFormData = {
        ...formData,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      };
      setFormData(updatedFormData);

      // If no custom fields, proceed immediately
      if (!event.registrationFields || event.registrationFields.length === 0) {
        onContinue({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber || undefined,
          registrationData: updatedFormData,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated, isLoading]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!registerData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phoneNumber: registerData.phoneNumber,
      });
      // Registration updates the user state via dispatch, check user from hook
      // We'll use useEffect to watch for user changes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[fieldId]) {
      setFormErrors((prev) => ({
        ...prev,
        [fieldId]: '',
      }));
    }
  };

  const renderFormField = (field: RegistrationField) => {
    const fieldError = formErrors[field.id];
    const value = formData[field.id] || '';
    const fieldId = `field-${field.id}`;

    const fieldType = field.type as
      | 'text'
      | 'email'
      | 'tel'
      | 'textarea'
      | 'select'
      | 'radio'
      | 'checkbox';

    switch (fieldType) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? 'border-destructive' : ''}
              required={field.required}
            />
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
            {field.type === 'email' && (
              <p className="text-xs text-muted-foreground">
                Your ticket will be sent to this email address.
              </p>
            )}
            {field.type === 'tel' && (
              <p className="text-xs text-muted-foreground">
                Format: +1 (555) 123-4567
              </p>
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
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
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
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
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
            {fieldError && (
              <p className="text-destructive text-sm mt-1">{fieldError}</p>
            )}
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
                  <input
                    type="checkbox"
                    id={`${fieldId}-${option}`}
                    name={field.name}
                    checked={formData[field.id] === option}
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.checked ? option : '')
                    }
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    // Validate terms agreement
    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    // Validate required custom fields
    if (event.registrationFields) {
      const missingFields: string[] = [];
      event.registrationFields.forEach((field) => {
        if (field.required && !formData[field.id]) {
          missingFields.push(field.label);
          setFormErrors((prev) => ({
            ...prev,
            [field.id]: 'This field is required',
          }));
        }
      });

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    const getStringValue = (value: string | boolean | undefined): string | undefined => {
      if (typeof value === 'string') return value;
      return undefined;
    };

    const currentUser = user || (isAuthenticated && typeof formData.userId === 'string' ? { id: formData.userId } : null);
    if (currentUser) {
      // User is logged in - proceed with registration data
      onContinue({
        userId: user?.id || getStringValue(formData.userId),
        email: user?.email || getStringValue(formData.email),
        firstName: user?.firstName || getStringValue(formData.firstName),
        lastName: user?.lastName || getStringValue(formData.lastName),
        phoneNumber: user?.phoneNumber || getStringValue(formData.phoneNumber),
        registrationData: formData,
      });
    } else {
      // User needs to login/register first
      setError('Please login or register to continue');
    }
  };

  if (user || isAuthenticated) {
    // User is already logged in - show custom registration form
    return (
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              You're logged in as <strong>{user?.email || formData.email}</strong>
            </AlertDescription>
          </Alert>
        </div>

        {/* Registration Summary */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="font-semibold mb-3">Registration Summary</h3>
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
                {event.currency || '$'}{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Registration Fields */}
        {event.registrationFields && event.registrationFields.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
              <p className="text-sm text-muted-foreground">
                Please complete the following information to finalize your registration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.registrationFields.map((field) => {
                // Long-form fields (textarea) span both columns
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
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : event.isFree ? (
            'Complete Registration'
          ) : (
            'Continue to Payment'
          )}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {event.isFree ? 'Complete Your Registration' : 'Login or Register to Continue'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Create an account or log in to complete your registration
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login & Continue'
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="register" className="space-y-4 mt-4">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="pl-10"
                    value={registerData.firstName}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="register-email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="pl-10"
                  value={registerData.phoneNumber}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, phoneNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="register-password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={registerData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setRegisterData({ ...registerData, agreeToTerms: checked as boolean })
                }
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
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

            {/* Show custom registration fields if event has them */}
            {event.registrationFields && event.registrationFields.length > 0 && (
              <div className="pt-4 border-t space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Additional Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Please provide the following information for your registration.
                  </p>
                </div>
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

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Register & Continue'
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Guest Checkout Option (Future) */}
      {/* <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button variant="outline" size="lg" className="w-full" onClick={handleGuestContinue}>
        Continue as Guest
      </Button> */}
    </div>
  );
};

