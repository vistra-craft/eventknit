import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users } from 'lucide-react';

const AttendeeRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    
    // Interests & Preferences
    interests: [] as string[],
    eventTypes: [] as string[],
    location: '',
    notificationPreferences: {
      email: true,
      sms: false,
      push: true,
    },
    
    // Profile Information
    dateOfBirth: '',
    gender: '',
    bio: '',
    profilePicture: null as File | null,
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

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(item => item !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(item => item !== eventType)
        : [...prev.eventTypes, eventType]
    }));
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: checked
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mock registration completion
      console.log('Attendee registration:', formData);
      navigate('/user/dashboard');
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
          Tell us about yourself!
        </h2>
        <p className="text-muted-foreground">
          Help us personalize your event discovery experience.
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
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Create a password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
      </div>
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
      <div className="space-y-4">
        <Label className="text-base font-medium">What are you interested in? *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {interests.map((interest) => (
            <Button
              key={interest}
              variant={formData.interests.includes(interest) ? "default" : "outline"}
              onClick={() => handleInterestToggle(interest)}
              className={`h-10 ${
                formData.interests.includes(interest)
                  ? 'bg-eventknit text-eventknit-foreground'
                  : 'border-border hover:border-eventknit/50'
              }`}
            >
              {interest}
            </Button>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div className="space-y-4">
        <Label className="text-base font-medium">What types of events do you enjoy? *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {eventTypes.map((eventType) => (
            <Button
              key={eventType}
              variant={formData.eventTypes.includes(eventType) ? "default" : "outline"}
              onClick={() => handleEventTypeToggle(eventType)}
              className={`h-10 ${
                formData.eventTypes.includes(eventType)
                  ? 'bg-eventknit text-eventknit-foreground'
                  : 'border-border hover:border-eventknit/50'
              }`}
            >
              {eventType}
            </Button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Where are you located? *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="City, State or Country"
          required
        />
      </div>
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
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Input
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us a bit about yourself..."
        />
      </div>

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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-notifications"
              checked={formData.notificationPreferences.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked as boolean)}
            />
            <Label htmlFor="email-notifications">Email notifications about events</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sms-notifications"
              checked={formData.notificationPreferences.sms}
              onCheckedChange={(checked) => handleNotificationChange('sms', checked as boolean)}
            />
            <Label htmlFor="sms-notifications">SMS notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="push-notifications"
              checked={formData.notificationPreferences.push}
              onCheckedChange={(checked) => handleNotificationChange('push', checked as boolean)}
            />
            <Label htmlFor="push-notifications">Push notifications</Label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-eventknit hover:text-eventknit/80 transition-colors mb-4"
          >
            EventKnit
          </button>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-eventknit text-eventknit-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step < currentStep ? 'bg-eventknit' : 'bg-muted'
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

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-6"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="px-6 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground"
              >
                {currentStep === 3 ? 'Complete Registration' : 'Continue'}
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

export default AttendeeRegistration;
