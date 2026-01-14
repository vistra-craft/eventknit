# Phase 1 Dashboard Cleanup - Detailed Action Items

**Status**: 🔴 READY FOR IMPLEMENTATION  
**Total Files to Fix**: 6 CRITICAL + 40+ Loader2 instances  
**Estimated Time**: 4-5 hours

---

## 1️⃣ PRIORITY 1 - Critical accent-coral Fixes

### File 1: ModerationPage.tsx
**Path**: `/client/src/pages/admin/ModerationPage.tsx`  
**Issue Count**: 7 instances of `accent-coral`  
**Severity**: CRITICAL

#### Changes Required:

**Change 1.1**: Badge status class (Lines 198-204)
```tsx
// BEFORE:
const getStatusBadgeClass = (status: string) => {
  const statusClasses = {
    pending: "bg-accent-coral/10 text-accent-coral border-accent-coral/20",
    rejected: "bg-accent-coral/10 text-accent-coral border-accent-coral/20",
    suspended: "bg-accent-coral/10 text-accent-coral border-accent-coral/20",
    banned: "bg-accent-coral/10 text-accent-coral border-accent-coral/20"
  }

// AFTER:
const getStatusBadgeClass = (status: string) => {
  const statusClasses = {
    pending: "bg-warning/10 text-warning border-warning/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
    suspended: "bg-destructive/10 text-destructive border-destructive/20",
    banned: "bg-destructive/10 text-destructive border-destructive/20"
  }
```

**Change 1.2**: Priority badge class (Lines 212-213)
```tsx
// BEFORE:
medium: "bg-accent-coral/10 text-accent-coral border-accent-coral/20",
high: "bg-accent-coral/10 text-accent-coral border-accent-coral/20"

// AFTER:
medium: "bg-warning/10 text-warning border-warning/20",
high: "bg-destructive/10 text-destructive border-destructive/20"
```

**Change 1.3**: Text color (Line 374)
```tsx
// BEFORE:
<div className="font-semibold text-accent-coral mb-2">

// AFTER:
<div className="font-semibold text-primary mb-2">
```

**Verify After**: 0 matches for `accent-coral` in this file

---

### File 2: MarketerDashboard.tsx
**Path**: `/client/src/pages/admin/MarketerDashboard.tsx`  
**Issue Count**: 5 instances of `accent-coral`  
**Severity**: CRITICAL

#### Changes Required:

**Change 2.1**: CTA Button (Line 163)
```tsx
// BEFORE:
<Button className="w-full bg-accent-coral hover:bg-accent-coral/90 text-white" size={isMobile ? 'default' : 'lg'}>

// AFTER:
<Button className="w-full bg-warning hover:bg-warning/90 text-white" size={isMobile ? 'default' : 'lg'}>
```

**Change 2.2**: Outline Button Hovers (Lines 169, 175, 250)
```tsx
// BEFORE:
className="w-full border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral"

// AFTER:
className="w-full border-primary text-primary hover:bg-muted hover:text-foreground hover:border-muted"
```

**Verify After**: 0 matches for `accent-coral` in this file

---

### File 3: AdminStaffSidebar.tsx
**Path**: `/client/src/pages/admin/AdminStaffSidebar.tsx`  
**Issue Count**: 4 instances of `accent-coral`  
**Severity**: CRITICAL

#### Changes Required:

**Change 3.1**: Navigation item hover (Line 184)
```tsx
// BEFORE:
className="p-2 rounded-lg hover:bg-accent-coral hover:text-white transition-colors text-muted-foreground"

// AFTER:
className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors text-muted-foreground"
```

**Change 3.2**: Conditional hover classes (Lines 214, 243, 263)
```tsx
// BEFORE:
: 'text-muted-foreground hover:bg-accent-coral hover:text-white'

// AFTER:
: 'text-muted-foreground hover:bg-muted hover:text-foreground'
```

**Verify After**: 0 matches for `accent-coral` in this file

---

### File 4: DashboardNavbar.tsx (User)
**Path**: `/client/src/pages/user/DashboardNavbar.tsx`  
**Issue Count**: 1 instance of `accent-coral`  
**Severity**: HIGH

#### Changes Required:

**Change 4.1**: Navigation item hover (Line 209)
```tsx
// BEFORE:
: "text-muted-foreground hover:bg-accent-coral hover:text-white"

// AFTER:
: "text-muted-foreground hover:bg-muted hover:text-foreground"
```

**Verify After**: 0 matches for `accent-coral` in this file

---

### File 5: CreateEventStepwise.tsx
**Path**: `/client/src/pages/CreateEventStepwise.tsx`  
**Issue Count**: 12+ instances of `accent-coral`  
**Severity**: CRITICAL

#### Changes Required:

**Change 5.1**: Multiple button hover patterns
```tsx
// BEFORE PATTERN (appears at lines 1835, 1848, 1861, 2524, 2701, 2763, 2945, 3395, 3411, 3423, 3433):
className="border border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral"

// AFTER PATTERN:
className="border border-primary text-primary hover:bg-muted hover:text-foreground hover:border-muted"
```

**Note**: This file has many similar patterns. Use multi-replace with pattern matching to fix all at once.

**Verify After**: 0 matches for `accent-coral` in this file

---

## 2️⃣ PRIORITY 2 - Loader2 Replacements (Admin Dashboards)

### Overview
Replace all `Loader2` imports and usages with `Loader` component using size prop instead of className dimensions.

### Files to Fix (14 files, ~40 instances total):

#### Batch 1: Analytics & Moderation
1. **AdminAnalyticsOverview.tsx** - 1 instance (line 331)
2. **PlatformFeedbackPage.tsx** - 4 instances (lines 200, 509, 630, 769)
3. **ModerationPage.tsx** - 6 instances (lines 574, 590, 603, 619, 665, 705)

#### Batch 2: Finance
4. **FinanceDashboard.tsx** - 1 instance (line 128)
5. **TransactionsPage.tsx** - 3 instances (lines 189, 403, etc.)
6. **EditWagePage.tsx** - 2 instances
7. **IncomePage.tsx** - 2 instances
8. **ExpensesPage.tsx** - 2 instances
9. **EditIncomePage.tsx** - 2 instances
10. **WagesPage.tsx** - 1 instance
11. **EditExpensePage.tsx** - 2 instances

#### Batch 3: Marketing & Events
12. **AdminPromotionsPage.tsx** - 2 instances
13. **AdminPromoCodeFormPage.tsx** - 2 instances
14. **CreateFeaturedEventPage.tsx** - 3 instances
15. **EditFeaturedEventPage.tsx** - 2 instances

### Replacement Pattern:
```tsx
// Step 1: Replace import
// OLD:
import { Loader2 } from 'lucide-react';

// NEW:
import { Loader } from '@/components/ui/loader';

// Step 2: Replace components
// Size mapping:
// h-4 w-4       → size="sm"
// h-5 w-5       → size="md"
// h-6 w-6       → size="lg"
// h-8 w-8       → size="xl"
// h-10 w-10     → size="xl" (approx)
// h-12 w-12     → size="2xl"

// Examples:

// BEFORE:
<Loader2 className="h-8 w-8 animate-spin text-primary" />
// AFTER:
<Loader size="xl" className="text-primary" />

// BEFORE (in buttons):
<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// AFTER:
<Loader size="sm" className="mr-2" />
```

---

## 3️⃣ PRIORITY 3 - Loader2 Replacements (User Dashboards)

### Files to Fix (12 files, ~12+ instances total):

1. **EventReviews.tsx** - 1 instance
2. **DashboardSponsors.tsx** - 1 instance
3. **DashboardMyEvent.tsx** - 1 instance
4. **DirectMessaging.tsx** - 1 instance
5. **AdvancedSearch.tsx** - 1 instance
6. **MyTickets.tsx** - 1 instance
7. **TicketTransfer.tsx** - 1 instance
8. **PersonalAnalytics.tsx** - 1 instance
9. **PersonalizedRecommendations.tsx** - 1 instance
10. **InterestManagement.tsx** - 1 instance
11. **SocialNetworking.tsx** - 1 instance
12. **EventCollections.tsx** - 1 instance

**Use same replacement pattern as Priority 2**

---

## Verification Checklist

After making all changes, verify:

```bash
# No accent-coral references
grep -r "accent-coral" client/src/pages/ --include="*.tsx"
# Should return: 0 matches

# No Loader2 imports (except in docs)
grep -r "Loader2" client/src/ --include="*.tsx" | grep -v "docs" | grep -v "CLEANUP"
# Should return: 0 matches

# All dashboards load without errors
# Check browser console for no TypeErrors
```

---

## Implementation Steps

### Step 1: Fix Critical accent-coral Files (30 min)
- [ ] ModerationPage.tsx
- [ ] MarketerDashboard.tsx
- [ ] AdminStaffSidebar.tsx
- [ ] DashboardNavbar.tsx
- [ ] CreateEventStepwise.tsx

### Step 2: Replace Admin Loader2 (45 min)
- [ ] Batch 1: Analytics & Moderation (3 files)
- [ ] Batch 2: Finance (9 files)
- [ ] Batch 3: Marketing & Events (3 files)

### Step 3: Replace User Loader2 (20 min)
- [ ] All 12 user dashboard files

### Step 4: Verification (15 min)
- [ ] Grep search for remaining issues
- [ ] Manual testing of dashboards
- [ ] Console checks for errors

---

## Expected Outcomes

After completion:
- ✅ Zero `accent-coral` references in production code (outside docs)
- ✅ Zero `Loader2` references in production code
- ✅ All dashboards use consistent design tokens
- ✅ All loaders use new `Loader` component with size prop
- ✅ Production-ready UI consistency across all dashboards

---

## Time Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Fix critical accent-coral files | 30 min |
| 2 | Replace admin Loader2 (14 files) | 45 min |
| 3 | Replace user Loader2 (12 files) | 20 min |
| 4 | Verification & testing | 15 min |
| **TOTAL** | | **2 hours** |

---

**Ready to proceed with implementation!**
