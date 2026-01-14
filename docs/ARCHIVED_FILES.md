# Archived Files

**Date:** 2026-01-15
**Phase:** Phase 4 Task 3 - Unused/Legacy Code Removal
**Archived By:** Claude Sonnet 4.5

---

## Summary

This document tracks files that were moved to `client/src/pages/_archived/` as part of Phase 4 cleanup. These files were not imported anywhere in the codebase and appeared to be unused legacy code.

**Total Files Archived:** 49 files (22,769 lines of code)
**Reason:** No imports found in client/src codebase
**Review Period:** 2 sprints (monitor for broken functionality)
**Permanent Deletion:** Scheduled for 2026-03-15 (if no issues found)
**Type Check Status:** ✅ Passed (no TypeScript errors after archival)

---

## Archived Files List

### Admin Pages (30 files)

#### Finance Module (14 files)
- `admin/AdminFinancialManagement.tsx` - Legacy financial overview
- `admin/finance/DisbursementsPage.tsx` - Disbursements management
- `admin/finance/EditExpensePage.tsx` - Expense editing form
- `admin/finance/EditIncomePage.tsx` - Income editing form
- `admin/finance/EditTransactionPage.tsx` - Transaction editing form
- `admin/finance/EditWagePage.tsx` - Wage editing form
- `admin/finance/EventFinanceDashboard.tsx` - Event-specific finance dashboard
- `admin/finance/ExpensesPage.tsx` - Expenses listing
- `admin/finance/FinanceDashboard.tsx` - Main finance dashboard
- `admin/finance/IncomePage.tsx` - Income listing
- `admin/finance/IncomeStatementPage.tsx` - Income statement reports
- `admin/finance/PaymentTransactionsPage.tsx` - Payment transactions
- `admin/finance/ReconciliationPage.tsx` - Payment reconciliation
- `admin/finance/RefundsPage.tsx` - Refunds management
- `admin/finance/TransactionsPage.tsx` - Transactions listing
- `admin/finance/WagesPage.tsx` - Wages management

#### Marketing Module (6 files)
- `admin/marketing/AdminCampaignsPage.tsx` - Marketing campaigns
- `admin/marketing/AdminEmailMarketingPage.tsx` - Email marketing
- `admin/marketing/AdminPartnershipsPage.tsx` - Partnerships management
- `admin/marketing/AdminPromotionsPage.tsx` - Promotions management
- `admin/marketing/AdminSocialMediaPage.tsx` - Social media management
- `admin/marketing/PartnershipDetailsPage.tsx` - Partnership details view
- `admin/marketing/PartnershipTemplateBuilder.tsx` - Template builder

#### System Module (5 files)
- `admin/system/BackupsPage.tsx` - Database backups
- `admin/system/DatabasePage.tsx` - Database management
- `admin/system/LogsPage.tsx` - System logs viewer
- `admin/system/MaintenancePage.tsx` - System maintenance
- `admin/system/SystemHealthPage.tsx` - System health monitoring

#### Analytics (1 file)
- `admin/analytics/AdminAnalyticsOverview.tsx` - Analytics overview

#### Modals/Components (2 files)
- `admin/CreateOrganizerModal.tsx` - Organizer creation modal

### Organizer Pages (15 files)

#### Analytics (5 files)
- `organizer/analytics/AnalyticsOverview.tsx` - Analytics overview
- `organizer/analytics/AttendeeInsights.tsx` - Attendee insights
- `organizer/analytics/EventPerformance.tsx` - Event performance metrics
- `organizer/analytics/RevenueReports.tsx` - Revenue reports
- `organizer/analytics/TestAnalytics.tsx` - **TEST FILE** - Development/testing page

#### Marketing (2 files)
- `organizer/marketing/OrganizerPromoCodeManager.tsx` - Promo code management
- `organizer/marketing/PromoCodeManager.tsx` - Duplicate promo code manager

#### Team Management (3 files)
- `organizer/team/RolesPermissionsPage.tsx` - Roles and permissions
- `organizer/team/TeamCalendarPage.tsx` - Team calendar
- `organizer/team/TeamPerformancePage.tsx` - Team performance metrics

#### Features (5 files)
- `organizer/CustomDomains.tsx` - Custom domain configuration
- `organizer/EmailMarketing.tsx` - Email marketing
- `organizer/Profile.tsx` - Organizer profile (possibly replaced by settings)
- `organizer/SocialMedia.tsx` - Social media integration
- `organizer/WhiteLabelBranding.tsx` - White-label branding

### Auth Pages (2 files)
- `auth/SignUp.tsx` - **Replaced by AttendeeRegistration/OrganizerRegistration in Phase 4 Task 1**
- `auth/UserTypeSelection.tsx` - User type selection (old registration flow)

### User Pages (2 files)
- `user/EventDetailView.tsx` - Event detail view (duplicate of EventDetails.tsx?)
- `user/UserSettingsPage.tsx` - User settings page

---

## Why These Files Were Archived

1. **No Active Imports:** Comprehensive codebase search found no imports of these components
2. **Not in Routes:** Not registered in App.tsx routing configuration
3. **No Dynamic Loading:** Not lazy-loaded or dynamically imported
4. **Feature Completeness:** Many features likely implemented in other pages (e.g., finance dashboard consolidated elsewhere)

---

## Files to Monitor

During the 2-sprint review period, watch for:
- Broken navigation links
- Missing functionality in admin/organizer dashboards
- User complaints about missing features
- Error logs mentioning these components

If any issues arise, files can be restored from:
- Git history (commit hash: TBD)
- `_archived/` directory (temporary storage)

---

## Next Steps

1. **Testing (Week 1):**
   - Test all admin dashboard navigation
   - Test all organizer dashboard navigation
   - Verify finance, marketing, system, analytics sections work
   - Check user profile and settings

2. **Monitoring (Weeks 2-8):**
   - Monitor error logs for missing components
   - Track user feedback about missing features
   - Review analytics for broken page requests

3. **Permanent Deletion (Week 8+):**
   - If no issues found, permanently delete `_archived/` directory
   - Update this documentation with final status
   - Close Phase 4 Task 3

---

## Recovery Instructions

If a file needs to be restored:

```bash
# Find the file in archive
ls client/src/pages/_archived/

# Move back to original location
mv client/src/pages/_archived/path/to/File.tsx client/src/pages/path/to/File.tsx

# Or restore from git
git checkout [commit-hash] -- client/src/pages/path/to/File.tsx

# Add import back to App.tsx or parent component
# Add route if needed
```

---

## Related Documentation

- [PHASE4_CONSOLIDATION_PLAN.md](./PHASE4_CONSOLIDATION_PLAN.md) - Full Phase 4 plan
- [UI_CLEANUP_IMPLEMENTATION.md](./UI_CLEANUP_IMPLEMENTATION.md) - Related cleanup work

---

**Status:** Files archived, pending 2-sprint monitoring period
**Last Updated:** 2026-01-15
