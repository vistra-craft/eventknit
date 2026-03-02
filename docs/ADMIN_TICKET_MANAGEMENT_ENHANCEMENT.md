# Admin Ticket Management Enhancement Plan

**Date**: March 2, 2026  
**Status**: ANALYSIS & PLANNING  
**Priority**: HIGH

---

## Executive Summary

The admin dashboard has **Advanced Ticket Types** and **Dynamic Pricing** pages, but they are **disconnected from event creation flow** and lack key features needed for organizers to:
1. Apply complementary tickets to events
2. Create ticket packages (bundles, groups, donations)
3. Configure dynamic pricing rules
4. Manage reserved seating
5. Enforce ticket type restrictions (VIP sections, early bird cutoffs, max per person)

**Gap**: Admin can manage these features, but there's **no way to apply them to organizer events** or have organizers configure them.

---

## Current State Analysis

### ✅ What Exists

#### Admin Pages
- **Advanced Ticket Types** (`/admin/tickets/advanced`)
  - Can create ticket packages (group, bundle, donation)
  - Can configure reserved seating
  - Organizer-scoped (per-event)

- **Dynamic Pricing** (`/admin/tickets/pricing`)
  - Can create pricing rules (time-based, demand-based, group discount, loyalty)
  - Rule priority management
  - Price calculator for preview

#### Event Creation Flow (`event.service.ts`)
- ✅ Validates complementary tickets (price must be 0)
- ✅ Validates discount tickets (originalPrice > currentPrice)
- ✅ Validates early bird date ranges
- ✅ Validates paid vs free event consistency
- ✅ Auto-generates invitation links for events
- ✅ Stores ticketTypes as JSON in Event record

#### Ticket Type Fields Supported
```typescript
ticketData: {
  name: string
  price: number
  quantity: number | null
  features: string[]
  originalPrice?: number              // For discounts
  discountLabel?: string
  isComplementary?: boolean
  requiresInvitation?: boolean
  availableFrom?: string              // Early bird start
  availableUntil?: string             // Early bird end
  description?: string
  maxPerPerson?: number
  minPerOrder?: number
  earlyBirdQuantity?: number
  salesChannel?: string               // DIRECT, API, AFFILIATE
  isHidden?: boolean                  // Hide from public registration
  nameLocked?: boolean                // Require attendee name entry
}
```

### ❌ Critical Gaps

#### 1. **No UI for Organizers to Configure Advanced Ticket Features**

Current organizer event creation/editing:
- Can add basic ticket types (name, price, quantity)
- **Cannot** add complementary tickets
- **Cannot** create ticket packages
- **Cannot** configure dynamic pricing
- **Cannot** set ticket restrictions (max per person, early bird dates, etc.)
- **Cannot** configure reserved seating

#### 2. **Admin Ticket Pages Are Disconnected from Event Creation**

- Admin pages allow CRUD on advanced features
- But NO integration with event creation wizard
- No way to assign admin-created packages to events
- No templating system to apply standards to multiple events

#### 3. **Complementary Ticket Workflow Incomplete**

Current flow:
```
Event Creation
  ├─ Can mark as isComplementary: true
  ├─ Validates price = 0
  └─ ❌ NO UI for organizer to create invitation links
  └─ ❌ NO UI for attendee to enter invitation code
  └─ ❌ NO UI to track invitation usage
```

#### 4. **Ticket Type Restrictions Not Enforced in UI**

Supported by backend but missing from UI:
- `maxPerPerson` - No validation in registration flow
- `minPerOrder` - No validation in registration flow
- `earlyBirdQuantity` - No countdown or "sold out" messaging
- `isHidden` - No hiding in registration UI
- `nameLocked` - No attendee name field in registration

#### 5. **No Way to Apply Pricing Rules to Events**

Backend supports:
- Dynamic pricing rules per event
- But organizers see no UI to apply them
- No price preview during registration
- No transparency about how final price is calculated

#### 6. **Organizer API Limited**

```typescript
// Organizer can:
- createPricingRule(eventId, rules)     ✅
- createTicketPackage(eventId, package) ✅
- getEventPricingRules(eventId)         ✅

// Organizer CANNOT:
- applyComplementaryTickets()           ❌
- configureTicketTypeRestrictions()     ❌
- createInvitationCodes()               ❌
- setEarlyBirdCutoff()                  ❌
```

---

## What Needs to Be Added

### Phase 1: Event Ticket Configuration Enhancement (PRIORITY: CRITICAL)

#### 1.1 Enhanced TicketsStep Component

**Goal**: Allow organizers to configure all ticket type features during event creation

```typescript
// Current: Basic name, price, quantity
// Needed: Add fields for:

interface EnhancedTicketTypeConfig {
  // Basic
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  
  // Advanced pricing
  originalPrice?: number;              // For discounts
  discountLabel?: string;
  isComplementary?: boolean;            // FREE comp tickets
  requiresInvitation?: boolean;
  
  // Early bird / Time-based
  availableFrom?: string;
  availableUntil?: string;
  earlyBirdQuantity?: number;
  
  // Restrictions
  maxPerPerson?: number;
  minPerOrder?: number;
  
  // Visibility & Registration
  isHidden?: boolean;
  nameLocked?: boolean;
  salesChannel?: 'DIRECT' | 'API' | 'AFFILIATE';
}
```

**UI Changes Needed**:
```tsx
<Tabs defaultValue="basic">
  <TabsList>
    <TabsTrigger value="basic">Basic Info</TabsTrigger>
    <TabsTrigger value="pricing">Pricing & Discounts</TabsTrigger>
    <TabsTrigger value="availability">Availability & Restrictions</TabsTrigger>
    <TabsTrigger value="complementary">Complementary / Invitations</TabsTrigger>
  </TabsList>
  
  <TabsContent value="basic">
    {/* Name, Description, Price, Quantity */}
  </TabsContent>
  
  <TabsContent value="pricing">
    {/* originalPrice, discountLabel, isComplementary toggle */}
    {/* Early bird: availableFrom, availableUntil, earlyBirdQuantity */}
  </TabsContent>
  
  <TabsContent value="availability">
    {/* maxPerPerson, minPerOrder, isHidden, nameLocked */}
  </TabsContent>
  
  <TabsContent value="complementary">
    {/* Show only when isComplementary = true */}
    {/* requiresInvitation toggle */}
    {/* Message: "Invitation links will be auto-generated. Share with speakers/staff." */}
  </TabsContent>
</Tabs>
```

#### 1.2 Event Creation Validation Enhancements

**Update**: `eventknit/server/src/validations/event.validations.ts`

```typescript
// Add validation for:
- If maxPerPerson < quantity, show warning
- If minPerOrder > maxPerOrder, show error
- If earlyBirdQuantity > total quantity, show error
- If isComplementary but minPerOrder > 0, warning
```

#### 1.3 Organizer Event Management Page

**Update**: Organizer dashboard to show ticket configuration status:

```tsx
// In EventManagement.tsx or event detail page, show:
{ticketType.isComplementary && (
  <Badge className="bg-amber-100">🎁 Complementary</Badge>
)}

{ticketType.maxPerPerson && (
  <Badge variant="outline">Max {ticketType.maxPerPerson}/person</Badge>
)}

{ticketType.availableFrom && (
  <p className="text-sm">
    Early Bird: {new Date(ticketType.availableFrom).toLocaleDateString()} -  
    {new Date(ticketType.availableUntil).toLocaleDateString()}
  </p>
)}

{ticketType.isHidden && (
  <Badge variant="secondary">Hidden from public registration</Badge>
)}
```

---

### Phase 2: Admin Ticket Management Integration

#### 2.1 Admin Pages Should Apply to Events

**Problem**: Admin can create packages/pricing rules but organizers can't discover them

**Solution 1 - Template/Preset System**:
```typescript
// Allow admins to create reusable ticket type templates
POST /admin/ticket-type-templates
{
  name: "Standard Theater Seating",
  description: "VIP + General + Budget sections",
  ticketTypes: [
    {
      name: "VIP Orchestra",
      price: 150,
      description: "Front 10 rows",
      maxPerPerson: 4,
      nameLocked: true
    },
    {
      name: "General Admission",
      price: 75,
      maxPerPerson: 6
    },
    {
      name: "Student",
      price: 40,
      maxPerPerson: 2,
      requiresInvitation: true,
      description: "Valid student ID required"
    }
  ]
}
```

Then organizers can select template during event creation.

**Solution 2 - Industry Standard Packages**:
Admin pages show pre-configured packages for:
- Theater events (Orchestra, Mezzanine, Balcony)
- Conferences (Standard, VIP, Speaker)
- Sports (Courtside, Lower Bowl, Upper Bowl)
- Concerts (General, VIP, Presale)

---

#### 2.2 Enhanced Admin Advanced Ticket Types Page

**Currently**: Can only manage packages after event exists

**Needed**:
- Create ticket type TEMPLATES (not tied to specific event)
- Apply template to event during creation
- Bulk apply templates to multiple events
- Show usage statistics (how many events using each template)

```tsx
// New Admin Page: /admin/tickets/templates
{/* Show reusable ticket templates */}
{/* Allow preview before applying to event */}
{/* Show which events using each template */}
```

---

### Phase 3: Organizer Registration Flow Enhancement

#### 3.1 Registration Form Improvements

**Current**: All ticket types displayed same way

**Needed**:
```tsx
{/* For each ticket type: */}

{ticketType.isComplementary ? (
  <>
    <Badge className="bg-amber-100">FREE 🎁</Badge>
    {ticketType.requiresInvitation && (
      <p className="text-sm text-amber-700">
        Invitation required. 
        <Button variant="link">Enter invitation code</Button>
      </p>
    )}
  </>
) : (
  <Badge>{formatCurrency(ticketType.price)}</Badge>
)}

{/* Show restrictions */}
{ticketType.maxPerPerson && (
  <p className="text-xs text-muted-foreground">
    Max {ticketType.maxPerPerson} per person
  </p>
)}

{/* Show early bird status */}
{ticketType.availableUntil && (
  <p className="text-xs text-orange-600">
    Early bird ends: {new Date(ticketType.availableUntil).toLocaleDateString()}
  </p>
)}

{/* Show if sold out */}
{ticketType.earlyBirdQuantity === 0 && (
  <Badge variant="destructive">Early bird sold out</Badge>
)}
```

#### 3.2 Invitation Code Entry Modal

```tsx
// New component: InvitationCodeModal

{/* If selecting complementary ticket with requiresInvitation */}

<Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enter Invitation Code</DialogTitle>
      <DialogDescription>
        This is an invitation-only ticket type.
        Enter the code provided to you.
      </DialogDescription>
    </DialogHeader>
    
    <Input
      placeholder="INVITE-XXXX-XXXX-XXXX"
      value={invitationCode}
      onChange={(e) => setInvitationCode(e.target.value)}
    />
    
    <Button onClick={validateAndSelectTicket}>
      Validate & Continue
    </Button>
  </DialogContent>
</Dialog>
```

---

### Phase 4: API & Service Layer Updates

#### 4.1 New Organizer APIs

```typescript
// 1. Get ticket type templates (for UI dropdown)
GET /organizer-dashboard/ticket-type-templates
Response: {
  templates: [
    {
      id: string;
      name: string;
      description: string;
      ticketTypes: TicketTypeConfig[];
    }
  ]
}

// 2. Apply template to event
POST /organizer-dashboard/events/:eventId/apply-ticket-template
{
  templateId: string;  // or inline ticketTypes array
}

// 3. Validate ticket configuration
POST /organizer-dashboard/events/:eventId/validate-ticket-config
{
  ticketTypes: TicketTypeConfig[];
}
Response: {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// 4. Create invitation codes for complementary tickets
POST /organizer-dashboard/events/:eventId/create-invitations
{
  ticketTypeName: string;
  quantity: number;
  recipientEmails?: string[];
}
Response: {
  invitations: [{
    code: string;
    link: string;
    email?: string;
  }]
}

// 5. Get complementary ticket usage
GET /organizer-dashboard/events/:eventId/complementary-usage
Response: {
  ticketType: string;
  created: number;
  claimed: number;
  remaining: number;
  invitations: [{
    code: string;
    email: string;
    claimedAt: string | null;
    claimedBy: string | null;
  }]
}
```

#### 4.2 New Admin APIs

```typescript
// 1. Create ticket type template
POST /admin/ticket-type-templates
{
  name: string;
  description: string;
  ticketTypes: TicketTypeConfig[];
  category: 'THEATER' | 'CONFERENCE' | 'SPORTS' | 'CONCERT' | 'OTHER';
}

// 2. Apply template to event (admin action)
POST /admin/events/:eventId/apply-ticket-template
{
  templateId: string;
  override: boolean;  // If true, replace existing ticket types
}

// 3. Bulk apply template to multiple events
POST /admin/apply-ticket-template-bulk
{
  templateId: string;
  eventIds: string[];
}

// 4. View template usage
GET /admin/ticket-type-templates/:templateId/usage
Response: {
  template: TicketTypeTemplate;
  events: [{
    eventId: string;
    eventTitle: string;
    appliedAt: string;
  }]
}

// 5. Create/manage pricing rule templates
POST /admin/pricing-rule-templates
{
  name: string;
  description: string;
  rules: DynamicPricingRule[];
  category: 'EARLY_BIRD' | 'DEMAND_BASED' | 'GROUP' | 'LOYALTY' | 'OTHER';
}
```

---

## Implementation Priority

### MUST HAVE (Block organizers from using platform effectively)
1. ✅ Event ticket configuration UI (maxPerPerson, early bird dates, restrictions)
2. ✅ Complementary ticket UI with invitation code entry
3. ✅ Invitation generation for organizers
4. ✅ Price preview during registration

### SHOULD HAVE (Improve admin/organizer experience)
1. Admin ticket type templates
2. Bulk apply templates to events
3. Registration form shows restrictions & early bird status
4. Complementary ticket usage tracking
5. Admin dashboard shows ticket type recommendations

### NICE TO HAVE (Future)
1. AI suggestions for pricing rules based on event type
2. A/B testing different ticket types
3. Seat allocation based on ticket tier
4. Automatic discounting based on demand

---

## Quick Wins (Easy to Implement)

### 1. Add Complementary Ticket Checkbox to TicketsStep
**Time**: 30 mins  
**Impact**: MEDIUM  
**Code**:
```tsx
<FormField
  control={form.control}
  name={`ticketTypes.${index}.isComplementary`}
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Complementary Ticket</FormLabel>
        <FormDescription>
          Mark this as a free complementary ticket (e.g., for speakers, press)
        </FormDescription>
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
```

### 2. Show Ticket Restrictions in Event Details
**Time**: 45 mins  
**Impact**: HIGH  
**Code**: Update EventManagement.tsx ticket display

### 3. Add Early Bird Indicator to Registration
**Time**: 1 hour  
**Impact**: MEDIUM  
**Code**: Update ticket selection UI in RegisterEvent.tsx

### 4. Create Invitation Generation Button for Organizers
**Time**: 2 hours  
**Impact**: HIGH  
**Code**: Add to event detail page + new endpoint

---

## Summary of Missing Pieces

| Feature | Status | Backend | Frontend | Blocker |
|---------|--------|---------|----------|---------|
| Complementary tickets | Partial | ✅ | ❌ UI missing | YES |
| Early bird dates | Partial | ✅ | ❌ UI missing | YES |
| Max per person | Partial | ✅ | ❌ No validation | NO |
| Ticket packages | Partial | ✅ Admin | ❌ Organizer UI missing | YES |
| Dynamic pricing | Partial | ✅ | ✅ Organizer has UI | NO |
| Invitation codes | Partial | ✅ | ❌ Generation/tracking missing | YES |
| Price preview | NO | ✅ | ❌ No UI display | NO |
| Ticket templates | NO | ❌ | ❌ | NO |

---

## Recommendations

**IMMEDIATE (This Week)**:
1. Add complementary ticket UI to TicketsStep
2. Add invitation code input to registration flow
3. Add early bird date fields to TicketsStep
4. Create invitation generation endpoint + UI

**SHORT TERM (Next Sprint)**:
1. Add max per person validation to registration
2. Show ticket restrictions in registration UI
3. Create ticket type templates (admin)
4. Price preview calculator in registration
5. Complementary ticket usage dashboard

**MEDIUM TERM (Q2)**:
1. Bulk apply templates to events
2. AI pricing recommendations
3. Seat allocation by ticket tier
4. Transfer controls per ticket type

