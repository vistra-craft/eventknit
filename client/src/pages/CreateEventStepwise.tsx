import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Users,
  Ticket,
  CheckCircle,
  Calendar,
  Camera,
  FileText,
  AlertCircle,
  Save,
  Eye,
  MapPin,
  Clock,
  Shield,
  Layout,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { createEvent, type CreateEventData, EventType, updateEvent, type UpdateEventData } from '@/lib/event-api';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { getOrganizerEventById } from '@/lib/organizer-api';
import { transformEventData, type BackendEvent } from '@/lib/event-utils';
import { useAuth } from '@/hooks/useAuth';
import { getVerificationStatus, type VerificationStatus } from '@/lib/verification-api';
import { applyTemplate } from '@/lib/organizer-dashboard-api';
import { useToast } from '@/hooks/useToast';
import { SocialConnectionsStep } from '@/components/event-wizard/SocialConnectionsStep';
import { AgendaBuilderStep } from '@/components/event-wizard/AgendaBuilderStep';
import { BasicInfoStep } from '@/components/event-wizard/BasicInfoStep';
import BackButton from '@/components/BackButton';
import { DateLocationStep } from '@/components/event-wizard/DateLocationStep';
import { MediaStep } from '@/components/event-wizard/MediaStep';
import { TicketsStep } from '@/components/event-wizard/TicketsStep';
import { RegistrationDetailsStep } from '@/components/event-wizard/RegistrationDetailsStep';
import { ReviewStep } from '@/components/event-wizard/ReviewStep';
import type { TicketType, RegistrationField, AgendaItem, SpeakerItem, ExhibitorItem, SponsorItem, EventFormData } from '@/components/event-wizard/types';
import { DEFAULT_CURRENCY } from '@/components/event-wizard/types';

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
  earlyBirdQuantity?: number | string;
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


const DRAFT_STORAGE_KEY = 'eventknit_event_draft';

/* Step definitions — ordered to match industry standard event creation flow */
const steps = [
  { title: "Basic Info", icon: FileText },       // 1: Title, description, category, tags
  { title: "Date & Location", icon: Calendar },   // 2: Date/time, venue type, venue/link
  { title: "Media", icon: Camera },               // 3: Cover image (moved up — visual identity)
  { title: "Tickets", icon: Ticket },             // 4: Ticket types, pricing, currency, capacity
  { title: "Agenda", icon: Clock },               // 5: Schedule, speakers, exhibitors, sponsors
  { title: "Registration", icon: Users },         // 6: Custom fields, privacy, requirements
  { title: "Social", icon: Layout },              // 7: Social links, FAQs
  { title: "Review", icon: CheckCircle }          // 8: Final review
];

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
  const [kycBannerDismissed, setKycBannerDismissed] = useState(false);

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

  const [eventData, setEventData] = useState<EventFormData>(() => {
    // Load draft from localStorage (only if not in edit mode and not just created an event)
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
        imageFocalX: 50,
        imageFocalY: 50,
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

    // Don't load draft if an event was just created
    const justCreated = sessionStorage.getItem('event_just_created');
    if (justCreated === 'true') {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
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
        imageFocalX: 50,
        imageFocalY: 50,
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
            imageFocalX: draftData.imageFocalX ?? 50,
            imageFocalY: draftData.imageFocalY ?? 50,
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
      imageFocalX: 50,
      imageFocalY: 50,
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
    { id: 1, name: "", type: "paid", price: "", quantity: "100", maxPerPerson: 10, salesChannel: 'both' }
  ]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
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
      imageFocalX: 50,
      imageFocalY: 50,
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
    setTags([]);
    setRequirements([]);
    setNewRequirement("");
    setFaqs([{ question: "", answer: "" }]);
    setEventType("physical");
    setIsPrivate(false);
    setImagePreview(null);
    setCurrentStep(1);
    setError(null);
    setValidationErrors({});
  }, [timezone]);



  // Load draft function (for use in other places)
  const loadDraft = useCallback((): Partial<EventFormData> => {
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

  // Use standardized categories from event-categories.ts to ensure consistency
  // between event creation and event search filtering
  const eventCategories = EVENT_CATEGORIES.map(cat => cat.value);

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
        tags,
        requirements,
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
  }, [eventData, timezone, ticketTypes, tags, requirements, faqs, registrationFields, eventType, isPrivate, socialLinks, agenda, speakers, exhibitors, sponsors]);

  // Reset all form state when starting fresh after successful event creation
  useEffect(() => {
    if (!isEditMode) {
      const justCreated = sessionStorage.getItem('event_just_created');
      if (justCreated === 'true') {
        // Clear the flag immediately to prevent re-triggering
        sessionStorage.removeItem('event_just_created');
        // Clear any lingering draft directly (clearDraft is defined later in the file)
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        // Reset all form state including eventData
        resetForm();
      }
    }
  }, [isEditMode, resetForm]);

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
  }, [eventData, ticketTypes, tags, requirements, faqs, registrationFields, eventType, isPrivate, timezone, socialLinks, agenda, speakers, exhibitors, sponsors, saveDraft, isEditMode]);

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
            imageFocalX: transformedEvent.imageFocalX ?? 50,
            imageFocalY: transformedEvent.imageFocalY ?? 50,
            requirements: "", // Requirements now managed via separate state
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
              earlyBirdQuantity: (tt as { earlyBirdQuantity?: number }).earlyBirdQuantity?.toString() || undefined,
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

          // Set requirements
          if (transformedEvent.requirements) {
            if (Array.isArray(transformedEvent.requirements)) {
              setRequirements(transformedEvent.requirements);
            }
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
            requirements: "", // Requirements now managed via separate state
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
              earlyBirdQuantity: tt.earlyBirdQuantity ? String(tt.earlyBirdQuantity) : undefined,
            }));
            setTicketTypes(mappedTicketTypes);
          }

          // Set registration fields
          if (templateData.registrationFields && Array.isArray(templateData.registrationFields) && templateData.registrationFields.length > 0) {
            const mappedFields: RegistrationField[] = templateData.registrationFields.map((field: RegistrationFieldData) => ({
              id: field.id || `field-${Date.now()}-${Math.random()}`,
              name: field.name || field.id || '',
              type: (field.type || "text") as RegistrationField['type'],
              label: field.label || field.name || "",
              required: field.required || false,
              placeholder: field.placeholder || "",
              options: field.options || undefined,
            }));
            setRegistrationFields(mappedFields);
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

          // Set requirements
          if (templateData.requirements) {
            if (Array.isArray(templateData.requirements)) {
              setRequirements(templateData.requirements);
            } else if (typeof templateData.requirements === 'string' && templateData.requirements.trim()) {
              setRequirements(templateData.requirements.split(/[,\n]/).map((r: string) => r.trim()).filter(Boolean));
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
            if (parsed.tags && Array.isArray(parsed.tags)) {
              setTags(parsed.tags);
            }
            if (parsed.requirements && Array.isArray(parsed.requirements)) {
              setRequirements(parsed.requirements);
            } else if (parsed.data?.requirements && typeof parsed.data.requirements === 'string' && parsed.data.requirements.trim()) {
              // Backward compatibility: parse string from old draft format
              setRequirements(parsed.data.requirements.split(/[,\n]/).map((r: string) => r.trim()).filter(Boolean));
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
        setTags([]);
        setRequirements([]);
        setNewRequirement("");
        setFaqs([{ question: "", answer: "" }]);
        setEventType("in-person");
        setIsPrivate(false);
        setImagePreview(null);
        setCurrentStep(1);
        setError(null);
        setValidationErrors({});
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
        setTags([]);
        setRequirements([]);
        setNewRequirement("");
        setFaqs([{ question: "", answer: "" }]);
        setEventType("in-person");
        setIsPrivate(false);
        setImagePreview(null);
        setCurrentStep(1);
        setError(null);
        setValidationErrors({});
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

  const handleInputChange = (
    field: string,
    value: string | boolean | number
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

  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (trimmed && !requirements.includes(trimmed)) {
      setRequirements([...requirements, trimmed]);
      setNewRequirement("");
    }
  };

  const removeRequirement = (req: string) => {
    setRequirements(requirements.filter(r => r !== req));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
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

    if (step === 2) { // Date & Location
      if (!eventData.date) errors.date = 'Event date is required';
      if (!eventData.time) errors.time = 'Start time is required';
      if ((eventType === 'in-person' || eventType === 'hybrid') && !eventData.venue?.trim()) {
        errors.venue = 'Venue name is required for in-person and hybrid events';
      }
      if ((eventType === 'in-person' || eventType === 'hybrid') && !eventData.location?.trim()) {
        errors.location = 'Location is required for in-person and hybrid events';
      }
      if ((eventType === 'in-person' || eventType === 'hybrid') && !eventData.address?.trim()) {
        errors.address = 'Address is required for in-person and hybrid events';
      }
      if ((eventType === 'online' || eventType === 'hybrid') && !eventData.onlineLink?.trim()) {
        errors.onlineLink = 'Online link is required for online and hybrid events';
      }
      if (eventData.endDate && eventData.date && new Date(eventData.endDate) < new Date(eventData.date)) {
        errors.endDate = 'End date must be after start date';
      }
    }

    // Step 3 (Media) — no strict validation needed

    if (step === 4) { // Tickets
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

      // Validate early bird dates: if one is set, both must be set, and from < until
      ticketTypes.forEach((ticket, index) => {
        const hasFrom = !!ticket.availableFrom;
        const hasUntil = !!ticket.availableUntil;
        if (hasFrom !== hasUntil) {
          errors.tickets = errors.tickets || `Ticket "${ticket.name || index + 1}": Both "Available From" and "Available Until" must be set for early bird pricing`;
        }
        if (hasFrom && hasUntil && new Date(ticket.availableFrom!) >= new Date(ticket.availableUntil!)) {
          errors.tickets = errors.tickets || `Ticket "${ticket.name || index + 1}": "Available From" must be before "Available Until"`;
        }
      });
      
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
      description: ticket.description?.trim() || undefined,
      price: ticket.type === 'free' ? 0 : parseFloat(ticket.price) || 0,
      originalPrice: ticket.originalPrice ? parseFloat(ticket.originalPrice) : undefined,
      discountLabel: ticket.discountLabel?.trim() || undefined,
      quantity: ticket.quantity ? parseInt(ticket.quantity, 10) : undefined,
      maxPerPerson: ticket.maxPerPerson || undefined,
      minPerOrder: ticket.minPerOrder || undefined,
      features: [],
      isComplementary: ticket.isComplementary || false,
      requiresInvitation: ticket.requiresInvitation || false,
      availableFrom: ticket.availableFrom || undefined,
      availableUntil: ticket.availableUntil || undefined,
      earlyBirdQuantity: ticket.earlyBirdQuantity ? parseInt(ticket.earlyBirdQuantity, 10) : undefined,
      salesChannel: ticket.salesChannel || 'both',
      isHidden: ticket.isHidden || false,
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
      category: eventData.category || undefined,
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
          return undefined;
        }
        return parsed;
      })(),
      // Only include image if it has a value (preserves existing image in edit mode if not changed)
      image: eventData.image?.trim() || undefined,
      imageFocalX: eventData.imageFocalX ?? 50,
      imageFocalY: eventData.imageFocalY ?? 50,
      timezone: timezone || undefined,
      type: isPrivate ? EventType.PRIVATE : EventType.PUBLIC,
      requirements: requirements.length > 0 ? requirements : undefined,
      ageRestriction: eventData.ageRestriction?.trim() || undefined,
      speakers: speakers.length > 0 ? speakers.map(s => ({
        id: s.id,
        name: s.name,
        title: s.title || '',
        bio: s.bio || '',
        image: s.image || '',
        company: s.company || '',
        website: s.website || '',
        linkedin: s.linkedin || '',
        twitter: s.twitter || '',
      })) : undefined,
      agenda: agenda.length > 0 ? agenda.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description || '',
        date: a.date || '',
        startTime: a.startTime || '',
        endTime: a.endTime || '',
        sessionType: a.sessionType || 'other',
        room: a.room || '',
        speakerIds: a.speakerIds || [],
        speakers: a.speakers || [], // Legacy field for backwards compatibility
      })) : undefined,
      exhibitors: exhibitors.length > 0 ? exhibitors.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description || '',
        logo: e.logo || '',
        contactEmail: e.contactEmail || '',
        booth: e.booth || '',
        website: e.website || '',
        category: e.category || '',
      })) : undefined,
      sponsors: sponsors.length > 0 ? sponsors.map(s => ({
        id: s.id,
        name: s.name,
        level: s.level || '',
        logo: s.logo || '',
        website: s.website || '',
        description: s.description || '',
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
      // Service fees
      serviceFeeType: eventData.serviceFeeType || undefined,
      serviceFeeValue: eventData.serviceFeeValue || undefined,
      serviceFeePassToAttendee: eventData.serviceFeePassToAttendee || undefined,
      // Refund policy
      refundPolicy: eventData.refundPolicy || undefined,
      refundDeadlineDays: eventData.refundDeadlineDays || undefined,
      refundPolicyText: eventData.refundPolicyText?.trim() || undefined,
    };

    return apiData;
  }, [ticketTypes, eventData, tags, requirements, speakers, agenda, exhibitors, sponsors, socialLinks, faqs, registrationFields, eventType, isPrivate, timezone]);

  const handleSubmit = useCallback(async () => {
    // Final validation — check ALL steps that have validation rules
    const stepsWithValidation = [1, 2, 4]; // Basic Info, Date & Location, Tickets
    for (const step of stepsWithValidation) {
      if (!validateStep(step)) {
        setError(`Please fix the errors in the "${steps[step - 1]?.title || `Step ${step}`}" section before submitting`);
        return;
      }
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
          // Stop auto-save interval before clearing draft
          if (autoSaveIntervalRef.current) {
            clearInterval(autoSaveIntervalRef.current);
            autoSaveIntervalRef.current = null;
          }
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
          // Stop auto-save interval BEFORE clearing draft to prevent race condition
          if (autoSaveIntervalRef.current) {
            clearInterval(autoSaveIntervalRef.current);
            autoSaveIntervalRef.current = null;
          }
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

  // Step rendering functions extracted to @/components/event-wizard/*
  // Render preview modal
  const renderPreview = () => {
    // Show registration form preview if on step 6 (Registration step)
    if (currentStep === 6) {
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
                          : `${eventData.currency || DEFAULT_CURRENCY} ${parseFloat(ticket.price || '0').toFixed(2)}`}
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
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-5xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <BackButton
            to={location.pathname.startsWith('/admin') ? '/admin/dashboard' : '/organizer/dashboard'}
            label="Back to Dashboard"
          />
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? 'Update your event details' : 'Set up your event with all the details attendees need to know'}
          </p>

          {/* Draft Save Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
            {isSavingDraft ? (
              <>
                <Loader size="sm" />
                <span>Saving draft...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Draft saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Auto-saving every 30 seconds</span>
              </>
            )}
          </div>
        </div>

        {/* Progress Indicator - Sticky */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-border mb-4 sm:mb-6">
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

        {/* KYC Verification Banner - Shows when identity is verified but KYC is not approved */}
        {!loadingVerification && !isEditMode && !kycBannerDismissed && hasPaidTickets() && verificationStatus?.identityVerified && verificationStatus?.kycStatus !== 'APPROVED' && (
          <Alert className="mb-4 border-amber-500 bg-amber-500/5">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-amber-700">
                <strong>KYC Required:</strong> Complete your KYC verification to receive payouts from ticket sales. You can continue creating your event{verificationStatus?.kycStatus === 'PENDING' ? ' — your KYC submission is under review.' : '.'}
              </span>
              <div className="flex items-center gap-2">
                {verificationStatus?.kycStatus !== 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/organizer/kyc', {
                      state: { redirectAfterVerification: location.pathname }
                    })}
                    className="border-amber-500 text-amber-700 hover:bg-amber-500/10"
                  >
                    Complete KYC
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKycBannerDismissed(true)}
                  className="text-amber-600 hover:bg-amber-500/10 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Content */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-md">
          <CardContent className="p-5 sm:p-6 lg:p-8">
            {currentStep === 1 && (
              <BasicInfoStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                eventType={eventType}
                setEventType={setEventType}
                eventCategories={eventCategories}
              />
            )}
            {currentStep === 2 && (
              <DateLocationStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                eventType={eventType}
                timezone={timezone}
                setTimezone={setTimezone}
              />
            )}
            {currentStep === 3 && (
              <MediaStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                isUploadingImage={isUploadingImage}
                setIsUploadingImage={setIsUploadingImage}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                tags={tags}
                newTag={newTag}
                setNewTag={setNewTag}
                addTag={addTag}
                removeTag={removeTag}
                requirements={requirements}
                newRequirement={newRequirement}
                setNewRequirement={setNewRequirement}
                addRequirement={addRequirement}
                removeRequirement={removeRequirement}
                faqs={faqs}
                addFaq={addFaq}
                removeFaq={removeFaq}
                handleFaqChange={handleFaqChange}
              />
            )}
            {currentStep === 4 && (
              <TicketsStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                ticketTypes={ticketTypes}
                setTicketTypes={setTicketTypes}
              />
            )}
            {currentStep === 5 && (
              <AgendaBuilderStep
                agenda={agenda}
                speakers={speakers}
                exhibitors={exhibitors}
                sponsors={sponsors}
                eventStartDate={eventData.date}
                onUpdate={(field, value) => {
                  if (field === 'agenda') {
                    const agendaValue = value as AgendaItem[];
                    setAgenda(agendaValue);
                    setEventData(prev => ({ ...prev, agenda: agendaValue }));
                  } else if (field === 'speakers') {
                    const speakersValue = value as SpeakerItem[];
                    setSpeakers(speakersValue);
                    setEventData(prev => ({ ...prev, speakers: speakersValue }));
                  } else if (field === 'exhibitors') {
                    const exhibitorsValue = value as ExhibitorItem[];
                    setExhibitors(exhibitorsValue);
                    setEventData(prev => ({ ...prev, exhibitors: exhibitorsValue }));
                  } else if (field === 'sponsors') {
                    const sponsorsValue = value as SponsorItem[];
                    setSponsors(sponsorsValue);
                    setEventData(prev => ({ ...prev, sponsors: sponsorsValue }));
                  }
                }}
              />
            )}
            {currentStep === 6 && (
              <RegistrationDetailsStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                registrationFields={registrationFields}
                setRegistrationFields={setRegistrationFields}
                useDragAndDrop={useDragAndDrop}
                setUseDragAndDrop={setUseDragAndDrop}
              />
            )}
            {currentStep === 7 && (
              <SocialConnectionsStep
                socialLinks={socialLinks}
                onChange={setSocialLinks}
              />
            )}
            {currentStep === 8 && (
              <ReviewStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                ticketTypes={ticketTypes}
                eventType={eventType}
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-border">
              {/* Left side - Back button (only from step 2 onwards) */}
              <div>
                {currentStep >= 2 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span>Back</span>
                  </Button>
                ) : (
                  <div className="flex-1"></div>
                )}
              </div>

              {/* Right side - Preview (middle) and Next (right) */}
              <div className="flex items-center gap-3">
                {/* Preview Button - Show from step 3 onwards */}
                {currentStep >= 3 && (
                  <Button
                    variant="secondary"
                    size="default"
                    onClick={() => setShowPreview(true)}
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
                    size="lg"
                    className="min-w-[140px]"
                    disabled={isSubmitting}
                  >
                    <Loader size="sm" className="mr-2" />
                    {currentStep === 8 ? 'Publishing...' : 'Validating...'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="min-w-[140px]"
                  >
                    <span>{currentStep === 8 ? (isEditMode ? 'Update Event' : 'Publish Event') : 'Next'}</span>
                    {currentStep !== 8 && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
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