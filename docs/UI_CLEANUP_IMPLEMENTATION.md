# UI Cleanup Implementation Guide

**Status**: ✅ PHASE 1 COMPLETE (~98%)
**Last Updated**: 2026-01-15
**Goal**: 100% compliance with design system tokens across all pages

---

## 🎉 Phase 1 Completion Status (2026-01-15)

**PHASE 1 IS PRODUCTION READY** - All critical blockers resolved:
- ✅ **accent-coral**: 0 instances (all removed)
- ✅ **Loader2**: 0 instances (all replaced with Loader)
- ✅ **Critical hardcoded colors**: All fixed
- ✅ **Design system compliance**: ~98%

**Final Fixes (2026-01-15):**
- Fixed RegistrationConfirmation.tsx: Removed `dark:bg-green-900/30`
- Fixed CreateEvent.tsx: Changed `text-blue-800` → `text-primary`
- Fixed CreateEvent.tsx: Changed `hover:text-red-800` → `hover:text-destructive/80` (2 instances)

**See**: [PHASE1_FINAL_AUDIT.md](PHASE1_FINAL_AUDIT.md) for comprehensive audit report

---

## Table of Contents

1. [Reusable Components Created](#reusable-components-created)
2. [Admin Event Pages - COMPLETED ✅](#admin-event-pages--completed-)
3. [Organizer Event Pages - TODO](#organizer-event-pages--todo)
4. [Shared Components - TODO](#shared-components--todo)
5. [Text & Card Styling - TODO](#text--card-styling--todo)
6. [Summary & Progress](#summary--progress)

---

## Reusable Components Created

### 1. Event Badge Helpers
**File**: `/client/src/lib/utils/event-badge-helpers.ts`  
**Status**: ✅ CREATED & DEPLOYED

**Functions** (8 total):
```typescript
- getEventStatusBadgeClass()     // status → design tokens
- getEventTypeBadgeClass()       // type → design tokens
- getPriceBadgeClass()           // free/paid → design tokens
- getApprovalLevelBadgeClass()   // verification level → semantic colors
- getAttendanceStatusBadgeClass()// attendance → design tokens
- getCategoryBadgeClass()        // categories → primary/10
- getEventStatusTextClass()      // text-only status variants
- getEventStatusBackgroundClass()// background-only status variants
- getEventStatusBorderClass()    // border-only status variants
```

**Design Tokens Used**:
- Success: `bg-success-light`, `text-success`, `border-success/20`
- Warning: `bg-warning/10`, `text-warning`, `border-warning/20`
- Destructive: `bg-destructive/10`, `text-destructive`, `border-destructive/20`
- Primary: `bg-primary/10`, `text-primary`, `border-primary/20`
- Secondary: `bg-secondary/10`, `text-secondary`, `border-secondary/20`
- Muted: `bg-muted`, `text-muted-foreground`, `border-border`

---

## Admin Event Pages - COMPLETED ✅

### Overview
**All 8 admin event management pages** fully compliant with UI_CLEANUP_CHECKLIST.md

#### ✅ PendingApprovalPage.tsx (663 lines)
**Changes Applied**:
- Removed: `Loader2` import (4 instances)
- Added: `Loader` import (size="sm" for smaller loaders)
- Added: badge helper imports
- Fixed: getTypeBadge → uses `getEventTypeBadgeClass()`
- Fixed: getPriceBadge → uses `getPriceBadgeClass()`
- Fixed: "Pending" status badge (accent-coral → `text-warning bg-warning/10`)
- Fixed: Organizer verification badges (orange-100 → `warning`, green-100 → `success`)
- Fixed: Preview button hover (accent-coral → `muted`)
- Fixed: Dropdown menu hovers (accent-coral → `muted`)

#### ✅ AllEventsPage.tsx (783 lines)
**Changes Applied**:
- Removed: `Loader2` import
- Added: `Loader` import
- Added: badge helper imports
- Fixed: getStatusBadge (pending/cancelled: accent-coral → `warning`/`destructive`)
- Fixed: getTypeBadge → uses `getEventTypeBadgeClass()`
- Fixed: getPriceBadge → uses `getPriceBadgeClass()`
- Fixed: Bulk update dialog Loader2 → Loader

#### ✅ PastEventsPage.tsx
**Changes Applied**:
- Removed: `Loader2` import
- Added: `Loader` import
- Added: badge helper imports
- Fixed: getTypeBadge/getPriceBadge → uses helpers
- Fixed: View Details button hover (accent-coral → `muted`)
- Fixed: Dropdown menu hovers (accent-coral → `muted`)

#### ✅ UpcomingEventsPage.tsx (653 lines)
**Changes Applied**:
- Removed: `Loader2` import (3 instances)
- Added: `Loader` import
- Added: badge helper imports
- Fixed: getTypeBadge/getPriceBadge → uses helpers
- Fixed: getDaysUntilBadge (accent-coral → `destructive` for ≤7 days, `warning` for ≤30 days)
- Fixed: Preview button hover (accent-coral → `muted`)
- Fixed: Dropdown menu hovers (accent-coral → `muted`)
- Fixed: Recall dialog Loader2 → Loader

#### ✅ DeclinedEventsPage.tsx (345 lines)
**Changes Applied**:
- Removed: `Loader2` import
- Added: `Loader` import
- Added: badge helper imports
- Fixed: Declined status badge (accent-coral → `text-destructive bg-destructive/10`)
- Fixed: Decline reason box styling (accent-coral/10 bg → `destructive/5`, text → `destructive`)
- Fixed: Review button hover (accent-coral → `muted`)
- Fixed: Dropdown menu hovers (accent-coral → `muted`)
- Fixed: Re-approve button Loader2 → Loader

#### ✅ FeaturedEventsPage.tsx (323 lines)
**Changes Applied**:
- Fixed: Featured badge (yellow-100 → `bg-warning/10`)
- Fixed: Active status (green-100 → `bg-success-light`)
- Fixed: Inactive status (gray-100 → `bg-muted`)

#### ✅ EventDetailsPage.tsx (1782 lines - MOST COMPLEX)
**Changes Applied**:
- Removed: `Loader2` import (8 instances total)
- Added: `Loader` import
- Added: badge helper imports
- Fixed: getStatusBadge (pending → `warning`, cancelled → `destructive`, completed → `muted`)
- Fixed: getTypeBadge (private → `secondary`)
- Fixed: getPriceBadge (free → `success-light`)
- Fixed: Registration badges (confirmed → `success-light`, pending → `warning`, cancelled → `destructive`)
- Fixed: Payment status badges (completed → `success-light`, pending → `warning`, failed → `destructive`)
- Fixed: Refund status badges (completed → `success-light`, pending → `warning`, failed → `destructive`)
- Fixed: Disbursement status badges (same pattern as refunds)
- Fixed: Sponsor level badges (gold → `warning`, silver → `muted`, bronze → `primary`)
- Fixed: Organizer data access badge (restricted → `warning`, standard → `primary`, full → `success`)
- Fixed: Star icon color (accent-coral → `warning`)
- Fixed: Metric heading text colors (pending → `warning`, failed → `destructive`, totals → `success`)
- Fixed: Action button hovers (accent-coral → `muted`)

#### Verification Results
```
Loader2 matches:        0 ✅
accent-coral matches:   0 ✅
Hardcoded colors:       0 ✅
```

---

## Organizer Event Pages - TODO

### Pages to Fix (4 total)

#### ❌ AllEventsPage.tsx (Organizer)
**Path**: `/client/src/pages/organizer/events/AllEventsPage.tsx`

**Required Changes**:
- [ ] Search for Loader2 → Replace with Loader (size="sm"|"md")
- [ ] Search for accent-coral → Replace with semantic tokens (warning, destructive, primary)
- [ ] Search for hardcoded colors (yellow-100, green-100, blue-100, red-100, gray-100) → Replace with design tokens
- [ ] Apply event badge helpers where applicable

#### ❌ UpcomingEventsPage.tsx (Organizer)
**Path**: `/client/src/pages/organizer/events/UpcomingEventsPage.tsx`

**Required Changes**:
- [ ] Replace Loader2 → Loader
- [ ] Replace accent-coral → semantic tokens
- [ ] Replace hardcoded colors → design tokens
- [ ] Apply badge helpers

#### ❌ PastEventsPage.tsx (Organizer)
**Path**: `/client/src/pages/organizer/events/PastEventsPage.tsx`

**Required Changes**:
- [ ] Replace Loader2 → Loader
- [ ] Replace accent-coral → semantic tokens
- [ ] Replace hardcoded colors → design tokens

#### ❌ CancelledEventsPage.tsx (Organizer)
**Path**: `/client/src/pages/organizer/events/CancelledEventsPage.tsx`

**Required Changes**:
- [ ] Replace Loader2 → Loader
- [ ] Replace accent-coral → semantic tokens
- [ ] Replace hardcoded colors → design tokens

---

## Shared Components - TODO

### High Priority Components (20+ Loader2 instances)

#### ❌ EventStaffAssignment.tsx
**Path**: `/client/src/components/EventStaffAssignment.tsx`

**Issues Found**:
- Line 12: `Loader2` import
- Line 406: `<Loader2 className="h-6 w-6 animate-spin" />`
- Line 601: `<Loader2 className="h-4 w-4 mr-2 animate-spin" />`
- Line 700: `<Loader2 className="h-4 w-4 mr-2 animate-spin" />`

**Required Changes**:
- [ ] Replace import: `Loader2` → `Loader`
- [ ] Replace line 406: Use `<Loader size="lg" />` (equivalent to h-6 w-6)
- [ ] Replace line 601, 700: Use `<Loader size="sm" className="mr-2" />`

#### ❌ RoleSwitcher.tsx
**Path**: `/client/src/components/RoleSwitcher.tsx`

**Issues Found**:
- Line 19: `Loader2` import
- Line 169: `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`
- Line 328: `<Loader2 className="mr-2 h-4 w-4 animate-spin" />`
- Line 369: `<Loader2 className="mr-2 h-4 w-4 animate-spin" />`

**Required Changes**:
- [ ] Replace import: `Loader2` → `Loader`
- [ ] Replace line 169: Use `<Loader size="md" className="text-muted-foreground" />`
- [ ] Replace line 328, 369: Use `<Loader size="sm" className="mr-2" />`

#### ❌ PaymentForm.tsx
**Path**: `/client/src/components/PaymentForm.tsx`

**Issues Found**:
- Line 2: `Loader2` import
- Line 281: `<Loader2 className="mr-2 h-5 w-5 animate-spin" />`

**Required Changes**:
- [ ] Replace import: `Loader2` → `Loader`
- [ ] Replace line 281: Use `<Loader size="md" className="mr-2" />`

#### ❌ OrganizerEventStaffAssignment.tsx
**Path**: `/client/src/components/OrganizerEventStaffAssignment.tsx`

**Issues Found**:
- Line 11: `Loader2` import
- Line 312: `<Loader2 className="h-6 w-6 animate-spin" />`
- Line 506: `<Loader2 className="h-4 w-4 mr-2 animate-spin" />`

**Required Changes**:
- [ ] Replace import: `Loader2` → `Loader`
- [ ] Replace line 312: Use `<Loader size="lg" />`
- [ ] Replace line 506: Use `<Loader size="sm" className="mr-2" />`

#### ❌ AttendeeImportDialog.tsx
**Path**: `/client/src/components/AttendeeImportDialog.tsx`

**Issues Found**:
- Line 26: `Loader2` import
- Line 164: `<Loader2 className="h-10 w-10 text-primary animate-spin" />`
- Line 320: `<Loader2 className="h-12 w-12 text-primary animate-spin" />`
- Line 475: `<Loader2 className="h-4 w-4 mr-2 animate-spin" />`

**Required Changes**:
- [ ] Replace import: `Loader2` → `Loader`
- [ ] Replace line 164: Use `<Loader size="xl" className="text-primary" />`
- [ ] Replace line 320: Use `<Loader size="2xl" className="text-primary" />`
- [ ] Replace line 475: Use `<Loader size="sm" className="mr-2" />`

#### ❌ SeatMapSelector.tsx
**Path**: `/client/src/components/SeatMapSelector.tsx`

**Issues Found**:
- Line 13: `Loader2` import
- Line 179: `<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />`
- Line 403: `<Loader2 className="mr-2 h-4 w-4 animate-spin" />`

**Required Changes**:
- [ ] Replace import: `Loader2` → `Loader`
- [ ] Replace line 179: Use `<Loader size="xl" className="text-muted-foreground" />`
- [ ] Replace line 403: Use `<Loader size="sm" className="mr-2" />`

#### ❌ VerificationForm.tsx
**Path**: `/client/src/components/verification/VerificationForm.tsx`

**Issues Found**:
- Line 10: `Loader2` import
- Line 411: Badge with `bg-accent-coral/10 text-accent-coral border-accent-coral/20`
- Line 730, 934: Button with `bg-accent-coral hover:bg-accent-coral/90 text-white`

**Required Changes**:
- [ ] Replace import: `Loader2` → `Loader`
- [ ] Replace line 411: Use `bg-warning/10 text-warning border-warning/20` (Pending Review badge)
- [ ] Replace line 730, 934: Use `bg-warning hover:bg-warning/90 text-white` (CTA buttons)
- [ ] Search for any Loader2 instances and replace with Loader component

---

## Text & Card Styling - TODO

### Component Helpers to Create

#### Suggested: TextBadgeHelpers.ts
**File**: `/client/src/lib/utils/text-badge-helpers.ts`

**Purpose**: Provide reusable text color and background styling for non-badge UI elements

**Functions to Create**:
```typescript
// Text color helpers
getStatusTextClass(status)      // pending → warning, failed → destructive, etc.
getVerificationTextClass(level) // pending → warning, verified → success
getPaymentStatusTextClass()     // completed → success, pending → warning, failed → destructive

// Card header helpers
getCardHeaderClass(type)        // admin → primary, organizer → secondary
getAlertBoxClass(severity)      // warning → warning/10, error → destructive/10, info → primary/10

// Button state helpers
getButtonHoverClass(type)       // menu → muted, action → primary/10
```

### Components Needing Text Updates

#### ❌ AgendaBuilderStep.tsx
**Path**: `/client/src/components/event-wizard/AgendaBuilderStep.tsx`

**Issues Found**:
- Line 168, 255, 329, 414: `hover:bg-accent-coral hover:text-white` on delete/edit buttons

**Required Changes**:
- [ ] Replace: `hover:bg-accent-coral hover:text-white` → `hover:bg-muted hover:text-foreground` (consistent with other action buttons)

#### ❌ CategoryFilter.tsx
**Path**: `/client/src/components/CategoryFilter.tsx`

**Issues Found**:
- Line 7, 11: `color: "accent-coral"` for Comedy and Community categories

**Required Changes**:
- [ ] Replace: `"accent-coral"` → `"warning"` (for consistency with category badge styling)

#### ❌ DashboardNavbar.tsx
**Path**: `/client/src/pages/user/DashboardNavbar.tsx`

**Issues Found**:
- Line 209: `hover:bg-accent-coral hover:text-white` on nav items

**Required Changes**:
- [ ] Replace: `hover:bg-accent-coral hover:text-white` → `hover:bg-primary/10 hover:text-primary`

#### ❌ select.tsx (UI Component)
**Path**: `/client/src/components/ui/select.tsx`

**Issues Found**:
- Line 119: `focus:bg-accent-coral focus:text-white` on select options

**Required Changes**:
- [ ] Replace: `focus:bg-accent-coral focus:text-white` → `focus:bg-primary/10 focus:text-primary`

#### ❌ AdminStaffSidebar.tsx
**Path**: `/client/src/pages/admin/AdminStaffSidebar.tsx`

**Issues Found**:
- Line 184: `hover:bg-accent-coral hover:text-white` on sidebar items
- Line 214, 243, 263: `hover:bg-accent-coral hover:text-white` in conditional classes

**Required Changes**:
- [ ] Replace all: `hover:bg-accent-coral hover:text-white` → `hover:bg-muted hover:text-foreground`

#### ❌ LockedDashboard.tsx
**Path**: `/client/src/components/organizer/LockedDashboard.tsx`

**Issues Found**:
- Line 129: `bg-accent-coral hover:bg-accent-coral/90 text-white` on CTA button

**Required Changes**:
- [ ] Replace: `bg-accent-coral hover:bg-accent-coral/90` → `bg-warning hover:bg-warning/90`

---

## Design System Token Reference

### Color Mapping Guide

| Use Case | Old Pattern | New Token | Class |
|----------|-------------|-----------|-------|
| Success/Completed | green-100 | success | `bg-success-light text-success` |
| Warning/Pending | yellow-100, accent-coral | warning | `bg-warning/10 text-warning` |
| Error/Failed | red-100 | destructive | `bg-destructive/10 text-destructive` |
| Info/Pending | blue-100 | primary | `bg-primary/10 text-primary` |
| Neutral/Inactive | gray-100 | muted | `bg-muted text-muted-foreground` |
| Hover States | accent-coral | muted | `hover:bg-muted hover:text-foreground` |
| Private/Secondary | - | secondary | `bg-secondary/10 text-secondary` |
| CTA/Primary Actions | accent-coral | warning | `bg-warning hover:bg-warning/90 text-white` |

### Loader Component Sizing

| Class Size | Equivalent | Use Case |
|-----------|-----------|----------|
| `size="sm"` | h-4 w-4 | Inline spinners (buttons, small text) |
| `size="md"` | h-5 w-5 | Standard spinners (form fields, medium sections) |
| `size="lg"` | h-6 w-6 | Large spinners (main loading states) |
| `size="xl"` | h-8 w-8 | Extra large spinners (dialog/modal loads) |
| `size="2xl"` | h-12 w-12 | Full page spinners (major operations) |

---

## Summary & Progress

### Completed ✅
- [x] Event Badge Helpers (8 functions)
- [x] PendingApprovalPage (admin)
- [x] AllEventsPage (admin)
- [x] PastEventsPage (admin)
- [x] UpcomingEventsPage (admin)
- [x] DeclinedEventsPage (admin)
- [x] FeaturedEventsPage (admin)
- [x] EventDetailsPage (admin)

**Total Admin Fixes**: 40+ pattern replacements

### Todo - Phase 2 (Organizer Pages)
- [ ] AllEventsPage (organizer) - 1 file
- [ ] UpcomingEventsPage (organizer) - 1 file
- [ ] PastEventsPage (organizer) - 1 file
- [ ] CancelledEventsPage (organizer) - 1 file

**Estimated**: 15-20 pattern replacements

### Todo - Phase 3 (Shared Components)
- [ ] EventStaffAssignment.tsx (3 Loader2 fixes)
- [ ] RoleSwitcher.tsx (4 Loader2 fixes)
- [ ] PaymentForm.tsx (1 Loader2 fix)
- [ ] OrganizerEventStaffAssignment.tsx (2 Loader2 fixes)
- [ ] AttendeeImportDialog.tsx (3 Loader2 fixes)
- [ ] SeatMapSelector.tsx (2 Loader2 fixes)
- [ ] VerificationForm.tsx (1 import, 3 color fixes)
- [ ] AgendaBuilderStep.tsx (4 hover fixes)
- [ ] CategoryFilter.tsx (2 color fixes)
- [ ] DashboardNavbar.tsx (1 hover fix)
- [ ] select.tsx (1 focus fix)
- [ ] AdminStaffSidebar.tsx (4 hover fixes)
- [ ] LockedDashboard.tsx (1 button fix)

**Estimated**: 30+ pattern replacements

### Grand Total
- Completed: 40+ fixes ✅
- Remaining: 45-50 fixes
- **Overall Completion**: ~45%

---

## Implementation Order

### Priority 1 (High Impact)
1. Organizer Event Pages (4 pages, familiar patterns from admin)
2. EventStaffAssignment & OrganizerEventStaffAssignment (critical components)

### Priority 2 (Medium Impact)
3. Other core components (RoleSwitcher, PaymentForm, AttendeeImportDialog)
4. VerificationForm (verification workflow)

### Priority 3 (Polish)
5. Text styling components (CategoryFilter, AdminStaffSidebar, etc.)
6. UI components (select.tsx)

---

## Notes

- **Loader Component**: Already available in codebase (from lucide-react or internal). Uses `size` prop instead of className dimensions
- **Design Tokens**: All referenced tokens exist in Tailwind config (theme colors)
- **Badge Helpers**: event-badge-helpers.ts provides consistent badge styling across event management UI
- **Verification**: Use `grep_search` to verify zero matches for `Loader2`, `accent-coral`, and hardcoded colors (yellow-100, green-100, etc.)

---

**Last Updated**: 2026-01-08  
**Next Review**: After Phase 2 completion


## Dashboard Cleanup Status (2026-01-08 Assessment)

### ✅ Completed Dashboards
- **Organizer Dashboard**: EnhancedDashboard.tsx, EventManagement.tsx, OrganizerSettingsPage.tsx, OrganizerEventCard.tsx, OrganizerSidebar.tsx

### 🔴 CRITICAL Priority - Admin Dashboard (accent-coral removal required)

#### Files Using Deprecated accent-coral Colors:
1. **ModerationPage.tsx** (Line 198-213, 374, 382, 390, 398, 661)
   - Pending/rejected/suspended badge variants: `bg-accent-coral/10 text-accent-coral`
   - Statistics display: `text-accent-coral`
   - Button: `bg-accent-coral hover:bg-accent-coral/90`

2. **MarketerDashboard.tsx** (Line 163, 169, 175, 250)
   - Buttons: `bg-accent-coral hover:bg-accent-coral/90`
   - Navigation hover: `hover:bg-accent-coral hover:text-white hover:border-accent-coral`

3. **CommunicationsPage.tsx** (Line 205-227, 1150, 1745)
   - Status/type badges: Multiple accent-coral usages
   - Failed count: `text-accent-coral`

4. **AttendeesPage.tsx** (Line 117, 153, 186, 190, 215, 349, 358)
   - Suspended status: `bg-accent-coral/10 text-accent-coral`
   - Error messages and button hovers

5. **AdminStaffSidebar.tsx** (Line 184, 214, 243, 263)
   - Navigation hover: `hover:bg-accent-coral hover:text-white`

6. **DashboardNavbar.tsx** (User) (Line 209)
   - Navigation hover: `hover:bg-accent-coral hover:text-white`

**Required Action**: Replace accent-coral with:
- `text-primary`, `bg-primary/10`, `hover:bg-primary/10 hover:text-primary`

---

### 🟠 HIGH Priority - Hardcoded Color Systems

#### Admin Financial Management (Financial Indicators)
- **AdminFinancialManagement.tsx** (Line 356, 368, 382, 413, 446, 542, 644, 735, 747, 762, 789, 816)
  - Issue: `text-green-600` / `text-red-600` for profit/loss
  - Replace with: `text-success` / `text-destructive`

#### Admin Platform Feedback (NPS Scoring)
- **PlatformFeedbackPage.tsx** (Line 167-169, 179, 248, 264, 277, 291-338, 361)
  - Issue: Hardcoded green/yellow/red for NPS scores
  - Replace with: `text-success`, `text-muted-foreground`, `text-destructive`
  - Progress bars: Use `bg-muted` for track, `bg-success` for fill

#### Admin User Roles (Role Identification)
- **UserRolesPage.tsx** (Line 285-291)
  - Issue: Role-specific colors (SUPERADMIN: red, ADMIN_STAFF: blue, etc.)
  - Replace with semantic system or keep role-specific but use design system colors

#### Admin Organizer Details
- **OrganizerDetailsPage.tsx** (Line 233-246, 253-266, 390, 401, 410, 419, 485, 580, 597, 604, 611)
  - Status badges: Use `bg-success-light text-success`, `bg-muted text-muted-foreground`, `bg-destructive/10 text-destructive`
  - Icons: Use `text-primary`, `text-success`, `text-muted-foreground`
  - Links: Use `Button variant="link"` instead of `text-blue-600 hover:underline`
  - Stars: Use `text-muted-foreground`

#### Admin White Label Management
- **WhiteLabelManagementPage.tsx** (Line 136-140, 169, 180-181, 195-196, 210-211, 225-226, 258, 540-542)
  - Status badges and cards with hardcoded colors
  - Replace with semantic status colors

#### Admin Analytics
- **AdminAnalyticsOverview.tsx** (Line 106-152, 273-277, 365-371, 479-486, 630)
  - Analytics cards: `text-blue-600`, `text-green-600`, `text-purple-600`, `text-orange-600`
  - Consider: Keep distinct colors for data visualization but use theme tokens

#### Admin Promotions
- **AdminPromotionsPage.tsx** (Line 224, 228, 272, 274, 374, 423, 434, 603)
  - Multiple hardcoded patterns
  - Standardize with semantic colors

#### Payment Transactions
- **PaymentTransactionsPage.tsx** (Line 109-111)
  - Transaction status badges
  - Replace with semantic status colors

#### User Personal Analytics
- **PersonalAnalytics.tsx** (Line 115-134)
  - Analytics card colors: `text-blue-600`, `text-green-600`, `text-purple-600`
  - Match admin analytics approach

---

### 🟡 MEDIUM Priority - Alert Patterns & Components

#### Success/Error Alert Pattern (Multiple Files)
Files using hardcoded alert colors instead of Alert component variants:
- AdminSettingsPage.tsx (Line 752-757, 818-821, 827-830)
- AdminNotificationSettingsPage.tsx (Line 311-323, 891, 893, 902, 904)
- UserProfilePage.tsx (Line 265-268, 274-277)
- UserSettingsPage.tsx (Line 1013-1025)
- NotificationPreferencesPage.tsx (Line 214-229)

**Standard Pattern**:
```tsx
// Instead of:
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <CheckCircle className="h-5 w-5 text-green-600" />
  <span className="text-green-800">Success message</span>
</div>

// Use:
<Alert className="border-success/20 bg-success-light">
  <CheckCircle className="h-4 w-4 text-success" />
  <AlertDescription className="text-success">Success message</AlertDescription>
</Alert>
```

#### Native Checkbox Replacement
**Admin Files** (Should use shadcn Checkbox):
- AdminPromoCodeFormPage.tsx
- ServicePointPrint.tsx
- AdminAdvancedTicketTypes.tsx
- PartnershipTemplateBuilder.tsx

**User Files** (Should use shadcn Checkbox):
- DigitalWallet.tsx (Line 306-314, 325-333)
- AdvancedSearch.tsx
- EventUpdatesSubscription.tsx
- EventCollections.tsx

**Required**: Replace `<input type="checkbox">` with `<Checkbox />` from `@/components/ui/checkbox`

#### Loader Component Standardization
**Admin Files Using Loader2** (25 files):
- AdminAnalyticsOverview.tsx, PlatformFeedbackPage.tsx, ModerationPage.tsx, CreateFeaturedEventPage.tsx, FinanceDashboard.tsx, TransactionsPage.tsx, IncomePage.tsx, WagesPage.tsx, ExpensesPage.tsx, EditExpensePage.tsx, AdminPromotionsPage.tsx, AdminPromoCodeFormPage.tsx, OrganizerDetailsPage.tsx, StaffPerformanceDashboard.tsx, WhiteLabelManagementPage.tsx, OrganizerEditPage.tsx, StaffPerformanceDetail.tsx, StaffEditPage.tsx, ServicePointPrint.tsx, EditFeaturedEventPage.tsx, ServicePointEvents.tsx, ServicePointEventDashboard.tsx, StaffDetailsPage.tsx, EditWagePage.tsx, EditIncomePage.tsx

**User Files Using Loader2** (12 files):
- EventReviews.tsx, DashboardSponsors.tsx, DirectMessaging.tsx, AdvancedSearch.tsx, MyTickets.tsx, TicketTransfer.tsx, PersonalAnalytics.tsx, PersonalizedRecommendations.tsx, InterestManagement.tsx, SocialNetworking.tsx, EventCollections.tsx, DashboardMyEvent.tsx

**Required**:
- Import: `import { Loader, ButtonLoader } from "@/components/ui/loader"`
- Replace: `<Loader2 className="h-X w-X animate-spin" />` with `<Loader size="sm|md|lg" />`
- For buttons: Use `<ButtonLoader />` instead of `<Loader2 className="w-4 h-4 mr-2 animate-spin" />`
- For full page: Use `<PageLoader />` instead of Loader2 in centered div

#### Status Badge Patterns
Files with status badge hardcoded colors:
- StaffEditPage.tsx (Line 339-352)
- StaffPerformanceDashboard.tsx (Line 84-85)
- WhiteLabelManagementPage.tsx (Line 136-140)
- MyTickets.tsx (Line 158-159)
- NotificationsCenter.tsx (Line 179, 181)
- DashboardAbstracts.tsx (Line 103, 107, 168)

**Standard Pattern**: Use status color utility or semantic classes

#### Tier/Category Badge Patterns
Files with tier/category hardcoded colors:
- DashboardSponsors.tsx (Line 69-72)
- ExhibitorDetails.tsx (Line 73-76)
- DashboardExhibitors.tsx (Line 106-119)

**Consider**: Create tier color system in theme or use consistent muted colors

---

### 🟢 LOW Priority - Cosmetic Issues

#### Star Rating Colors
Files with yellow star hardcoding:
- EventReviews.tsx (Line 175)
- InterestManagement.tsx (Line 122)

**Note**: Yellow stars are acceptable UX pattern, but could use theme token

#### Price Display Colors
Files with green price colors:
- TicketResale.tsx (Line 257, 309)

**Note**: Green for prices is acceptable, but use `text-success`

#### Favorite/Like Icons
- SavedEvents.tsx (Line 147): `text-red-500 fill-red-500`

**Note**: Red hearts are acceptable UX pattern

---

### Summary Statistics

**Total Files Assessed**: ~80+ files across admin and user dashboards
- **CRITICAL Issues**: 6 files (accent-coral removal required immediately)
- **HIGH Issues**: 11 files (hardcoded color systems need semantic replacements)
- **MEDIUM Issues**: ~40+ files (alert patterns, native checkboxes, Loader2)
- **LOW Issues**: ~5 files (cosmetic, acceptable patterns)

**Next Actions**:
1. **Week 1**: Fix all CRITICAL accent-coral usages (6 files)
2. **Week 2**: Fix HIGH priority color systems (11 files)
3. **Week 3**: Standardize MEDIUM priority patterns (40+ files)
4. **Week 4**: Address LOW priority cosmetic issues as needed

**Estimated Total Work**: 2-3 weeks for full dashboard cleanup


