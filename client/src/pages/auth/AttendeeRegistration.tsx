import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Users } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useMultiStepForm, validateStepFields } from '@/hooks/useMultiStepForm';
import { UserRole } from '@/types/auth';
import {
  attendeeRegistrationSchema,
  type AttendeeRegistrationData,
} from '@/lib/validations/auth';

const AttendeeRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get email from previous step
  const emailFromPrevious = location.state?.email || '';

  // Initialize React Hook Form
  const form = useForm<AttendeeRegistrationData>({
    resolver: zodResolver(attendeeRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: emailFromPrevious,
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      interests: [],
      eventTypes: [],
      location: '',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
      },
      dateOfBirth: '',
      gender: '',
      bio: '',
      profilePicture: null,
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Multi-step form management
  const multiStep = useMultiStepForm({
    form,
    steps: 3,
  });

  const interests = [
    'Music', 'Technology', 'Business', 'Arts & Culture', 'Sports',
    'Food & Drink', 'Travel', 'Wellness', 'Education', 'Networking',
    'Comedy', 'Gaming', 'Photography', 'Fashion', 'Science'
  ];

  const eventTypes = [
    'Conferences', 'Workshops', 'Concerts', 'Meetups', 'Festivals',
    'Seminars', 'Exhibitions', 'Parties', 'Sports Events', 'Cultural Events'
  ];

  // Get current form values for conditional rendering
  const watchPassword = form.watch('password');
  const watchInterests = form.watch('interests');
  const watchEventTypes = form.watch('eventTypes');

  const handleInterestToggle = (interest: string) => {
    const currentInterests = form.getValues('interests');
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(item => item !== interest)
      : [...currentInterests, interest];
    form.setValue('interests', newInterests, { shouldValidate: true });
  };

  const handleEventTypeToggle = (eventType: string) => {
    const currentEventTypes = form.getValues('eventTypes');
    const newEventTypes = currentEventTypes.includes(eventType)
      ? currentEventTypes.filter(item => item !== eventType)
      : [...currentEventTypes, eventType];
    form.setValue('eventTypes', newEventTypes, { shouldValidate: true });
  };

  const handleNext = async () => {
    setError('');

    if (multiStep.currentStep < 3) {
      // Validate current step before proceeding
      let fieldsToValidate: (keyof AttendeeRegistrationData)[] = [];

      if (multiStep.currentStep === 1) {
        fieldsToValidate = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phoneNumber'];
      } else if (multiStep.currentStep === 2) {
        fieldsToValidate = ['interests', 'eventTypes', 'location'];
      }

      const isValid = await validateStepFields(form, fieldsToValidate);

      if (isValid) {
        multiStep.goToNextStep();
      }
    } else {
      // Final step - submit registration
      const isValid = await form.trigger(); // Validate all fields

      if (!isValid) {
        setError('Please fill in all required fields correctly');
        return;
      }

      setIsLoading(true);

      try {
        const formData = form.getValues();

        // Prepare registration data
        const registrationData = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber || undefined,
          role: UserRole.ATTENDEE,
        };

        // Call registration API
        await registerUser(registrationData);
        // Navigation will happen automatically via useAuth hook
      } catch (err: unknown) {
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? (err.message as string)
            : 'Registration failed. Please try again.';
        setError(errorMessage);
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (!multiStep.isFirstStep) {
      multiStep.goToPreviousStep();
    } else {
      navigate('/auth/user-type');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Tell us about yourself!
        </h2>
        <p className="text-muted-foreground">
          Help us personalize your event discovery experience.
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
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="+1 (555) 123-4567" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          What interests you?
        </h2>
        <p className="text-muted-foreground">
          Select your interests to discover relevant events.
        </p>
      </div>

      {/* Interests */}
      <FormField
        control={form.control}
        name="interests"
        render={() => (
          <FormItem>
            <FormLabel>What are you interested in? *</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interests.map((interest) => (
                <Button
                  key={interest}
                  type="button"
                  variant={watchInterests.includes(interest) ? "default" : "outline"}
                  onClick={() => handleInterestToggle(interest)}
                  className={`h-10 text-sm ${
                    watchInterests.includes(interest)
                      ? ''
                      : 'border-border hover:bg-muted hover:border-border'
                  }`}
                >
                  {interest}
                </Button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Event Types */}
      <FormField
        control={form.control}
        name="eventTypes"
        render={() => (
          <FormItem>
            <FormLabel>What types of events do you enjoy? *</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {eventTypes.map((eventType) => (
                <Button
                  key={eventType}
                  type="button"
                  variant={watchEventTypes.includes(eventType) ? "default" : "outline"}
                  onClick={() => handleEventTypeToggle(eventType)}
                  className={`h-10 text-sm ${
                    watchEventTypes.includes(eventType)
                      ? ''
                      : 'border-border hover:bg-muted hover:border-border'
                  }`}
                >
                  {eventType}
                </Button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location */}
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Where are you located? *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="City, State or Country" />
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
          Complete your profile
        </h2>
        <p className="text-muted-foreground">
          Add some additional details to enhance your experience.
        </p>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio (Optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Tell us a bit about yourself..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Profile Picture */}
      <div className="space-y-2">
        <Label>Profile Picture (Optional)</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">Upload a profile picture</p>
          <Button variant="outline" size="sm">
            Choose File
          </Button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="notificationPreferences.email"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="email-notifications">Email notifications about events</Label>
              </div>
            )}
          />
          <FormField
            control={form.control}
            name="notificationPreferences.sms"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms-notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="sms-notifications">SMS notifications</Label>
              </div>
            )}
          />
          <FormField
            control={form.control}
            name="notificationPreferences.push"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="push-notifications"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="push-notifications">Push notifications</Label>
              </div>
            )}
          />
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
                  variant="outline"
                  onClick={handleBack}
                  className="px-6 h-11"
                  disabled={isLoading}
                  type="button"
                >
                  Back
                </Button>
                <Button
                  variant="default"
                  onClick={handleNext}
                  className="px-6 h-11"
                  disabled={isLoading}
                  type="button"
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
            </Form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AttendeeRegistration;
