import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Users, 
  Ticket, 
  Plus, 
  X, 
  CheckCircle,
  Calendar,
  Camera,
  FileText,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  Upload,
  Globe,
  MapPin,
  Clock,
  Percent,
  Gift
} from 'lucide-react';
import { createEvent, type CreateEventData, EventType } from '@/lib/event-api';
import { useAuth } from '@/hooks/useAuth';

// interface Speaker {
//   name: string;
//   title: string;
//   bio: string;
// }

// interface Sponsor {
//   name: string;
//   level: 'gold' | 'silver' | 'bronze';
//   logo: string;
// }

interface RegistrationField {
  id: string;
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
  options?: string[];
}

interface TicketType {
  id: number;
  name: string;
  type: 'free' | 'paid';
  price: string;
  originalPrice?: string;
  discountLabel?: string;
  quantity: string;
  isComplementary?: boolean;
  requiresInvitation?: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

interface EventData {
  title: string;
  organizer: string;
  description: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  location: string;
  venue: string;
  address: string;
  onlineLink: string;
  price: string;
  totalSlots: number;
  image: string;
  requirements: string;
  isOnline: boolean;
  capacity: string;
  category?: string;
  timezone?: string;
}

type Tag = string;

// Common timezones list
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
];

const DRAFT_STORAGE_KEY = 'eventknit_event_draft';

export default function CreateEventStepwise() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState("in-person");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState(() => {
    // Default to user's timezone or UTC
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: 1, name: "General Admission", type: "paid", price: "50", quantity: "100" }
  ]);
  const [categories, setCategories] = useState(["Music", "Concert"]);
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  // const [_speakers] = useState<Speaker[]>([{ name: "", title: "", bio: "" }]);
  // const [_sponsors] = useState<Sponsor[]>([{ name: "", level: "gold", logo: "" }]);
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Load draft from localStorage on mount
  const loadDraft = (): Partial<EventData> => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Check if draft is less than 7 days old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return parsed.data || {};
        } else {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return {};
  };

  const [eventData, setEventData] = useState<EventData>(() => {
    const draft = loadDraft();
    return {
      title: draft.title || "",
      organizer: draft.organizer || "",
      description: draft.description || "",
      date: draft.date || "",
      time: draft.time || "",
      endDate: draft.endDate || "",
      endTime: draft.endTime || "",
      location: draft.location || "",
      venue: draft.venue || "",
      address: draft.address || "",
      onlineLink: draft.onlineLink || "",
      price: draft.price || "",
      totalSlots: draft.totalSlots || 0,
      image: draft.image || "",
      requirements: draft.requirements || "",
      isOnline: draft.isOnline || false,
      capacity: draft.capacity || "",
      category: draft.category || "",
      timezone: draft.timezone || timezone,
    };
  });

  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([
    {
      id: "firstName",
      name: "firstName",
      type: "text",
      label: "First Name",
      required: true,
      placeholder: "Enter your first name",
    },
    {
      id: "lastName",
      name: "lastName",
      type: "text",
      label: "Last Name",
      required: true,
      placeholder: "Enter your last name",
    },
    {
      id: "email",
      name: "email",
      type: "email",
      label: "Email Address",
      required: true,
      placeholder: "your.email@example.com",
    },
  ]);

  const eventCategories = [
    "Technology", "Business", "Arts", "Music", "Sports", "Education", 
    "Health", "Food", "Travel", "Networking", "Workshop", "Conference", 
    "Wellness", "Entertainment", "Community", "Charity"
  ];

  // Save draft to localStorage
  // const _saveDraft = () => {
  //   try {
  //     const draftData = {
  //       data: {
  //         ...eventData,
  //         timezone,
  //       },
  //       ticketTypes,
  //       categories,
  //       tags,
  //       faqs,
  //       registrationFields,
  //       eventType,
  //       isPrivate,
  //       timestamp: Date.now(),
  //     };
  //     localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  //     setLastSaved(new Date());
  //     setIsSavingDraft(false);
  //   } catch (error) {
  //     console.error('Error saving draft:', error);
  //   }
  // };

  // Auto-save every 30 seconds
  useEffect(() => {
    // Set up auto-save interval
    autoSaveIntervalRef.current = setInterval(() => {
      setIsSavingDraft(true);
      const draftData = {
        data: {
          ...eventData,
          timezone,
        },
        ticketTypes,
        categories,
        tags,
        faqs,
        registrationFields,
        eventType,
        isPrivate,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        setLastSaved(new Date());
        setIsSavingDraft(false);
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [eventData, ticketTypes, categories, tags, faqs, registrationFields, eventType, isPrivate, timezone]);

  // Clear draft after successful submission
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      // Convert to base64 for now (in production, upload to cloud storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setEventData(prev => ({ ...prev, image: base64String }));
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to upload image');
      setIsUploadingImage(false);
    }
  };

  // Format date with timezone
  const formatDateWithTimezone = (date: string, time: string) => {
    if (!date || !time) return '';
    try {
      const dateTime = new Date(`${date}T${time}`);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: timezone,
      }).format(dateTime);
    } catch {
      return `${date} at ${time}`;
    }
  };

  const handleInputChange = <K extends keyof EventData>(
    field: K,
    value: K extends 'totalSlots' ? number | string : EventData[K]
  ) => {
    const processedValue = field === 'totalSlots' 
      ? typeof value === 'string' 
        ? value === '' 
          ? 0 
          : Number(value) 
        : value
      : value;

    setEventData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { 
      id: Date.now(), 
      name: "", 
      type: "paid", 
      price: "", 
      quantity: "",
      isComplementary: false,
      requiresInvitation: false,
    }]);
  };

  const removeTicketType = (id: number) => {
    setTicketTypes(ticketTypes.filter(ticket => ticket.id !== id));
  };

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(cat => cat !== category));
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
  };


  const addRegistrationField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      placeholder: "Enter placeholder text",
    };
    setRegistrationFields((prev) => [...prev, newField]);
  };

  const updateRegistrationField = (index: number, updates: Partial<RegistrationField>) => {
    setRegistrationFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const removeRegistrationField = (index: number) => {
    if (registrationFields.length > 3) {
      setRegistrationFields((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
  };


  const calculateProgress = () => {
    const requiredFields = [
      eventData.title, eventData.description,
      eventData.date, eventData.time, eventData.location || eventData.onlineLink,
      eventData.category, ticketTypes.length > 0
    ];
    const filledFields = requiredFields.filter(field => field && field.toString().trim() !== "").length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      if (!eventData.title?.trim()) errors.title = 'Event title is required';
      if (!eventData.description?.trim()) errors.description = 'Event description is required';
      if (eventData.description && eventData.description.length < 10) {
        errors.description = 'Description must be at least 10 characters';
      }
      if (!eventData.category) errors.category = 'Category is required';
    }
    
    if (step === 2) {
      if (!eventData.date) errors.date = 'Event date is required';
      if (!eventData.time) errors.time = 'Start time is required';
      if (eventType === 'in-person' && !eventData.venue?.trim()) {
        errors.venue = 'Venue name is required for in-person events';
      }
      if (eventType === 'in-person' && !eventData.location?.trim()) {
        errors.location = 'Location is required for in-person events';
      }
      if (eventType === 'online' && !eventData.onlineLink?.trim()) {
        errors.onlineLink = 'Online link is required for online events';
      }
      if (eventData.endDate && eventData.date && new Date(eventData.endDate) < new Date(eventData.date)) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    if (step === 3) {
      if (ticketTypes.length === 0) {
        errors.tickets = 'At least one ticket type is required';
      }
      const hasInvalidTickets = ticketTypes.some(ticket => {
        if (!ticket.name?.trim()) return true;
        if (ticket.type === 'paid' && (!ticket.price || parseFloat(ticket.price) < 0)) return true;
        return false;
      });
      if (hasInvalidTickets) {
        errors.tickets = 'All tickets must have a name and valid price (if paid)';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep < 6) {
      if (validateStep(currentStep)) {
        setError(null);
        setCurrentStep(currentStep + 1);
      } else {
        setError('Please fix the errors before proceeding');
      }
    } else {
      handleSubmit();
    }
  };

  const transformFormDataToAPI = (): CreateEventData => {
    // Determine if event is free
    const isFree = ticketTypes.every(t => t.type === 'free');
    
    // Build ticket types array
    const apiTicketTypes = ticketTypes.map(ticket => ({
      name: ticket.name.trim(),
      price: ticket.type === 'free' ? 0 : parseFloat(ticket.price) || 0,
      originalPrice: ticket.originalPrice ? parseFloat(ticket.originalPrice) : undefined,
      discountLabel: ticket.discountLabel?.trim() || undefined,
      quantity: ticket.quantity ? parseInt(ticket.quantity, 10) : undefined,
      features: [],
      isComplementary: ticket.isComplementary || false,
      requiresInvitation: ticket.requiresInvitation || false,
      availableFrom: ticket.availableFrom || undefined,
      availableUntil: ticket.availableUntil || undefined,
    }));

    // Build start date with time and timezone (ISO format)
    const startDate = eventData.date && eventData.time 
      ? new Date(`${eventData.date}T${eventData.time}`).toISOString()
      : new Date().toISOString();

    // Build end date with time if provided
    const endDate = eventData.endDate && eventData.endTime
      ? new Date(`${eventData.endDate}T${eventData.endTime}`).toISOString()
      : undefined;

    // Determine single price if all tickets have same price
    const singlePrice = !isFree && ticketTypes.length === 1 && ticketTypes[0].type === 'paid'
      ? parseFloat(ticketTypes[0].price)
      : undefined;

    const apiData: CreateEventData = {
      title: eventData.title.trim(),
      description: eventData.description.trim(),
      category: eventData.category || categories[0] || undefined,
      tags: tags.length > 0 ? tags : undefined,
      startDate,
      endDate,
      startTime: eventData.time,
      endTime: eventData.endTime || undefined,
      venue: eventData.venue?.trim() || undefined,
      location: eventData.location?.trim() || eventData.onlineLink?.trim() || '',
      address: eventData.address?.trim() || undefined,
      isOnline: eventType === 'online' || eventType === 'hybrid',
      onlineLink: eventData.onlineLink?.trim() || undefined,
      isFree,
      price: singlePrice,
      ticketTypes: apiTicketTypes.length > 0 ? apiTicketTypes : undefined,
      capacity: eventData.capacity ? parseInt(eventData.capacity, 10) : undefined,
      image: eventData.image?.trim() || undefined,
      type: isPrivate ? EventType.PRIVATE : EventType.PUBLIC,
      faqs: faqs.filter(faq => faq.question.trim() && faq.answer.trim()).length > 0
        ? faqs.filter(faq => faq.question.trim() && faq.answer.trim()).map(faq => ({
            question: faq.question.trim(),
            answer: faq.answer.trim()
          }))
        : undefined,
      registrationFields: registrationFields.length > 3
        ? registrationFields.map(field => ({
            id: field.id,
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            options: field.options
          }))
        : undefined,
    };

    return apiData;
  };

  const handleSubmit = async () => {
    // Final validation
    if (!validateStep(6)) {
      setError('Please fix all errors before submitting');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      setError('You must be logged in to create events');
      navigate('/auth/signin');
      return;
    }

    // Check if user is an organizer or admin
    const isOrganizerRole = ['ORGANIZER', 'ORGANIZER_STAFF', 'ORGANIZER_TELLER'].includes(user.role);
    const isAdminRole = ['SUPERADMIN', 'ADMIN_STAFF', 'MARKETER', 'SUPPORT', 'TELLER'].includes(user.role);
    
    if (!isOrganizerRole && !isAdminRole) {
      setError('Only organizers and admins can create events');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiData = transformFormDataToAPI();
      const response = await createEvent(apiData);

      if (response.success && response.data) {
        // Clear draft on success
        clearDraft();
        // Success! Navigate to appropriate dashboard based on current route
        const isAdminRoute = location.pathname.startsWith('/admin');
        const dashboardRoute = isAdminRoute ? '/admin/dashboard' : '/organizer/dashboard';
        navigate(dashboardRoute, {
          state: { message: 'Event created successfully! It is pending admin approval.' }
        });
      } else {
        setError(response.message || 'Failed to create event. Please try again.');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate to appropriate dashboard based on current route
      const isAdminRoute = location.pathname.startsWith('/admin');
      const dashboardRoute = isAdminRoute ? '/admin/dashboard' : '/organizer/dashboard';
      navigate(dashboardRoute);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Basic Event Information
        </h2>
        <p className="text-muted-foreground">
          Let's start with the essential details about your event.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventName">Event Title *</Label>
          <Input 
            id="eventName" 
            placeholder="Give your event a catchy title" 
            value={eventData.title}
            onChange={(e) => {
              handleInputChange("title", e.target.value);
              if (validationErrors.title) setValidationErrors(prev => ({ ...prev, title: '' }));
            }}
            className={validationErrors.title ? 'border-destructive' : ''}
          />
          {validationErrors.title && (
            <p className="text-sm text-destructive">{validationErrors.title}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizer">Organizer Name</Label>
          <Input 
            id="organizer" 
            placeholder="Your organization name" 
            value={eventData.organizer}
            onChange={(e) => handleInputChange("organizer", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Event Description *</Label>
        <Textarea 
          id="description" 
          placeholder="Describe what your event is about..." 
          rows={4}
          value={eventData.description}
          maxLength={5000}
          onChange={(e) => {
            handleInputChange("description", e.target.value);
            if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
          }}
          className={validationErrors.description ? 'border-destructive' : ''}
        />
        <div className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {eventData.description.length}/5000 characters
          </p>
          {validationErrors.description && (
            <p className="text-sm text-destructive">{validationErrors.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type *</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">In-Person Event</SelectItem>
              <SelectItem value="online">Online Event</SelectItem>
              <SelectItem value="hybrid">Hybrid Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={eventData.category || ""} 
            onValueChange={(value) => {
              handleInputChange("category", value);
              if (validationErrors.category) setValidationErrors(prev => ({ ...prev, category: '' }));
            }}
          >
            <SelectTrigger className={validationErrors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.category && (
            <p className="text-sm text-destructive">{validationErrors.category}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Date, Time & Location
        </h2>
        <p className="text-muted-foreground">
          When and where will your event take place?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Event Date *</Label>
          <Input 
            id="date" 
            type="date"
            value={eventData.date}
            onChange={(e) => {
              handleInputChange("date", e.target.value);
              if (validationErrors.date) setValidationErrors(prev => ({ ...prev, date: '' }));
            }}
            className={validationErrors.date ? 'border-destructive' : ''}
          />
          {validationErrors.date && (
            <p className="text-sm text-destructive">{validationErrors.date}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Start Time *</Label>
          <Input 
            id="time" 
            type="time"
            value={eventData.time}
            onChange={(e) => {
              handleInputChange("time", e.target.value);
              if (validationErrors.time) setValidationErrors(prev => ({ ...prev, time: '' }));
            }}
            className={validationErrors.time ? 'border-destructive' : ''}
          />
          {validationErrors.time && (
            <p className="text-sm text-destructive">{validationErrors.time}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input 
            id="endDate" 
            type="date"
            value={eventData.endDate}
            onChange={(e) => {
              handleInputChange("endDate", e.target.value);
              if (validationErrors.endDate) setValidationErrors(prev => ({ ...prev, endDate: '' }));
            }}
            className={validationErrors.endDate ? 'border-destructive' : ''}
          />
          {validationErrors.endDate && (
            <p className="text-sm text-destructive">{validationErrors.endDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input 
            id="endTime" 
            type="time"
            value={eventData.endTime}
            onChange={(e) => handleInputChange("endTime", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Timezone *
        </Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Event time will be displayed in this timezone
        </p>
      </div>

      {eventType === "in-person" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue">Venue Name *</Label>
            <Input 
              id="venue" 
              placeholder="Enter venue name"
              value={eventData.venue}
              onChange={(e) => {
                handleInputChange("venue", e.target.value);
                if (validationErrors.venue) setValidationErrors(prev => ({ ...prev, venue: '' }));
              }}
              className={validationErrors.venue ? 'border-destructive' : ''}
            />
            {validationErrors.venue && (
              <p className="text-sm text-destructive">{validationErrors.venue}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input 
              id="location" 
              placeholder="City, State/Country"
              value={eventData.location}
              onChange={(e) => {
                handleInputChange("location", e.target.value);
                if (validationErrors.location) setValidationErrors(prev => ({ ...prev, location: '' }));
              }}
              className={validationErrors.location ? 'border-destructive' : ''}
            />
            {validationErrors.location && (
              <p className="text-sm text-destructive">{validationErrors.location}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address" 
              placeholder="Enter full address"
              rows={2}
              value={eventData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>
        </div>
      )}

      {eventType === "online" && (
        <div className="space-y-2">
          <Label htmlFor="onlineLink">Online Event Link *</Label>
          <Input 
            id="onlineLink" 
            placeholder="https://zoom.us/j/..."
            value={eventData.onlineLink}
            onChange={(e) => {
              handleInputChange("onlineLink", e.target.value);
              if (validationErrors.onlineLink) setValidationErrors(prev => ({ ...prev, onlineLink: '' }));
            }}
            className={validationErrors.onlineLink ? 'border-destructive' : ''}
          />
          {validationErrors.onlineLink && (
            <p className="text-sm text-destructive">{validationErrors.onlineLink}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="capacity">Event Capacity</Label>
        <Input 
          id="capacity" 
          type="number"
          placeholder="Maximum number of attendees"
          value={eventData.capacity}
          onChange={(e) => handleInputChange("capacity", e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Ticket Setup
        </h2>
        <p className="text-muted-foreground">
          Configure your ticket types and pricing.
        </p>
      </div>

      {validationErrors.tickets && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationErrors.tickets}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {ticketTypes.map((ticket, index) => (
          <Card key={ticket.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Ticket Type {index + 1}</CardTitle>
                {ticketTypes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTicketType(ticket.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ticket Name</Label>
                  <Input 
                    placeholder="e.g., General Admission, VIP"
                    value={ticket.name}
                    onChange={(e) => {
                      const updatedTickets = [...ticketTypes];
                      updatedTickets[index] = { ...ticket, name: e.target.value };
                      setTicketTypes(updatedTickets);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <Select value={ticket.type} onValueChange={(value: 'free' | 'paid') => {
                    const updatedTickets = [...ticketTypes];
                    updatedTickets[index] = { ...ticket, type: value };
                    setTicketTypes(updatedTickets);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Complementary Ticket Option */}
              {ticket.type === 'paid' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`complementary-${ticket.id}`}
                      checked={ticket.isComplementary || false}
                      onChange={(e) => {
                        const updatedTickets = [...ticketTypes];
                        if (e.target.checked) {
                          updatedTickets[index] = {
                            ...ticket,
                            isComplementary: true,
                            requiresInvitation: true,
                            price: '0',
                          };
                        } else {
                          updatedTickets[index] = {
                            ...ticket,
                            isComplementary: false,
                            requiresInvitation: false,
                          };
                        }
                        setTicketTypes(updatedTickets);
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`complementary-${ticket.id}`} className="flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      This is a complementary ticket
                    </Label>
                  </div>
                  {ticket.isComplementary && (
                    <div className="pl-6 space-y-2 border-l-2 border-primary">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`invitation-${ticket.id}`}
                          checked={ticket.requiresInvitation || false}
                          onChange={(e) => {
                            const updatedTickets = [...ticketTypes];
                            updatedTickets[index] = {
                              ...ticket,
                              requiresInvitation: e.target.checked,
                            };
                            setTicketTypes(updatedTickets);
                          }}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`invitation-${ticket.id}`}>
                          Requires invitation
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Complementary tickets can only be issued via invitations
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Discount Option */}
              {ticket.type === 'paid' && !ticket.isComplementary && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`discount-${ticket.id}`}
                      checked={!!ticket.originalPrice}
                      onChange={(e) => {
                        const updatedTickets = [...ticketTypes];
                        if (e.target.checked) {
                          updatedTickets[index] = {
                            ...ticket,
                            originalPrice: ticket.price || '0',
                          };
                        } else {
                          updatedTickets[index] = {
                            ...ticket,
                            originalPrice: undefined,
                            discountLabel: undefined,
                          };
                        }
                        setTicketTypes(updatedTickets);
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`discount-${ticket.id}`} className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      This ticket is discounted
                    </Label>
                  </div>

                  {ticket.originalPrice && (
                    <div className="space-y-4 pl-6 border-l-2 border-primary">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Original Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="149.99"
                            value={ticket.originalPrice}
                            onChange={(e) => {
                              const updatedTickets = [...ticketTypes];
                              updatedTickets[index] = {
                                ...ticket,
                                originalPrice: e.target.value,
                              };
                              setTicketTypes(updatedTickets);
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Price before discount
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Current Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="99.99"
                            value={ticket.price}
                            onChange={(e) => {
                              const updatedTickets = [...ticketTypes];
                              updatedTickets[index] = { ...ticket, price: e.target.value };
                              setTicketTypes(updatedTickets);
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Price attendees pay
                          </p>
                        </div>
                      </div>

                      {/* Discount Preview */}
                      {ticket.originalPrice && ticket.price && 
                       parseFloat(ticket.originalPrice) > parseFloat(ticket.price) && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-green-900">
                                Discount Preview
                              </p>
                              <p className="text-xs text-green-700">
                                {Math.round(((parseFloat(ticket.originalPrice) - parseFloat(ticket.price)) / parseFloat(ticket.originalPrice)) * 100)}% OFF
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-green-900">
                                Save ${(parseFloat(ticket.originalPrice) - parseFloat(ticket.price)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Discount Label (Optional)</Label>
                        <Input
                          placeholder="e.g., Student Discount, Early Bird, Limited Time"
                          value={ticket.discountLabel || ''}
                          onChange={(e) => {
                            const updatedTickets = [...ticketTypes];
                            updatedTickets[index] = {
                              ...ticket,
                              discountLabel: e.target.value,
                            };
                            setTicketTypes(updatedTickets);
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Shown as a badge on the ticket
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Regular Price Field (when not discounted or complementary) */}
              {ticket.type === 'paid' && !ticket.originalPrice && !ticket.isComplementary && (
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={ticket.price}
                    onChange={(e) => {
                      const updatedTickets = [...ticketTypes];
                      updatedTickets[index] = { ...ticket, price: e.target.value };
                      setTicketTypes(updatedTickets);
                    }}
                    disabled={false}
                  />
                </div>
              )}

              {/* Early Bird Availability */}
              {ticket.type === 'paid' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Early Bird Availability (Optional)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Available From</Label>
                      <Input
                        type="datetime-local"
                        value={ticket.availableFrom || ''}
                        onChange={(e) => {
                          const updatedTickets = [...ticketTypes];
                          updatedTickets[index] = {
                            ...ticket,
                            availableFrom: e.target.value,
                          };
                          setTicketTypes(updatedTickets);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Available Until</Label>
                      <Input
                        type="datetime-local"
                        value={ticket.availableUntil || ''}
                        onChange={(e) => {
                          const updatedTickets = [...ticketTypes];
                          updatedTickets[index] = {
                            ...ticket,
                            availableUntil: e.target.value,
                          };
                          setTicketTypes(updatedTickets);
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set time windows for early bird pricing
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Quantity Available</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={ticket.quantity}
                  onChange={(e) => {
                    const updatedTickets = [...ticketTypes];
                    updatedTickets[index] = { ...ticket, quantity: e.target.value };
                    setTicketTypes(updatedTickets);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addTicketType}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Ticket Type
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Registration Form
        </h2>
        <p className="text-muted-foreground">
          Customize what information you collect from attendees.
        </p>
      </div>

      <div className="space-y-4">
        {registrationFields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Field {index + 1}</CardTitle>
                {registrationFields.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRegistrationField(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Label</Label>
                  <Input 
                    value={field.label}
                    onChange={(e) => updateRegistrationField(index, { label: e.target.value })}
                    placeholder="Field label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={field.type} onValueChange={(value) => updateRegistrationField(index, { type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder Text</Label>
                <Input 
                  value={field.placeholder}
                  onChange={(e) => updateRegistrationField(index, { placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => updateRegistrationField(index, { required: checked })}
                />
                <Label>Required field</Label>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addRegistrationField}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Field
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Media & Additional Details
        </h2>
        <p className="text-muted-foreground">
          Add images, FAQs, and other details to make your event stand out.
        </p>
      </div>

      {/* Event Image */}
      <div className="space-y-4">
        <Label>Event Image</Label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {imagePreview || eventData.image ? (
            <div className="relative">
              <img
                src={imagePreview || eventData.image}
                alt="Event preview"
                className="w-full h-64 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImagePreview(null);
                  setEventData(prev => ({ ...prev, image: '' }));
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload an event image</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Max 5MB. JPG, PNG, or GIF</p>
            </div>
          )}
          {!imagePreview && !eventData.image && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm">Or provide image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={eventData.image}
                onChange={(e) => handleInputChange("image", e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1">
              {category}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeCategory(category)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category to add" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories
                .filter(cat => !categories.includes(cat))
                .map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button onClick={addCategory} disabled={!newCategory.trim()}>
            Add
          </Button>
        </div>
        {eventCategories.filter(cat => !categories.includes(cat)).length === 0 && (
          <p className="text-sm text-muted-foreground">All available categories have been added</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              {tag}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button onClick={addTag} disabled={!newTag.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <Label>Frequently Asked Questions</Label>
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">FAQ {index + 1}</span>
                  {faqs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFaq(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Input 
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                />
                <Textarea 
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          variant="outline"
          onClick={addFaq}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Review & Publish
        </h2>
        <p className="text-muted-foreground">
          Review your event details and publish when ready.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Event Title</Label>
              <p className="text-lg font-semibold">{eventData.title || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Organizer</Label>
              <p className="text-lg font-semibold">{eventData.organizer || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
              <p className="text-lg font-semibold">
                {eventData.date && eventData.time 
                  ? `${eventData.date} at ${eventData.time}` 
                  : 'Not set'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Location</Label>
              <p className="text-lg font-semibold">
                {eventData.venue || eventData.onlineLink || 'Not set'}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
            <p className="text-base">{eventData.description || 'Not set'}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Ticket Types</Label>
            <div className="space-y-2">
              {ticketTypes.map((ticket, index) => (
                <div key={ticket.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>{ticket.name || `Ticket ${index + 1}`}</span>
                  <span className="font-medium">
                    {ticket.type === 'free' ? 'Free' : `$${ticket.price}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
          <Label>Make this event private</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Private events are only visible to people with the direct link.
        </p>
      </div>
    </div>
  );

  const steps = [
    { title: "Basic Info", icon: FileText },
    { title: "Date & Location", icon: Calendar },
    { title: "Tickets", icon: Ticket },
    { title: "Registration", icon: Users },
    { title: "Media & Details", icon: Camera },
    { title: "Review", icon: CheckCircle }
  ];

  // Render preview modal
  const renderPreview = () => {
    // Show registration form preview if on step 4
    if (currentStep === 4) {
      return (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registration Form Preview</DialogTitle>
              <DialogDescription>
                This is how your registration form will appear to attendees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="text-xl font-semibold mb-4">{eventData.title || 'Event Registration'}</h3>
                <form className="space-y-4">
                  {registrationFields.map((field, index) => (
                    <div key={field.id || index} className="space-y-2">
                      <Label htmlFor={`preview-${field.id}`}>
                        {field.label || `Field ${index + 1}`}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={`preview-${field.id}`}
                          placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || 'value'}`}
                          disabled
                          className="bg-muted"
                        />
                      ) : field.type === 'select' ? (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || `Select ${field.label?.toLowerCase() || 'option'}`} />
                          </SelectTrigger>
                        </Select>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id={`preview-${field.id}`} disabled className="bg-muted" />
                          <Label htmlFor={`preview-${field.id}`} className="font-normal">{field.placeholder || field.label}</Label>
                        </div>
                      ) : (
                        <Input
                          id={`preview-${field.id}`}
                          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || 'value'}`}
                          disabled
                          className="bg-muted"
                        />
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="w-full" disabled>
                    Register Now
                  </Button>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    // Default event preview for other steps
    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>
              This is how your event will appear to attendees
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Event Image */}
            {(imagePreview || eventData.image) && (
              <img
                src={imagePreview || eventData.image}
                alt={eventData.title || 'Event'}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            
            {/* Event Title */}
            <div>
              <h2 className="text-3xl font-bold">{eventData.title || 'Untitled Event'}</h2>
              {eventData.organizer && (
                <p className="text-muted-foreground mt-1">by {eventData.organizer}</p>
              )}
            </div>

            {/* Date & Time */}
            {eventData.date && eventData.time && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDateWithTimezone(eventData.date, eventData.time)}</p>
                  <p className="text-sm text-muted-foreground">{timezone}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {(eventData.venue || eventData.location || eventData.onlineLink) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  {eventData.venue && <p className="font-medium">{eventData.venue}</p>}
                  {eventData.location && <p className="text-muted-foreground">{eventData.location}</p>}
                  {eventData.onlineLink && (
                    <a href={eventData.onlineLink} className="text-primary hover:underline">
                      {eventData.onlineLink}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {eventData.description && (
              <div>
                <h3 className="font-semibold mb-2">About this event</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{eventData.description}</p>
              </div>
            )}

            {/* Tickets */}
            {ticketTypes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Tickets</h3>
                <div className="space-y-2">
                  {ticketTypes.map((ticket, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{ticket.name || `Ticket ${index + 1}`}</p>
                        {ticket.quantity && (
                          <p className="text-sm text-muted-foreground">
                            {ticket.quantity} available
                          </p>
                        )}
                      </div>
                      <p className="font-bold">
                        {ticket.type === 'free' ? 'Free' : `$${parseFloat(ticket.price || '0').toFixed(2)}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {faqs.filter(f => f.question && f.answer).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {faqs.filter(f => f.question && f.answer).map((faq, index) => (
                    <div key={index}>
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-muted-foreground text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create New Event</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Set up your event with all the details attendees need to know</p>
          
          {/* Draft Save Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {isSavingDraft ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving draft...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-4 h-4" />
                <span>Draft saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Auto-saving every 30 seconds</span>
              </>
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{calculateProgress()}% complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-eventknit h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>

          {/* Step Navigation - Hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center justify-center space-x-2 sm:space-x-4 mt-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                    index + 1 <= currentStep
                      ? 'bg-eventknit text-eventknit-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <step.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-colors ${
                      index + 1 < currentStep ? 'bg-eventknit' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
              <div className="flex gap-2 order-2 sm:order-1">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 sm:px-6 sm:flex-none"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                {currentStep >= 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="flex-1 sm:px-6 sm:flex-none"
                    disabled={isSubmitting}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                )}
              </div>
              <Button
                onClick={handleNext}
                className="order-1 sm:order-2 flex-1 sm:flex-none px-6 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {currentStep === 6 ? 'Publishing...' : 'Validating...'}
                  </>
                ) : (
                  currentStep === 6 ? 'Publish Event' : 'Next'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Preview Modal */}
      {renderPreview()}
    </div>
  );
}
