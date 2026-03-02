# Admin Ticket Management - Implementation Checklist

**Status**: READY TO IMPLEMENT  
**Priority**: CRITICAL BLOCKING FEATURES  
**Estimated Effort**: 4-5 sprints (40-50 hours)

---

## Files That Need Changes

### TIER 1: CRITICAL (Blocks organizers from using platform)

#### 1. TicketsStep.tsx - Add Advanced Ticket Configuration
**File**: `eventknit/client/src/components/event-wizard/TicketsStep.tsx`

**Changes Needed**:
- [ ] Add `isComplementary` field to ticket type UI
- [ ] Add `requiresInvitation` toggle (shown when isComplementary = true)
- [ ] Add `maxPerPerson` number input
- [ ] Add `minPerOrder` number input
- [ ] Add early bird section:
  - [ ] `availableFrom` date picker
  - [ ] `availableUntil` date picker
  - [ ] `earlyBirdQuantity` number input
- [ ] Add `description` textarea
- [ ] Add `nameLocked` toggle for required attendee name

**Example**:
```tsx
// Add tab-based organization for advanced options
<Tabs defaultValue="basic">
  <TabsList>
    <TabsTrigger value="basic">Basic</TabsTrigger>
    <TabsTrigger value="pricing">Pricing</TabsTrigger>
    <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
    <TabsTrigger value="special">Special (Comp/Early Bird)</TabsTrigger>
  </TabsList>
  
  {/* Existing basic fields in basic tab */}
  {/* Add other fields in respective tabs */}
</Tabs>
```

---

#### 2. RegisterEvent.tsx - Add Invitation Code Input
**File**: `eventknit/client/src/pages/public/RegisterEvent.tsx`

**Changes Needed**:
- [ ] Detect when ticket type has `isComplementary = true` AND `requiresInvitation = true`
- [ ] Show invitation code input field when complementary ticket selected
- [ ] Add invitation code validation before submission
- [ ] Display ticket restrictions (maxPerPerson, minPerOrder, early bird status)
- [ ] Show visual indicators for complementary vs paid tickets

**Example**:
```tsx
// When user selects complementary ticket:
{selectedTicket?.isComplementary && selectedTicket?.requiresInvitation && (
  <Input
    placeholder="Enter your invitation code"
    value={invitationCode}
    onChange={(e) => setInvitationCode(e.target.value)}
    required
  />
)}

// Show ticket restrictions:
{selectedTicket?.maxPerPerson && (
  <p className="text-sm text-amber-600">
    Maximum {selectedTicket.maxPerPerson} tickets per person
  </p>
)}
```

---

#### 3. event.validations.ts - Add New Validation Rules
**File**: `eventknit/server/src/validations/event.validations.ts`

**Changes Needed**:
- [ ] Validate `maxPerPerson` > 0
- [ ] Validate `minPerOrder` <= `maxPerPerson` OR both null
- [ ] Validate `earlyBirdQuantity` <= total `quantity`
- [ ] Validate if `availableFrom` provided, `availableUntil` must also be provided
- [ ] Validate `availableFrom` < `availableUntil`
- [ ] Warn if `isComplementary = true` AND `minPerOrder > 0`

**Code Location**: Find the `ticketTypesSchema` object and add the above validations

---

#### 4. event.service.ts - Handle Invitation Links for Complementary Tickets
**File**: `eventknit/server/src/services/event.service.ts`

**Changes Needed**:
- [ ] When event created, check if any ticket type has `requiresInvitation = true`
- [ ] Automatically create invitation links for those ticket types
- [ ] Store link info so organizers can share/manage them
- [ ] Don't auto-generate invitations if already generated

**Addition to createEvent()**:
```typescript
// After event creation, if complementary tickets found:
const complementaryTickets = ticketTypesJson.filter(t => t.isComplementary && t.requiresInvitation);

if (complementaryTickets.length > 0) {
  for (const ticket of complementaryTickets) {
    // Create default invitation link
    await InvitationService.createInvitation(
      event.id,
      {
        inviteType: InviteType.ATTENDEE,
        title: `${ticket.name} Invitation`,
        ticketType: ticket.name,  // New field to link to specific ticket type
      },
      organizerId,
      organizerRole
    );
  }
}
```

---

### TIER 2: HIGH PRIORITY (Improve UX significantly)

#### 5. New Endpoint: Create Invitation Codes for Complementary Tickets
**File**: Create new controller method in `organizer-dashboard.controller.ts`

**New Endpoint**:
```typescript
POST /organizer-dashboard/events/:eventId/generate-comp-invitations
Request: {
  ticketTypeName: string;
  quantity: number;
  recipientEmails?: string[];
}
Response: {
  invitations: [{ code: string; email?: string }];
}
```

**Implementation**:
- [ ] Create method to generate invitation codes (UUID-based or custom format)
- [ ] Associate invitation codes with specific ticket type
- [ ] Optionally send emails to recipients
- [ ] Track which codes have been claimed
- [ ] Return codes & shareable links to organizer

---

#### 6. New API Endpoint: Validate Invitation Code
**File**: `event.controller.ts` (public endpoint)

**New Endpoint**:
```typescript
POST /events/:eventId/validate-invitation
Request: {
  code: string;
  ticketType: string;
}
Response: {
  valid: boolean;
  message: string;
  ticketType: string;
}
```

---

#### 7. EventManagement.tsx - Show Ticket Status & Manage Invitations
**File**: `eventknit/client/src/pages/organizer/EventManagement.tsx`

**Changes Needed**:
- [ ] Show complementary ticket badge on ticket types
- [ ] Show max per person / min per order info
- [ ] Show early bird countdown if applicable
- [ ] Add button to manage complementary ticket invitations
- [ ] Show invitation usage (created, claimed, remaining)
- [ ] Allow organizer to manually create/resend invitations

**UI Addition**:
```tsx
{ticket.isComplementary && (
  <div className="flex gap-2 items-center">
    <Badge className="bg-amber-100">🎁 Complementary</Badge>
    {ticket.requiresInvitation && (
      <Button variant="outline" size="sm">
        Manage Invitations ({usedCount}/{totalCount})
      </Button>
    )}
  </div>
)}
```

---

#### 8. New Component: Complementary Invitation Manager
**File**: Create `eventknit/client/src/components/organizer/ComplementaryInvitationManager.tsx`

**Features**:
- [ ] Show generated invitation codes
- [ ] Allow bulk code generation
- [ ] Copy codes or share links
- [ ] Track which codes were used
- [ ] Send invitation emails
- [ ] Revoke invitations
- [ ] Edit invitation expiration dates

---

### TIER 3: MEDIUM PRIORITY (Enhance admin capabilities)

#### 9. Ticket Type Templates System
**File**: Create `eventknit/server/src/services/ticket-type-template.service.ts`

**Features**:
- [ ] Allow admins to create reusable ticket type templates
- [ ] Store templates with categories (THEATER, CONFERENCE, SPORTS, CONCERT)
- [ ] Apply templates to events (for organizers or admins)
- [ ] Track template usage across events
- [ ] Show recommendations based on event category

**New Endpoints**:
```
GET /admin/ticket-type-templates
POST /admin/ticket-type-templates
GET /admin/ticket-type-templates/:templateId/usage
POST /organizer-dashboard/apply-ticket-template  // For organizers to use templates
```

---

#### 10. Dynamic Pricing Integration with Event Creation
**File**: Update `TicketsStep.tsx`

**Changes Needed**:
- [ ] Add optional "Apply pricing rules" section in event wizard
- [ ] Show available pricing rule templates
- [ ] Allow quick setup of time-based/demand-based pricing
- [ ] Link to full pricing page for advanced setup

---

#### 11. Admin Dashboard Enhancements
**File**: Update `AdminEnhancedDashboard.tsx` and create metrics

**New Metrics**:
- [ ] Number of events using complementary tickets
- [ ] Total complementary tickets distributed
- [ ] Invitation usage rate
- [ ] Most popular ticket types
- [ ] Early bird vs regular ticket sales ratio

---

## Data Model Changes

### Prisma Schema Updates
**File**: `eventknit/server/prisma/schema.prisma`

```prisma
// Add to Event model
model Event {
  // ... existing fields ...
  
  // For tracking ticket type templates
  templateId String?
  template   TicketTypeTemplate?  @relation(fields: [templateId], references: [id])
  
  // For tracking invitations by ticket type
  ticketInvitations TicketInvitation[]
}

// New model for reusable templates
model TicketTypeTemplate {
  id          String    @id @default(cuid())
  name        String
  description String?
  category    String    // THEATER, CONFERENCE, SPORTS, CONCERT, OTHER
  ticketTypes Json      // TicketTypeConfig[]
  isPublic    Boolean   @default(true)  // Can organizers see/use it?
  events      Event[]   // Which events use this template
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// Enhance EventInvitation to support ticket-specific invites
model EventInvitation {
  // ... existing fields ...
  
  // New field: which ticket type this invitation is for
  ticketType    String?   // Null = any ticket type
  
  // Track usage
  usedCount     Int       @default(0)
  usageRecords  TicketInvitationUsage[]
}

// New model to track who used which invitation
model TicketInvitationUsage {
  id           String   @id @default(cuid())
  invitationId String
  invitation   EventInvitation @relation(fields: [invitationId], references: [id])
  registrationId String
  registration EventRegistration @relation(fields: [registrationId], references: [id])
  claimedAt    DateTime @default(now())
  
  @@unique([invitationId, registrationId])
}
```

---

## Database Migration

**File**: Create new migration file

```sql
-- Add template support
ALTER TABLE "Event" ADD COLUMN "templateId" TEXT;
ALTER TABLE "Event" ADD CONSTRAINT "Event_templateId_fkey" 
  FOREIGN KEY ("templateId") REFERENCES "TicketTypeTemplate"("id");

-- Track invitation usage
ALTER TABLE "EventInvitation" ADD COLUMN "ticketType" TEXT;
ALTER TABLE "EventInvitation" ADD COLUMN "usedCount" INTEGER DEFAULT 0;

-- Create tables for ticket invitations
CREATE TABLE "TicketTypeTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "ticketTypes" JSONB NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "TicketInvitationUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invitationId" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "TicketInvitationUsage_invitationId_registrationId_key" 
  ON "TicketInvitationUsage"("invitationId", "registrationId");
```

---

## API Changes Summary

### New Routes to Add

**File**: `eventknit/server/src/routes/organizer-dashboard.routes.ts`

```typescript
// Complementary ticket management
POST   /organizer-dashboard/events/:eventId/generate-comp-invitations
GET    /organizer-dashboard/events/:eventId/comp-invitations
PUT    /organizer-dashboard/comp-invitations/:invitationId
DELETE /organizer-dashboard/comp-invitations/:invitationId

// Template application
POST   /organizer-dashboard/apply-ticket-template

// Pricing rule templates
GET    /organizer-dashboard/pricing-rule-templates
POST   /organizer-dashboard/events/:eventId/apply-pricing-template
```

**File**: `eventknit/server/src/routes/admin.routes.ts`

```typescript
// Template management
GET    /admin/ticket-type-templates
POST   /admin/ticket-type-templates
GET    /admin/ticket-type-templates/:templateId
DELETE /admin/ticket-type-templates/:templateId
GET    /admin/ticket-type-templates/:templateId/usage

GET    /admin/pricing-rule-templates
POST   /admin/pricing-rule-templates
```

**File**: `eventknit/server/src/routes/event.routes.ts` (public)

```typescript
// Validate invitation code before registration
POST /events/:eventId/validate-invitation-code
```

---

## Testing Requirements

### Unit Tests to Add

- [ ] Validate ticket type configuration (maxPerPerson, early bird, etc.)
- [ ] Validate invitation code generation and usage
- [ ] Validate complementary ticket registration flow
- [ ] Validate pricing rule application

### Integration Tests to Add

- [ ] Complete event creation with complementary tickets
- [ ] Complete registration with invitation code
- [ ] Verify early bird cutoff enforcement
- [ ] Verify max per person enforcement

### E2E Tests to Add

- [ ] Organizer creates event with complementary tickets
- [ ] Organizer generates and shares invitation codes
- [ ] Attendee registers with invitation code
- [ ] Admin applies template to event

---

## Implementation Order

### SPRINT 1 (Week 1-2): Core Complementary Ticket Flow

1. ✅ TicketsStep.tsx - Add isComplementary & requiresInvitation UI
2. ✅ event.validations.ts - Add validation rules
3. ✅ RegisterEvent.tsx - Add invitation code input
4. ✅ event.service.ts - Auto-generate invitations
5. ✅ New Endpoint - Generate complementary invitation codes

### SPRINT 2 (Week 3-4): Organizer Management

6. ✅ EventManagement.tsx - Show complementary ticket status
7. ✅ ComplementaryInvitationManager - Component for managing invitations
8. ✅ Endpoints - Get/update/delete invitations
9. ✅ Validate invitation code endpoint

### SPRINT 3 (Week 5-6): Admin Templates & Advanced Features

10. ✅ Ticket type templates service & endpoints
11. ✅ Admin template management UI
12. ✅ Template application endpoints
13. ✅ Pricing rule templates

### SPRINT 4 (Week 7-8): Polish & Testing

14. ✅ Complete test coverage
15. ✅ Email sending for invitations
16. ✅ Admin dashboard metrics
17. ✅ Documentation updates

---

## Quick Wins (Can do in parallel)

- Tier 1.1: Add isComplementary checkbox (30 mins)
- Tier 2.3: Show ticket restrictions in UI (1 hour)
- Tier 2.4: Add early bird countdown (1 hour)

---

## Definition of Done

- [ ] All TIER 1 items complete
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Code review passed
- [ ] E2E tests pass
- [ ] Works on all device sizes

