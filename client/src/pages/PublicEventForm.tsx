import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  Send,
  FileText,
  Mic,
  Building2,
  Gift
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'number' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  type: 'attendee' | 'speaker' | 'exhibitor' | 'sponsor';
  fields: FormField[];
  eventInfo: {
    title: string;
    date: string;
    time: string;
    location: string;
    organizer: string;
    image: string;
  };
}

interface FormData {
  [key: string]: string | string[] | boolean;
}

const PublicEventForm = () => {
  const [template, setTemplate] = useState<EventTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // In a real app, this would fetch the template based on URL parameters
    // For now, we'll use mock data
    const mockTemplate: EventTemplate = {
      id: '1',
      name: 'Tech Innovation Summit 2024 - Attendee Registration',
      description: 'Register for the most comprehensive technology innovation summit of the year',
      type: 'attendee',
      fields: [
        { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter your first name' },
        { id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter your last name' },
        { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your.email@example.com' },
        { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'company', name: 'company', label: 'Company', type: 'text', required: false, placeholder: 'Your company name' },
        { id: 'jobTitle', name: 'jobTitle', label: 'Job Title', type: 'text', required: false, placeholder: 'Your job title' },
        { id: 'experience', name: 'experience', label: 'Years of Experience', type: 'select', required: true, options: ['0-2 years', '3-5 years', '6-10 years', '10+ years'] },
        { id: 'dietaryRestrictions', name: 'dietaryRestrictions', label: 'Dietary Restrictions', type: 'textarea', required: false, placeholder: 'Please specify any dietary restrictions...' },
        { id: 'emergencyContact', name: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: true, placeholder: 'Emergency contact name and phone' }
      ],
      eventInfo: {
        title: 'Tech Innovation Summit 2024',
        date: 'March 15-17, 2024',
        time: '9:00 AM - 5:00 PM',
        location: 'San Francisco, CA',
        organizer: 'Tech Events Inc.',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop'
      }
    };
    setTemplate(mockTemplate);
  }, []);

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'attendee': return <Users className="h-5 w-5" />;
      case 'speaker': return <Mic className="h-5 w-5" />;
      case 'exhibitor': return <Building2 className="h-5 w-5" />;
      case 'sponsor': return <Gift className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTemplateColor = (type: string) => {
    switch (type) {
      case 'attendee': return 'bg-blue-100 text-blue-800';
      case 'speaker': return 'bg-purple-100 text-purple-800';
      case 'exhibitor': return 'bg-green-100 text-green-800';
      case 'sponsor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputChange = (fieldId: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    template?.fields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would submit to your backend
      console.log('Form submitted:', formData);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <Select value={value as string} onValueChange={(val) => handleInputChange(field.id, val)}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}_${option}`}
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="text-primary"
                />
                <Label htmlFor={`${field.id}_${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.id}_${option}`}
                  checked={(value as string[])?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleInputChange(field.id, newValues);
                  }}
                  className="text-primary"
                />
                <Label htmlFor={`${field.id}_${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <Input
            type={field.type}
            value={value as string}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for registering for {template.eventInfo.title}. You will receive a confirmation email shortly.
            </p>
            <Button onClick={() => window.close()} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <BackButton label="Back" />
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getTemplateColor(template.type)}`}>
                {getTemplateIcon(template.type)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={template.eventInfo.image} 
                      alt={template.eventInfo.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">{template.eventInfo.title}</h3>
                      <p className="text-sm text-muted-foreground">{template.eventInfo.organizer}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{template.eventInfo.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{template.eventInfo.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{template.eventInfo.location}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Registration Form</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Please fill out all required fields to complete your registration.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {template.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      {renderField(field)}
                      {errors[field.id] && (
                        <p className="text-sm text-red-500">{errors[field.id]}</p>
                      )}
                      {field.description && (
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  ))}

                  <div className="pt-6 border-t">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Registration
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEventForm;
