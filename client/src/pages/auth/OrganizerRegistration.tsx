import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

const OrganizerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get email from previous step
  const emailFromPrevious = location.state?.email || '';
  
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: emailFromPrevious, // Pre-fill email from previous step
    password: '',
    confirmPassword: '',
    
    // Event Preferences
    eventTypes: [] as string[],
    organizationType: '',
    eventsPerYear: '',
    isRecurringSeries: false,
    
    // KYC Information
    businessName: '',
    businessType: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phoneNumber: '',
    
    // Verification Documents (placeholders)
    idDocument: null as File | null,
    businessLicense: null as File | null,
    taxDocument: null as File | null,
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

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(type => type !== eventType)
        : [...prev.eventTypes, eventType]
    }));
  };


  // Password validation
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[@$!%*?&]/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return null;
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      // Validate current step before proceeding
      if (currentStep === 1) {
        // Validate step 1 fields
        if (formData.eventTypes.length === 0) {
          setError('Please select at least one event type');
          return;
        }
        if (!formData.organizationType) {
          setError('Organization type is required');
          return;
        }
        if (!formData.eventsPerYear) {
          setError('Please select how many events you plan to organize');
          return;
        }
        setError('');
      } else if (currentStep === 2) {
        // Validate step 2 fields
        if (!formData.firstName.trim()) {
          setError('First name is required');
          return;
        }
        if (!formData.lastName.trim()) {
          setError('Last name is required');
          return;
        }
        if (!formData.email.trim()) {
          setError('Email is required');
          return;
        }
        if (!formData.password) {
          setError('Password is required');
          return;
        }
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          setError(passwordError);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (!formData.phoneNumber.trim()) {
          setError('Phone number is required');
          return;
        }
        setError('');
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit registration
      setIsLoading(true);
      setError('');
      
      try {
        // Validate final step
        if (!formData.businessName.trim()) {
          setError('Business name is required');
          setIsLoading(false);
          return;
        }
        if (!formData.businessType) {
          setError('Business type is required');
          setIsLoading(false);
          return;
        }
        if (!formData.taxId.trim()) {
          setError('Tax ID is required');
          setIsLoading(false);
          return;
        }
        if (!formData.address.trim()) {
          setError('Business address is required');
          setIsLoading(false);
          return;
        }
        if (!formData.city.trim()) {
          setError('City is required');
          setIsLoading(false);
          return;
        }
        if (!formData.state.trim()) {
          setError('State is required');
          setIsLoading(false);
          return;
        }
        if (!formData.zipCode.trim()) {
          setError('ZIP code is required');
          setIsLoading(false);
          return;
        }

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
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/auth/user-type');
    }
  };

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
      <div className="space-y-4">
        <Label className="text-base font-medium">What type of events do you host? *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {eventTypes.map((type) => (
            <Button
              key={type}
              variant={formData.eventTypes.includes(type) ? "default" : "outline"}
              onClick={() => handleEventTypeToggle(type)}
              className={`h-10 ${
                formData.eventTypes.includes(type)
                  ? 'bg-eventknit text-eventknit-foreground'
                  : 'border-border hover:border-eventknit/50'
              }`}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Organization Type */}
      <div className="space-y-2">
        <Label htmlFor="organizationType">Which best describes your organization? *</Label>
        <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your organization type" />
          </SelectTrigger>
          <SelectContent>
            {organizationTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events Per Year */}
      <div className="space-y-2">
        <Label htmlFor="eventsPerYear">How many events do you plan to organize in the next year? *</Label>
        <Select value={formData.eventsPerYear} onValueChange={(value) => handleInputChange('eventsPerYear', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Number of events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-2">1-2 events</SelectItem>
            <SelectItem value="3-5">3-5 events</SelectItem>
            <SelectItem value="5-10">5-10 events</SelectItem>
            <SelectItem value="10-20">10-20 events</SelectItem>
            <SelectItem value="20+">20+ events</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && currentStep === 1 && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Recurring Series */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRecurringSeries"
          checked={formData.isRecurringSeries}
          onCheckedChange={(checked) => handleInputChange('isRecurringSeries', checked)}
        />
        <Label htmlFor="isRecurringSeries">My events are part of a recurring series</Label>
      </div>
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
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your.email@example.com"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => {
              handleInputChange('password', e.target.value);
              setError('');
            }}
            placeholder="Create a password"
            required
          />
          {formData.password && (
            <p className="text-xs text-muted-foreground">
              Must contain: uppercase, lowercase, number, special character (@$!%*?&), min 8 chars
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => {
              handleInputChange('confirmPassword', e.target.value);
              setError('');
            }}
            placeholder="Confirm your password"
            required
          />
        </div>
      </div>
      {error && currentStep === 2 && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number *</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          placeholder="+1 (555) 123-4567"
          required
        />
      </div>
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
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Your business or organization name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type *</Label>
            <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="llc">LLC</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                <SelectItem value="non-profit">Non-Profit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID / EIN *</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => handleInputChange('taxId', e.target.value)}
            placeholder="XX-XXXXXXX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Business Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Street address"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="ZIP Code"
              required
            />
          </div>
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
            <Button variant="outline" size="sm">
              Upload Document
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Business License</p>
            <Button variant="outline" size="sm">
              Upload Document
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Tax Documentation</p>
            <Button variant="outline" size="sm">
              Upload Document
            </Button>
          </div>
        </div>
      </div>
      {error && currentStep === 3 && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-gray-500 hover:bg-gray-900 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to home</span>
            </button>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">EK</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EventKnit</span>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-gray-900 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step < currentStep ? 'bg-gray-900' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

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
                className="px-6 border border-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Registering...'
                  : currentStep === 3
                  ? 'Complete registration'
                  : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-eventknit/5 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-eventknit/5 to-transparent rounded-full blur-xl"></div>
      </div>
    </div>
  );
};

export default OrganizerRegistration;
