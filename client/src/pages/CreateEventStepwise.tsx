import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  Save,
  Eye,
  Upload,
  Globe,
  MapPin,
  Clock,
  Percent,
  Gift,
  Shield,
  Layout,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { createEvent, type CreateEventData, EventType, updateEvent, type UpdateEventData } from '@/lib/event-api';
import { getOrganizerEventById } from '@/lib/organizer-api';
import { transformEventData, type BackendEvent } from '@/lib/event-utils';
import { useAuth } from '@/hooks/useAuth';
import { getVerificationStatus, type VerificationStatus } from '@/lib/verification-api';
import { applyTemplate } from '@/lib/organizer-dashboard-api';
import { useToast } from '@/hooks/useToast';
import { SocialConnectionsStep } from '@/components/event-wizard/SocialConnectionsStep';
import { AgendaBuilderStep } from '@/components/event-wizard/AgendaBuilderStep';
import { DragAndDropFormBuilder } from '@/components/event-wizard/DragAndDropFormBuilder';

// Currency options with KES as default
const CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES' },
  { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
  { code: 'UGX', name: 'Ugandan Shilling (UGX)', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling (TZS)', symbol: 'TSh' },
];

const DEFAULT_CURRENCY = 'KES';

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
  placeholder?: string;
  options?: string[];
}

interface AgendaItem {
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  speakers?: string[];
}

interface SpeakerItem {
  id?: string;
  name: string;
  title?: string;
  bio?: string;
  image?: string;
}

interface ExhibitorItem {
  id?: string;
  name: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  booth?: string;
}

interface SponsorItem {
  id?: string;
  name: string;
  level?: 'gold' | 'silver' | 'bronze' | string;
  logo?: string;
}

interface TemplateDataResponse {
  templateData?: TemplateData;
  eventData?: TemplateData;
  templateName?: string;
}

interface TemplateData {
  description?: string;
  fullDescription?: string;
  organizerDescription?: string;
  location?: string;
  venue?: string;
  address?: string;
  onlineLink?: string;
  price?: number | string;
  capacity?: number;
  image?: string;
  requirements?: string[] | string;
  ageRestriction?: string;
  isOnline?: boolean;
  category?: string;
  timezone?: string;
  currency?: string;
  ticketTypes?: TicketTypeData[];
  registrationFields?: RegistrationFieldData[];
  tags?: string[] | string;
  faqs?: Array<{ question: string; answer: string }>;
  agenda?: AgendaItem[] | string;
  speakers?: SpeakerItem[];
  exhibitors?: ExhibitorItem[];
  sponsors?: SponsorItem[];
  socialLinks?: Record<string, string>;
  isPrivate?: boolean;
}

interface TicketTypeData {
  name?: string;
  price?: number | string;
  originalPrice?: number | string;
  discountLabel?: string;
  quantity?: number | string;
  isComplementary?: boolean;
  requiresInvitation?: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

interface RegistrationFieldData {
  id?: string;
  name?: string;
  type?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

type FormFieldType = 'text' | 'email' | 'tel' | 'phone' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'number';

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

// Local form state interface - distinct from shared EventData which matches DB
interface EventData {
  title: string;
  organizer: string;
  description: string;
  fullDescription: string;
  organizerDescription?: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  registrationDeadline: string;
  registrationDeadlineTime: string;
  location: string;
  venue: string;
  address: string;
  onlineLink: string;
  price: string;
  totalSlots: number;
  image: string;
  requirements: string;
  ageRestriction: string;
  isOnline: boolean;
  capacity: string;
  category?: string;
  timezone?: string;
  socialLinks?: Record<string, string>;
  exhibitors?: ExhibitorItem[];
  sponsors?: SponsorItem[];
  agenda?: AgendaItem[];
  speakers?: SpeakerItem[];
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
  
  // Check for edit mode and template from URL query params
  const searchParams = new URLSearchParams(location.search);
  const editEventId = searchParams.get('edit');
  const templateId = searchParams.get('template');
  const stepParam = searchParams.get('step');
  const isEditMode = !!editEventId;
  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId && !isEditMode);
  const [useDragAndDrop, setUseDragAndDrop] = useState(false);
  const { toast } = useToast();
  
  /* Renaming STEPS constant if it exists or adding it */
  const steps = [
    { title: "Basic Info", icon: FileText },
    { title: "Date & Location", icon: Calendar },
    { title: "Agenda", icon: Clock },
    { title: "Tickets", icon: Ticket },
    { title: "Registration", icon: Users },
    { title: "Media", icon: Camera },
    { title: "Social", icon: Layout },
    { title: "Review", icon: CheckCircle }
  ];

  const [currentStep, setCurrentStep] = useState(() => {
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      return step >= 1 && step <= 8 ? step : 1;
    }
    return 1;
  });

  // Restored missing state for enhancements
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [exhibitors, setExhibitors] = useState<ExhibitorItem[]>([]);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  
  // Verification state
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

  useEffect(() => {
    const fetchVerification = async () => {
      if (user && ['ORGANIZER', 'ORGANIZER_STAFF'].includes(user.role)) {
        try {
          setLoadingVerification(true);
          const response = await getVerificationStatus();
          if (response.success) {
            setVerificationStatus(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch verification status", error);
        } finally {
          setLoadingVerification(false);
        }
      }
    };
    fetchVerification();
  }, [user]);

  const [eventType, setEventType] = useState("in-person");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [eventId] = useState<string | null>(editEventId);
  const [timezone, setTimezone] = useState(() => {
    // Default to user's timezone or UTC
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [eventData, setEventData] = useState<EventData & { currency: string }>(() => {
    // Load draft from localStorage (only if not in edit mode)
    if (isEditMode) {
      return {
        title: "",
        organizer: "",
        description: "",
        fullDescription: "",
        organizerDescription: "",
        date: "",
        time: "",
        endDate: "",
        endTime: "",
        registrationDeadline: "",
        registrationDeadlineTime: "",
        location: "",
        venue: "",
        address: "",
        onlineLink: "",
        price: "",
        totalSlots: 0,
        image: "",
        requirements: "",
        ageRestriction: "",
        isOnline: false,
        capacity: "",
        category: "",
        timezone: timezone,
        currency: DEFAULT_CURRENCY,
        socialLinks: {},
        exhibitors: [],
        sponsors: [],
        agenda: [],
        speakers: [],
      };
    }
    
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Check if draft is less than 7 days old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          const draftData = parsed.data || {};
          return {
            title: draftData.title || "",
            organizer: draftData.organizer || "",
            description: draftData.description || "",
            fullDescription: draftData.fullDescription || "",
            organizerDescription: draftData.organizerDescription || "",
            date: draftData.date || "",
            time: draftData.time || "",
            endDate: draftData.endDate || "",
            endTime: draftData.endTime || "",
            registrationDeadline: draftData.registrationDeadline || "",
            registrationDeadlineTime: draftData.registrationDeadlineTime || "",
            location: draftData.location || "",
            venue: draftData.venue || "",
            address: draftData.address || "",
            onlineLink: draftData.onlineLink || "",
            price: draftData.price || "",
            totalSlots: draftData.totalSlots || 0,
            image: draftData.image || "",
            requirements: draftData.requirements || "",
            ageRestriction: draftData.ageRestriction || "",
            isOnline: draftData.isOnline || false,
            capacity: draftData.capacity || "",
            category: draftData.category || "",
            timezone: draftData.timezone || timezone,
            currency: draftData.currency || DEFAULT_CURRENCY,
            socialLinks: draftData.socialLinks || {},
            exhibitors: draftData.exhibitors || [],
            sponsors: draftData.sponsors || [],
            agenda: draftData.agenda || [],
            speakers: draftData.speakers || [],
          };
        } else {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore errors
    }
    
    return {
      title: "",
      organizer: "",
      description: "",
      fullDescription: "",
      organizerDescription: "",
      date: "",
      time: "",
      endDate: "",
      endTime: "",
      registrationDeadline: "",
      registrationDeadlineTime: "",
      location: "",
      venue: "",
      address: "",
      onlineLink: "",
      price: "",
      totalSlots: 0,
      image: "",
      requirements: "",
      ageRestriction: "",
      isOnline: false,
      capacity: "",
      category: "",
      timezone: timezone,
      currency: DEFAULT_CURRENCY,
      socialLinks: {},
      exhibitors: [],
      sponsors: [],
      agenda: [],
      speakers: [],
    };
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: 1, name: "", type: "paid", price: "", quantity: "" }
  ]);
  const [categories, setCategories] = useState(["Music", "Concert"]);
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Reset form to initial state
  const resetForm = useCallback(() => {
    setEventData({
      title: "",
      organizer: "",
      description: "",
      fullDescription: "",
      organizerDescription: "",
      date: "",
      time: "",
      endDate: "",
      endTime: "",
      registrationDeadline: "",
      registrationDeadlineTime: "",
      location: "",
      venue: "",
      address: "",
      onlineLink: "",
      price: "",
      totalSlots: 0,
      image: "",
      requirements: "",
      ageRestriction: "",
      isOnline: false,
      capacity: "",
      category: "",
      timezone: timezone,
      currency: DEFAULT_CURRENCY,
      socialLinks: {},
      exhibitors: [],
      sponsors: [],
      agenda: [],
      speakers: [],
    });
    setTicketTypes([{ id: 1, name: "", type: "paid", price: "", quantity: "" }]);
    setCategories(["Music", "Concert"]);
    setTags([]);
    setFaqs([{ question: "", answer: "" }]);
    setEventType("physical");
    setIsPrivate(false);
    setImagePreview(null);
    setCurrentStep(1);
    setError(null);
    setValidationErrors({});
  }, [timezone]);



  // Load draft function (for use in other places)
  const loadDraft = useCallback((): Partial<EventData & { currency: string }> => {
    // Don't load draft if in edit mode
    if (isEditMode) {
      return {};
    }
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
    } catch {
      // Ignore errors
    }
    return {};
  }, [isEditMode]);

  // Check if event has paid tickets (must be after eventData is declared)
  const hasPaidTickets = useCallback(() => {
    if (eventData.price && parseFloat(eventData.price) > 0) {
      return true;
    }
    return ticketTypes.some(ticket => ticket.type === 'paid' && parseFloat(ticket.price) > 0);
  }, [eventData.price, ticketTypes]);

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

  // Save draft function
  const saveDraft = useCallback(() => {
    try {
      setIsSavingDraft(true);
      // Ensure eventData includes the latest values from separate state
      const syncedEventData = {
        ...eventData,
        socialLinks,
        agenda,
        speakers,
        exhibitors,
        sponsors,
        timezone,
      };
      const draftData = {
        data: syncedEventData,
        ticketTypes,
        categories,
        tags,
        faqs,
        registrationFields,
        eventType,
        isPrivate,
        // Include separate state fields explicitly for safety
        socialLinks,
        agenda,
        speakers,
        exhibitors,
        sponsors,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
      setIsSavingDraft(false);
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      setIsSavingDraft(false);
      return false;
    }
  }, [eventData, timezone, ticketTypes, categories, tags, faqs, registrationFields, eventType, isPrivate, socialLinks, agenda, speakers, exhibitors, sponsors]);

  // Reset all form state when starting fresh after successful event creation
  useEffect(() => {
    if (!isEditMode) {
      const justCreated = sessionStorage.getItem('event_just_created');
      if (justCreated === 'true') {
        // Reset all form state to defaults
        setTicketTypes([{ id: 1, name: "", type: "paid", price: "", quantity: "" }]);
        setCategories(["Music", "Concert"]);
        setTags([]);
        setFaqs([{ question: "", answer: "" }]);
        setEventType("in-person");
        setIsPrivate(false);
        setImagePreview(null);
        setCurrentStep(1);
        // Flag is already cleared in eventData initializer
      }
    }
  }, [isEditMode]);

  // Auto-save every 30 seconds
  useEffect(() => {
    // Don't auto-save if in edit mode
    if (isEditMode) {
      return;
    }
    
    // Set up auto-save interval
    autoSaveIntervalRef.current = setInterval(() => {
      saveDraft();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [eventData, ticketTypes, categories, tags, faqs, registrationFields, eventType, isPrivate, timezone, socialLinks, agenda, speakers, exhibitors, sponsors, saveDraft, isEditMode]);

  // Load event data when in edit mode
  useEffect(() => {
    const loadEventForEdit = async () => {
      if (!editEventId) return;

      try {
        setIsLoadingEvent(true);
        setError(null);
        
        const response = await getOrganizerEventById(editEventId);
        
        if (response.success && response.data) {
          const orgEvent = response.data.event;
          const transformedEvent = transformEventData(orgEvent as unknown as BackendEvent);
          
          // Debug: Log the transformed event data to verify fields are present
          console.log('Loading event for edit - Transformed event data:', {
            timezone: transformedEvent.timezone,
            category: transformedEvent.category,
            tags: transformedEvent.tags,
            agenda: transformedEvent.agenda,
            agendaType: typeof transformedEvent.agenda,
            agendaIsArray: Array.isArray(transformedEvent.agenda),
          });
          
          // Parse dates from ISO format to form format (YYYY-MM-DD)
          const parseDate = (isoDate?: string | null): string => {
            if (!isoDate) return "";
            try {
              const date = new Date(isoDate);
              return date.toISOString().split('T')[0];
            } catch {
              return "";
            }
          };

          // Parse time from ISO format to form format (HH:MM)
          const parseTime = (isoTime?: string | null): string => {
            if (!isoTime) return "";
            try {
              // If it's already in HH:MM format, return as is
              if (/^\d{2}:\d{2}$/.test(isoTime)) {
                return isoTime;
              }
              // If it's a full ISO datetime, extract time
              const date = new Date(isoTime);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              return `${hours}:${minutes}`;
            } catch {
              return "";
            }
          };

          // Map event data to form fields
          setEventData(prev => ({
            ...prev,
            title: transformedEvent.title || "",
            organizer: transformedEvent.organizerName || user?.organizationName || "",
            description: transformedEvent.description || "",
            fullDescription: transformedEvent.fullDescription || "",
            organizerDescription: transformedEvent.organizerDescription || "",
            date: parseDate(transformedEvent.startDate) || transformedEvent.date || "",
            time: parseTime(transformedEvent.startTime) || transformedEvent.time || "",
            endDate: parseDate(transformedEvent.endDate) || "",
            endTime: parseTime(transformedEvent.endTime) || "",
            registrationDeadline: parseDate((transformedEvent as { registrationDeadline?: string }).registrationDeadline) || "",
            registrationDeadlineTime: parseTime((transformedEvent as { registrationDeadline?: string }).registrationDeadline) || "",
            location: transformedEvent.location || "",
            venue: transformedEvent.venue || "",
            address: (transformedEvent as { address?: string }).address || "",
            onlineLink: (transformedEvent as { onlineLink?: string }).onlineLink || "",
            price: transformedEvent.price?.toString() || "",
            totalSlots: transformedEvent.capacity || 0,
            image: transformedEvent.image || "",
            requirements: Array.isArray(transformedEvent.requirements) 
              ? transformedEvent.requirements.join('\n') 
              : (typeof transformedEvent.requirements === 'string' ? transformedEvent.requirements : ""),
            ageRestriction: transformedEvent.ageRestriction || "",
            isOnline: transformedEvent.isOnline || false,
            capacity: transformedEvent.capacity?.toString() || "",
            category: transformedEvent.category || "",
            timezone: transformedEvent.timezone || timezone,
          }));
          
          // Set timezone separately to ensure it's loaded
          const eventTimezone = transformedEvent.timezone;
          if (eventTimezone && eventTimezone.trim() !== '') {
            setTimezone(eventTimezone);
          } else {
            // If no timezone in event, keep the default (user's timezone)
            console.log('No timezone found in event data, using default:', timezone);
          }
          
          setEventData(prev => ({
            ...prev,
            currency: transformedEvent.currency || DEFAULT_CURRENCY,
          }));

          // Set image preview if image exists
          if (transformedEvent.image) {
            setImagePreview(transformedEvent.image);
          }

          // Set event type based on isOnline
          setEventType(transformedEvent.isOnline ? "online" : "in-person");

          // Set ticket types
          if (transformedEvent.ticketTypes && transformedEvent.ticketTypes.length > 0) {
            const mappedTicketTypes: TicketType[] = transformedEvent.ticketTypes.map((tt, index) => ({
              id: index + 1,
              name: tt.name || "",
              type: tt.price === 0 || tt.isComplementary ? "free" : "paid",
              price: tt.price?.toString() || "",
              originalPrice: tt.originalPrice?.toString(),
              discountLabel: tt.discountLabel || undefined,
              quantity: tt.quantity?.toString() || "",
              isComplementary: tt.isComplementary,
              requiresInvitation: tt.requiresInvitation,
              availableFrom: tt.availableFrom || undefined,
              availableUntil: tt.availableUntil || undefined,
            }));
            setTicketTypes(mappedTicketTypes);
          }

          // Set registration fields
          if (transformedEvent.registrationFields && transformedEvent.registrationFields.length > 0) {
            const mappedFields: RegistrationField[] = transformedEvent.registrationFields.map(field => ({
              id: field.id,
              name: field.name,
              type: field.type,
              label: field.label,
              required: field.required,
              placeholder: field.placeholder || "",
              options: field.options,
            }));
            setRegistrationFields(mappedFields);
          }

          // Set categories
          if (transformedEvent.category) {
            setCategories([transformedEvent.category]);
          } else {
            // Reset to default if no category
            setCategories([]);
          }

          // Set tags - handle both array and string formats
          if (transformedEvent.tags) {
            if (Array.isArray(transformedEvent.tags)) {
              setTags(transformedEvent.tags);
            } else if (typeof transformedEvent.tags === 'string') {
              try {
                const parsedTags = JSON.parse(transformedEvent.tags);
                setTags(Array.isArray(parsedTags) ? parsedTags : []);
              } catch {
                // If parsing fails, treat as single tag
                setTags([transformedEvent.tags]);
              }
            } else {
              setTags([]);
            }
          } else {
            setTags([]);
          }

          // Set FAQs
          if (transformedEvent.faqs && transformedEvent.faqs.length > 0) {
            setFaqs(transformedEvent.faqs);
          }

          // Set agenda - ensure proper structure and handle JSON strings
          let agendaData: AgendaItem[] | string | null = transformedEvent.agenda as AgendaItem[] | string | null;

          // If agenda is a string, try to parse it
          if (typeof agendaData === 'string' && agendaData.trim() !== '') {
            try {
              agendaData = JSON.parse(agendaData) as AgendaItem[];
            } catch (e) {
              console.error('Failed to parse agenda JSON:', e);
              agendaData = null;
            }
          }

          if (agendaData && Array.isArray(agendaData) && agendaData.length > 0) {
            // Map agenda items to ensure they have the correct structure
            const mappedAgenda = agendaData.map((item: AgendaItem) => ({
              title: item.title || '',
              description: item.description || '',
              date: item.date || '',
              startTime: item.startTime || '',
              endTime: item.endTime || '',
              speakers: Array.isArray(item.speakers) ? item.speakers : [],
            }));
            setAgenda(mappedAgenda);
            setEventData(prev => ({ ...prev, agenda: mappedAgenda }));
          } else {
            setAgenda([]);
            setEventData(prev => ({ ...prev, agenda: [] }));
          }

          // Set speakers
          if (transformedEvent.speakers && Array.isArray(transformedEvent.speakers)) {
            const mappedSpeakers = transformedEvent.speakers.map((speaker, index) => ({
              id: `speaker-${index}`,
              name: speaker.name || "",
              title: speaker.title || "",
              bio: speaker.bio || "",
              image: speaker.image || "",
            }));
            setSpeakers(mappedSpeakers);
            setEventData(prev => ({ ...prev, speakers: mappedSpeakers }));
          }

          // Set exhibitors
          if (transformedEvent.exhibitors && Array.isArray(transformedEvent.exhibitors)) {
            setExhibitors(transformedEvent.exhibitors);
            setEventData(prev => ({ ...prev, exhibitors: transformedEvent.exhibitors || [] }));
          }

          // Set sponsors
          if (transformedEvent.sponsors && Array.isArray(transformedEvent.sponsors)) {
            setSponsors(transformedEvent.sponsors);
            setEventData(prev => ({ ...prev, sponsors: transformedEvent.sponsors || [] }));
          }

          // Set social links
          if (transformedEvent.socialLinks && typeof transformedEvent.socialLinks === 'object') {
            setSocialLinks(transformedEvent.socialLinks);
            setEventData(prev => ({ ...prev, socialLinks: transformedEvent.socialLinks || {} }));
          }

          // Set privacy
          setIsPrivate(transformedEvent.isPrivate || false);
        } else {
          setError('Failed to load event data');
        }
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event data. Please try again.');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEventForEdit();
  }, [editEventId, user, timezone]);

  // Load template data when template parameter is present
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId || isEditMode) return;

      try {
        setIsLoadingTemplate(true);
        setError(null);
        
        const response = await applyTemplate(templateId);
        
        if (response.success && response.data) {
          // The API returns { templateData, templateName }
          // Handle both templateData and eventData for compatibility
          const responseData = response.data as TemplateDataResponse;
          const templateData: TemplateData = responseData.templateData || responseData.eventData || {};
          const templateName = responseData.templateName || '';
          
          // Clear any existing draft when loading from template
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          
          // Map template data to form fields (dates are cleared - user must enter new ones)
          setEventData(prev => ({
            ...prev,
            title: "", // Always clear title - user must enter new one
            organizer: user?.organizationName || "",
            description: templateData.description || "",
            fullDescription: templateData.fullDescription || "",
            organizerDescription: templateData.organizerDescription || "",
            date: "", // Clear dates - user must enter new ones
            time: "",
            endDate: "",
            endTime: "",
            registrationDeadline: "",
            registrationDeadlineTime: "",
            location: templateData.location || "",
            venue: templateData.venue || "",
            address: templateData.address || "",
            onlineLink: templateData.onlineLink || "",
            price: templateData.price ? String(templateData.price) : "",
            totalSlots: templateData.capacity || 0,
            image: templateData.image || "",
            requirements: Array.isArray(templateData.requirements)
              ? templateData.requirements.join('\n')
              : (typeof templateData.requirements === 'string' ? templateData.requirements : ""),
            ageRestriction: templateData.ageRestriction || "",
            isOnline: templateData.isOnline || false,
            capacity: templateData.capacity ? String(templateData.capacity) : "",
            category: templateData.category || "",
            timezone: templateData.timezone || timezone,
            currency: templateData.currency || DEFAULT_CURRENCY,
          }));

          // Set timezone separately
          if (templateData.timezone && templateData.timezone.trim() !== '') {
            setTimezone(templateData.timezone);
          }

          // Set image preview if image exists
          if (templateData.image) {
            setImagePreview(templateData.image);
          }

          // Set event type based on isOnline
          setEventType(templateData.isOnline ? "online" : "in-person");

          // Set ticket types
          if (templateData.ticketTypes && Array.isArray(templateData.ticketTypes) && templateData.ticketTypes.length > 0) {
            const mappedTicketTypes: TicketType[] = templateData.ticketTypes.map((tt: TicketTypeData, index: number) => ({
              id: index + 1,
              name: tt.name || "",
              type: (tt.price === 0 || tt.isComplementary) ? "free" as const : "paid" as const,
              price: tt.price ? String(tt.price) : "",
              originalPrice: tt.originalPrice ? String(tt.originalPrice) : undefined,
              discountLabel: tt.discountLabel || undefined,
              quantity: tt.quantity ? String(tt.quantity) : "",
              isComplementary: tt.isComplementary || false,
              requiresInvitation: tt.requiresInvitation || false,
              availableFrom: tt.availableFrom || undefined,
              availableUntil: tt.availableUntil || undefined,
            }));
            setTicketTypes(mappedTicketTypes);
          }

          // Set registration fields
          if (templateData.registrationFields && Array.isArray(templateData.registrationFields) && templateData.registrationFields.length > 0) {
            const mappedFields: RegistrationField[] = templateData.registrationFields.map((field: RegistrationFieldData) => ({
              id: field.id || `field-${Date.now()}-${Math.random()}`,
              name: field.name || field.id || '',
              type: field.type || "text",
              label: field.label || field.name || "",
              required: field.required || false,
              placeholder: field.placeholder || "",
              options: field.options || undefined,
            }));
            setRegistrationFields(mappedFields);
          }

          // Set categories
          if (templateData.category) {
            setCategories([templateData.category]);
          }

          // Set tags
          if (templateData.tags) {
            if (Array.isArray(templateData.tags)) {
              setTags(templateData.tags);
            } else if (typeof templateData.tags === 'string') {
              try {
                const parsedTags = JSON.parse(templateData.tags);
                setTags(Array.isArray(parsedTags) ? parsedTags : [templateData.tags]);
              } catch {
                setTags([templateData.tags]);
              }
            }
          }

          // Set FAQs
          if (templateData.faqs && Array.isArray(templateData.faqs) && templateData.faqs.length > 0) {
            setFaqs(templateData.faqs);
          }

          // Set agenda
          let agendaDataParsed: AgendaItem[] | null = null;
          if (typeof templateData.agenda === 'string' && templateData.agenda.trim() !== '') {
            try {
              agendaDataParsed = JSON.parse(templateData.agenda) as AgendaItem[];
            } catch (e) {
              console.error('Failed to parse agenda JSON:', e);
              agendaDataParsed = null;
            }
          } else if (Array.isArray(templateData.agenda)) {
            agendaDataParsed = templateData.agenda;
          }

          if (agendaDataParsed && Array.isArray(agendaDataParsed) && agendaDataParsed.length > 0) {
            const mappedAgenda = agendaDataParsed.map((item: AgendaItem) => ({
              title: item.title || '',
              description: item.description || '',
              date: item.date || '',
              startTime: item.startTime || '',
              endTime: item.endTime || '',
              speakers: Array.isArray(item.speakers) ? item.speakers : [],
            }));
            setAgenda(mappedAgenda);
            setEventData(prev => ({ ...prev, agenda: mappedAgenda }));
          }

          // Set speakers
          if (templateData.speakers && Array.isArray(templateData.speakers) && templateData.speakers.length > 0) {
            const mappedSpeakers = templateData.speakers.map((speaker: SpeakerItem, index: number) => ({
              id: `speaker-${index}`,
              name: speaker.name || "",
              title: speaker.title || "",
              bio: speaker.bio || "",
              image: speaker.image || "",
            }));
            setSpeakers(mappedSpeakers);
            setEventData(prev => ({ ...prev, speakers: mappedSpeakers }));
          }

          // Set exhibitors
          if (templateData.exhibitors && Array.isArray(templateData.exhibitors) && templateData.exhibitors.length > 0) {
            setExhibitors(templateData.exhibitors);
            setEventData(prev => ({ ...prev, exhibitors: templateData.exhibitors || [] }));
          }

          // Set sponsors
          if (templateData.sponsors && Array.isArray(templateData.sponsors) && templateData.sponsors.length > 0) {
            setSponsors(templateData.sponsors);
            setEventData(prev => ({ ...prev, sponsors: templateData.sponsors || [] }));
          }

          // Set social links
          if (templateData.socialLinks && typeof templateData.socialLinks === 'object') {
            setSocialLinks(templateData.socialLinks);
            setEventData(prev => ({ ...prev, socialLinks: templateData.socialLinks || {} }));
          }

          // Set privacy
          setIsPrivate(templateData.isPrivate || false);

          // Show success message
          toast({
            title: "Template Loaded",
            description: templateName ? `Template "${templateName}" loaded successfully. Please fill in the title and dates.` : "Template loaded successfully. Please fill in the title and dates.",
          });

          // Save initial state as draft
          setTimeout(() => {
            saveDraft();
          }, 1000);
        } else {
          setError('Failed to load template data');
        }
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template data. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load template. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    loadTemplate();
  }, [templateId, isEditMode, user, timezone, toast, saveDraft]);

  // Restore separate state from draft when loading (skip if template is being loaded)
  useEffect(() => {
    if (!isEditMode && !editEventId && !templateId) {
      try {
        const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            // Restore separate state variables from draft
            if (parsed.socialLinks) {
              setSocialLinks(parsed.socialLinks);
            }
            if (parsed.agenda) {
              setAgenda(parsed.agenda);
            }
            if (parsed.speakers) {
              setSpeakers(parsed.speakers);
            }
            if (parsed.exhibitors) {
              setExhibitors(parsed.exhibitors);
            }
            if (parsed.sponsors) {
              setSponsors(parsed.sponsors);
            }
            if (parsed.ticketTypes && Array.isArray(parsed.ticketTypes)) {
              setTicketTypes(parsed.ticketTypes);
            }
            if (parsed.categories && Array.isArray(parsed.categories)) {
              setCategories(parsed.categories);
            }
            if (parsed.tags && Array.isArray(parsed.tags)) {
              setTags(parsed.tags);
            }
            if (parsed.faqs && Array.isArray(parsed.faqs)) {
              setFaqs(parsed.faqs);
            }
            if (parsed.timezone) {
              setTimezone(parsed.timezone);
            }
            // Also restore from data object if present (for backward compatibility)
            if (parsed.data) {
              if (parsed.data.socialLinks) {
                setSocialLinks(parsed.data.socialLinks);
              }
              if (parsed.data.agenda) {
                setAgenda(parsed.data.agenda);
              }
              if (parsed.data.speakers) {
                setSpeakers(parsed.data.speakers);
              }
              if (parsed.data.exhibitors) {
                setExhibitors(parsed.data.exhibitors);
              }
              if (parsed.data.sponsors) {
                setSponsors(parsed.data.sponsors);
              }
              if (parsed.data.timezone) {
                setTimezone(parsed.data.timezone);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error restoring draft state:', error);
      }
    }
  }, [isEditMode, editEventId, templateId]);

  // Clear form when navigating to create a new event (not in edit mode) and after successful submission
  useEffect(() => {
    // Only reset if we're not in edit mode
    if (!editEventId && !isEditMode) {
      const draft = loadDraft();
      // If no draft exists, ensure form is completely reset
      if (Object.keys(draft).length === 0) {
        // Reset all form state to initial values
        resetForm();
        // Also reset other state variables
        setTicketTypes([{ id: 1, name: "", type: "paid", price: "", quantity: "" }]);
        setCategories(["Music", "Concert"]);
        setTags([]);
        setFaqs([{ question: "", answer: "" }]);
        setEventType("in-person");
        setIsPrivate(false);
        setImagePreview(null);
        setCurrentStep(1);
        setError(null);
        setValidationErrors({});
        setNewCategory("");
        setNewTag("");
        // Reset separate state
        setSocialLinks({});
        setAgenda([]);
        setSpeakers([]);
        setExhibitors([]);
        setSponsors([]);
      }
    }
  }, [editEventId, isEditMode, loadDraft, resetForm]);

  // Reset form when component mounts and we're creating a new event (not editing)
  // This ensures fresh state when navigating to create event page
  useEffect(() => {
    // Only run on mount for new event creation (not edit mode)
    if (!isEditMode && !editEventId) {
      // Check if we just navigated here (not from a draft load)
      const hasDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!hasDraft) {
        // No draft exists, ensure everything is reset
        resetForm();
        setTicketTypes([{ id: 1, name: "", type: "paid", price: "", quantity: "" }]);
        setCategories(["Music", "Concert"]);
        setTags([]);
        setFaqs([{ question: "", answer: "" }]);
        setEventType("in-person");
        setIsPrivate(false);
        setImagePreview(null);
        setCurrentStep(1);
        setError(null);
        setValidationErrors({});
        setNewCategory("");
        setNewTag("");
      }
    }
  }, [location.pathname, isEditMode, editEventId, resetForm]); // Reset when route changes

  // Clear draft after successful submission
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

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
      label: "",
      required: false,
      placeholder: "",
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

  const validateStep = useCallback((step: number) => {
    const errors: Record<string, string> = {};

    if (step === 1) { // Basic Info
      if (!eventData.title?.trim()) errors.title = 'Event title is required';
      if (!eventData.description?.trim()) errors.description = 'Event description is required';
      if (eventData.description && eventData.description.length < 10) {
        errors.description = 'Description must be at least 10 characters';
      }
      if (!eventData.category) errors.category = 'Category is required';
    }
    
    // Step 2 (Social) and Step 3 (Agenda) are optional, no strict validation needed yet
    
    if (step === 4) { // Date & Location
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
    
    if (step === 5) { // Tickets
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
      
      // Validate capacity matches sum of ticket quantities
      if (eventData.capacity && eventData.capacity.trim() !== '') {
        const capacity = parseInt(eventData.capacity, 10);
        if (!isNaN(capacity) && capacity > 0) {
          // Sum up all ticket quantities (only count tickets with quantities set)
          const totalTicketQuantity = ticketTypes.reduce((sum, ticket) => {
            if (ticket.quantity && ticket.quantity.trim() !== '') {
              const qty = parseInt(ticket.quantity, 10);
              if (!isNaN(qty) && qty > 0) {
                return sum + qty;
              }
            }
            return sum;
          }, 0);
          
          // Only validate if at least one ticket has a quantity set
          if (totalTicketQuantity > 0 && totalTicketQuantity !== capacity) {
            errors.capacity = `Event capacity (${capacity}) must match the sum of ticket quantities (${totalTicketQuantity}). Please adjust either the capacity or ticket quantities.`;
            errors.tickets = errors.tickets || 'Ticket quantities must match event capacity';
          }
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [eventData, eventType, ticketTypes]);

  const transformFormDataToAPI = useCallback((): CreateEventData => {
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

    // Build registration deadline date with optional time
    const registrationDeadline = eventData.registrationDeadline
      ? new Date(`${eventData.registrationDeadline}T${eventData.registrationDeadlineTime || '23:59'}`).toISOString()
      : undefined;

    // Determine single price if all tickets have same price
    const singlePrice = !isFree && ticketTypes.length === 1 && ticketTypes[0].type === 'paid'
      ? parseFloat(ticketTypes[0].price)
      : undefined;

    const apiData: CreateEventData = {
      title: eventData.title.trim(),
      description: eventData.description.trim(),
      fullDescription: eventData.fullDescription?.trim() || undefined,
      organizerDescription: eventData.organizerDescription?.trim() || undefined,
      category: eventData.category || categories[0] || undefined,
      tags: tags.length > 0 ? tags : undefined,
      startDate,
      endDate,
      startTime: eventData.time,
      endTime: eventData.endTime || undefined,
      registrationDeadline,
      venue: eventData.venue?.trim() || undefined,
      location: eventData.location?.trim() || eventData.onlineLink?.trim() || '',
      address: eventData.address?.trim() || undefined,
      isOnline: eventType === 'online' || eventType === 'hybrid',
      onlineLink: eventData.onlineLink?.trim() || undefined,
      isFree,
      price: singlePrice,
      currency: eventData.currency || DEFAULT_CURRENCY,
      ticketTypes: apiTicketTypes.length > 0 ? apiTicketTypes : undefined,
      capacity: (() => {
        // Ensure we're using the capacity from form, not availableSlots
        const capacityValue = eventData.capacity;
        if (!capacityValue || capacityValue.trim() === '') {
          return undefined;
        }
        const parsed = parseInt(capacityValue, 10);
        if (isNaN(parsed) || parsed < 0) {
          console.warn('Invalid capacity value:', capacityValue);
          return undefined;
        }
        console.log('Saving capacity:', parsed, 'from form value:', capacityValue);
        return parsed;
      })(),
      // Only include image if it has a value (preserves existing image in edit mode if not changed)
      image: eventData.image?.trim() || undefined,
      timezone: timezone || undefined,
      type: isPrivate ? EventType.PRIVATE : EventType.PUBLIC,
      requirements: eventData.requirements?.trim() 
        ? eventData.requirements.split(/[,\n]/).map(r => r.trim()).filter(Boolean)
        : undefined,
      ageRestriction: eventData.ageRestriction?.trim() || undefined,
      speakers: speakers.length > 0 ? speakers.map(s => ({
        name: s.name,
        title: s.title || '',
        bio: s.bio || '',
        image: s.image
      })) : undefined,
      agenda: agenda.length > 0 ? agenda.map(a => ({
        title: a.title,
        description: a.description || '',
        startTime: a.startTime || '',
        endTime: a.endTime || '',
        speakers: a.speakers || []
      })) : undefined,
      exhibitors: exhibitors.length > 0 ? exhibitors.map(e => ({
        name: e.name,
        description: e.description || '',
        logo: e.logo || '',
        contactEmail: e.contactEmail || '',
        booth: e.booth || ''
      })) : undefined,
      sponsors: sponsors.length > 0 ? sponsors.map(s => ({
        name: s.name,
        level: s.level || '',
        logo: s.logo || ''
      })) : undefined,
      socialLinks: socialLinks && Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
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
  }, [ticketTypes, eventData, categories, tags, speakers, agenda, exhibitors, sponsors, socialLinks, faqs, registrationFields, eventType, isPrivate, timezone]);

  const handleSubmit = useCallback(async () => {
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

    // Eventbrite-style: No verification required to CREATE events
    // Verification is only required to RECEIVE payouts (handled in disbursement service)

    setIsSubmitting(true);
    setError(null);

    try {
      const apiData = transformFormDataToAPI();
      
      if (isEditMode && eventId) {
        // Update existing event
        const response = await updateEvent(eventId, apiData as UpdateEventData);
        
        if (response.success && response.data) {
          // Clear draft on success
          clearDraft();
          // Reset form state
          resetForm();
          // Navigate back to event management page
          navigate(`/organizer/event/${eventId}`, {
            state: { message: 'Event updated successfully!' }
          });
        } else {
          setError(response.message || 'Failed to update event. Please try again.');
        }
      } else {
        // Create new event
        const response = await createEvent(apiData);

        if (response.success && response.data) {
          // Clear draft on success
          clearDraft();
          // Set flag to clear draft when returning to create new event
          sessionStorage.setItem('event_just_created', 'true');
          // Reset form state
          resetForm();
          // Success! Navigate based on current route
          const isAdminRoute = location.pathname.startsWith('/admin');
          const isStandaloneRoute = location.pathname.includes('/create-standalone');
          
          if (isAdminRoute) {
            navigate('/admin/dashboard', {
              state: { message: 'Event created successfully! It is pending admin approval.' }
            });
          } else if (isStandaloneRoute) {
            // For standalone creation, navigate to dashboard with success message and verification reminder
            const needsVerification = verificationStatus && !verificationStatus.identityVerified;
            const successMessage = 'Event created successfully! It is pending admin approval. You will receive an email when it\'s approved.';
            const verificationMessage = needsVerification 
              ? 'Complete identity verification to help speed up approval and receive payouts from ticket sales.'
              : null;
            
            navigate('/organizer/dashboard', {
              state: { 
                message: successMessage,
                verificationReminder: verificationMessage,
                eventCreated: true,
                needsVerification: needsVerification
              }
            });
          } else {
            // Created from dashboard - go back to dashboard
            navigate('/organizer/dashboard', {
              state: { message: 'Event created successfully! It is pending admin approval.' }
            });
          }
        } else {
          setError(response.message || 'Failed to create event. Please try again.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateStep, user, navigate, isEditMode, eventId, transformFormDataToAPI, clearDraft, resetForm, location.pathname, verificationStatus]);

  const handleNext = useCallback(() => {
    if (currentStep < 8) {
      if (validateStep(currentStep)) {
        setError(null);
        // Save draft before navigating to next step
        if (!isEditMode) {
          saveDraft();
        }
        setCurrentStep(currentStep + 1);
      } else {
        setError('Please fix the errors before proceeding');
      }
    } else {
      handleSubmit();
    }
  }, [currentStep, isEditMode, saveDraft, validateStep, handleSubmit]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      // Save draft before navigating to previous step
      if (!isEditMode) {
        saveDraft();
      }
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate to appropriate dashboard based on current route
      const isAdminRoute = location.pathname.startsWith('/admin');
      const dashboardRoute = isAdminRoute ? '/admin/dashboard' : '/organizer/dashboard';
      navigate(dashboardRoute);
    }
  }, [currentStep, isEditMode, saveDraft, location.pathname, navigate]);

  const renderBasicInfoStep = () => (
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
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.title ? 'border-destructive' : ''}`}
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
            className="h-12 border-border focus-visible:border-primary/30"
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

      <div className="space-y-2">
        <Label htmlFor="fullDescription">Detailed Description (Optional)</Label>
        <Textarea 
          id="fullDescription" 
          placeholder="Provide a more comprehensive description of your event, including what attendees can expect..." 
          rows={6}
          value={eventData.fullDescription}
          maxLength={10000}
          onChange={(e) => handleInputChange("fullDescription", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {eventData.fullDescription.length}/10000 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizerDescription">About the Organizer (Optional)</Label>
        <Textarea 
          id="organizerDescription" 
          placeholder="Tell attendees about yourself or your organization. This will be displayed on the event details page." 
          rows={4}
          value={eventData.organizerDescription || ""}
          maxLength={1000}
          onChange={(e) => handleInputChange("organizerDescription", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {(eventData.organizerDescription || "").length}/1000 characters
        </p>
        <p className="text-xs text-muted-foreground">
          Share information about yourself or your organization to help attendees learn more about the event host.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Event Type *</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={eventType === 'in-person' ? 'default' : 'outline'}
              onClick={() => setEventType('in-person')}
              className={`h-11 text-sm font-medium rounded-xl transition-all duration-200 ${
                eventType === 'in-person'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'
              }`}
            >
              <MapPin className="mr-2 h-4 w-4" />
              In-Person
            </Button>
            <Button
              type="button"
              variant={eventType === 'online' ? 'default' : 'outline'}
              onClick={() => setEventType('online')}
              className={`h-11 text-sm font-medium rounded-xl transition-all duration-200 ${
                eventType === 'online'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'
              }`}
            >
              <Globe className="mr-2 h-4 w-4" />
              Online
            </Button>
            <Button
              type="button"
              variant={eventType === 'hybrid' ? 'default' : 'outline'}
              onClick={() => setEventType('hybrid')}
              className={`h-11 text-sm font-medium rounded-xl transition-all duration-200 ${
                eventType === 'hybrid'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'
              }`}
            >
              <Users className="mr-2 h-4 w-4" />
              Hybrid
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select 
              value={eventData.currency || DEFAULT_CURRENCY}
              onValueChange={(value) => setEventData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the currency for ticket prices
            </p>
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
    </div>
  );

  const renderDateLocationStep = () => (
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
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.date ? 'border-destructive' : ''}`}
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
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.time ? 'border-destructive' : ''}`}
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
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.endDate ? 'border-destructive' : ''}`}
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
            className="h-12 border-border focus-visible:border-primary/30"
          />
        </div>
      </div>

      {/* Registration Deadline - Toggle Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="hasRegistrationDeadline" className="text-sm font-medium cursor-pointer">
                Set Registration Deadline
              </Label>
              <p className="text-xs text-muted-foreground">
                Close registrations before the event starts
              </p>
            </div>
          </div>
          <Switch
            id="hasRegistrationDeadline"
            checked={!!eventData.registrationDeadline}
            onCheckedChange={(checked) => {
              if (!checked) {
                handleInputChange("registrationDeadline", "");
              } else {
                // Default to event date if available
                handleInputChange("registrationDeadline", eventData.date || "");
              }
            }}
          />
        </div>

        {/* Expandable deadline fields */}
        {eventData.registrationDeadline !== "" && (
          <div className="pt-3 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline" className="text-xs text-muted-foreground">
                  Last Registration Date
                </Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={eventData.registrationDeadline}
                  max={eventData.date || undefined}
                  onChange={(e) => handleInputChange("registrationDeadline", e.target.value)}
                  className="h-10 border-border focus-visible:border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationDeadlineTime" className="text-xs text-muted-foreground">
                  Closing Time
                </Label>
                <Input
                  id="registrationDeadlineTime"
                  type="time"
                  value={eventData.registrationDeadlineTime || "23:59"}
                  onChange={(e) => handleInputChange("registrationDeadlineTime", e.target.value)}
                  className="h-10 border-border focus-visible:border-primary/30"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registrations will close on this date and time. After this, attendees won't be able to register.
            </p>
          </div>
        )}
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
              className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.venue ? 'border-destructive' : ''}`}
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
              className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.location ? 'border-destructive' : ''}`}
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
            className={`h-12 border-border focus-visible:border-primary/30 ${validationErrors.onlineLink ? 'border-destructive' : ''}`}
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
          min="1"
          placeholder="Maximum number of attendees"
          value={eventData.capacity}
          onChange={(e) => {
            const value = e.target.value;
            // Only allow positive integers or empty string
            if (value === '' || /^\d+$/.test(value)) {
              handleInputChange("capacity", value);
            }
          }}
          onBlur={(e) => {
            // Ensure value is valid on blur
            const value = e.target.value.trim();
            if (value === '' || parseInt(value, 10) > 0) {
              handleInputChange("capacity", value);
            } else {
              // Reset to empty if invalid
              handleInputChange("capacity", "");
            }
          }}
          className="h-12 border-border focus-visible:border-primary/30"
        />
        <p className="text-xs text-muted-foreground">
          Enter the maximum number of attendees for this event
        </p>
      </div>
    </div>
  );

  const renderSocialStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Social Connections
        </h2>
        <p className="text-muted-foreground">
          Connect your social media accounts to display them on your event page.
        </p>
      </div>

      <SocialConnectionsStep
        socialLinks={socialLinks}
        onChange={(newLinks) => {
          setSocialLinks(newLinks);
          setEventData(prev => ({ ...prev, socialLinks: newLinks }));
        }}
      />
    </div>
  );

  const handleAgendaUpdate = useCallback((field: 'agenda' | 'speakers' | 'exhibitors' | 'sponsors', value: AgendaItem[] | SpeakerItem[] | ExhibitorItem[] | SponsorItem[]) => {
    if (field === 'agenda') {
      setAgenda(value as AgendaItem[]);
      setEventData(prev => ({ ...prev, agenda: value as AgendaItem[] }));
    }
    if (field === 'speakers') {
      setSpeakers(value as SpeakerItem[]);
      setEventData(prev => ({ ...prev, speakers: value as SpeakerItem[] }));
    }
    if (field === 'exhibitors') {
      setExhibitors(value as ExhibitorItem[]);
      setEventData(prev => ({ ...prev, exhibitors: value as ExhibitorItem[] }));
    }
    if (field === 'sponsors') {
      setSponsors(value as SponsorItem[]);
      setEventData(prev => ({ ...prev, sponsors: value as SponsorItem[] }));
    }
  }, []);

  const renderAgendaStep = () => (
    <div className="space-y-6">
      <AgendaBuilderStep
        agenda={agenda.map(a => ({
          title: a.title,
          description: a.description || '',
          date: a.date,
          startTime: a.startTime || '',
          endTime: a.endTime || '',
          speakers: a.speakers || []
        }))}
        speakers={speakers.map(s => ({
          id: s.id || Date.now().toString(),
          name: s.name,
          title: s.title || '',
          bio: s.bio || '',
          image: s.image || ''
        }))}
        exhibitors={exhibitors.map(e => ({
          name: e.name,
          description: e.description || '',
          logo: e.logo || '',
          contactEmail: e.contactEmail || '',
          booth: e.booth || ''
        }))}
        sponsors={sponsors.map(s => ({
          name: s.name,
          level: s.level || '',
          logo: s.logo || ''
        }))}
        eventStartDate={eventData.date}
        onUpdate={handleAgendaUpdate}
      />
    </div>
  );

  const renderTicketsStep = () => (
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
          <Card key={ticket.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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
                    className="h-12 border-border focus-visible:border-primary/30"
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
                    <Checkbox
                      id={`complementary-${ticket.id}`}
                      checked={ticket.isComplementary || false}
                      onCheckedChange={(checked) => {
                        const updatedTickets = [...ticketTypes];
                        if (checked) {
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
                    />
                    <Label htmlFor={`complementary-${ticket.id}`} className="flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      This is a complementary ticket
                    </Label>
                  </div>
                  {ticket.isComplementary && (
                    <div className="pl-6 space-y-2 border-l-2 border-primary">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`invitation-${ticket.id}`}
                          checked={ticket.requiresInvitation || false}
                          onCheckedChange={(checked) => {
                            const updatedTickets = [...ticketTypes];
                            updatedTickets[index] = {
                              ...ticket,
                              requiresInvitation: !!checked,
                            };
                            setTicketTypes(updatedTickets);
                          }}
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
                    <Checkbox
                      id={`discount-${ticket.id}`}
                      checked={!!ticket.originalPrice}
                      onCheckedChange={(checked) => {
                        const updatedTickets = [...ticketTypes];
                        if (checked) {
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
                            className="h-12 border-border focus-visible:border-primary/30"
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
                        <div className="p-3 bg-success/5 border border-success rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-success">
                                Discount Preview
                              </p>
                              <p className="text-xs text-success">
                                {Math.round(((parseFloat(ticket.originalPrice) - parseFloat(ticket.price)) / parseFloat(ticket.originalPrice)) * 100)}% OFF
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-success">
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
                          className="h-12 border-border focus-visible:border-primary/30"
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
                        className="h-12 border-border focus-visible:border-primary/30"
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
                        className="h-12 border-border focus-visible:border-primary/30"
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
                  className="h-12 border-border focus-visible:border-primary/30"
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
          className="w-full border-dashed border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Ticket Type
        </Button>
        
        {/* Capacity Validation Summary */}
        {eventData.capacity && eventData.capacity.trim() !== '' && (() => {
          const capacity = parseInt(eventData.capacity, 10);
          const totalTicketQuantity = ticketTypes.reduce((sum, ticket) => {
            if (ticket.quantity && ticket.quantity.trim() !== '') {
              const qty = parseInt(ticket.quantity, 10);
              if (!isNaN(qty) && qty > 0) {
                return sum + qty;
              }
            }
            return sum;
          }, 0);
          
          if (!isNaN(capacity) && capacity > 0 && totalTicketQuantity > 0) {
            const matches = totalTicketQuantity === capacity;
            return (
              <Card className={`mt-4 border-2 ${matches ? 'border-success bg-success/5/50' : 'border-destructive bg-destructive/10'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {matches ? '✓ Capacity matches ticket quantities' : '⚠ Capacity mismatch'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Event Capacity: <strong>{capacity}</strong> | Total Ticket Quantities: <strong>{totalTicketQuantity}</strong>
                      </p>
                    </div>
                    {!matches && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  {!matches && (
                    <p className="text-xs text-destructive mt-2">
                      Please adjust either the event capacity or ticket quantities so they match.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );

  const renderRegistrationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Registration Form
        </h2>
        <p className="text-muted-foreground">
          Customize what information you collect from attendees.
        </p>
      </div>

      <div className="flex justify-end items-center space-x-2 mb-4">
        <Label htmlFor="builder-mode" className="text-sm font-medium">
          {useDragAndDrop ? 'Drag & Drop Builder' : 'Simple Builder'}
        </Label>
        <Switch
          id="builder-mode"
          checked={useDragAndDrop}
          onCheckedChange={setUseDragAndDrop}
        />
      </div>

      {useDragAndDrop ? (
        <DragAndDropFormBuilder
          fields={registrationFields.map((field: RegistrationField) => ({
            id: field.id,
            name: field.id,
            type: field.type as FormFieldType,
            label: field.label,
            required: field.required,
            placeholder: field.placeholder,
            options: field.options
          }))}
          onChange={(newFields: RegistrationField[]) => {
            const mappedFields = newFields.map((field: RegistrationField) => ({
              id: field.id,
              name: field.id,
              type: field.type,
              label: field.label,
              required: field.required || false,
              placeholder: field.placeholder || '',
              options: field.options
            }));
            setRegistrationFields(mappedFields);
          }}
        />
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
          {/* Display standard fields (Name, Email, Phone) as read-only or informational if needed, 
              but usually they are implicit. The original code only mapped 'registrationFields'.
              Assuming standard fields like 'First Name', 'Last Name', 'Email' are fixed or handled elsewhere?
              The original code rendered all fields in 'registrationFields'. */}
              
          {registrationFields.map((field, index) => (
            <Card key={field.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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
                      className="h-12 border-border focus-visible:border-primary/30"
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
                    className="h-12 border-border focus-visible:border-primary/30"
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
            className="w-full border-dashed border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
        </div>
      )}
    </div>
  );

  const renderMediaStep = () => (
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
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    setEventData(prev => ({ ...prev, image: '' }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
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
                className="border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                {isUploadingImage ? (
                  <>
                    <Loader size="sm" className="mr-2" />
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
                className="h-12 border-border focus-visible:border-primary/30"
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
            className="h-12 border-border focus-visible:border-primary/30"
          />
          <Button onClick={addTag} disabled={!newTag.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <Label htmlFor="requirements">Event Requirements (Optional)</Label>
        <Textarea 
          id="requirements"
          placeholder="e.g., Valid ID required, 18+ only, Dress code: Business casual"
          rows={3}
          value={eventData.requirements}
          onChange={(e) => handleInputChange("requirements", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          List any requirements attendees need to meet (one per line or separated by commas)
        </p>
      </div>

      {/* Age Restriction */}
      <div className="space-y-2">
        <Label htmlFor="ageRestriction">Age Restriction (Optional)</Label>
        <Select
          value={eventData.ageRestriction || "none"}
          onValueChange={(value) => {
            // If "none" is selected, set to empty string, otherwise set the value
            handleInputChange("ageRestriction", value === "none" ? "" : value);
          }}
        >
          <SelectTrigger id="ageRestriction">
            <SelectValue placeholder="Select age restriction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No restriction</SelectItem>
            <SelectItem value="All ages">All ages</SelectItem>
            <SelectItem value="13+">13+</SelectItem>
            <SelectItem value="16+">16+</SelectItem>
            <SelectItem value="18+">18+</SelectItem>
            <SelectItem value="21+">21+</SelectItem>
            <SelectItem value="25+">25+</SelectItem>
            <SelectItem value="Adults only">Adults only</SelectItem>
            <SelectItem value="Seniors (65+)">Seniors (65+)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Specify any age restrictions for this event
        </p>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <Label>Frequently Asked Questions</Label>
        {faqs.map((faq, index) => (
          <Card key={index} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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
                  className="h-12 border-border focus-visible:border-primary/30"
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
          className="w-full border-dashed border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>
    </div>
  );



  const renderReviewStep = () => (
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



  // steps definition moved up

  // Render preview modal
  const renderPreview = () => {
    // Show registration form preview if on step 5 (Registration step)
    if (currentStep === 5) {
      return (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>Registration Form Preview</DialogTitle>
              <DialogDescription>
                This is how your registration form will appear to attendees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden bg-card">
                {/* Event Image */}
                {(imagePreview || eventData.image) && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={imagePreview || eventData.image}
                      alt={eventData.title || 'Event'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  {/* Event Title */}
                  <h3 className="text-2xl font-bold mb-2">{eventData.title || 'Event Registration'}</h3>
                  
                  {/* Organizer */}
                  {eventData.organizer && (
                    <p className="text-sm text-muted-foreground mb-4">by {eventData.organizer}</p>
                  )}
                  
                  {/* Event Details */}
                  <div className="space-y-2 mb-6 text-sm">
                    {/* Date & Time */}
                    {eventData.date && eventData.time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(`${eventData.date}T${eventData.time}`).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} at {new Date(`${eventData.date}T${eventData.time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {/* Location/Venue */}
                    {(eventData.venue || eventData.location || eventData.onlineLink) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {eventData.venue && `${eventData.venue}, `}
                          {eventData.location || eventData.onlineLink}
                        </span>
                      </div>
                    )}
                    
                    {/* Category */}
                    {eventData.category && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{eventData.category}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-lg font-semibold mb-4">Registration Form</h4>
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
                          <Checkbox id={`preview-${field.id}`} disabled />
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
                        {ticket.type === 'free'
                          ? 'Free'
                          : `${eventData.currency || DEFAULT_CURRENCY}${parseFloat(ticket.price || '0').toFixed(2)}`}
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

  // Show loading state while fetching event data
  if (isLoadingEvent || isLoadingTemplate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isLoadingEvent ? "Loading event data..." : "Loading template..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isEditMode ? 'Update your event details' : 'Set up your event with all the details attendees need to know'}
          </p>
          
          {/* Draft Save Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {isSavingDraft ? (
              <>
                <Loader size="sm" />
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
              <span>{Math.round((currentStep / steps.length) * 100)}% complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Navigation - Hidden on mobile, shown on desktop */}

        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Verification Info Banner - Eventbrite style: Verification needed for payouts, not event creation */}
        {!loadingVerification && !isEditMode && hasPaidTickets() && !verificationStatus?.identityVerified && (
          <Alert className="mb-4 border-primary bg-primary/5">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-primary">
                <strong>Note:</strong> Identity verification is required to receive payouts from ticket sales. You can create and publish your event now, but complete verification to receive funds.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/organizer/verification', { 
                  state: { redirectAfterVerification: location.pathname } 
                })}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Verify Identity
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Content */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-md">
          <CardContent className="p-6 sm:p-8">
            {currentStep === 1 && renderBasicInfoStep()}
            {currentStep === 2 && renderDateLocationStep()}
            {currentStep === 3 && renderAgendaStep()}
            {currentStep === 4 && renderTicketsStep()}
            {currentStep === 5 && renderRegistrationStep()}
            {currentStep === 6 && renderMediaStep()}
            {currentStep === 7 && renderSocialStep()}
            {currentStep === 8 && renderReviewStep()}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
              {/* Left side - Back button (only from step 2 onwards) */}
              <div>
                {currentStep >= 2 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                )}
              </div>
              
              {/* Right side - Preview (middle) and Next (right) */}
              <div className="flex items-center gap-3 ml-auto">
                {/* Preview Button - Show from step 3 onwards, in the middle */}
                {currentStep >= 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="px-6 border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    disabled={isSubmitting}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                )}
                
                {/* Next Button - Always on the right */}
                {isSubmitting ? (
                  <Button
                    onClick={handleNext}
                    className="px-6 h-11 rounded-xl bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-none"
                    disabled={isSubmitting}
                  >
                    <Loader size="sm" className="mr-2" />
                    {currentStep === 8 ? 'Publishing...' : 'Validating...'}
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    disabled={isSubmitting}
                  >
                    <span>{currentStep === 8 ? (isEditMode ? 'Update Event' : 'Publish Event') : 'Next'}</span>
                    {currentStep !== 8 && <ArrowRight className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Preview Modal */}
      {renderPreview()}
    </div>
  );
}