# Dashboard Changes for Seat Allocation Feature

**Last Updated:** March 2, 2026  
**Status:** Planning / Pre-Implementation  
**Priority:** High - Critical for Feature Rollout

---

## Table of Contents

1. [Overview](#overview)
2. [Organizer Dashboard Changes](#organizer-dashboard-changes)
3. [Attendee Dashboard Changes](#attendee-dashboard-changes)
4. [Admin Dashboard Changes](#admin-dashboard-changes)
5. [Navigation & Routing Updates](#navigation--routing-updates)
6. [Component Additions & Modifications](#component-additions--modifications)
7. [Implementation Priority](#implementation-priority)

---

## Overview

The new seat allocation feature requires significant changes across all three dashboard types:

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Changes                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ORGANIZER DASHBOARD                                         │
│ ├─ Event Creation Wizard (Step 3 & 4)                      │
│ ├─ Event Management (new "Seat Management" card)           │
│ ├─ Seat Assignment Dashboard (NEW)                         │
│ └─ Event Details → Seating Tab (enhanced)                  │
│                                                             │
│ ATTENDEE DASHBOARD                                          │
│ ├─ My Tickets (show seat info)                             │
│ ├─ Seat Preferences (if organizer-assigns)                │
│ └─ Seat Change Requests (NEW - for CUSTOMER_SELECTS)      │
│                                                             │
│ ADMIN DASHBOARD                                             │
│ ├─ Event Approval (seating validation)                     │
│ ├─ Seating Analytics                                       │
│ └─ Seat Compliance Monitoring                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Event Creation Wizard (Organizer & Admin)

### Current State

**Event Creation Flow (Shared Component):**
```
CreateEventStepwise.tsx (7 steps)
├─ Used by: Organizers + Admins (assisted onboarding, company events)
├─ Step 1: BasicInfoStep
├─ Step 2: DateLocationStep
├─ Step 3: TicketsStep
├─ Step 4: RegistrationDetailsStep
├─ Step 5: MediaStep
├─ Step 6: ExtrasStep
└─ Step 7: ReviewStep
```

**Access Points:**
```
Organizer Dashboard
├─ Events → "Create Event"
└─ CreateEventStepwise

Admin Dashboard (Superadmin, Admin Staff)
├─ Events Management → "Create Event"
├─ CreateEventStepwise (SAME component)
└─ Additional field: "Assign to Organizer"

Assisted Onboarding Flow
├─ New Organizer Setup → Create First Event
├─ CreateEventStepwise (simplified/guided)
└─ Pre-populated with organizer info
```

**Event Management:**
```
UnifiedOrganizerDashboard.tsx
├─ Dashboard stats (events, attendees, revenue)
├─ Event cards with quick actions
└─ Event list view (upcoming, past, cancelled, templates)
```

---

### Required Changes

#### 1. Event Creation Wizard (Steps 3 & 4)

**Step 3: TicketsStep - ADD SEATING CONFIGURATION**

**Current:**
```tsx
// TicketsStep.tsx
export interface TicketsStepData {
  ticketTypes: TicketType[];
  currency?: string;
  eventCapacity?: number;
}

// Renders:
// - Add ticket type UI
// - Price, quantity, features
// - No seating option
```

**New:**
```tsx
// TicketsStep.tsx - UPDATED

export interface TicketsStepData {
  ticketTypes: TicketType[];
  currency?: string;
  eventCapacity?: number;
  
  // ✅ NEW FIELDS
  hasSeatingMap: boolean;              // Does event have assigned seating?
  seatingType?: 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'HYBRID';
  seatMapRequired: boolean;            // Must configure before publish?
}

// ✅ NEW: Admin-specific fields
export interface CreateEventDataAdmin extends CreateEventData {
  organizerId: string;                 // Which organizer owns this event?
  createdByAdminId: string;           // Audit trail
  assistedOnboarding?: boolean;        // Is this part of onboarding?
}

// Renders:
// - Existing: Add ticket type UI
// - NEW: Toggle "This event has assigned seating"
// - NEW: Radio buttons for seating type
//   └─ "Customers choose seats during purchase"
//   └─ "I'll assign seats after purchase"  
//   └─ "Different rules per ticket type"
// - NEW: Help text explaining each type
// - NEW: Show pricing impact (might need to restrict sections)
```

**UI Components to Add:**
```tsx
{/* NEW: Seating Configuration Section */}
<div className="border-t pt-8 mt-8">
  <div className="flex items-center gap-3 mb-4">
    <Armchair className="h-5 w-5 text-primary" />
    <h3 className="text-lg font-semibold">Seating Configuration</h3>
  </div>
  
  <label className="flex items-center gap-3">
    <Checkbox
      checked={formData.hasSeatingMap}
      onChange={(e) => updateFormData({
        hasSeatingMap: e.target.checked
      })}
    />
    <span>This event has assigned seating</span>
  </label>
  
  {formData.hasSeatingMap && (
    <>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
        <Label>How should seats be allocated?</Label>
        
        <RadioGroup value={formData.seatingType || 'CUSTOMER_SELECTS'}>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="CUSTOMER_SELECTS" />
            <span>
              <strong>Customers choose seats during purchase</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Best for: Concerts, sports, festivals
              </p>
            </span>
          </label>
          
          <label className="flex items-center gap-2">
            <RadioGroupItem value="ORGANIZER_ASSIGNS" />
            <span>
              <strong>I'll assign seats after purchase</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Best for: Theater, corporate events, premium experiences
              </p>
            </span>
          </label>
          
          <label className="flex items-center gap-2">
            <RadioGroupItem value="HYBRID" />
            <span>
              <strong>Different rules for different ticket types</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Best for: Premium conferences, stadium events with VIP areas
              </p>
            </span>
          </label>
        </RadioGroup>
      </div>
      
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {formData.seatingType === 'CUSTOMER_SELECTS' && 
            "You'll configure your seat map in the next step"}
          {formData.seatingType === 'ORGANIZER_ASSIGNS' && 
            "You can add your seat map later in the organizer dashboard"}
          {formData.seatingType === 'HYBRID' && 
            "You'll configure which ticket types require customer selection"}
        </AlertDescription>
      </Alert>
    </>
  )}
</div>
```

**Update Ticket Type Interface:**
```tsx
// types.d.ts
export interface TicketType {
  // ... existing fields
  
  // ✅ NEW: Seating configuration per ticket type
  seatingType?: 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'RESERVED';
  allowedSections?: string[];      // VIP only, etc.
  allowedSeatTypes?: string[];     // Premium seat types
  reservedSeats?: string[];        // Pre-allocated seats
}
```

---

**Step 4: NEW - SeatingConfigStep (Conditional)**

**Location:** Between TicketsStep and RegistrationDetailsStep

**When Shown:**
- Only if `hasSeatingMap === true` AND `seatingType === CUSTOMER_SELECTS`
- Always optional (can skip to publish, add seats later)

**Components:**
```tsx
// SeatingConfigStep.tsx - NEW

interface SeatingConfigStepProps {
  eventData: EventFormData;
  onUpdate: (data: Partial<EventFormData>) => void;
  onOpenBuilder: () => void;
}

export const SeatingConfigStep = ({
  eventData,
  onUpdate,
  onOpenBuilder
}: SeatingConfigStepProps) => {
  
  // Shows:
  // 1. Venue setup options
  //    ├─ "Use SeatMapBuilder" button
  //    ├─ "Upload venue image" (optional)
  //    └─ "Configure manually" link
  //
  // 2. Layout preview (if configured)
  //
  // 3. Pricing summary
  //    └─ Show base price vs section override
  //
  // 4. Restrictions summary
  //    └─ Which ticket types can use which sections
  //
  // 5. Continue or Skip button
  //    └─ "Configure now" or "Add seats after publish"
}
```

**What Goes Inside:**

1. **Seat Map Builder Integration**
   ```tsx
   <button onClick={onOpenBuilder}>
     <Plus className="h-4 w-4 mr-2" />
     Open Seat Map Builder
   </button>
   ```

2. **Quick Setup Options**
   ```tsx
   <div className="grid grid-cols-2 gap-4">
     <button>Upload Venue Image</button>
     <button>Use Template</button>
     <button>Manual Configuration</button>
     <button>Skip for Now</button>
   </div>
   ```

3. **Configuration Summary**
   - Total seats configured
   - Sections created
   - Pricing rules
   - Ticket restrictions

---

#### 2. Event Management Page (UnifiedEventsPage)

**Current:**
```tsx
// UnifiedEventsPage.tsx
// Shows event cards with:
// - Basic info
// - Status badge
// - Quick actions (edit, analytics, etc.)
// - View toggle (upcoming, past, cancelled, templates)
```

**New Elements:**
```tsx
// ✅ ADD: Seating status indicator on event cards

<OrganizerEventCard
  event={event}
  additionalBadges={[
    event.hasSeatingMap && (
      <Badge variant="secondary">
        <Armchair className="h-3 w-3 mr-1" />
        {event.seatingType === 'CUSTOMER_SELECTS' && 'Seat Selection'}
        {event.seatingType === 'ORGANIZER_ASSIGNS' && 'Assigned Seating'}
        {event.seatingType === 'HYBRID' && 'Mixed Seating'}
      </Badge>
    ),
    // Show warning if ORGANIZER_ASSIGNS without seat map
    event.seatingType === 'ORGANIZER_ASSIGNS' && !event.seatMap && (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Needs Seat Assignment
      </Badge>
    ),
  ]}
  quickActions={[
    // ... existing actions
    event.hasSeatingMap && {
      label: 'Manage Seats',
      icon: Armchair,
      onClick: () => navigate(`/organizer/events/${event.id}/seats`)
    }
  ]}
/>
```

---

#### 3. NEW - Seat Management Dashboard

**New Route:**
```tsx
// organizerRoutes.tsx
{
  path: 'events/:eventId/seats',
  element: createElement(EventSeatManagement),
  name: 'Event Seat Management'
}
```

**Component: EventSeatManagement.tsx (NEW)**

```tsx
// /organizer/events/:eventId/seats

interface EventSeatManagementProps {
  eventId: string;
}

export const EventSeatManagement = ({ eventId }: EventSeatManagementProps) => {
  // Tabs:
  // 1. Seat Map Tab
  //    ├─ Visual seat map
  //    ├─ Edit button (opens SeatMapBuilder)
  //    └─ Statistics (total seats, sold, available, blocked)
  //
  // 2. Seat Assignments Tab (if ORGANIZER_ASSIGNS)
  //    ├─ List of unassigned registrations
  //    ├─ Drag-and-drop seat assignment interface
  //    ├─ Bulk assignment tools
  //    ├─ Filter by ticket type
  //    └─ Email notifications on assignment
  //
  // 3. Analytics Tab
  //    ├─ Seat utilization heatmap
  //    ├─ Revenue by section
  //    ├─ Popular vs unpopular sections
  //    └─ Price elasticity by section
  //
  // 4. Settings Tab
  //    ├─ Change seating type (CUSTOMER_SELECTS ↔ ORGANIZER_ASSIGNS)
  //    ├─ Pricing overrides
  //    └─ Blocking/opening sections
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Seat Management"
        description={event.title}
      />
      
      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">Seat Map</TabsTrigger>
          {event.seatingType === 'ORGANIZER_ASSIGNS' && (
            <TabsTrigger value="assignments">
              Assignments
              <Badge>{unassignedCount}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map">
          <SeatMapViewer
            seatMap={event.seatMap}
            onEdit={() => setShowBuilder(true)}
          />
        </TabsContent>
        
        <TabsContent value="assignments">
          <SeatAssignmentDashboard eventId={eventId} />
        </TabsContent>
        
        <TabsContent value="analytics">
          <SeatAnalytics eventId={eventId} />
        </TabsContent>
        
        <TabsContent value="settings">
          <SeatSettings eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Sub-component: SeatAssignmentDashboard.tsx (NEW)**

```tsx
// Interface for ORGANIZER_ASSIGNS seating type

interface SeatAssignmentDashboardProps {
  eventId: string;
}

export const SeatAssignmentDashboard = ({
  eventId
}: SeatAssignmentDashboardProps) => {
  // Features:
  // 1. Unassigned Registrations List
  //    ├─ Filter by ticket type
  //    ├─ Sort by registration date
  //    ├─ Search by attendee name/email
  //    └─ Bulk select for batch assignment
  //
  // 2. Seat Map View (right side)
  //    ├─ Click a seat to assign to selected registration(s)
  //    ├─ Show seat details on hover
  //    └─ Highlight available vs booked vs blocked
  //
  // 3. Assignment Tools
  //    ├─ "Assign Selected to Seat(s)"
  //    ├─ "Auto-assign by proximity" (group together)
  //    ├─ "Assign from template" (recurring patterns)
  //    └─ "Undo last assignment"
  //
  // 4. Notification Controls
  //    ├─ "Email attendee" checkbox
  //    ├─ "Send batch email"
  //    └─ Email template picker
  //
  // 5. Confirmation Dialog
  //    ├─ Show assignments
  //    ├─ Confirm with option to email
  //    └─ Undo option for 5 minutes
  
  const [unassignedRegistrations, setUnassignedRegistrations] = useState([]);
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  const handleAssignSeats = async () => {
    // POST /api/v1/organizer-dashboard/events/:eventId/seats/assign
    // Body: {
    //   registrationIds: string[],
    //   seatIds: string[],
    //   sendEmail: boolean,
    //   emailTemplate?: string
    // }
  };
  
  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Left: Registration List */}
      <div className="col-span-1 border rounded-lg p-4 overflow-y-auto">
        <div className="space-y-4">
          <Input
            placeholder="Search by name/email..."
            onChange={(e) => handleSearch(e.target.value)}
          />
          
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Filter by ticket type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {event.ticketTypes.map(tt => (
                <SelectItem key={tt.id} value={tt.id}>
                  {tt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="space-y-2">
            {unassignedRegistrations.map(reg => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                isSelected={selectedRegistrations.includes(reg.id)}
                onSelect={(id) => {
                  setSelectedRegistrations(prev =>
                    prev.includes(id)
                      ? prev.filter(x => x !== id)
                      : [...prev, id]
                  );
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Center: Seat Map */}
      <div className="col-span-1 border rounded-lg p-4">
        <InteractiveSeatMap
          seatMap={event.seatMap}
          selectedSeats={selectedSeats}
          onSeatClick={(seatId) => setSelectedSeats([seatId])}
          availableOnly={true}
          highlightRestrictions={true}
        />
      </div>
      
      {/* Right: Assignment Tools */}
      <div className="col-span-1 border rounded-lg p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Selected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Registrations</p>
              <p className="text-2xl font-bold">{selectedRegistrations.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Seats</p>
              <p className="text-2xl font-bold">{selectedSeats.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Button
          onClick={handleAssignSeats}
          disabled={selectedRegistrations.length === 0 || selectedSeats.length === 0}
          className="w-full"
        >
          Assign Seats
        </Button>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <Checkbox defaultChecked />
            <span className="text-sm">Email attendees</span>
          </label>
          
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select email template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Confirmation</SelectItem>
              <SelectItem value="premium">Premium Experience</SelectItem>
              <SelectItem value="vip">VIP Welcome</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Button variant="outline" className="w-full">
            Auto-assign by Proximity
          </Button>
          <Button variant="outline" className="w-full">
            Undo Last Assignment
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

#### 4. Event Details Page - New "Seating" Tab

**Current:**
```tsx
// Event Details Page
// Tabs:
// - Overview
// - Tickets
// - Attendees
// - Analytics
// - Settings
```

**New:**
```tsx
// Event Details Page - ADD SEATING TAB

<Tabs>
  <TabsList>
    {/* ... existing tabs ... */}
    {event.hasSeatingMap && (
      <TabsTrigger value="seating">
        <Armchair className="h-4 w-4 mr-2" />
        Seating
      </TabsTrigger>
    )}
  </TabsList>
  
  <TabsContent value="seating">
    <EventSeatingOverview
      event={event}
      onManageSeats={() => navigate(`/organizer/events/${event.id}/seats`)}
    />
  </TabsContent>
</Tabs>
```

**Component: EventSeatingOverview.tsx (NEW)**

```tsx
// Shows:
// - Seating type badge (CUSTOMER_SELECTS / ORGANIZER_ASSIGNS / HYBRID)
// - Seat map thumbnail
// - Quick stats:
//   ├─ Total seats: 500
//   ├─ Sold: 325 (65%)
//   ├─ Available: 175 (35%)
//   └─ Blocked: 0
// - Quick actions:
//   ├─ "Manage Seats" button
//   ├─ "View Analytics" button
//   └─ "Change Seating Settings" button
// - Warnings (if applicable):
//   ├─ "No seat assignments yet" (ORGANIZER_ASSIGNS)
//   └─ "Seating configuration incomplete" (CUSTOMER_SELECTS without map)
```

---

### Organizer Dashboard Summary

| Component | Status | Type | Priority |
|-----------|--------|------|----------|
| TicketsStep (enhance) | ✅ NEW | UI | Critical |
| SeatingConfigStep | ✅ NEW | UI | Critical |
| EventSeatManagement | ✅ NEW | Page | Critical |
| SeatAssignmentDashboard | ✅ NEW | Component | High |
| EventSeatingOverview | ✅ NEW | Component | High |
| Event Card (add seating badge) | ✅ MODIFY | UI | Medium |

---

## Attendee Dashboard Changes

### Current State

**My Tickets:**
```tsx
// MyTickets.tsx
// Shows:
// - Ticket list by event
// - Ticket number
// - QR code
// - Check-in status
// - Transfer/resale options
// - NO SEAT INFO
```

---

### Required Changes

#### 1. My Tickets - Add Seat Information

**Current:**
```tsx
// MyTickets.tsx - TicketCard component

<Card>
  <CardHeader>
    <h3>{event.title}</h3>
    <p>{ticketType}</p>
  </CardHeader>
  <CardContent>
    <p>Ticket: {ticketNumber}</p>
    <img src={qrCode} alt="QR Code" />
    <Status>{status}</Status>
  </CardContent>
  <CardFooter>
    <Transfer />
    <Resale />
  </CardFooter>
</Card>
```

**New:**
```tsx
// MyTickets.tsx - UPDATED TicketCard component

<Card>
  <CardHeader>
    <h3>{event.title}</h3>
    <p>{ticketType}</p>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Ticket</p>
        <p className="font-mono">{ticketNumber}</p>
      </div>
      
      {/* ✅ NEW: Seat Information */}
      {ticket.seat && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">Your Seat</p>
          <p className="text-lg font-semibold">
            {ticket.seat.sectionId && `${ticket.seat.sectionId} - `}
            {ticket.seat.rowLabel}{ticket.seat.seatLabel}
          </p>
          {ticket.seat.attendeeName && (
            <p className="text-xs text-muted-foreground mt-1">
              Reserved for: {ticket.seat.attendeeName}
            </p>
          )}
          {!ticket.seat.seatId && (
            <p className="text-xs text-amber-600 mt-1">
              ⏳ Seat assignment pending
            </p>
          )}
        </div>
      )}
      
      <img src={qrCode} alt="QR Code" />
      <Status>{status}</Status>
    </div>
  </CardContent>
  <CardFooter>
    {/* ✅ NEW: Show seat-specific actions */}
    {ticket.seatId && event.seatingType === 'CUSTOMER_SELECTS' && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/user/dashboard?section=seat-change-request')}
      >
        <MapPin className="h-4 w-4 mr-1" />
        Request Seat Change
      </Button>
    )}
    <Transfer />
    <Resale />
  </CardFooter>
</Card>
```

**New Fields in Ticket Response:**
```typescript
interface TicketWithSeat extends Ticket {
  seat?: {
    seatId: string;
    seatIdentifier: string;
    sectionId?: string;
    rowLabel?: string;
    seatLabel?: string;
    attendeeName?: string;    // ✅ Who it's reserved for
    attendeeEmail?: string;
    seatType?: string;         // VIP, standard, etc.
  };
}
```

---

#### 2. NEW - Seat Preferences (if ORGANIZER_ASSIGNS)

**New Route:**
```tsx
// userRoutes.tsx
{
  path: 'seat-preferences',
  section: 'seat-preferences',
  element: createElement(SeatPreferences),
  name: 'Seat Preferences'
}
```

**Component: SeatPreferences.tsx (NEW)**

```tsx
// For events with ORGANIZER_ASSIGNS seating

interface SeatPreferencesProps {
  registrations: EventRegistration[];
}

export const SeatPreferences = ({ registrations }: SeatPreferencesProps) => {
  // Shows for each registration with ORGANIZER_ASSIGNS seating:
  // 1. Event info
  // 2. Current seat (if assigned)
  // 3. Preferences form:
  //    ├─ Preferred section
  //    ├─ Proximity (front/middle/back)
  //    ├─ Mobility requirements
  //    ├─ Accessibility needs
  //    └─ Special requests
  // 4. Submit button
  // 5. Confirmation message
  
  const organizerAssignEvents = registrations.filter(
    r => r.event.seatingType === 'ORGANIZER_ASSIGNS'
  );
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Seat Preferences"
        description="Tell organizers where you'd like to sit"
      />
      
      {organizerAssignEvents.length === 0 ? (
        <EmptyState
          icon={<Armchair />}
          title="No organizer-assigned events"
          description="Your upcoming events don't require seat preferences"
        />
      ) : (
        <div className="space-y-4">
          {organizerAssignEvents.map(registration => (
            <SeatPreferenceForm
              key={registration.id}
              registration={registration}
              onSubmit={handleSubmitPreferences}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Sub-component: SeatPreferenceForm.tsx**

```tsx
interface SeatPreferenceFormProps {
  registration: EventRegistration;
  onSubmit: (prefs: SeatPreferences) => Promise<void>;
}

export const SeatPreferenceForm = ({
  registration,
  onSubmit
}: SeatPreferenceFormProps) => {
  const [prefs, setPrefs] = useState<SeatPreferences>({
    preferredSection: undefined,
    proximity: 'middle',
    mobilityRequired: false,
    wheelchairAccessible: false,
    specialRequests: ''
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{registration.event.title}</CardTitle>
        {registration.seatReservation?.seat && (
          <CardDescription>
            Current Seat: {registration.seatReservation.seat.seatIdentifier}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Preferred Section</Label>
          <Select value={prefs.preferredSection || ''}>
            <SelectTrigger>
              <SelectValue placeholder="No preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Preference</SelectItem>
              {registration.event.seatMap?.layout.sections.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Seating Proximity</Label>
          <RadioGroup value={prefs.proximity}>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="front" />
              <span>Front (Rows 1-5)</span>
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="middle" />
              <span>Middle (Rows 6-10)</span>
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="back" />
              <span>Back (Rows 11+)</span>
            </label>
          </RadioGroup>
        </div>
        
        <label className="flex items-center gap-2">
          <Checkbox
            checked={prefs.mobilityRequired}
            onChange={(e) => setPrefs({
              ...prefs,
              mobilityRequired: e.target.checked
            })}
          />
          <span>I require easy access/mobility</span>
        </label>
        
        <label className="flex items-center gap-2">
          <Checkbox
            checked={prefs.wheelchairAccessible}
            onChange={(e) => setPrefs({
              ...prefs,
              wheelchairAccessible: e.target.checked
            })}
          />
          <span>I require wheelchair accessible seating</span>
        </label>
        
        <div>
          <Label>Special Requests</Label>
          <Textarea
            placeholder="Any special seating requests or needs?"
            value={prefs.specialRequests}
            onChange={(e) => setPrefs({
              ...prefs,
              specialRequests: e.target.value
            })}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSubmit(prefs)}>
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

#### 3. NEW - Seat Change Requests (for CUSTOMER_SELECTS)

**New Route:**
```tsx
// userRoutes.tsx
{
  path: 'seat-change-request',
  section: 'seat-change-request',
  element: createElement(SeatChangeRequest),
  name: 'Request Seat Change'
}
```

**Component: SeatChangeRequest.tsx (NEW)**

```tsx
// For events with CUSTOMER_SELECTS seating type

export const SeatChangeRequest = () => {
  // Shows for customer-select events:
  // 1. Event info
  // 2. Current seat info
  // 3. New seat selection UI
  // 4. Reason dropdown
  // 5. Submit request
  // 6. Request status history
  
  const [selectedEvent, setSelectedEvent] = useState<EventRegistration | null>(null);
  const [newSeatIds, setNewSeatIds] = useState<string[]>([]);
  const [reason, setReason] = useState<string>('');
  
  const customerSelectTickets = userTickets.filter(
    t => t.event.seatingType === 'CUSTOMER_SELECTS' && t.seatId
  );
  
  const handleSubmitRequest = async () => {
    // POST /api/v1/registrations/:registrationId/seat-change-request
    // Body: {
    //   newSeatIds: string[],
    //   reason: string
    // }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Request Seat Change"
        description="Change your seats for events with open seating"
      />
      
      {customerSelectTickets.length === 0 ? (
        <EmptyState message="No eligible events for seat changes" />
      ) : (
        <>
          {/* Event Selection */}
          <div>
            <Label>Select Event</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {customerSelectTickets.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.event.title} ({t.seatId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedEvent && (
            <>
              {/* Current Seat */}
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Current Seat</p>
                  <p className="text-xl font-semibold">
                    {selectedEvent.seatReservation?.seat?.seatIdentifier}
                  </p>
                </CardContent>
              </Card>
              
              {/* New Seat Selection */}
              <div>
                <Label>Select New Seats</Label>
                <InteractiveSeatMap
                  seatMap={selectedEvent.event.seatMap}
                  selectedSeats={newSeatIds}
                  onSeatClick={(seatId) => {
                    setNewSeatIds(prev =>
                      prev.includes(seatId)
                        ? prev.filter(x => x !== seatId)
                        : [...prev, seatId]
                    );
                  }}
                  highlightCurrent={true}
                  showAvailableOnly={true}
                />
              </div>
              
              {/* Reason */}
              <div>
                <Label>Reason for Change</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Why do you want to change?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="better-view">Better View</SelectItem>
                    <SelectItem value="accessibility">Accessibility</SelectItem>
                    <SelectItem value="companion">With Companion</SelectItem>
                    <SelectItem value="away-from">Away from Section</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Submit */}
              <Button
                onClick={handleSubmitRequest}
                disabled={newSeatIds.length === 0}
              >
                Submit Change Request
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
```

---

#### 4. Dashboard Navigation - Add New Links

**Update DashboardNavbar.tsx:**

```tsx
// Add to navigation:
{
  id: 'tickets',
  label: 'My Tickets',
  href: '/user/dashboard?section=tickets',
  icon: Ticket
},
{
  id: 'seat-preferences',
  label: 'Seat Preferences',
  href: '/user/dashboard?section=seat-preferences',
  icon: Armchair,
  badge: preferencesPending ? 'New' : undefined
},
{
  id: 'seat-changes',
  label: 'Seat Changes',
  href: '/user/dashboard?section=seat-change-request',
  icon: SwapHorizontal2
},
```

---

### Attendee Dashboard Summary

| Component | Status | Type | Priority |
|-----------|--------|------|----------|
| MyTickets (add seat info) | ✅ MODIFY | UI | Critical |
| SeatPreferences | ✅ NEW | Page | High |
| SeatPreferenceForm | ✅ NEW | Component | High |
| SeatChangeRequest | ✅ NEW | Page | High |
| DashboardNavbar (update) | ✅ MODIFY | Navigation | High |

---

## Admin Dashboard Changes

### Current State

**Admin Dashboard:**
```tsx
// AdminDashboard.tsx routes to:
// - AdminEnhancedDashboard (superadmin, admin staff)
//   ├─ Event Management (CREATE, EDIT, APPROVE)
//   ├─ User/Organizer Management
//   └─ Platform Analytics
// - TellerDashboard (tellers)
// - MarketerDashboard (marketers)
// - SupportDashboard (support)
```

**Admin Event Creation Context:**
- Assisted Onboarding: New organizers need their first event set up
- Company Events: Platform-owned events created by admin
- Event Cloning: Copy event template to new organizer
- Event Editing: Modify any event on platform (audited)

---

### Required Changes

#### 1. Admin Event Creation (SHARED CreateEventStepwise)

**Component: AdminCreateEventPage.tsx (NEW)**

```tsx
// Admin wrapper around CreateEventStepwise

interface AdminCreateEventPageProps {
  mode: 'assisted-onboarding' | 'standard' | 'clone-template';
  organizerId?: string;
  templateEventId?: string;
}

export const AdminCreateEventPage = ({
  mode,
  organizerId,
  templateEventId
}: AdminCreateEventPageProps) => {
  // Wrapper component that:
  // 1. Calls same CreateEventStepwise
  // 2. Adds admin-specific fields
  // 3. Handles organizer assignment
  // 4. Logs audit trail
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={
          mode === 'assisted-onboarding' 
            ? 'Onboard New Event' 
            : 'Create Event'
        }
      />
      
      {/* ✅ NEW: Admin context section */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Event Creation Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Mode</Label>
            <Badge>{mode === 'assisted-onboarding' ? '👥 Assisted Onboarding' : '🎯 Standard'}</Badge>
          </div>
          
          {mode === 'assisted-onboarding' && (
            <div>
              <Label>Assign to Organizer</Label>
              <Select value={organizerId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose organizer..." />
                </SelectTrigger>
                <SelectContent>
                  {/* List of onboarding organizers */}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {mode === 'clone-template' && (
            <div>
              <Label>Template Event</Label>
              <p className="text-sm text-muted-foreground">{templateEventTitle}</p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Created by: {adminName} | Timestamp: {now}
          </p>
        </CardContent>
      </Card>
      
      {/* ✅ SAME: CreateEventStepwise component */}
      <CreateEventStepwise
        initialData={mode === 'clone-template' ? getTemplateData() : undefined}
        onSubmit={(data) => handleAdminCreateEvent(data, mode, organizerId)}
        context="admin"
        showExtraFields={true}
      />
    </div>
  );
}
```

**Key Differences from Organizer:**
```tsx
// CreateEventStepwise accepts context prop

interface CreateEventStepwiseProps {
  // ... existing props
  context?: 'organizer' | 'admin';  // ✅ NEW
  showExtraFields?: boolean;         // ✅ NEW - shows organizer assignment
}

// In BasicInfoStep (Step 1):
{context === 'admin' && (
  <>
    <div>
      <Label>Event Owner (Organizer)</Label>
      <Select value={formData.organizerId || ''}>
        <SelectTrigger>
          <SelectValue placeholder="Who owns this event?" />
        </SelectTrigger>
        <SelectContent>
          {organizers.map(org => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    
    <label className="flex items-center gap-2">
      <Checkbox
        checked={formData.assistedOnboarding}
        onChange={(e) => updateFormData({
          assistedOnboarding: e.target.checked
        })}
      />
      <span className="text-sm">
        This is part of onboarding assistance
      </span>
    </label>
  </>
)}
```

---

#### 2. Admin Event Management Page

**Enhanced: AdminEventManagement.tsx (MODIFY)**

```tsx
// Platform event management

interface AdminEventManagementProps {
  filter?: 'all' | 'pending-approval' | 'live' | 'ended' | 'no-seatmap';
}

export const AdminEventManagement = ({
  filter = 'all'
}: AdminEventManagementProps) => {
  // Features:
  // 1. Event list with advanced filters
  //    ├─ Status (pending, live, ended)
  //    ├─ Seating type (CUSTOMER_SELECTS, ORGANIZER_ASSIGNS, HYBRID, NONE)
  //    ├─ Missing seat map (critical flag)
  //    └─ Organizer name
  //
  // 2. Quick actions per event
  //    ├─ Create (for assisted onboarding)
  //    ├─ Edit
  //    ├─ Approve/Reject
  //    ├─ Manage Seats
  //    └─ Clone as Template
  //
  // 3. Bulk actions
  //    ├─ Approve multiple
  //    ├─ Add seating validation
  //    └─ Export data
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Event Management" />
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-4 gap-4">
        <Select defaultValue={filter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="pending-approval">Pending Approval</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Seating Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="customer-select">Customer Select</SelectItem>
            <SelectItem value="organizer-assign">Organizer Assign</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="none">No Seating</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Issues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="no-seatmap">Missing Seat Map</SelectItem>
            <SelectItem value="overcapacity">Overcapacity</SelectItem>
            <SelectItem value="unassigned">Pending Assignments</SelectItem>
          </SelectContent>
        </Select>
        
        <Input placeholder="Search organizer..." />
      </div>
      
      {/* Event List Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Organizer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Seating</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map(event => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell>{event.organizer.name}</TableCell>
              <TableCell>
                <Badge>{event.status}</Badge>
              </TableCell>
              <TableCell>
                {event.hasSeatingMap ? (
                  <Badge variant="secondary">
                    {event.seatingType}
                    {!event.seatMap && ' ⚠️'}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </TableCell>
              <TableCell>
                {event.issues.length > 0 && (
                  <Badge variant="destructive">{event.issues.length}</Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => editEvent(event.id)}>
                      Edit
                    </DropdownMenuItem>
                    {event.hasSeatingMap && (
                      <DropdownMenuItem onClick={() => manageSeat(event.id)}>
                        Manage Seats
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => approveEvent(event.id)}>
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => cloneEvent(event.id)}>
                      Clone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Component: AdminEventApproval.tsx (MODIFY)**

**Current:**
```tsx
// Reviews:
// - Event details
// - Ticket pricing
// - Content compliance
// - Approve / Reject buttons
```

**New:**
```tsx
// ADD: Seating validation checklist

{event.hasSeatingMap && (
  <Card className="border-blue-200 bg-blue-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Armchair className="h-5 w-5" />
        Seating Configuration
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
        <div>
          <p className="font-medium">Seating Type</p>
          <p className="text-sm text-muted-foreground">
            {event.seatingType === 'CUSTOMER_SELECTS' && 'Customers select seats during purchase'}
            {event.seatingType === 'ORGANIZER_ASSIGNS' && 'Organizer assigns seats after purchase'}
            {event.seatingType === 'HYBRID' && 'Mixed seating (varies by ticket type)'}
          </p>
        </div>
      </div>
      
      {event.seatingType === 'CUSTOMER_SELECTS' && (
        <div className={`flex items-start gap-3 ${event.seatMap ? 'opacity-100' : 'opacity-50'}`}>
          {event.seatMap ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          )}
          <div>
            <p className="font-medium">Seat Map</p>
            <p className="text-sm text-muted-foreground">
              {event.seatMap 
                ? `${event.seatMap.seats.length} total seats`
                : 'NOT CONFIGURED - Customer seat selection will be unavailable'}
            </p>
          </div>
        </div>
      )}
      
      <Separator />
      
      <div className="bg-white p-3 rounded text-sm space-y-2">
        <p className="font-medium">Approval Notes:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>
            {event.seatingType === 'CUSTOMER_SELECTS' ? 
              'Seat map is configured and will be visible to customers' :
              'Organizer will manually assign seats after event closes'}
          </li>
          <li>Validate venue capacity matches seat count</li>
          <li>Check for realistic pricing by section</li>
        </ul>
      </div>
    </CardContent>
  </Card>
)}

{/* Validation */}
{event.hasSeatingMap && event.seatingType === 'CUSTOMER_SELECTS' && !event.seatMap && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      ⚠️ This event requires a seat map but none is configured. 
      Customers will not be able to select seats.
    </AlertDescription>
  </Alert>
)}
```

---

#### 2. NEW - Seating Analytics Page

**New Route:**
```tsx
// adminRoutes.tsx
{
  path: 'analytics/seating',
  element: createElement(SeatingAnalytics),
  name: 'Seating Analytics'
}
```

**Component: SeatingAnalytics.tsx (NEW)**

```tsx
// Platform-level seating insights

export const SeatingAnalytics = () => {
  // Shows:
  // 1. Seating Type Distribution
  //    ├─ % of events using CUSTOMER_SELECTS
  //    ├─ % using ORGANIZER_ASSIGNS
  //    └─ % using HYBRID
  //
  // 2. Seat Allocation Stats
  //    ├─ Total seats across platform
  //    ├─ Seats sold vs available
  //    ├─ Revenue per seat type
  //    └─ Popular vs unpopular sections
  //
  // 3. Organizer-Assign Metrics
  //    ├─ Pending assignments
  //    ├─ Assignment completion rate
  //    ├─ Time to assign (average)
  //    └─ Customer satisfaction with assignments
  //
  // 4. Issues & Compliance
  //    ├─ Events missing seat maps
  //    ├─ Overcapacity issues
  //    ├─ Pricing anomalies
  //    └─ Customer complaints related to seats
  //
  // 5. Top Events (by seat revenue)
  //    └─ Leaderboard with filters
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Seating Analytics"
        description="Platform-wide seat allocation insights"
      />
      
      {/* Distribution */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Select
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">45%</p>
            <p className="text-xs text-muted-foreground">
              +12% this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Organizer Assign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">35%</p>
            <p className="text-xs text-muted-foreground">
              +18% this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Hybrid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">20%</p>
            <p className="text-xs text-muted-foreground">
              +8% this month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs>
        <TabsList>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="distribution">
          <SeatingDistributionChart />
        </TabsContent>
        
        <TabsContent value="revenue">
          <RevenueBySeatingChart />
        </TabsContent>
        
        <TabsContent value="assignments">
          <AssignmentMetricsChart />
        </TabsContent>
      </Tabs>
      
      {/* Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Issues & Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-3 bg-red-50 rounded">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{issue.title}</p>
                  <p className="text-xs text-muted-foreground">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

#### 3. NEW - Seat Compliance Monitoring

**Component: SeatComplianceMonitoring.tsx (NEW)**

```tsx
// Flags potential issues with seat allocations

interface ComplianceIssue {
  id: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  issue: 'missing-seatmap' | 'overcapacity' | 'pricing-anomaly' | 'unassigned-pending';
  severity: 'warning' | 'critical';
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export const SeatComplianceMonitoring = () => {
  // Watches for:
  // 1. Events with CUSTOMER_SELECTS but no seat map
  // 2. Event capacity < seat count
  // 3. Section pricing > event price (unrealistic)
  // 4. ORGANIZER_ASSIGNS with unassigned registrations > 30 days
  // 5. High customer complaints about seat allocation
  
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [filter, setFilter] = useState<ComplianceIssue['severity']>('all');
  
  useEffect(() => {
    // Poll /api/v1/admin/compliance/seating-issues
  }, []);
  
  const handleResolveIssue = async (issueId: string) => {
    // PATCH /api/v1/admin/compliance/seating-issues/:issueId
    // Body: { resolved: true }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Seating Compliance</h3>
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issues</SelectItem>
            <SelectItem value="warning">Warnings</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {issues.length === 0 ? (
        <EmptyState message="No seating compliance issues" />
      ) : (
        <div className="space-y-2">
          {issues.map(issue => (
            <Card key={issue.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {issue.severity === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{issue.eventTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {issue.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(issue.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/events/${issue.eventId}`)}
                    >
                      View Event
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResolveIssue(issue.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Admin Dashboard Summary

| Component | Status | Type | Priority |
|-----------|--------|------|----------|
| AdminEventApproval (enhance) | ✅ MODIFY | UI | Critical |
| SeatingAnalytics | ✅ NEW | Page | High |
| SeatComplianceMonitoring | ✅ NEW | Component | High |

---

## Navigation & Routing Updates

### Organizer Routes (ADD)

```tsx
// organizerRoutes.tsx

// Existing paths enhanced:
{
  path: 'events/create',
  element: createElement(CreateEventPage),
  // ✅ Now includes SeatingConfigStep
  // ✅ Uses shared CreateEventStepwise component
}

{
  path: 'events/:eventId/edit',
  element: createElement(EditEventPage),
  // ✅ Updated to allow seating changes
}

// NEW paths:
{
  path: 'events/:eventId/seats',
  element: createElement(EventSeatManagement),
  name: 'Seat Management'
}

{
  path: 'events/:eventId/seats/assignments',
  element: createElement(SeatAssignmentDashboard),
  name: 'Assign Seats'
}
```

### Admin Routes (ADD - EVENT CREATION)

```tsx
// adminRoutes.tsx

// ✅ NEW: Admin can create events
{
  path: 'events/create',
  element: createElement(AdminCreateEventPage),
  // ✅ Uses SAME CreateEventStepwise component
  // ✅ Adds "Assign to Organizer" field in Step 1
  // ✅ Adds "Assisted Onboarding" toggle
  name: 'Create Event'
}

{
  path: 'events/:eventId/edit',
  element: createElement(AdminEditEventPage),
  // ✅ Can edit any event on platform
}

// Existing analytics/oversight:
{
  path: 'analytics/seating',
  element: createElement(SeatingAnalytics),
  name: 'Seating Analytics'
}

{
  path: 'compliance/seating',
  element: createElement(SeatComplianceMonitoring),
  name: 'Seat Compliance'
}

---

## Component Additions & Modifications

### New Components to Create

```
/client/src/components/
├─ organizer/
│  ├─ seating/
│  │  ├─ SeatAssignmentDashboard.tsx (NEW)
│  │  ├─ SeatAssignmentForm.tsx (NEW)
│  │  ├─ SeatAnalytics.tsx (NEW)
│  │  ├─ SeatSettings.tsx (NEW)
│  │  └─ SeatingConfigStep.tsx (NEW)
│  ├─ SeatingConfigSection.tsx (NEW - for Step 3)
│  └─ EventSeatingOverview.tsx (NEW)
│
├─ user/
│  ├─ seating/
│  │  ├─ SeatPreferences.tsx (NEW)
│  │  ├─ SeatPreferenceForm.tsx (NEW)
│  │  ├─ SeatChangeRequest.tsx (NEW)
│  │  └─ MyTicketsWithSeats.tsx (NEW/MODIFY)
│
├─ admin/
│  └─ seating/
│     ├─ SeatingAnalytics.tsx (NEW)
│     ├─ SeatComplianceMonitoring.tsx (NEW)
│     └─ SeatingDistributionChart.tsx (NEW)
│
└─ shared/
   ├─ InteractiveSeatMap.tsx (NEW - reusable)
   ├─ SeatMapViewer.tsx (NEW - read-only)
   └─ RegistrationCard.tsx (NEW - for assignment UI)
```

### Components to Modify

```
/client/src/pages/organizer/
├─ CreateEventStepwise.tsx (add SeatingConfigStep)
├─ UnifiedOrganizerDashboard.tsx (add seating badge)
├─ UnifiedEventsPage.tsx (add seat management link)
└─ EventDetailsPage.tsx (add Seating tab)

/client/src/pages/user/
├─ UserDashboard.tsx (add seat navigation items)
└─ MyTickets.tsx (show seat info)

/client/src/pages/admin/
└─ AdminEventApproval.tsx (add seating validation)
```

### Reusable Components

```
InteractiveSeatMap.tsx
├─ Props:
│  ├─ seatMap: SeatMap
│  ├─ selectedSeats: string[]
│  ├─ onSeatClick: (seatId) => void
│  ├─ mode: 'select' | 'view' | 'assign'
│  ├─ highlightRestrictions: boolean
│  ├─ highlightCurrent: boolean
│  └─ showAvailableOnly: boolean
├─ Features:
│  ├─ Visual seat grid
│  ├─ Hover tooltips
│  ├─ Accessibility
│  └─ Responsive design

SeatMapViewer.tsx (read-only)
├─ Props:
│  ├─ seatMap: SeatMap
│  ├─ showStats: boolean
│  └─ onEdit?: () => void
└─ Features:
   ├─ Display map
   ├─ Statistics overlay
   └─ Edit button

RegistrationCard.tsx (for assignment)
├─ Props:
│  ├─ registration: EventRegistration
│  ├─ isSelected: boolean
│  ├─ onSelect: () => void
│  └─ showAssignmentStatus: boolean
└─ Features:
   ├─ Attendee info
   ├─ Ticket type
   └─ Current seat (if assigned)
```

---

## Implementation Priority

### Phase 1: Critical for Event Creation (Week 1-2)

**Must complete for organizers AND admins to create seated events:**
- [ ] Enhance TicketsStep with seating toggle
- [ ] Create SeatingConfigStep component
- [ ] Integrate SeatMapBuilder into event creation
- [ ] Update event creation API to accept seating config
- [ ] Create AdminCreateEventPage wrapper (context + organizer assignment)
- [ ] Database migration for seating fields

**Dependencies:** Seat allocation architecture (completed)

### Phase 2: Organizer Seat Management (Week 2-3)

**Must complete for organizers to manage seats:**
- [ ] Create EventSeatManagement page
- [ ] Implement SeatAssignmentDashboard (for ORGANIZER_ASSIGNS)
- [ ] Create interactive seat assignment UI
- [ ] Add email notifications on assignment
- [ ] Seat analytics dashboard
- [ ] Create AdminEventManagement page (admin event overview + quick actions)

**Dependencies:** Phase 1 completion

### Phase 3: Attendee Experience (Week 3-4)

**Must complete for good attendee UX:**
- [ ] Update MyTickets to show seat info
- [ ] Create SeatPreferences page
- [ ] Implement SeatChangeRequest workflow
- [ ] Update dashboard navigation

**Dependencies:** Phase 1 & 2 completion

### Phase 4: Admin Oversight (Week 4)

**Must complete for platform compliance:**
- [ ] Enhance event approval with seating validation
- [ ] Create SeatingAnalytics dashboard
- [ ] Implement SeatComplianceMonitoring
- [ ] Add alerts for missing/invalid configurations

**Dependencies:** Phase 1, 2, 3 completion

### Phase 5: Testing & Polish (Week 5)

- [ ] End-to-end testing for all flows
- [ ] Performance testing with large seat maps
- [ ] Accessibility audit
- [ ] Documentation

---

## Summary Table

| Dashboard | Component | Status | Priority | Week |
|-----------|-----------|--------|----------|------|
| **Organizer** | TicketsStep | Modify | Critical | 1-2 |
| | SeatingConfigStep | New | Critical | 1-2 |
| | EventSeatManagement | New | Critical | 2-3 |
| | SeatAssignmentDashboard | New | High | 2-3 |
| | EventSeatingOverview | New | High | 2-3 |
| | UnifiedEventsPage | Modify | Medium | 1-2 |
| | UnifiedOrganizerDashboard | Modify | Medium | 2-3 |
| **Attendee** | MyTickets | Modify | Critical | 3-4 |
| | SeatPreferences | New | High | 3-4 |
| | SeatChangeRequest | New | High | 3-4 |
| | DashboardNavbar | Modify | Medium | 3-4 |
| **Admin** | CreateEventPage | Modify | Critical | 1-2 |
| | EventManagement | Modify | Critical | 2-3 |
| | EventApproval | Modify | Critical | 4-5 |
| | SeatingAnalytics | New | High | 4-5 |
| | ComplianceMonitoring | New | High | 4-5 |

---

## Reference Architecture

```
Organizer Dashboard
├─ Home
├─ Events Overview
├─ Create Event ✅ Enhanced
│  └─ Uses: CreateEventStepwise (shared with admin)
├─ Events List ✅ ENHANCED
│  └─ Show seating status badges
├─ Event Details ✅ ENHANCED
│  ├─ ... existing tabs
│  └─ Seating Tab ✅ NEW
├─ Seat Management ✅ NEW
│  ├─ Seat Map
│  ├─ Assignments (for ORGANIZER_ASSIGNS)
│  ├─ Analytics
│  └─ Settings
└─ [Other sections...]

Admin Dashboard
├─ Home
├─ Events Management ✅ NEW
│  ├─ Create Event ✅ NEW
│  │  └─ Uses: CreateEventStepwise (shared with organizer)
│  │  └─ +Organizer Assignment Field
│  │  └─ +Assisted Onboarding Toggle
│  ├─ Event List with Status ✅ ENHANCED
│  └─ Quick Actions (Edit, Approve, Manage Seats, Clone)
├─ Event Approval ✅ ENHANCED
│  └─ Seating validation
├─ Analytics ✅ ENHANCED
│  └─ Seating Analytics ✅ NEW
├─ Compliance ✅ NEW
│  └─ Seat Compliance Monitoring ✅ NEW
└─ [Other sections...]

Attendee Dashboard (User)
├─ Home
├─ My Tickets ✅ ENHANCED
│  └─ Show seat information per ticket
├─ Seat Preferences ✅ NEW
│  └─ For ORGANIZER_ASSIGNS events
├─ Seat Changes ✅ NEW
│  └─ For CUSTOMER_SELECTS events
└─ [Other sections...]

Shared Components
├─ CreateEventStepwise (8 steps - used by both organizer & admin)
│  ├─ context: 'organizer' | 'admin'
│  ├─ showExtraFields: true (admin only)
│  └─ All new seating steps included
├─ InteractiveSeatMap (reusable)
├─ SeatMapViewer (read-only)
└─ RegistrationCard (assignment UI)
```

---

## Next Steps

1. **Review & Approve** this design
2. **Create GitHub Issues** for each component
3. **Assign to Sprint** with Phase 1 focus
4. **Kick off development** with Phase 1 items
5. **Weekly reviews** to track progress

---

**Document Owner:** Product Team  
**Last Review:** 2026-03-02  
**Next Review:** 2026-03-09
