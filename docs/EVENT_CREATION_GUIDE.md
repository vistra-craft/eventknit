# Event Creation System - Developer Guide

This document provides a comprehensive walkthrough of the EventKnit event creation system, covering the multi-step wizard, data flow, validation, and API integration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Step-by-Step Wizard Flow](#step-by-step-wizard-flow)
4. [Data Types & Interfaces](#data-types--interfaces)
5. [State Management](#state-management)
6. [Validation Logic](#validation-logic)
7. [API Integration](#api-integration)
8. [Draft Save/Load System](#draft-saveload-system)
9. [Platform-Wide Settings](#platform-wide-settings)
10. [Promo Codes Integration](#promo-codes-integration)
11. [Common Patterns & Best Practices](#common-patterns--best-practices)

---

## Architecture Overview

The event creation system uses a multi-step wizard pattern built with React and TypeScript. Key characteristics:

- **Form State**: Uses individual `useState` hooks (NOT react-hook-form)
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variable tokens (`hsl(var(--token))`)
- **Validation**: Custom validation logic per step (Zod schemas exist but are unused)
- **Persistence**: LocalStorage for draft auto-save

### Data Flow

```
User Input → useState Hooks → transformFormDataToAPI() → API Call → Backend
     ↓
LocalStorage (auto-save drafts)
```

---

## File Structure

```
eventknit/client/src/
├── pages/
│   ├── CreateEventStepwise.tsx       # Main wizard component (~800+ lines)
│   └── organizer/
│       ├── CreateEventPage.tsx       # Wrapper with layout
│       └── marketing/
│           └── OrganizerPromoCodeManager.tsx  # Promo code management
│
├── components/event-wizard/
│   ├── types.ts                      # Form-specific TypeScript interfaces
│   ├── BasicInfoStep.tsx             # Step 1: Title, description, category
│   ├── DateLocationStep.tsx          # Step 2: Date, time, venue
│   ├── MediaStep.tsx                 # Step 3: Images, media uploads
│   ├── TicketsStep.tsx               # Step 4: Ticket types, pricing
│   ├── AgendaBuilderStep.tsx         # Step 5: Sessions, speakers, sponsors
│   ├── RegistrationStep.tsx          # Step 6: Custom registration fields
│   ├── SocialLinksStep.tsx           # Step 7: Social media links
│   └── ReviewStep.tsx                # Step 8: Final review before submit
│
├── lib/
│   ├── event-api.ts                  # API functions & CreateEventData interface
│   ├── event-utils.ts                # transformEventData utility
│   └── promo-code-api.ts             # Promo code API functions
│
└── types/
    └── event.ts                      # API/DB EventData type (different from form type)
```

### Important Type Distinction

**`EventFormData`** (in `components/event-wizard/types.ts`):
- Used for local form state during event creation/editing
- Contains UI-friendly field names and types

**`EventData`** (in `types/event.ts`):
- Represents the API/database response shape
- Used for displaying event data throughout the app

**`CreateEventData`** (in `lib/event-api.ts`):
- API request payload shape
- Transformed from EventFormData before submission

---

## Step-by-Step Wizard Flow

The wizard consists of 8 steps, progressed via `currentStep` state:

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | BasicInfoStep | Event title, organizer name, description, category |
| 2 | DateLocationStep | Start/end dates, times, timezone, venue, online settings |
| 3 | MediaStep | Cover image upload with focal point selection |
| 4 | TicketsStep | Ticket types, pricing, purchase limits |
| 5 | AgendaBuilderStep | Sessions, speakers, exhibitors, sponsors |
| 6 | RegistrationStep | Custom registration form fields |
| 7 | SocialLinksStep | Social media links, website |
| 8 | ReviewStep | Summary view, final validation, submit |

### Step Navigation

```tsx
// In CreateEventStepwise.tsx
const [currentStep, setCurrentStep] = useState(1);

const handleNext = () => {
  if (validateStep(currentStep)) {
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  }
};

const handleBack = () => {
  setCurrentStep(prev => Math.max(prev - 1, 1));
};
```

---

## Data Types & Interfaces

### EventFormData (Form State)

```typescript
// components/event-wizard/types.ts
interface EventFormData {
  // Basic Info
  title: string;
  organizer: string;
  description: string;
  fullDescription: string;
  organizerDescription?: string;
  category?: string;

  // Date & Time
  date: string;           // Start date (YYYY-MM-DD)
  time: string;           // Start time (HH:MM)
  endDate: string;
  endTime: string;
  registrationDeadline: string;
  registrationDeadlineTime: string;
  timezone?: string;

  // Location
  location: string;       // City/region
  venue: string;          // Venue name
  address: string;        // Full address
  isOnline: boolean;
  onlineLink: string;

  // Media
  image: string;          // Cover image URL
  imageFocalX: number;    // Focal point X (0-100)
  imageFocalY: number;    // Focal point Y (0-100)

  // Tickets & Pricing
  price: string;
  currency: string;       // 'KES', 'USD', etc.
  capacity: string;
  totalSlots: number;

  // Additional Info
  requirements: string;
  ageRestriction: string;

  // Related Data (managed separately)
  socialLinks?: Record<string, string>;
  exhibitors?: ExhibitorItem[];
  sponsors?: SponsorItem[];
  agenda?: AgendaItem[];
  speakers?: SpeakerItem[];
}
```

### TicketType Interface

```typescript
interface TicketType {
  id: number;
  name: string;
  description?: string;
  type: 'free' | 'paid';
  price: string;
  originalPrice?: string;      // For showing discounts
  discountLabel?: string;      // e.g., "Early Bird"
  quantity: string;
  maxPerPerson?: number;       // Per-person purchase limit
  minPerOrder?: number;        // Minimum tickets per order
  isComplementary?: boolean;   // Free VIP/comp tickets
  requiresInvitation?: boolean;
  availableFrom?: string;      // Sales start date
  availableUntil?: string;     // Sales end date
  earlyBirdQuantity?: string;  // Qty at early bird price
  salesChannel?: 'online' | 'door' | 'both';
  isHidden?: boolean;          // Hidden from public listing
}
```

### Supporting Types

```typescript
interface AgendaItem {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  sessionType?: SessionType;
  room?: string;
  speakerIds?: string[];
}

interface SpeakerItem {
  id?: string;
  name: string;
  title?: string;
  bio?: string;
  image?: string;
  company?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
}

interface SponsorItem {
  id?: string;
  name: string;
  level?: 'gold' | 'silver' | 'bronze' | 'platinum' | string;
  logo?: string;
  website?: string;
  description?: string;
}
```

---

## State Management

The wizard uses individual `useState` hooks for maximum flexibility:

```tsx
// CreateEventStepwise.tsx - Core state
const [currentStep, setCurrentStep] = useState(1);
const [eventData, setEventData] = useState<EventFormData>(initialFormData);
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

// Related data with separate state
const [ticketTypes, setTicketTypes] = useState<TicketType[]>([defaultTicket]);
const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
const [agenda, setAgenda] = useState<AgendaItem[]>([]);
const [exhibitors, setExhibitors] = useState<ExhibitorItem[]>([]);
const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([]);
const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

// Generic input handler
const handleInputChange = useCallback((field: string, value: string | boolean | number) => {
  setEventData(prev => ({ ...prev, [field]: value }));
  // Clear validation error for this field
  if (validationErrors[field]) {
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }
}, [validationErrors]);
```

### Why Individual useState?

1. **Granular re-renders**: Only components using changed state re-render
2. **Simple debugging**: Easy to trace state changes
3. **Flexible updates**: Each piece of state can be updated independently
4. **Draft persistence**: Easy to serialize/deserialize specific fields

---

## Validation Logic

Validation is performed per-step with custom logic:

```tsx
const validateStep = (step: number): boolean => {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1: // Basic Info
      if (!eventData.title.trim()) {
        errors.title = 'Event title is required';
      }
      if (!eventData.description.trim()) {
        errors.description = 'Short description is required';
      }
      break;

    case 2: // Date & Location
      if (!eventData.date) {
        errors.date = 'Start date is required';
      }
      if (!eventData.time) {
        errors.time = 'Start time is required';
      }
      if (!eventData.isOnline && !eventData.location.trim()) {
        errors.location = 'Location is required for in-person events';
      }
      if (eventData.isOnline && !eventData.venue && !eventData.onlineLink) {
        errors.onlineLink = 'Online link is required for virtual events';
      }
      break;

    case 4: // Tickets
      if (ticketTypes.length === 0) {
        errors.tickets = 'At least one ticket type is required';
      }
      ticketTypes.forEach((ticket, index) => {
        if (!ticket.name.trim()) {
          errors[`ticket_${index}_name`] = 'Ticket name is required';
        }
        if (ticket.type === 'paid' && (!ticket.price || parseFloat(ticket.price) <= 0)) {
          errors[`ticket_${index}_price`] = 'Valid price is required for paid tickets';
        }
      });
      break;
  }

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### Validation on Submit

Before final submission, all steps with validation rules are checked:

```tsx
const handleSubmit = async () => {
  const stepsWithValidation = [1, 2, 4]; // Basic Info, Date & Location, Tickets

  for (const step of stepsWithValidation) {
    if (!validateStep(step)) {
      setError(`Please fix errors in "${steps[step - 1]?.title}" section`);
      return;
    }
  }

  // Proceed with submission...
};
```

---

## API Integration

### Transform Form Data to API Payload

```tsx
// CreateEventStepwise.tsx
const transformFormDataToAPI = useCallback((): CreateEventData => {
  const apiData: CreateEventData = {
    title: eventData.title,
    description: eventData.description,
    fullDescription: eventData.fullDescription || eventData.description,

    // Dates - combine date and time fields
    startDate: eventData.date,
    endDate: eventData.endDate || eventData.date,
    startTime: eventData.time,
    endTime: eventData.endTime,
    timezone: timezone,

    // Location
    venue: eventData.venue || undefined,
    location: eventData.location,
    address: eventData.address || undefined,
    isOnline: eventData.isOnline,
    onlineLink: eventData.isOnline ? eventData.onlineLink : undefined,

    // Pricing
    isFree: ticketTypes.every(t => t.type === 'free'),
    currency: eventData.currency || 'KES',

    // Tickets - transform to API format
    ticketTypes: ticketTypes.map(ticket => ({
      name: ticket.name,
      description: ticket.description,
      price: ticket.type === 'paid' ? parseFloat(ticket.price) || 0 : 0,
      quantity: parseInt(ticket.quantity) || undefined,
      maxPerPerson: ticket.maxPerPerson,
      minPerOrder: ticket.minPerOrder,
      salesChannel: ticket.salesChannel,
      isHidden: ticket.isHidden,
      // ... other fields
    })),

    // Media
    image: eventData.image || undefined,
    imageFocalX: eventData.imageFocalX,
    imageFocalY: eventData.imageFocalY,

    // Related data
    speakers: speakers.length > 0 ? speakers : undefined,
    agenda: agenda.length > 0 ? agenda : undefined,
    sponsors: sponsors.length > 0 ? sponsors : undefined,
    exhibitors: exhibitors.length > 0 ? exhibitors : undefined,
    socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    registrationFields: registrationFields.length > 0 ? registrationFields : undefined,
  };

  return apiData;
}, [eventData, ticketTypes, speakers, agenda, sponsors, exhibitors, socialLinks, registrationFields, timezone]);
```

### API Functions

```typescript
// lib/event-api.ts
export const createEvent = async (data: CreateEventData): Promise<ApiResponse<EventData>> => {
  return apiPost<ApiResponse<EventData>>('/events', data);
};

export const updateEvent = async (id: string, data: UpdateEventData): Promise<ApiResponse<EventData>> => {
  return apiPut<ApiResponse<EventData>>(`/events/${id}`, data);
};
```

---

## Draft Save/Load System

Drafts are automatically saved to localStorage every 30 seconds:

```tsx
// Auto-save interval
const autoSaveIntervalRef = useRef<NodeJS.Timer | null>(null);

useEffect(() => {
  // Start auto-save
  autoSaveIntervalRef.current = setInterval(() => {
    saveDraft();
  }, 30000); // 30 seconds

  return () => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
  };
}, [saveDraft]);

// Save draft function
const saveDraft = useCallback(() => {
  const draft = {
    eventData,
    ticketTypes,
    speakers,
    agenda,
    exhibitors,
    sponsors,
    socialLinks,
    registrationFields,
    currentStep,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem('event_draft', JSON.stringify(draft));
}, [eventData, ticketTypes, speakers, agenda, exhibitors, sponsors, socialLinks, registrationFields, currentStep]);

// Load draft on mount
useEffect(() => {
  const savedDraft = localStorage.getItem('event_draft');
  if (savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      setEventData(draft.eventData);
      setTicketTypes(draft.ticketTypes || [defaultTicket]);
      setSpeakers(draft.speakers || []);
      // ... restore other state
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }
}, []);
```

---

## Platform-Wide Settings

Some settings are managed at the platform level by administrators, not per-event:

### Service Fees

Service fees are configured by the platform admin team. Organizers see an informational card:

```tsx
// TicketsStep.tsx
<Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
  <CardContent className="p-6">
    <div className="flex items-center gap-3 mb-4">
      <DollarSign className="h-5 w-5 text-primary" />
      <div>
        <h3 className="font-semibold">Service Fees</h3>
        <p className="text-sm text-muted-foreground">Platform-wide setting</p>
      </div>
    </div>
    <p className="text-sm text-muted-foreground">
      Service fees are configured at the platform level by our team.
      A standard processing fee applies to all paid ticket sales.
    </p>
    <Button variant="outline" onClick={() => window.location.href = 'mailto:support@eventknit.com?subject=Service%20Fee%20Inquiry'}>
      Contact Support for Custom Rates
    </Button>
  </CardContent>
</Card>
```

### Refund Policy

Refund policies are also governed at the platform level:

- Attendees request refunds through the support team
- Enterprise organizers can negotiate custom policies
- Contact: `support@eventknit.com`

---

## Promo Codes Integration

Promo codes are managed separately from event creation, following industry standards (Eventbrite, Ticketmaster pattern).

### Why Separate?

1. **Timeline**: Codes often created after event is published
2. **Scope**: Codes can be event-specific OR organizer-wide
3. **Analytics**: Separate tracking and reporting
4. **Flexibility**: Can modify codes without editing event

### Navigation

Organizers access promo codes via:
- **Sidebar**: Marketing > Promo Codes
- **Route**: `/organizer/marketing/promo-codes`
- **Component**: `OrganizerPromoCodeManager.tsx`

### From TicketsStep

The TicketsStep includes a link to the promo code manager:

```tsx
<Button
  variant="outline"
  onClick={() => window.open('/organizer/marketing/promo-codes', '_blank')}
>
  <Tag className="h-4 w-4" />
  Manage Codes
</Button>
```

### Promo Code API

```typescript
// lib/promo-code-api.ts
interface PromoCode {
  id: string;
  code: string;
  eventId?: string;                    // null = organizer-wide
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableTicketTypes: string[];
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validUntil: string;
}

// API Functions
export const getPromoCodes = async (eventId?: string) => { ... };
export const createPromoCode = async (data: CreatePromoCodeData) => { ... };
export const updatePromoCode = async (id: string, data: Partial<CreatePromoCodeData>) => { ... };
export const deletePromoCode = async (id: string) => { ... };
export const validatePromoCode = async (code: string, eventId: string, ticketType: string | null, totalAmount: number) => { ... };
```

---

## Common Patterns & Best Practices

### 1. Currency Handling

Always use the event's currency, never hardcode:

```tsx
// Good
const currency = eventData.currency || DEFAULT_CURRENCY;
const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;

// Bad
const price = `$${ticket.price}`; // Don't hardcode $
```

### 2. Online/Hybrid Events

Use the `getVenueType()` utility:

```typescript
// types/event.ts
export const getVenueType = (event: { isOnline?: boolean; venue?: string | null; onlineLink?: string | null }) => {
  if (event.isOnline && event.venue) return 'hybrid';
  if (event.isOnline) return 'online';
  return 'in-person';
};
```

### 3. Validation Error Display

Display errors inline with form fields:

```tsx
<Input
  value={eventData.title}
  onChange={(e) => onInputChange('title', e.target.value)}
  className={validationErrors.title ? 'border-destructive' : ''}
/>
{validationErrors.title && (
  <p className="text-sm text-destructive mt-1">{validationErrors.title}</p>
)}
```

### 4. Collapsible Sections

Use shadcn's Collapsible for expandable content:

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Hidden content */}
  </CollapsibleContent>
</Collapsible>
```

### 5. Form Field Consistency

Follow the established pattern for form fields:

```tsx
<div className="space-y-2">
  <Label htmlFor="fieldName">Field Label</Label>
  <Input
    id="fieldName"
    value={eventData.fieldName}
    onChange={(e) => onInputChange('fieldName', e.target.value)}
    placeholder="Placeholder text"
    className="h-11" // Standard height
  />
  {validationErrors.fieldName && (
    <p className="text-sm text-destructive">{validationErrors.fieldName}</p>
  )}
</div>
```

---

## Backend Integration

### Prisma Schema (Event Model)

Key fields in the Event model:

```prisma
model Event {
  id                  String      @id @default(uuid())
  title               String
  description         String
  fullDescription     String?     @db.Text

  startDate           DateTime
  endDate             DateTime?
  startTime           String?
  endTime             String?
  timezone            String?

  venue               String?
  location            String
  address             String?
  isOnline            Boolean     @default(false)
  onlineLink          String?

  isFree              Boolean     @default(false)
  price               Decimal?    @db.Decimal(10, 2)
  currency            String?     @default("KES")

  image               String?
  imageFocalX         Float?
  imageFocalY         Float?

  capacity            Int?

  // Status
  status              EventStatus @default(PENDING)
  type                EventType   @default(PUBLIC)

  // Relations
  organizerId         String
  organizer           User        @relation(fields: [organizerId], references: [id])
  ticketTypes         TicketType[]
  registrations       Registration[]

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}
```

### Event Service

Located at `server/src/services/event.service.ts`:

```typescript
export class EventService {
  static async createEvent(
    data: CreateEventData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Event> {
    // Validation
    // Create event record
    // Create ticket types
    // Create agenda items
    // Generate default invitation links
    // Create audit log
    return event;
  }

  static async updateEvent(
    eventId: string,
    data: UpdateEventData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Event> {
    // Authorization check
    // Update event record
    // Sync ticket types
    // Sync agenda/speakers
    // Create audit log
    // Send notifications to attendees if significant changes
    return updatedEvent;
  }
}
```

---

## Troubleshooting

### Common Issues

1. **Draft not loading**: Check localStorage quota, clear old drafts
2. **Validation not triggering**: Ensure `validateStep()` is called before navigation
3. **API errors**: Check network tab, verify CreateEventData shape matches API expectations
4. **Image upload fails**: Verify file size limits and accepted formats
5. **Currency symbol wrong**: Ensure `eventData.currency` is set, use `CURRENCIES` lookup

### Debug Tips

```tsx
// Log state changes
useEffect(() => {
  console.log('Event data changed:', eventData);
}, [eventData]);

// Log validation errors
useEffect(() => {
  console.log('Validation errors:', validationErrors);
}, [validationErrors]);

// Log API payload before submit
const handleSubmit = async () => {
  const apiData = transformFormDataToAPI();
  console.log('API Payload:', JSON.stringify(apiData, null, 2));
  // ...
};
```

---

## Related Documentation

- [API Documentation](./API.md) - REST API endpoints
- [Database Schema](./DATABASE.md) - Prisma schema reference
- [UI Components](./UI_COMPONENTS.md) - shadcn/ui component usage
- [Authentication](./AUTH.md) - JWT auth flow

---

*Last updated: February 2026*
