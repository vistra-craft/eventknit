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
  Ticket,
  CheckCircle,
  Calendar,
  Camera,
  FileText,
  AlertCircle,
  Save,
  Eye,
  MapPin,
  Shield,
  LayoutList,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  X,
  User,
  Building2,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { createEvent, type CreateEventData, EventType, updateEvent } from '@/lib/event-api';
import { becomeOrganizer } from '@/lib/user-dashboard-api';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { getOrganizerEventById } from '@/lib/organizer-api';


import { useAuth } from '@/hooks/useAuth';
import { getVerificationStatus, type VerificationStatus } from '@/lib/verification-api';
import { applyTemplate } from '@/lib/organizer-dashboard-api';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/lib/utils/error';
import { getMyOrganizerProfile } from '@/lib/organizer-profile-api';
import { uploadImage } from '@/lib/upload-api';
import { refreshAccessToken } from '@/lib/api';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { BasicInfoStep } from '@/components/event-wizard/BasicInfoStep';
import { RegistrationDetailsStep } from '@/components/event-wizard/RegistrationDetailsStep';
import BackButton from '@/components/BackButton';
import { DateLocationStep } from '@/components/event-wizard/DateLocationStep';
import { MediaStep } from '@/components/event-wizard/MediaStep';
import { TicketsStep } from '@/components/event-wizard/TicketsStep';
import { ExtrasStep } from '@/components/event-wizard/ExtrasStep';
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

/* Step definitions — consolidated 6-step wizard */
const steps = [
  { title: "Details", icon: FileText },           // 1: Basic info + date/location combined
  { title: "Media", icon: Camera },               // 2: Cover image, tags, requirements, FAQs
  { title: "Tickets", icon: Ticket },             // 3: Ticket types, pricing, currency, capacity
  { title: "Registration", icon: ClipboardList }, // 4: Registration form builder
  { title: "Extras", icon: LayoutList },          // 5: Agenda + Social (collapsible)
  { title: "Review", icon: CheckCircle },         // 6: Final review
];

export default function CreateEventStepwise() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();

  // Check for edit mode and template from URL query params
  const searchParams = new URLSearchParams(location.search);
  const editEventId = searchParams.get('edit');
  const templateId = searchParams.get('template');
  const stepParam = searchParams.get('step');
  const isEditMode = !!editEventId;
  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId && !isEditMode);
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(() => {
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      return step >= 1 && step <= 6 ? step : 1;
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

  // Auto-populate organizer fields from profile (for existing organizers)
  useEffect(() => {
    const fetchOrganizerProfile = async () => {
      if (user && !isEditMode && ['ORGANIZER', 'ORGANIZER_STAFF'].includes(user.role)) {
        try {
          // Set organizer name from user profile
          if (user.organizationName) {
            setEventData(prev => ({
              ...prev,
              organizer: prev.organizer || user.organizationName || '',
            }));
          }
          // Fetch extended profile for description
          const response = await getMyOrganizerProfile();
          if (response.success && response.data?.organizerProfile?.description) {
            setEventData(prev => ({
              ...prev,
              organizerDescription: prev.organizerDescription || response.data!.organizerProfile!.description || '',
            }));
          }
        } catch (error) {
          console.error('Failed to fetch organizer profile:', error);
        }
      }
    };
    fetchOrganizerProfile();
  }, [user, isEditMode]);

  const [eventType, setEventType] = useState("in-person");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showOrgNameDialog, setShowOrgNameDialog] = useState(false);
  const [orgNameInput, setOrgNameInput] = useState('');
  const [orgDescInput, setOrgDescInput] = useState('');
  const [orgSetupType, setOrgSetupType] = useState<'individual' | 'organization'>('individual');
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
        hasSeatingMap: false,
        seatingType: '',
        seatMapRequired: false,
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
        hasSeatingMap: false,
        seatingType: '',
        seatMapRequired: false,
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
            hasSeatingMap: draftData.hasSeatingMap || false,
            seatingType: draftData.seatingType || '',
            seatMapRequired: draftData.seatMapRequired || false,
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
      hasSeatingMap: false,
      seatingType: '',
      seatMapRequired: false,
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
      hasSeatingMap: false,
      seatingType: '',
      seatMapRequired: false,
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
          // Already transformed by getOrganizerEventById — use directly
          const transformedEvent = response.data.event;
          
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

            organizerDescription: transformedEvent.organizerDescription || "",
            date: parseDate(transformedEvent.startDate) || transformedEvent.date || "",
            time: parseTime(transformedEvent.startTime) || transformedEvent.time || "",
            endDate: parseDate(transformedEvent.endDate) || "",
            endTime: parseTime(transformedEvent.endTime) || "",
            registrationDeadline: parseDate(transformedEvent.registrationDeadline) || "",
            registrationDeadlineTime: parseTime(transformedEvent.registrationDeadline) || "",
            location: transformedEvent.location || "",
            venue: transformedEvent.venue || "",
            address: transformedEvent.address || "",
            onlineLink: transformedEvent.onlineLink || "",
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
              earlyBirdQuantity: tt.earlyBirdQuantity?.toString() || undefined,
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

          // Set requirements - handle both array and string formats
          if (transformedEvent.requirements) {
            if (Array.isArray(transformedEvent.requirements)) {
              setRequirements(transformedEvent.requirements);
            } else if (typeof transformedEvent.requirements === 'string') {
              try {
                const parsedReqs = JSON.parse(transformedEvent.requirements);
                setRequirements(Array.isArray(parsedReqs) ? parsedReqs : []);
              } catch {
                // If parsing fails, split by comma/newline
                setRequirements(
                  transformedEvent.requirements.split(/[,\n]/).map((r: string) => r.trim()).filter(Boolean)
                );
              }
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
              price: tt.price !== undefined && tt.price !== null ? String(tt.price) : "",
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
        const msg = extractErrorMessage(err, 'Unable to load the template. Please try selecting a different template.');
        setError(msg);
        toast({
          title: "Template load failed",
          description: msg,
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

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB. Please choose a smaller file.');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const url = await uploadImage(file, 'events');
      setImagePreview(url);
      setEventData(prev => ({ ...prev, image: url }));
    } catch {
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const validateStep = useCallback((step: number): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (step === 1) { // Details (Basic Info + Date & Location combined)
      // Basic Info validation
      if (!eventData.title?.trim()) errors.title = 'Event title is required';
      if (!eventData.description?.trim()) errors.description = 'Event description is required';
      if (eventData.description && eventData.description.length < 10) {
        errors.description = 'Description must be at least 10 characters';
      }
      if (!eventData.category) errors.category = 'Category is required';
      // Date & Location validation
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

    if (step === 2) { // Media — validate FAQs if partially filled
      faqs.forEach((faq, index) => {
        const hasQuestion = faq.question.trim().length > 0;
        const hasAnswer = faq.answer.trim().length > 0;
        if (hasQuestion && !hasAnswer) {
          errors[`faq_${index}`] = `FAQ #${index + 1} has a question but no answer.`;
        } else if (!hasQuestion && hasAnswer) {
          errors[`faq_${index}`] = `FAQ #${index + 1} has an answer but no question.`;
        }
      });
    }

    if (step === 3) { // Tickets
      if (ticketTypes.length === 0) {
        errors.tickets = 'At least one ticket type is required';
      }
      const hasInvalidTickets = ticketTypes.some(ticket => {
        if (!ticket.name?.trim()) return true;
        if (ticket.type === 'paid' && !ticket.isComplementary && (!ticket.price || parseFloat(ticket.price) <= 0)) return true;
        return false;
      });
      if (hasInvalidTickets) {
        errors.tickets = 'Some tickets need attention before you can continue.';
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
            errors.capacity = `Event capacity (${capacity}) doesn't match total ticket quantities (${totalTicketQuantity}). Adjust either value above.`;
            errors.tickets = errors.tickets || `Total ticket quantities (${totalTicketQuantity}) must equal event capacity (${capacity}).`;
          }
        }
      }
    }

    if (step === 4) { // Registration
      // Only validate custom fields (beyond the 3 default: firstName, lastName, email)
      registrationFields.slice(3).forEach((field, i) => {
        const idx = i + 3;
        if (!field.label?.trim()) {
          errors[`regField_${idx}`] = `Registration field #${idx + 1} needs a label.`;
        }
        const validTypes = ['text', 'email', 'phone', 'select', 'radio', 'checkbox', 'textarea', 'date', 'number'];
        if (!validTypes.includes(field.type)) {
          errors[`regField_${idx}_type`] = `Registration field "${field.label || idx + 1}" has an invalid type.`;
        }
        // Select/radio/checkbox must have options
        if ((field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (!field.options || field.options.length === 0)) {
          errors[`regField_${idx}_options`] = `"${field.label || `Field #${idx + 1}`}" needs at least one option.`;
        }
      });
    }

    if (step === 5) { // Extras — speakers, sponsors, exhibitors, agenda
      // Only validate entries that have some content (skip empty placeholders)
      speakers.forEach((speaker, i) => {
        const hasContent = speaker.name?.trim() || speaker.title?.trim() || speaker.bio?.trim() || speaker.company?.trim() || speaker.image;
        if (hasContent && !speaker.name?.trim()) {
          errors[`speaker_${i}`] = `Speaker #${i + 1} needs a name.`;
        }
      });
      sponsors.forEach((sponsor, i) => {
        const hasContent = sponsor.name?.trim() || sponsor.description?.trim() || sponsor.logo || sponsor.website?.trim();
        if (hasContent && !sponsor.name?.trim()) {
          errors[`sponsor_${i}`] = `Sponsor #${i + 1} needs a name.`;
        }
      });
      exhibitors.forEach((exhibitor, i) => {
        const hasContent = exhibitor.name?.trim() || exhibitor.description?.trim() || exhibitor.logo || exhibitor.contactEmail?.trim() || exhibitor.booth?.trim();
        if (hasContent && !exhibitor.name?.trim()) {
          errors[`exhibitor_${i}`] = `Exhibitor #${i + 1} needs a name.`;
        }
      });
      agenda.forEach((item, i) => {
        const hasContent = item.title?.trim() || item.description?.trim();
        if (hasContent && !item.title?.trim()) {
          errors[`agenda_${i}`] = `Agenda item #${i + 1} needs a title.`;
        }
      });
    }

    setValidationErrors(errors);
    return errors;
  }, [eventData, eventType, ticketTypes, faqs, registrationFields, speakers, sponsors, exhibitors, agenda]);

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
      speakers: (() => {
        const filled = speakers.filter(s => s.name?.trim());
        return filled.length > 0 ? filled.map(s => ({
          id: s.id,
          name: s.name,
          title: s.title || '',
          bio: s.bio || '',
          image: s.image || '',
          company: s.company || '',
          website: s.website || '',
          linkedin: s.linkedin || '',
          twitter: s.twitter || '',
        })) : undefined;
      })(),
      agenda: (() => {
        const filled = agenda.filter(a => a.title?.trim());
        return filled.length > 0 ? filled.map(a => ({
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
        })) : undefined;
      })(),
      exhibitors: (() => {
        const filled = exhibitors.filter(e => e.name?.trim());
        return filled.length > 0 ? filled.map(e => ({
          id: e.id,
          name: e.name,
          description: e.description || '',
          logo: e.logo || '',
          contactEmail: e.contactEmail || '',
          booth: e.booth || '',
          website: e.website || '',
          category: e.category || '',
        })) : undefined;
      })(),
      sponsors: (() => {
        const filled = sponsors.filter(s => s.name?.trim());
        return filled.length > 0 ? filled.map(s => ({
          id: s.id,
          name: s.name,
          level: s.level || '',
          logo: s.logo || '',
          website: s.website || '',
          description: s.description || '',
        })) : undefined;
      })(),
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
    const stepsWithValidation = [1, 2, 3, 4, 5];
    for (const step of stepsWithValidation) {
      const errors = validateStep(step);
      if (Object.keys(errors).length > 0) {
        const errorMessages = Object.values(errors);
        setError(`${steps[step - 1]?.title || `Step ${step}`}: ${errorMessages[0]}${errorMessages.length > 1 ? ` (+${errorMessages.length - 1} more)` : ''}`);
        setCurrentStep(step);
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

    // Track if this user was an attendee before upgrade (used for approval flow after event creation)
    const wasAttendee = !isOrganizerRole && !isAdminRole;

    // If ATTENDEE, prompt for organization name before proceeding
    if (wasAttendee && !orgNameInput.trim()) {
      setShowOrgNameDialog(true);
      return;
    }

    // Show loading state from the start — covers both the upgrade and create steps
    setIsSubmitting(true);
    setError(null);

    // If ATTENDEE, upgrade to organizer using the collected org name.
    // Skip if user status is already PENDING_APPROVAL (upgrade succeeded on a previous attempt
    // but event creation failed — no need to call becomeOrganizer again).
    if (wasAttendee && user.status !== 'PENDING_APPROVAL') {
      const orgName = orgNameInput.trim();
      if (orgName.length < 2) {
        setError('Organization name must be at least 2 characters long.');
        setIsSubmitting(false);
        return;
      }
      try {
        const upgradeResponse = await becomeOrganizer({
          organizationName: orgName,
          description: orgDescInput.trim() || undefined,
        });
        if (!upgradeResponse.success) {
          throw new Error(upgradeResponse.message || 'Failed to set up organizer account');
        }
      } catch (upgradeError) {
        setError(extractErrorMessage(upgradeError, 'Failed to set up organizer account. Please try again.'));
        setIsSubmitting(false);
        return;
      }
    }

    // Eventbrite-style: No verification required to CREATE events
    // Verification is only required to RECEIVE payouts (handled in disbursement service)

    try {
      // Save draft before submission so data isn't lost if something goes wrong
      if (!isEditMode) {
        saveDraft();
      }

      // Proactively refresh the access token to prevent 401 during submission.
      // Event creation forms can take a long time to fill, so the token may have
      // expired by the time the user clicks Publish.
      try {
        await refreshAccessToken();
      } catch {
        // Refresh failed — token may still be valid, or the server will 401
        // and the apiRequest retry logic will handle it. Don't block submission.
      }

      const apiData = transformFormDataToAPI();

      if (isEditMode && eventId) {
        // Update existing event
        const response = await updateEvent(eventId, apiData);
        
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
          setError(response.message || 'Unable to update the event. Please check your information and try again.');
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

          // If this was an attendee who just became an organizer, refresh auth state
          // (becomeOrganizer() already set status=PENDING_APPROVAL server-side)
          if (wasAttendee) {
            await refreshProfile();
            navigate('/user/dashboard', {
              state: {
                message: 'Your event has been submitted! Your organizer account is now pending admin approval. You will receive an email once approved.',
              }
            });
          } else {
            // Existing organizer or admin — navigate normally
            const isAdminRoute = location.pathname.startsWith('/admin');

            if (isAdminRoute) {
              navigate('/admin/dashboard', {
                state: { message: 'Event created successfully! It is pending admin approval.' }
              });
            } else {
              navigate('/organizer/dashboard', {
                state: {
                  message: 'Event created successfully! It is pending admin approval.',
                  fromEventCreation: true,
                }
              });
            }
          }
        } else {
          setError(response.message || 'Unable to create the event. Please check your information and try again.');
        }
      }
    } catch (err: unknown) {
      const rawMessage = extractErrorMessage(err, 'Failed to save event. Please try again.');

      // Map technical messages to user-friendly ones and navigate to the relevant step
      let errorMessage = rawMessage;
      const lowerMsg = rawMessage.toLowerCase();
      if (lowerMsg.includes('ticket') || lowerMsg.includes('price') || lowerMsg.includes('paid event')) {
        errorMessage = rawMessage;
        setCurrentStep(3); // Navigate to Tickets step
      } else if (rawMessage.includes('registrationFields') && rawMessage.includes('type')) {
        errorMessage = 'Invalid registration field type detected. Please check your custom form fields.';
        setCurrentStep(4); // Navigate to Registration step
      } else if (lowerMsg.includes('unauthorized') || lowerMsg.includes('authentication') || lowerMsg.includes('session expired')) {
        errorMessage = 'Your session has expired. Your draft has been saved — please log in again and your progress will be restored.';
      } else if (lowerMsg.includes('speaker') || lowerMsg.includes('sponsor') || lowerMsg.includes('exhibitor') || lowerMsg.includes('agenda')) {
        setCurrentStep(5); // Navigate to Extras step
      } else if (lowerMsg.includes('title') || lowerMsg.includes('description') || lowerMsg.includes('date') || lowerMsg.includes('location') || lowerMsg.includes('venue')) {
        setCurrentStep(1); // Navigate to Details step
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateStep, user, navigate, isEditMode, eventId, transformFormDataToAPI, saveDraft, clearDraft, resetForm, location.pathname, refreshProfile, orgNameInput, orgDescInput]);

  const handleNext = useCallback(() => {
    if (currentStep < 6) {
      const errors = validateStep(currentStep);
      if (Object.keys(errors).length === 0) {
        setError(null);
        // Save draft before navigating to next step
        if (!isEditMode) {
          saveDraft();
        }
        setCurrentStep(currentStep + 1);
      } else {
        // Show specific error messages from validation
        const errorMessages = Object.values(errors);
        if (errorMessages.length === 1) {
          setError(errorMessages[0]);
        } else if (errorMessages.length > 1) {
          setError(errorMessages[0] + ` (+${errorMessages.length - 1} more)`);
        } else {
          setError('Please fix the highlighted fields before continuing.');
        }
        // Scroll to the first invalid ticket card
        setTimeout(() => {
          const firstInvalid = document.querySelector('[data-ticket-card].border-destructive\\/40');
          if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 0);
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
    // Show registration form preview on step 4 (Registration step)
    if (currentStep === 4) {
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
                  <h3 className="text-page-title mb-2">{eventData.title || 'Event Registration'}</h3>
                  
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
                    <h4 className="text-section-header mb-4">Registration Form</h4>
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
    const filledSpeakers = speakers.filter(s => s.name?.trim());
    const filledExhibitors = exhibitors.filter(e => e.name?.trim());
    const filledSponsors = sponsors.filter(s => s.name?.trim());
    const filledAgenda = agenda.filter(a => a.title?.trim());
    const filledFaqs = faqs.filter(f => f.question?.trim() && f.answer?.trim());

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
              <h2 className="text-page-title">{eventData.title || 'Untitled Event'}</h2>
              {eventData.organizer && (
                <p className="text-muted-foreground mt-1">by {eventData.organizer}</p>
              )}
              {eventData.category && (
                <Badge variant="outline" className="mt-2">{eventData.category}</Badge>
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
                  {eventData.address && <p className="text-sm text-muted-foreground">{eventData.address}</p>}
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
                <h3 className="text-section-header mb-2">About this event</h3>
                <RichTextContent
                  content={eventData.description}
                  className="prose prose-sm max-w-none text-muted-foreground"
                />
              </div>
            )}

            {/* Tickets */}
            {ticketTypes.length > 0 && (
              <div>
                <h3 className="text-section-header mb-3">Tickets</h3>
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

            {/* Requirements & Age Restriction */}
            {(requirements.length > 0 || eventData.ageRestriction) && (
              <div>
                <h3 className="text-section-header mb-3">Important Information</h3>
                <div className="space-y-2">
                  {eventData.ageRestriction && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-primary" />
                      <span>Age Restriction: {eventData.ageRestriction}</span>
                    </div>
                  )}
                  {requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {filledSpeakers.length > 0 && (
              <div>
                <h3 className="text-section-header mb-3">Speakers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filledSpeakers.map((speaker, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      {speaker.image ? (
                        <img src={speaker.image} alt={speaker.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{speaker.name}</p>
                        {speaker.title && <p className="text-sm text-primary">{speaker.title}</p>}
                        {speaker.company && <p className="text-xs text-muted-foreground">{speaker.company}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda */}
            {filledAgenda.length > 0 && (
              <div>
                <h3 className="text-section-header mb-3">Schedule</h3>
                <div className="space-y-2">
                  {filledAgenda.map((item, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {item.startTime && (
                          <span className="text-sm font-medium text-primary">
                            {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
                          </span>
                        )}
                        {item.sessionType && item.sessionType !== 'other' && (
                          <Badge variant="outline" className="text-xs">{item.sessionType}</Badge>
                        )}
                      </div>
                      <p className="font-medium mt-1">{item.title}</p>
                      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      {item.room && <p className="text-xs text-muted-foreground mt-1">Room: {item.room}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exhibitors */}
            {filledExhibitors.length > 0 && (
              <div>
                <h3 className="text-section-header mb-3">Exhibitors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filledExhibitors.map((exhibitor, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <p className="font-medium">{exhibitor.name}</p>
                      {exhibitor.description && <p className="text-sm text-muted-foreground">{exhibitor.description}</p>}
                      {exhibitor.booth && <p className="text-xs text-muted-foreground">Booth: {exhibitor.booth}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sponsors */}
            {filledSponsors.length > 0 && (
              <div>
                <h3 className="text-section-header mb-3">Sponsors</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filledSponsors.map((sponsor, i) => (
                    <div key={i} className="p-3 border rounded-lg text-center">
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt={sponsor.name} className="h-10 mx-auto mb-2 object-contain" />
                      ) : (
                        <p className="font-medium">{sponsor.name}</p>
                      )}
                      {sponsor.level && <Badge variant="outline" className="text-xs">{sponsor.level}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {filledFaqs.length > 0 && (
              <div>
                <h3 className="text-section-header mb-3">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {filledFaqs.map((faq, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-muted-foreground text-sm mt-1">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-section-header mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
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
            <AlertDescription>
              <span>{error}</span>
              {Object.keys(validationErrors).length > 1 && (
                <ul className="mt-1.5 list-disc pl-4 text-xs space-y-0.5">
                  {Object.values(validationErrors).map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
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
                onClick={() => {
                  const isOrgRole = user && ['ORGANIZER', 'ORGANIZER_STAFF', 'ORGANIZER_TELLER'].includes(user.role);
                  navigate(isOrgRole ? '/organizer/verification' : '/user/verification', {
                    state: { redirectAfterVerification: location.pathname }
                  });
                }}
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
                    onClick={() => {
                      const isOrgRole = user && ['ORGANIZER', 'ORGANIZER_STAFF', 'ORGANIZER_TELLER'].includes(user.role);
                      navigate(isOrgRole ? '/organizer/kyc' : '/user/kyc', {
                        state: { redirectAfterVerification: location.pathname }
                      });
                    }}
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
            {/* Step 1: Details (Basic Info + Date & Location) */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Event Information</h2>
                  <p className="text-sm text-muted-foreground mb-4">Title, description, and category</p>
                  <BasicInfoStep
                    eventData={eventData}
                    onInputChange={handleInputChange}
                    validationErrors={validationErrors}
                    setValidationErrors={setValidationErrors}
                    eventType={eventType}
                    setEventType={setEventType}
                    eventCategories={eventCategories}
                  />
                </div>
                <div className="border-t border-border" />
                <div>
                  <h2 className="text-lg font-semibold mb-1">Date & Location</h2>
                  <p className="text-sm text-muted-foreground mb-4">When and where your event takes place</p>
                  <DateLocationStep
                    eventData={eventData}
                    onInputChange={handleInputChange}
                    validationErrors={validationErrors}
                    setValidationErrors={setValidationErrors}
                    eventType={eventType}
                    timezone={timezone}
                    setTimezone={setTimezone}
                  />
                </div>
              </div>
            )}
            {/* Step 2: Media */}
            {currentStep === 2 && (
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
            {/* Step 3: Tickets */}
            {currentStep === 3 && (
              <TicketsStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                ticketTypes={ticketTypes}
                setTicketTypes={setTicketTypes}
              />
            )}
            {/* Step 4: Registration Form */}
            {currentStep === 4 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">Registration Form</h2>
                  <p className="text-sm text-muted-foreground">
                    Customize what information you collect from attendees
                  </p>
                </div>
                <RegistrationDetailsStep
                  eventData={eventData}
                  onInputChange={handleInputChange}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
                  registrationFields={registrationFields}
                  setRegistrationFields={setRegistrationFields}
                />
              </div>
            )}
            {/* Step 5: Extras (Agenda + Social — collapsible) */}
            {currentStep === 5 && (
              <ExtrasStep
                agenda={agenda}
                speakers={speakers}
                exhibitors={exhibitors}
                sponsors={sponsors}
                eventStartDate={eventData.date}
                eventEndDate={eventData.endDate}
                onAgendaUpdate={(field, value) => {
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
                socialLinks={socialLinks}
                onSocialLinksChange={setSocialLinks}
              />
            )}
            {/* Step 6: Review */}
            {currentStep === 6 && (
              <ReviewStep
                eventData={eventData}
                onInputChange={handleInputChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                ticketTypes={ticketTypes}
                eventType={eventType}
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                tags={tags}
                requirements={requirements}
                faqs={faqs}
                agenda={agenda}
                speakers={speakers}
                exhibitors={exhibitors}
                sponsors={sponsors}
                registrationFields={registrationFields}
                socialLinks={socialLinks}
                timezone={timezone}
                imagePreview={imagePreview}
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
                {/* Preview Button - Show from step 2 onwards */}
                {currentStep >= 2 && (
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
                    {currentStep === 6 ? 'Publishing...' : 'Validating...'}
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
                    <span>{currentStep === 6 ? (isEditMode ? 'Update Event' : 'Publish Event') : 'Next'}</span>
                    {currentStep !== 5 && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Preview Modal */}
      {renderPreview()}

      {/* Organizer setup dialog — shown when attendee clicks Publish */}
      <Dialog open={showOrgNameDialog} onOpenChange={setShowOrgNameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>One last step before publishing</DialogTitle>
            <DialogDescription>
              Set up your organizer account. This is what attendees will see on your events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            {/* Account type selector */}
            <div className="space-y-2">
              <Label>I'm organizing as</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrgSetupType('individual')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors text-left ${
                    orgSetupType === 'individual'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <User className="h-4 w-4 self-center" />
                  <span className="font-medium self-center">Individual</span>
                  <span className="text-xs text-center leading-tight">Freelancer or personal events</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrgSetupType('organization')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors text-left ${
                    orgSetupType === 'organization'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Building2 className="h-4 w-4 self-center" />
                  <span className="font-medium self-center">Organization</span>
                  <span className="text-xs text-center leading-tight">Company, nonprofit or group</span>
                </button>
              </div>
            </div>

            {/* Display name input */}
            <div className="space-y-1.5">
              <Label htmlFor="orgNameDialog">
                {orgSetupType === 'individual' ? 'Your name or brand' : 'Organization name'} *
              </Label>
              <Input
                id="orgNameDialog"
                placeholder={
                  orgSetupType === 'individual'
                    ? 'e.g. "Jane Kamau" or "Jane\'s Workshops"'
                    : 'e.g. "Nairobi Tech Hub" or "Acme Events"'
                }
                value={orgNameInput}
                onChange={(e) => setOrgNameInput(e.target.value)}
                className="h-11"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && orgNameInput.trim().length >= 2) {
                    setShowOrgNameDialog(false);
                    handleSubmit();
                  }
                }}
              />
              {orgNameInput.trim().length > 0 && orgNameInput.trim().length < 2 && (
                <p className="text-xs text-destructive">Must be at least 2 characters</p>
              )}
              <p className="text-xs text-muted-foreground">
                This is what attendees see on your events. You can update it later in your profile.
              </p>
            </div>

            {/* Bio / description */}
            <div className="space-y-1.5">
              <Label htmlFor="orgDescDialog">
                {orgSetupType === 'individual' ? 'About you' : 'About your organization'}
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <Textarea
                id="orgDescDialog"
                placeholder={
                  orgSetupType === 'individual'
                    ? 'A short intro — what kind of events you run, your experience, etc.'
                    : 'What your organization does, your mission, the type of events you host…'
                }
                value={orgDescInput}
                onChange={(e) => setOrgDescInput(e.target.value)}
                className="text-sm resize-none"
                rows={3}
              />
            </div>

            {/* What happens next — KYC awareness */}
            <div className={`rounded-lg border p-3 text-sm ${hasPaidTickets() ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-muted/30'}`}>
              <p className="font-medium text-foreground mb-2">What happens after you publish</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-green-600 shrink-0" />
                  <span>Your event is submitted for review — usually under 24 hours</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-green-600 shrink-0" />
                  {hasPaidTickets() ? (
                    <span>
                      You can publish now and start collecting registrations.{' '}
                      <strong className="text-foreground">To receive payments</strong>, complete identity verification from your dashboard.
                    </span>
                  ) : (
                    <span>No further verification needed for free events</span>
                  )}
                </li>
              </ul>
              {hasPaidTickets() && (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  This event has paid tickets — KYC verification will be required before payouts are enabled.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowOrgNameDialog(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  setShowOrgNameDialog(false);
                  handleSubmit();
                }}
                disabled={orgNameInput.trim().length < 2}
              >
                Publish event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}