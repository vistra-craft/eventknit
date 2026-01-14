import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useMultiStepForm, validateStepFields } from '@/hooks/useMultiStepForm';
import { UserRole } from '@/types/auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  organizerRegistrationSchema,
  type OrganizerRegistrationData,
} from '@/lib/validations/auth';

const OrganizerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get email from previous step
  const emailFromPrevious = location.state?.email || '';

  // Initialize form with React Hook Form + Zod
  const form = useForm<OrganizerRegistrationData>({
    resolver: zodResolver(organizerRegistrationSchema),
    defaultValues: {
      // Step 1: Event Preferences
      eventTypes: [],
      organizationType: '',
      eventsPerYear: '',
      isRecurringSeries: false,

      // Step 2: Basic Info
      firstName: '',
      lastName: '',
      email: emailFromPrevious,
      password: '',
      confirmPassword: '',
      phoneNumber: '',

      // Step 3: Business Info
      businessName: '',
      businessType: '',
      taxId: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      idDocument: null,
      businessLicense: null,
      taxDocument: null,
    },
    mode: 'onChange',
  });

  // Multi-step form management
  const multiStep = useMultiStepForm({
    form,
    steps: 3,
  });

  const eventTypes = [
    'Music', 'Comedy', 'Food & Drink', 'Community & Culture',
    'Hobbies & Special Interest', 'Performing & Visual Arts',
    'Parties', 'Technology', 'Business', 'Sports', 'Education'
  ];

  const organizationTypes = [
    'Music Nightlife & Parties',
    'Music Promoter',
    'Music Artist or Performer',
    'Music Venue',
    'Music Festival',
    'Event Planning Company',
    'Corporate Events',
    'Non-Profit Organization',
    'Educational Institution',
    'Other'
  ];

  const handleEventTypeToggle = (eventType: string) => {
    const currentTypes = form.getValues('eventTypes');
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter(type => type !== eventType)
      : [...currentTypes, eventType];

    form.setValue('eventTypes', newTypes, { shouldValidate: true });
  };

  const handleNext = async () => {
    setError('');

    if (multiStep.currentStep === 1) {
      // Validate step 1 fields
      const isValid = await validateStepFields(form, [
        'eventTypes',
        'organizationType',
        'eventsPerYear',
      ]);
      if (isValid) {
        multiStep.goToNextStep();
      }
    } else if (multiStep.currentStep === 2) {
      // Validate step 2 fields
      const isValid = await validateStepFields(form, [
        'firstName',
        'lastName',
        'email',
        'password',
        'confirmPassword',
        'phoneNumber',
      ]);
      if (isValid) {
        multiStep.goToNextStep();
      }
    } else if (multiStep.currentStep === 3) {
      // Final step - validate and submit
      const isValid = await validateStepFields(form, [
        'businessName',
        'businessType',
        'taxId',
        'address',
        'city',
        'state',
        'zipCode',
      ]);

      if (isValid) {
        await handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const formData = form.getValues();

      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        organizationName: formData.businessName,
        role: UserRole.ORGANIZER,
      };

      // Call registration API
      await register(registrationData);
      // Navigation will happen automatically via useAuth hook
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Registration failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (!multiStep.isFirstStep) {
      multiStep.goToPreviousStep();
    } else {
      navigate('/auth/user-type');
    }
  };

  const watchPassword = form.watch('password');

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Let's get to know you first!
        </h2>
        <p className="text-muted-foreground">
          Tell us what kind of events you want to host and we'll help make it happen.
        </p>
      </div>

      {/* Event Types */}
      <FormField
        control={form.control}
        name="eventTypes"
        render={() => (
          <FormItem>
            <FormLabel className="text-sm font-medium">What type of events do you host? *</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {eventTypes.map((type) => {
                const isSelected = form.watch('eventTypes').includes(type);
                return (
                  <Button
                    key={type}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleEventTypeToggle(type)}
                    className={`h-10 text-sm ${
                      isSelected
                        ? ''
                        : 'border-border hover:bg-muted hover:border-border'
                    }`}
                  >
                    {type}
                  </Button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Organization Type */}
      <FormField
        control={form.control}
        name="organizationType"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="organizationType">Which best describes your organization? *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your organization type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {organizationTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Events Per Year */}
      <FormField
        control={form.control}
        name="eventsPerYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="eventsPerYear">How many events do you plan to organize in the next year? *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Number of events" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="1-2">1-2 events</SelectItem>
                <SelectItem value="3-5">3-5 events</SelectItem>
                <SelectItem value="5-10">5-10 events</SelectItem>
                <SelectItem value="10-20">10-20 events</SelectItem>
                <SelectItem value="20+">20+ events</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Recurring Series */}
      <FormField
        control={form.control}
        name="isRecurringSeries"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                id="isRecurringSeries"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel htmlFor="isRecurringSeries" className="!mt-0 cursor-pointer">
              My events are part of a recurring series
            </FormLabel>
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Basic Information
        </h2>
        <p className="text-muted-foreground">
          Let's set up your organizer account with some basic details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your first name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your last name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address *</FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="your.email@example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password *</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Create a password" />
              </FormControl>
              {watchPassword && (
                <div className="space-y-1.5 mt-2">
                  <p className="text-xs font-medium text-foreground">Password requirements:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className={`flex items-center gap-2 ${watchPassword.length >= 8 ? 'text-success' : ''}`}>
                      <span className={watchPassword.length >= 8 ? 'text-success' : 'text-muted-foreground'}>
                        {watchPassword.length >= 8 ? '✓' : '○'}
                      </span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center gap-2 ${/[a-zA-Z]/.test(watchPassword) ? 'text-success' : ''}`}>
                      <span className={/[a-zA-Z]/.test(watchPassword) ? 'text-success' : 'text-muted-foreground'}>
                        {/[a-zA-Z]/.test(watchPassword) ? '✓' : '○'}
                      </span>
                      At least one letter
                    </li>
                    <li className={`flex items-center gap-2 ${/\d/.test(watchPassword) ? 'text-success' : ''}`}>
                      <span className={/\d/.test(watchPassword) ? 'text-success' : 'text-muted-foreground'}>
                        {/\d/.test(watchPassword) ? '✓' : '○'}
                      </span>
                      At least one number
                    </li>
                  </ul>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password *</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Confirm your password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number *</FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="+1 (555) 123-4567" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Business Information & Verification
        </h2>
        <p className="text-muted-foreground">
          Help us verify your business for secure event hosting.
        </p>
      </div>

      {/* Business Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Business Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your business or organization name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="non-profit">Non-Profit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax ID / EIN *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="XX-XXXXXXX" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Address *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Street address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="City" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="State" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ZIP Code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Document Upload Placeholders */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Verification Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload the following documents for verification (required for event hosting):
        </p>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Government-issued ID</p>
            <Button variant="outline" size="sm" type="button">
              Upload Document
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Business License</p>
            <Button variant="outline" size="sm" type="button">
              Upload Document
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Tax Documentation</p>
            <Button variant="outline" size="sm" type="button">
              Upload Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <BackButton to="/auth/user-type" label="Back" />
            <Logo />
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= multiStep.currentStep
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step < multiStep.currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-md">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()}>
                {multiStep.currentStep === 1 && renderStep1()}
                {multiStep.currentStep === 2 && renderStep2()}
                {multiStep.currentStep === 3 && renderStep3()}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="px-6 h-11"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleNext}
                    className="px-6 h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Registering...
                      </>
                    ) : multiStep.isLastStep ? (
                      'Complete registration'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default OrganizerRegistration;
