# Ticket Types: Industry Standards vs Current Implementation

**Document Date**: March 2, 2026  
**Analysis Type**: Comprehensive industry comparison with implementation roadmap  
**Status**: STRATEGIC ANALYSIS - Not all recommendations require implementation

---

## Executive Summary

Your current ticket type implementation is **solid but incomplete**. You have:
- ✅ **Good foundation**: Basic ticket type structure with price, quantity, sales channels
- ✅ **Advanced features started**: Complementary tickets, early bird, limits per person
- ⚠️ **Major gaps**: No bundles/packages, no dynamic pricing, no transfers/resales, no visibility controls
- ❌ **Missing strategic features**: No ticket categories, no assigned seating integration, no dynamic inventory

### What Eventbrite, Ticketmaster, and others do differently:
1. **Ticket Bundling** - Sell multiple tickets together at discount
2. **Tiered Pricing** - Same ticket type at different prices for different tiers of users
3. **Assigned Seating** - Link tickets to specific seats
4. **Inventory Management** - Real-time availability, overselling protection
5. **Resale Marketplace** - Secondary market for tickets
6. **Dynamic Availability** - Tickets appear/disappear based on rules
7. **Visibility Controls** - Hide until certain conditions are met
8. **Transfer Restrictions** - Prevent or allow transfers after purchase

---

## PART 1: Current Implementation Analysis

### What You Have

**Current TicketType Structure** (in schema and form):
```typescript
interface TicketType {
  id: number;
  name: string;
  description?: string;
  type: 'free' | 'paid';
  price: string;
  originalPrice?: string;           // For discounts
  discountLabel?: string;           // "Early Bird", "VIP", etc
  quantity: string;                 // Total capacity
  maxPerPerson?: number;            // Per-person limit
  minPerOrder?: number;             // Minimum per order
  isComplementary?: boolean;        // Free ticket
  requiresInvitation?: boolean;     // Comp tickets need code
  availableFrom?: string;           // Sales start date
  availableUntil?: string;          // Sales end date
  earlyBirdQuantity?: string;       // Limited early bird quantity
  salesChannel?: 'online' | 'door' | 'both';
  isHidden?: boolean;               // Hidden from public listing
  nameLocked?: boolean;             // Non-transferable
}
```

**Database Storage**: `Event.ticketTypes` as JSON array (not normalized)

**Validation Rules**:
- ✅ Complementary tickets must have price = 0
- ✅ Discount price validation (originalPrice > currentPrice)
- ✅ Early bird date range validation
- ✅ Free vs paid event rules

**Missing Validations**:
- ❌ No bundle/package validation
- ❌ No seating configuration validation
- ❌ No inventory overselling protection
- ❌ No visibility rule validation

### Related Features (In Different Services)

**AdvancedTicketTypesService** (`admin/tickets/AdminAdvancedTicketTypes.tsx`):
- TicketPackage model: group, bundle, donation types
- ReservedSeating per package
- Currently disconnected from main TicketType system

**DynamicPricingService** (`admin/tickets/AdminDynamicPricing.tsx`):
- 4 rule types: time-based, demand-based, group discount, loyalty
- Can adjust prices but not visibility/availability
- Currently disconnected from main TicketType system

**Current Problem**: These are separate admin pages managing different models, not integrated into core ticket type flow.

---

## PART 2: Industry Standards Breakdown

### Eventbrite's Ticket Types (What they offer)

**Ticket Classification**:
1. **General Admission** - Standard ticket for entry
2. **VIP/Premium** - Higher price, premium seating/benefits
3. **Early Bird** - Limited quantity at discount, time-limited
4. **Student/Senior** - Discounted with verification
5. **Donation** - "Pay what you want" with suggested amounts
6. **Group** - Bundle discount when buying 5+ tickets
7. **Promotional** - Free or discounted via promo code
8. **Complimentary** - Free tickets (invitation-only or admin-allocated)
9. **Day Pass** - For multi-day events
10. **Workshop/Session** - For sessions within event (add-on)

**Price Strategies**:
- Base price + optional fees
- Early bird (limited quantity + time window)
- Last minute (days before, escalating pricing)
- Group discounts (buy 5+ get 10% off)
- Member/loyalty pricing
- Location-based pricing

**Availability Control**:
- Quantity-based (X tickets available)
- Time-based (sales start/end dates)
- Rule-based (auto-hide when sold out, auto-show when restocked)
- Conditional (show only to tier 1 organizers, show only with promo code)

**Advanced Features**:
- **Seating Charts**: Assigned seats with price variations per seat
- **Bundles**: "VIP Package" = Ticket + Parking + Merchandise
- **Add-ons**: Optional upgrades (parking, merchandise, upgrade to VIP)
- **Transfers**: Attendee can transfer to friend (with/without restriction)
- **Resale**: Attendee can resell on secondary market

---

### Ticketmaster's Approach (Larger scale)

**Ticket Categories**:
1. **Pricing Tiers**: Nose bleed seats → Premium → VIP → Club seats (each tier is separate ticket type)
2. **Reserved vs General**: Reserved (assigned seat) vs GA (standing room)
3. **Accessibility Pricing**: Discounted tickets for people with disabilities
4. **Presale** - Early access to members (higher price often)
5. **Public Sale** - General availability
6. **Platinum** - Dynamic pricing (can go 2-5x higher than face value)
7. **Rescheduled/Make-up** - For rescheduled events
8. **Refund Policy Variants**: Some tickets no refund, some 90-day refund

**Inventory Management**:
- Real-time seat availability per section
- Overbooking for GA (sell 105% for standing, account for no-shows)
- Smart hold/release (hold 50 seats for walk-up, release if not claimed)
- Waitlists (when sold out, queue for cancellations)
- Flash sales (limited time, limited quantity)

**Restrictions**:
- Transfer allowed/not allowed
- Resale allowed/not allowed
- Must show ID to match name on ticket
- Spouse/partner can't be transferred
- Corporate block holds (can't transfer outside company)

---

### StubHub/Resale Market Model (Secondary)

**What enables resale**:
1. Digital ticket wallets
2. Transfer restrictions are per-ticket, not per-type
3. Pricing floor (resale can't go below face value)
4. Pricing ceiling (resale capped at X% above face)
5. Resale fee (10-25% + processing)
6. Refund eligibility (can't resell non-refundable tickets)
7. Ownership chain (track who owned what, when)

---

### Event-specific Examples

**Conferences** (Tech Summit, Web Summit):
- Early Bird: $299 (limited 100)
- Regular: $399
- Late: $499 (30 days before)
- Last Minute: $599 (7 days before)
- Student: $99 (with .edu email)
- Exhibitor: $149 (for booth staff)
- VIP + Networking: $999 (includes mixer)
- All-Access Pass (2 years): $1,299

**Concerts** (Live Nation, AEG):
- General Admission: Nose bleeds ($50)
- Standard: Mid-level ($100)
- Premium: Lower deck ($200)
- Floor: Pit/floor seats ($300)
- VIP: Front rows + Meet & Greet ($500)
- Accessibility: Wheelchair area ($75)
- Platinum: Dynamic, highest bidder gets best remaining seats

**Sports** (NBA, NFL):
- Upper Level: $20-60
- Mid-Level: $60-200
- Lower Bowl: $200-500
- Club Level: $500-2,000
- Suites: $5,000-50,000
- Prestige Seating: Varies by demand (Platinum pricing)

**Festivals** (Burning Man, Coachella):
- Early Bird: $400 (limited 5,000)
- Regular: $500
- Late: $600
- VIP: $1,500 (campground access)
- Glamping: $2,000-5,000
- Artist Pass: Free (to performers)
- Press: Free (limited, verification required)

---

## PART 3: Gap Analysis - What You're Missing

### Critical Gaps (Must-Have for Platform Competitiveness)

| Feature | Current | Needed | Impact | Priority |
|---------|---------|--------|--------|----------|
| **Bundles/Packages** | ❌ No | ✅ Yes | Can't sell "VIP + Parking" together | HIGH |
| **Assigned Seating** | ⚠️ Started | ✅ Complete | Theater/sports events impossible | HIGH |
| **Visibility Control** | ⚠️ Hidden field | ✅ Rules engine | Can't show/hide conditionally | HIGH |
| **Dynamic Pricing** | ⚠️ Separate service | ✅ Integrated | Can't adjust prices on-the-fly | HIGH |
| **Transfer/Resale** | ❌ No | ✅ Yes | Secondary market, attendee experience | MEDIUM |
| **Add-ons/Upsells** | ❌ No | ✅ Yes | Parking, merch, upgrades at checkout | MEDIUM |
| **Ticket Categories** | ❌ No | ✅ Yes | Can't organize VIP, GA, Premium | MEDIUM |
| **Inventory Management** | ⚠️ Basic | ✅ Advanced | No overselling protection, no waitlists | MEDIUM |
| **Promo Code Integration** | ✅ Has | ✅ Enhance | Works but not granular control | LOW |

### Non-Critical Gaps (Nice-To-Have)

| Feature | Current | Benefit | Priority |
|---------|---------|---------|----------|
| **Accessibility Pricing** | ❌ | Comply with regulations, reach disabled audience | MEDIUM |
| **Loyalty/Member Pricing** | ❌ | Repeat customer incentives | LOW |
| **Corporate Blocks** | ❌ | B2B ticket sales | LOW |
| **Waitlists** | ❌ | Re-engage users when tickets go on sale | LOW |
| **Last-Minute Surge Pricing** | ❌ | Revenue optimization | LOW |

---

## PART 4: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) - CRITICAL

**Goal**: Make ticket system work for 90% of event types

**Changes**:

1. **Enhance TicketType Model**
   ```typescript
   interface TicketType {
     // Existing fields (keep all)
     id: number;
     name: string;
     price: string;
     quantity: string;
     // ... existing ...

     // NEW: Category/Classification
     category?: 'general_admission' | 'vip' | 'early_bird' | 'student' | 'donation' | 'other';
     
     // NEW: Visibility Rules
     isVisible: boolean;                    // Master visibility toggle
     visibilityRules?: {
       showWhenQuantityAbove?: number;     // Show only if >X available
       hideWhenSoldOut?: boolean;          // Auto-hide when sold out
       showOnlyWithPromoCode?: string[];   // Show only with these codes
       showOnlyToRole?: UserRole[];        // Show only to VIP/staff/members
     };

     // NEW: Seating Integration
     hasAssignedSeating?: boolean;
     seatMapId?: string;                   // Link to seat map
     seatPricingRules?: {
       sectionId: string;
       priceMultiplier: number;            // 1.0 = same price, 1.5 = 50% more
     }[];

     // NEW: Add-ons/Upsells
     addOns?: {
       id: string;
       name: string;
       price: number;
       maxQuantity?: number;
       required?: boolean;
     }[];

     // NEW: Transfer/Resale Config
     transferAllowed?: boolean;
     resaleAllowed?: boolean;
     mustMatchAttendeeId?: boolean;        // Require ID match
     minResalePrice?: number;              // Floor for resale
     maxResalePrice?: number;              // Ceiling for resale
   }
   ```

2. **Integrate Dynamic Pricing** (move from separate service)
   - Link DynamicPricingRule to TicketType
   - Apply pricing rules at checkout time
   - Show "was $X, now $Y" when applicable

3. **Create Ticket Categories UI** (TicketsStep.tsx enhancement)
   - Add category dropdown
   - Show suggested names (General Admission, VIP, Early Bird, etc.)
   - Auto-suggest category based on name

4. **Add Visibility Rules UI**
   - Simple toggle for "Hide this ticket"
   - Checkbox for "Auto-hide when sold out"
   - List of promo codes that unlock this ticket

---

### Phase 2: Advanced Features (Weeks 3-4) - HIGH PRIORITY

**Goal**: Support all major event types (theater, conferences, festivals)

**Changes**:

1. **Ticket Bundles** (separate from packages)
   ```typescript
   interface TicketBundle {
     id: string;
     name: string;                        // "VIP Package"
     description: string;
     ticketTypes: {                       // Which tickets included
       ticketTypeId: string;
       quantity: number;                  // How many of this type
     }[];
     bundlePrice: number;                 // Discount compared to buying separately
     bundleDiscount: number;              // "$150 savings" label
     quantity: number;                    // How many bundles available
     imageUrl?: string;
     benefits?: string[];                 // "Meet & greet", "Front row seats"
   }
   ```

2. **Seating Integration** (Connect to SeatMap)
   - Link TicketType to SeatMap
   - Apply different prices to different sections
   - Show seat availability in real-time

3. **Add-ons at Checkout**
   - Optional parking (+$20)
   - Merchandise package (+$15)
   - Upgrade to VIP (+$150)
   - Donation (minimum $5, suggested $10, $25, $50)

4. **Transfer & Resale Basic**
   - Track ticket ownership chain
   - Allow/prevent transfers per ticket type
   - Simple resale marketplace UI

---

### Phase 3: Optimization (Weeks 5-6) - MEDIUM PRIORITY

**Goal**: Maximize revenue and engagement

**Changes**:

1. **Smart Inventory**
   - Overselling for GA (105% for no-show adjustment)
   - Overbooking holds (reserve 50, release if not claimed)
   - Waitlists when sold out

2. **Advanced Pricing**
   - Last-minute surge ($50 cheaper 60 days out, $100 more expensive week-of)
   - Volume discounts ("Buy 10+, get 15% off")
   - Time-zone based pricing (different prices for different regions)

3. **Accessibility & Inclusion**
   - Accessibility pricing (discounted for wheelchair users)
   - Student/senior verification workflow
   - Group discounts (5+ at same price tier)

4. **Loyalty & Engagement**
   - Member-only pricing
   - First-time attendee discount
   - Loyalty points system

---

### Phase 4: Scale (Weeks 7-8) - LOW PRIORITY

**Goal**: Support enterprise use cases

**Changes**:

1. **Corporate Block Ticketing**
   - Company A buys 100 tickets, controls distribution
   - Separate pricing for corporate blocks
   - Role-based allocation (execs get premium, staff get standard)

2. **API for Ticketing Partners**
   - Allow external distributors to sell your tickets
   - Real-time inventory sync
   - Commission management

3. **Advanced Analytics**
   - Cohort analysis (which ticket type converts best?)
   - Revenue impact of pricing changes
   - Inventory forecasting (predict sellout date)

---

## PART 5: Database Schema Changes

### Recommended Structure (Normalized)

**Option 1: Keep as JSON (Current Approach)**
- ✅ Pros: Simple, flexible, no migrations needed
- ❌ Cons: Harder to query, no referential integrity, scaling issues

**Option 2: Create Separate Tables (Recommended for scale)**

```prisma
model TicketType {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  category    String   @default("general_admission")
  
  // Pricing
  price       Decimal  @db.Decimal(10, 2)
  originalPrice Decimal? @db.Decimal(10, 2)
  discountLabel String?
  
  // Inventory
  totalQuantity Int
  soldQuantity  Int     @default(0)
  quantity      Int     @computed // available = total - sold
  
  // Restrictions
  maxPerPerson  Int?
  minPerOrder   Int?
  type          String  @default("paid")           // paid, free
  
  // Dates
  availableFrom DateTime?
  availableUntil DateTime?
  
  // Visibility & Control
  isVisible     Boolean @default(true)
  isHidden      Boolean @default(false)            // Deprecated (use isVisible)
  visibilityRules Json?  // Complex visibility rules
  
  // Complementary & Transfer
  isComplementary Boolean @default(false)
  requiresInvitation Boolean @default(false)
  nameLocked    Boolean @default(false)            // Non-transferable
  transferAllowed Boolean @default(true)
  resaleAllowed Boolean @default(true)
  
  // Sales Channel
  salesChannel  String  @default("online")         // online, door, both
  
  // Seating
  hasAssignedSeating Boolean @default(false)
  seatMapId     String?
  seatPricingRules Json?
  
  // Add-ons
  addOns        Json?   // Array of add-on items
  
  // Related
  registrations EventRegistration[] @relation("TicketTypeRegistrations")
  invoices      Invoice[] @relation("InvoiceTicketTypes")
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([eventId])
  @@index([category])
  @@index([isVisible])
  @@index([availableUntil])
}

model TicketBundle {
  id              String   @id @default(cuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  imageUrl        String?
  benefits        String[]
  
  // Components
  ticketTypeIds   String[] // Array of TicketType IDs included
  quantities      Int[]    // Quantities for each ticket type (parallel array)
  
  // Pricing
  bundlePrice     Decimal  @db.Decimal(10, 2)
  totalSeparatePrice Decimal? @db.Decimal(10, 2) // For calculating savings
  
  // Inventory
  totalQuantity   Int
  soldQuantity    Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([eventId])
}

// Link between TicketType and DynamicPricingRule
model TicketTypePricingRule {
  id              String   @id @default(cuid())
  ticketTypeId    String
  pricingRuleId   String
  
  ticketType      TicketType @relation(fields: [ticketTypeId], references: [id], onDelete: Cascade)
  pricingRule     DynamicPricingRule @relation(fields: [pricingRuleId], references: [id], onDelete: Cascade)
  
  @@unique([ticketTypeId, pricingRuleId])
  @@index([ticketTypeId])
  @@index([pricingRuleId])
}
```

### Migration Path

**Step 1**: Add new TicketType table alongside existing JSON
**Step 2**: During event creation, populate both (JSON and new table)
**Step 3**: Queries read from new table, fall back to JSON for legacy events
**Step 4**: Background job migrates old events
**Step 5**: Remove JSON field after full migration

---

## PART 6: API Changes Needed

### New Endpoints

```typescript
// Ticket Type Management
POST   /organizer-dashboard/events/:eventId/ticket-types
GET    /organizer-dashboard/events/:eventId/ticket-types
PUT    /organizer-dashboard/ticket-types/:ticketTypeId
DELETE /organizer-dashboard/ticket-types/:ticketTypeId

// Ticket Bundles
POST   /organizer-dashboard/events/:eventId/ticket-bundles
GET    /organizer-dashboard/events/:eventId/ticket-bundles
PUT    /organizer-dashboard/ticket-bundles/:bundleId
DELETE /organizer-dashboard/ticket-bundles/:bundleId

// Seating Integration
GET    /organizer-dashboard/events/:eventId/ticket-types/:ticketTypeId/seat-pricing
PUT    /organizer-dashboard/ticket-types/:ticketTypeId/seat-pricing

// Visibility Rules
PUT    /organizer-dashboard/ticket-types/:ticketTypeId/visibility-rules

// Add-ons Management
POST   /organizer-dashboard/ticket-types/:ticketTypeId/add-ons
DELETE /organizer-dashboard/add-ons/:addOnId

// Transfer/Resale
PUT    /organizer-dashboard/ticket-types/:ticketTypeId/transfer-settings
GET    /events/:eventId/ticket-types/:ticketTypeId/transfer-availability

// Admin
GET    /admin/ticket-types/templates              // Preset templates
POST   /admin/ticket-types/templates/:templateId/apply-to-event
```

---

## PART 7: UI/UX Changes Needed

### TicketsStep.tsx Enhancement (Event Creation)

**Current**: Simple form with add/edit/delete ticket types

**Enhanced**:
```
┌─────────────────────────────────────────────────────────┐
│ TICKET CONFIGURATION                                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ [ Quick Start Templates ] [ Import from Previous Event ] │
│                                                           │
│ ┌─ Ticket Type 1 ─────────────────────────────────┐     │
│ │ Name: General Admission                         │     │
│ │ Category: [General Admission ▼]                 │     │
│ │                                                  │     │
│ │ [Basic] [Pricing] [Restrictions] [Seating] [Advanced] │
│ │                                                  │     │
│ │ ☐ Show/Hide visibility rules                    │     │
│ │ ☐ Has assigned seating                          │     │
│ │ ☐ Allow transfers                               │     │
│ │ ☐ Allow resale                                  │     │
│ └──────────────────────────────────────────────────┘     │
│                                                           │
│ [ + Add Ticket Type ]  [ + Create Bundle ]              │
│                                                           │
│ ┌─ Bundle 1 ───────────────────────────────────┐        │
│ │ "VIP Package" - General Admission + Parking   │        │
│ │ $150 (save $30 vs buying separate)            │        │
│ └───────────────────────────────────────────────┘        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Organizer Dashboard Enhancement

**Show**:
- Ticket type breakdown (X units at $Y, Y units at $Z, Z units free)
- Sales progress bar per ticket type
- Revenue projection
- Transfer/resale activity

---

## PART 8: What NOT to Do

### Anti-Patterns to Avoid

1. ❌ **Over-normalize data**: Don't create 10 new tables for flexibility you won't use
2. ❌ **Pricing complexity**: Don't try to support every possible pricing strategy—focus on top 5
3. ❌ **Feature creep**: Don't build corporate blocks in Phase 1
4. ❌ **Premature optimization**: Don't add caching for price calculations until you have perf issues
5. ❌ **Breaking changes**: Don't remove JSON ticketTypes field until migration is 100% complete

### What NOT to Implement

- Dynamic pricing by individual (personalized pricing per user) - complexity not worth ROI
- AI-based price optimization - wait until you have 100+ events to analyze
- Blockchain-based transfers - unnecessary complexity
- Gamified ticket releases - gimmick, focus on core
- Influencer-specific pricing tiers - too much overhead

---

## PART 9: Implementation Dependencies

### Must Be Done First
1. Seating system (for theater/sports events)
2. Dynamic pricing integration (for conferences/festivals)
3. Basic bundle support (foundation for packages)

### Should Be Done Before Launch
1. Transfer/resale basic functionality
2. Visibility rules (so you can hide broken features)
3. Add-on system (checkout upsells)

### Can Be Deferred
1. Accessibility pricing (nice to have, compliance driven)
2. Loyalty pricing (optimization, not core)
3. Corporate blocks (enterprise, not core)
4. Waitlists (engagement feature, not critical)

---

## PART 10: Recommended Priority Order

### For EventKnit (Your Platform) - 12 Week Plan

**SPRINT 1: Foundation (Week 1-2)**
- Add TicketType table (migration from JSON)
- Add category field
- Add visibility control
- Enhance validation rules

**SPRINT 2: Integration (Week 3-4)**
- Integrate DynamicPricingRule with TicketType
- Build Ticket Bundle model
- Create add-on system

**SPRINT 3: Seating (Week 5-6)**
- Link TicketType to SeatMap
- Add section-based pricing
- Build seat selection UI

**SPRINT 4: Transfer/Resale (Week 7-8)**
- Implement transfer workflow
- Build resale marketplace
- Add ownership chain tracking

**SPRINT 5: Polish (Week 9-10)**
- Admin preset templates
- Bulk operations
- Analytics dashboard

**SPRINT 6: Enterprise (Week 11-12)**
- Accessibility pricing
- Group discounts
- Corporate blocks

---

## Summary: Your Ticket Type Roadmap

| Phase | Focus | Impact | Effort | Timeline |
|-------|-------|--------|--------|----------|
| **Foundation** | Core ticket model enhancement | 🟢 High | 40 hrs | Week 1-2 |
| **Bundles** | Package/bundle tickets | 🟢 High | 30 hrs | Week 3-4 |
| **Seating** | Assigned seats pricing | 🟢 High | 50 hrs | Week 5-6 |
| **Transfer** | Resale marketplace | 🟡 Medium | 40 hrs | Week 7-8 |
| **Templates** | Admin presets | 🟡 Medium | 20 hrs | Week 9-10 |
| **Enterprise** | B2B, accessibility, groups | 🔴 Low | 30 hrs | Week 11-12 |

**Total Estimated Effort**: 210 hours (5-6 sprints, 4-5 developers)

---

## Questions to Answer Before Implementation

1. **Seating**: Do you want assigned seating now or later?
2. **Bundles**: Will you support bundles in event creation or admin-only initially?
3. **Resale**: Is secondary market a priority or can it wait?
4. **Pricing Strategies**: Which pricing strategies matter most to your organizers?
5. **Enterprise**: Are corporate blocks and blocks for teams on your roadmap?

---

## Conclusion

Your current ticket type system is **not broken**, it's just **incomplete**. The foundation is solid:

✅ You have basic pricing, quantities, dates, restrictions  
✅ You have complementary tickets  
✅ You have some early bird support  

But you're missing the **advanced features** that differentiate platforms:

❌ No bundles/packages  
❌ No seating integration  
❌ No transfer/resale  
❌ No add-ons  
❌ No visibility rules  

**Recommendation**: Start with bundles + seating (Phases 1-2), then add transfer/resale (Phase 3). These three alone will unlock 80% of enterprise event types you're missing.

