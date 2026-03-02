# Ticket Types Implementation Strategy: Prioritized Roadmap

**Status**: PHASE-BASED IMPLEMENTATION GUIDE  
**Scope**: What to build first vs later, with exact file changes and database migrations  
**Timeline**: 12 weeks (3 phases of 4 weeks each)

---

## IMPLEMENTATION STRATEGY: Three Phases

### Why This Order?

1. **FOUNDATION** (Bundles + Visibility + Categories) - Enables most common use cases
2. **INTEGRATION** (Seating + Dynamic Pricing) - Supports theater/sports/conferences
3. **SCALE** (Transfer/Resale + Enterprise) - Unlock premium features + revenue

This order ensures each phase builds on the previous without rework.

---

## PHASE 1: FOUNDATION (Weeks 1-4)

### Goal
Support bundled tickets, category organization, and visibility control. Enables: Festivals, Conferences, Simple Theater.

### What Changes

#### 1.1 Database Schema Migration

**File**: Create new migration `eventknit/server/prisma/migrations/[timestamp]_add_ticket_bundles_and_visibility/migration.sql`

```sql
-- Create TicketType table (normalize from JSON)
CREATE TABLE "TicketType" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general_admission',
  
  -- Pricing
  "price" DECIMAL(10, 2),
  "originalPrice" DECIMAL(10, 2),
  "discountLabel" TEXT,
  
  -- Inventory
  "totalQuantity" INTEGER,
  "soldQuantity" INTEGER DEFAULT 0,
  "type" TEXT DEFAULT 'paid',
  
  -- Restrictions
  "maxPerPerson" INTEGER,
  "minPerOrder" INTEGER,
  
  -- Dates
  "availableFrom" TIMESTAMP(3),
  "availableUntil" TIMESTAMP(3),
  
  -- Visibility & Control
  "isVisible" BOOLEAN DEFAULT true,
  "isHidden" BOOLEAN DEFAULT false,
  "visibilityRules" JSONB,
  
  -- Complementary & Transfer
  "isComplementary" BOOLEAN DEFAULT false,
  "requiresInvitation" BOOLEAN DEFAULT false,
  "nameLocked" BOOLEAN DEFAULT false,
  "transferAllowed" BOOLEAN DEFAULT true,
  "resaleAllowed" BOOLEAN DEFAULT true,
  
  -- Sales Channel
  "salesChannel" TEXT DEFAULT 'online',
  
  -- Seating (for Phase 2, nullable for now)
  "hasAssignedSeating" BOOLEAN DEFAULT false,
  "seatMapId" TEXT,
  "seatPricingRules" JSONB,
  
  -- Add-ons (array of objects)
  "addOns" JSONB,
  
  -- Audit
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "TicketType_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE
);

CREATE INDEX "TicketType_eventId_idx" ON "TicketType"("eventId");
CREATE INDEX "TicketType_category_idx" ON "TicketType"("category");
CREATE INDEX "TicketType_isVisible_idx" ON "TicketType"("isVisible");

-- Create TicketBundle table
CREATE TABLE "TicketBundle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "benefits" TEXT[] DEFAULT '{}',
  
  -- Components: parallel arrays
  "ticketTypeIds" TEXT[] NOT NULL,
  "quantities" INTEGER[] NOT NULL,
  
  -- Pricing
  "bundlePrice" DECIMAL(10, 2) NOT NULL,
  "totalSeparatePrice" DECIMAL(10, 2),
  
  -- Inventory
  "totalQuantity" INTEGER NOT NULL,
  "soldQuantity" INTEGER DEFAULT 0,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "TicketBundle_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE
);

CREATE INDEX "TicketBundle_eventId_idx" ON "TicketBundle"("eventId");
```

**Prisma Schema Update**: `eventknit/server/prisma/schema.prisma`

```prisma
// Add to Event model
model Event {
  // ... existing fields ...
  
  // Phase 1: New fields
  ticketTypesNew    TicketType[]    @relation("EventTicketTypes")
  ticketBundles     TicketBundle[]  @relation("EventTicketBundles")
  
  // Keep old JSON field for backward compatibility
  ticketTypes       Json?           // Legacy - migrate over time
}

// New TicketType model
model TicketType {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation("EventTicketTypes", fields: [eventId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  category    String   @default("general_admission") // general_admission, vip, early_bird, student, donation, workshop, other
  
  // Pricing
  price       Decimal  @db.Decimal(10, 2)
  originalPrice Decimal? @db.Decimal(10, 2)
  discountLabel String?
  
  // Inventory
  totalQuantity Int?
  soldQuantity  Int     @default(0)
  type          String  @default("paid")
  
  // Restrictions
  maxPerPerson  Int?
  minPerOrder   Int?
  
  // Dates
  availableFrom DateTime?
  availableUntil DateTime?
  
  // Visibility & Control
  isVisible     Boolean @default(true)
  isHidden      Boolean @default(false)   // Deprecated (use isVisible)
  visibilityRules Json?  // { hideWhenSoldOut: bool, showWhenQuantityAbove: number, etc }
  
  // Complementary & Transfer
  isComplementary Boolean @default(false)
  requiresInvitation Boolean @default(false)
  nameLocked    Boolean @default(false)
  transferAllowed Boolean @default(true)
  resaleAllowed Boolean @default(true)
  
  // Sales Channel
  salesChannel  String  @default("online")
  
  // Seating (Phase 2 - nullable for now)
  hasAssignedSeating Boolean @default(false)
  seatMapId     String?
  seatPricingRules Json?
  
  // Add-ons (Phase 2)
  addOns        Json?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  registrations EventRegistration[]
  
  @@index([eventId])
  @@index([category])
  @@index([isVisible])
}

// New TicketBundle model
model TicketBundle {
  id              String   @id @default(cuid())
  eventId         String
  event           Event    @relation("EventTicketBundles", fields: [eventId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  imageUrl        String?
  benefits        String[]
  
  // Components (parallel arrays - ticketTypeIds[0] has quantity quantities[0])
  ticketTypeIds   String[]
  quantities      Int[]
  
  // Pricing
  bundlePrice     Decimal  @db.Decimal(10, 2)
  totalSeparatePrice Decimal? @db.Decimal(10, 2)
  
  // Inventory
  totalQuantity   Int
  soldQuantity    Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([eventId])
}
```

#### 1.2 Update Event Creation Service

**File**: `eventknit/server/src/services/event.service.ts`

**Changes in `createEvent()` method** (around line 200-400):

```typescript
// OLD: Store ticket types as JSON only
const ticketTypesJson = ticketTypes?.map(ticket => ({
  name: ticket.name,
  price: ticket.price,
  // ... rest of fields
}));

// NEW: Store BOTH as JSON (legacy) and in TicketType table (new)
const createdEvent = await prisma.event.create({
  data: {
    // ... existing fields
    ticketTypes: ticketTypesJson,  // Keep for backward compatibility
    // NEW: Also create TicketType records
    ticketTypesNew: {
      createMany: {
        data: (ticketTypes || []).map(ticket => ({
          name: ticket.name,
          description: ticket.description,
          category: this.detectCategory(ticket.name), // Auto-detect category
          price: parseFloat(ticket.price),
          originalPrice: ticket.originalPrice ? parseFloat(ticket.originalPrice) : null,
          discountLabel: ticket.discountLabel,
          totalQuantity: ticket.quantity ? parseInt(ticket.quantity) : null,
          type: ticket.type || 'paid',
          maxPerPerson: ticket.maxPerPerson,
          minPerOrder: ticket.minPerOrder,
          isComplementary: ticket.isComplementary,
          requiresInvitation: ticket.requiresInvitation,
          availableFrom: ticket.availableFrom ? new Date(ticket.availableFrom) : null,
          availableUntil: ticket.availableUntil ? new Date(ticket.availableUntil) : null,
          nameLocked: ticket.nameLocked,
          salesChannel: ticket.salesChannel,
          isVisible: !ticket.isHidden,  // Convert isHidden to isVisible
        })),
      },
    },
  },
});

// NEW: Helper method to detect category from ticket name
private detectCategory(ticketName: string): string {
  const name = ticketName.toLowerCase();
  if (name.includes('vip') || name.includes('premium')) return 'vip';
  if (name.includes('early')) return 'early_bird';
  if (name.includes('student')) return 'student';
  if (name.includes('donation')) return 'donation';
  if (name.includes('workshop') || name.includes('session')) return 'workshop';
  return 'general_admission';
}
```

#### 1.3 Create New Services

**File**: `eventknit/server/src/services/ticket-type.service.ts` (NEW)

```typescript
import { prisma } from '../config/database.js';
import { EventNotFoundError, ValidationError } from '../utils/errors.js';

export class TicketTypeService {
  
  async createTicketType(eventId: string, organizerId: string, data: any) {
    // Verify event exists and user can edit
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });
    
    if (!event) throw new EventNotFoundError();
    if (event.organizerId !== organizerId) throw new AuthorizationError();
    
    // Validate
    if (data.category && !['general_admission', 'vip', 'early_bird', 'student', 'donation', 'workshop', 'other'].includes(data.category)) {
      throw new ValidationError('Invalid category');
    }
    
    return await prisma.ticketType.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        category: data.category || 'general_admission',
        price: data.price,
        originalPrice: data.originalPrice,
        discountLabel: data.discountLabel,
        totalQuantity: data.quantity,
        type: data.type || 'paid',
        maxPerPerson: data.maxPerPerson,
        minPerOrder: data.minPerOrder,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
        isComplementary: data.isComplementary,
        requiresInvitation: data.requiresInvitation,
        isVisible: data.isVisible !== false,
        visibilityRules: data.visibilityRules,
        transferAllowed: data.transferAllowed !== false,
        resaleAllowed: data.resaleAllowed !== false,
        salesChannel: data.salesChannel,
      },
    });
  }
  
  async getEventTicketTypes(eventId: string) {
    return await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }
  
  async updateTicketType(ticketTypeId: string, organizerId: string, data: any) {
    // Verify ownership
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: { select: { organizerId: true } } },
    });
    
    if (!ticketType || ticketType.event.organizerId !== organizerId) {
      throw new AuthorizationError();
    }
    
    return await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        name: data.name ?? ticketType.name,
        description: data.description ?? ticketType.description,
        category: data.category ?? ticketType.category,
        price: data.price ?? ticketType.price,
        totalQuantity: data.quantity ?? ticketType.totalQuantity,
        isVisible: data.isVisible ?? ticketType.isVisible,
        visibilityRules: data.visibilityRules ?? ticketType.visibilityRules,
      },
    });
  }
  
  async deleteTicketType(ticketTypeId: string, organizerId: string) {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: { select: { organizerId: true } } },
    });
    
    if (!ticketType || ticketType.event.organizerId !== organizerId) {
      throw new AuthorizationError();
    }
    
    return await prisma.ticketType.delete({
      where: { id: ticketTypeId },
    });
  }
}

export const ticketTypeService = new TicketTypeService();
```

**File**: `eventknit/server/src/services/ticket-bundle.service.ts` (NEW)

```typescript
import { prisma } from '../config/database.js';

export class TicketBundleService {
  
  async createBundle(eventId: string, organizerId: string, data: {
    name: string;
    description?: string;
    ticketTypeIds: string[];  // [id1, id2, id3]
    quantities: number[];      // [1, 2, 1]
    bundlePrice: number;
    totalQuantity: number;
    benefits?: string[];
  }) {
    // Verify all ticket types belong to this event
    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        id: { in: data.ticketTypeIds },
        eventId: eventId,
      },
    });
    
    if (ticketTypes.length !== data.ticketTypeIds.length) {
      throw new ValidationError('Some ticket types not found in this event');
    }
    
    // Calculate total separate price
    const totalSeparatePrice = data.ticketTypeIds.reduce((total, id, idx) => {
      const ticketType = ticketTypes.find(t => t.id === id);
      return total + (ticketType?.price * data.quantities[idx] || 0);
    }, 0);
    
    return await prisma.ticketBundle.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        ticketTypeIds: data.ticketTypeIds,
        quantities: data.quantities,
        bundlePrice: data.bundlePrice,
        totalSeparatePrice,
        totalQuantity: data.totalQuantity,
        benefits: data.benefits || [],
      },
    });
  }
  
  async getEventBundles(eventId: string) {
    return await prisma.ticketBundle.findMany({
      where: { eventId },
    });
  }
}
```

#### 1.4 Update API Routes

**File**: `eventknit/server/src/routes/organizer-dashboard.routes.ts`

Add new routes:

```typescript
// Ticket Types
router.post(
  '/events/:eventId/ticket-types',
  authenticate,
  validate(ticketTypeCreateSchema),
  async (req, res) => {
    try {
      const ticketType = await ticketTypeService.createTicketType(
        req.params.eventId,
        req.user.id,
        req.body
      );
      res.json({ success: true, data: ticketType });
    } catch (error) {
      // ... error handling
    }
  }
);

router.get(
  '/events/:eventId/ticket-types',
  authenticate,
  async (req, res) => {
    try {
      const ticketTypes = await ticketTypeService.getEventTicketTypes(
        req.params.eventId
      );
      res.json({ success: true, data: ticketTypes });
    } catch (error) {
      // ... error handling
    }
  }
);

router.put(
  '/ticket-types/:ticketTypeId',
  authenticate,
  validate(ticketTypeUpdateSchema),
  async (req, res) => {
    try {
      const ticketType = await ticketTypeService.updateTicketType(
        req.params.ticketTypeId,
        req.user.id,
        req.body
      );
      res.json({ success: true, data: ticketType });
    } catch (error) {
      // ... error handling
    }
  }
);

router.delete(
  '/ticket-types/:ticketTypeId',
  authenticate,
  async (req, res) => {
    try {
      await ticketTypeService.deleteTicketType(
        req.params.ticketTypeId,
        req.user.id
      );
      res.json({ success: true });
    } catch (error) {
      // ... error handling
    }
  }
);

// Ticket Bundles
router.post(
  '/events/:eventId/ticket-bundles',
  authenticate,
  validate(ticketBundleCreateSchema),
  async (req, res) => {
    try {
      const bundle = await ticketBundleService.createBundle(
        req.params.eventId,
        req.user.id,
        req.body
      );
      res.json({ success: true, data: bundle });
    } catch (error) {
      // ... error handling
    }
  }
);

router.get(
  '/events/:eventId/ticket-bundles',
  authenticate,
  async (req, res) => {
    try {
      const bundles = await ticketBundleService.getEventBundles(
        req.params.eventId
      );
      res.json({ success: true, data: bundles });
    } catch (error) {
      // ... error handling
    }
  }
);
```

#### 1.5 Update Event Creation UI

**File**: `eventknit/client/src/components/event-wizard/TicketsStep.tsx`

Major changes:

```typescript
// 1. Add category field to ticket type form
const addTicketType = () => {
  const newTicket: TicketType = {
    id: Date.now(),
    name: '',
    type: 'paid',
    price: '0',
    quantity: '1',
    category: 'general_admission',  // NEW
    isVisible: true,                 // NEW
    transferAllowed: true,           // NEW
    visibilityRules: {},             // NEW
  };
  setTicketTypes([...ticketTypes, newTicket]);
};

// 2. Update ticket form rendering
return (
  <div className="space-y-6">
    {ticketTypes.map((ticket, index) => (
      <Card key={ticket.id} className="p-6">
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ticket Name"
              value={ticket.name}
              onChange={(val) => updateTicket(index, 'name', val)}
            />
            {/* NEW: Category selector */}
            <Select
              label="Category"
              value={ticket.category || 'general_admission'}
              options={[
                { value: 'general_admission', label: 'General Admission' },
                { value: 'vip', label: 'VIP / Premium' },
                { value: 'early_bird', label: 'Early Bird' },
                { value: 'student', label: 'Student / Concession' },
                { value: 'donation', label: 'Donation / Pay What You Want' },
                { value: 'workshop', label: 'Workshop / Session' },
                { value: 'other', label: 'Other' },
              ]}
              onChange={(val) => updateTicket(index, 'category', val)}
            />
          </div>

          {/* Pricing Tab */}
          <Tabs>
            <Tab label="Pricing">
              {/* Price, originalPrice, discountLabel */}
            </Tab>
            
            <Tab label="Availability">
              {/* Quantity, availableFrom, availableUntil, earlyBirdQuantity */}
            </Tab>
            
            <Tab label="Advanced">
              {/* NEW: Visibility Rules */}
              <Checkbox
                label="Show this ticket"
                checked={ticket.isVisible !== false}
                onChange={(val) => updateTicket(index, 'isVisible', val)}
              />
              
              <Checkbox
                label="Hide when sold out"
                checked={ticket.visibilityRules?.hideWhenSoldOut}
                onChange={(val) => 
                  updateTicket(index, 'visibilityRules', {
                    ...ticket.visibilityRules,
                    hideWhenSoldOut: val
                  })
                }
              />
              
              <Checkbox
                label="Allow attendees to transfer this ticket"
                checked={ticket.transferAllowed !== false}
                onChange={(val) => updateTicket(index, 'transferAllowed', val)}
              />
            </Tab>
          </Tabs>
        </div>
      </Card>
    ))}

    {/* NEW: Bundle section */}
    <Card className="border-dashed">
      <h3 className="text-lg font-semibold mb-4">Ticket Bundles</h3>
      <p className="text-sm text-gray-600 mb-4">
        Combine multiple tickets at a discount (e.g., "VIP Package" = VIP Ticket + Parking)
      </p>
      
      {bundles.map((bundle, idx) => (
        <div key={bundle.id} className="p-4 border rounded mb-3">
          <Input label="Bundle Name" value={bundle.name} />
          {/* Multi-select for ticket types and quantities */}
        </div>
      ))}
      
      <Button onClick={() => addBundle()}>+ Add Bundle</Button>
    </Card>
  </div>
);
```

#### 1.6 Add Validation Schemas

**File**: `eventknit/server/src/validations/ticket-type.validations.ts` (NEW)

```typescript
import Joi from 'joi';

export const ticketTypeCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string().valid('general_admission', 'vip', 'early_bird', 'student', 'donation', 'workshop', 'other'),
  price: Joi.number().min(0),
  originalPrice: Joi.number().optional(),
  quantity: Joi.number().required(),
  type: Joi.string().valid('paid', 'free').required(),
  isComplementary: Joi.boolean().optional(),
  requiresInvitation: Joi.boolean().optional(),
  maxPerPerson: Joi.number().optional(),
  minPerOrder: Joi.number().optional(),
  isVisible: Joi.boolean().optional(),
  transferAllowed: Joi.boolean().optional(),
  visibilityRules: Joi.object().optional(),
});

export const ticketBundleCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  ticketTypeIds: Joi.array().items(Joi.string()).required(),
  quantities: Joi.array().items(Joi.number()).required(),
  bundlePrice: Joi.number().required(),
  totalQuantity: Joi.number().required(),
  benefits: Joi.array().items(Joi.string()).optional(),
});
```

---

### PHASE 1 Testing

**Tests to Add**:

1. `ticket-type.service.test.ts` - Create, update, delete, list
2. `ticket-bundle.service.test.ts` - Bundle creation with validation
3. `event.service.test.ts` - Update createEvent to test new TicketType storage
4. `TicketsStep.test.tsx` - Category selector, bundle form

### PHASE 1 Timeline
- **Days 1-2**: Database migration, Prisma schema
- **Days 3-4**: Create services + routes
- **Days 5-7**: Update event creation service
- **Days 8**: UI updates (category, bundles)
- **Days 9-10**: Testing, documentation

---

## PHASE 2: INTEGRATION & SEATING (Weeks 5-8)

### Goal
Connect seating system to pricing, integrate dynamic pricing, add add-ons.

### Key Changes
1. Link TicketType to SeatMap (seating system)
2. Add section-based pricing rules
3. Create add-on system (parking, merchandise, upgrades)
4. Integrate DynamicPricingRule

**(See detailed Phase 2 plan in separate document)**

---

## PHASE 3: SCALE & TRANSFER (Weeks 9-12)

### Goal
Resale marketplace, transfer workflows, enterprise features.

### Key Changes
1. TicketTransfer model and workflow
2. TicketResale marketplace
3. Corporate block ticketing
4. Admin presets/templates

**(See detailed Phase 3 plan in separate document)**

---

## Migration Strategy: Old JSON → New Tables

### Step 1: Dual-Write (Week 1-2)
During `createEvent()`, write to both:
- `Event.ticketTypes` (legacy JSON)
- `Event.ticketTypesNew` (new normalized)

### Step 2: Migration Queries (Week 3)
```typescript
// Background job to migrate old events
async function migrateOldTicketTypes() {
  const eventsWithOldTickets = await prisma.event.findMany({
    where: { ticketTypes: { not: null } },
  });
  
  for (const event of eventsWithOldTickets) {
    const ticketTypesJson = event.ticketTypes as any[];
    if (!ticketTypesJson || ticketTypesJson.length === 0) continue;
    
    await prisma.ticketType.createMany({
      data: ticketTypesJson.map(t => ({
        eventId: event.id,
        name: t.name,
        category: detectCategory(t.name),
        price: t.price,
        // ... rest of fields
      })),
    });
  }
}
```

### Step 3: Dual-Read (Week 4)
When fetching tickets, try new table first:
```typescript
const ticketTypes = await prisma.ticketType.findMany({
  where: { eventId: eventId },
});

if (ticketTypes.length === 0) {
  // Fall back to JSON for unmigrated events
  const legacyTickets = event.ticketTypes as any[];
  // Convert to TicketType format
}
```

### Step 4: Cleanup (Later)
After 100% migration, remove JSON field from Event model.

---

## Rollout Plan

### Week 1: Internal Testing
- Developers only
- Test new schema, services, routes
- Verify backward compatibility

### Week 2: Beta Testing
- Small subset of organizers
- Flag: `BETA_NEW_TICKET_TYPES=true`
- Collect feedback

### Week 3: Gradual Rollout
- 25% of new events use new system
- Monitor for errors
- 48 hours observation

### Week 4: Full Rollout
- 100% of new events use new system
- Migrate existing events in background
- Monitor performance

---

## Success Criteria

- ✅ All Phase 1 features working
- ✅ No performance degradation
- ✅ Backward compatibility maintained
- ✅ 95%+ test coverage
- ✅ Documentation complete
- ✅ Zero data loss during migration

---

## Risk Mitigation

### Risk: Complexity introduces bugs
**Mitigation**: Comprehensive test suite, gradual rollout, feature flags

### Risk: Data loss during migration
**Mitigation**: Backup old JSON, dual-write during transition, validation checks

### Risk: Performance issues with new tables
**Mitigation**: Proper indexing, query optimization, monitoring

### Risk: Organizers confused by new categories
**Mitigation**: Auto-detect categories, provide templates, good UX

---

## File Checklist

### Phase 1 Files to Create/Modify

**Backend**:
- [ ] `prisma/migrations/[timestamp]_add_ticket_types_bundles/migration.sql`
- [ ] `prisma/schema.prisma` - Add TicketType, TicketBundle models
- [ ] `services/ticket-type.service.ts` (NEW)
- [ ] `services/ticket-bundle.service.ts` (NEW)
- [ ] `routes/organizer-dashboard.routes.ts` - Add ticket/bundle endpoints
- [ ] `validations/ticket-type.validations.ts` (NEW)
- [ ] `services/event.service.ts` - Update createEvent()

**Frontend**:
- [ ] `components/event-wizard/TicketsStep.tsx` - Add category, bundles, visibility
- [ ] `lib/validations/event.ts` - Update schemas
- [ ] `lib/event-api.ts` - Add new API functions

**Tests**:
- [ ] `services/__tests__/ticket-type.service.test.ts`
- [ ] `services/__tests__/ticket-bundle.service.test.ts`
- [ ] `components/__tests__/TicketsStep.test.tsx`

**Documentation**:
- [ ] Update EVENT_CREATION_GUIDE.md
- [ ] Add TICKET_TYPES_GUIDE.md (organizer documentation)

---

## Conclusion

This Phase 1 implementation gives you:

✅ **Category organization** - Organize tickets by type  
✅ **Ticket bundles** - Sell multiple tickets together  
✅ **Visibility control** - Hide/show tickets conditionally  
✅ **Transfer control** - Enable/disable transfers per type  
✅ **Foundation** - Ready for seating + dynamic pricing in Phase 2  

**Total effort**: ~40 hours  
**Timeline**: 2-3 weeks with 2-3 developers  
**Blockers**: None (can ship independently)

