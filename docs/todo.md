# TODO

## Flutter: Move Heavy Work Off Main Thread

- Identify any expensive computations, synchronous loops, or blocking I/O in widget build methods, initState, or event handlers.
- Move heavy computations to background isolates using `compute()` or custom `Isolate`.
- For network requests, database access, or file I/O, always use async/await and avoid blocking calls.
- Use `FutureBuilder` or `StreamBuilder` to update UI when background work completes.
- Profile app startup and screen transitions to find bottlenecks (use Flutter DevTools Timeline).
- Refactor code to keep the main thread (UI thread) responsive.


## Web
- Staff details: audit trail (actions history) with timestamps and actor.
- Staff details: access/role change history.
- Staff details: shift logs (check-in/out, durations).
- Staff details: KPI definitions and targets (scan speed, error rate, resolution time).
- Staff details: payout/banking status (if applicable).
- Staff details: compliance/KYC status (if required for payouts).
- Staff details: device/session activity (recent logins, device IDs, IPs).
- Staff details: security flags (failed login attempts, account lockouts).

---

## Uniform Error Handling & Confirmation Dialogs

### Problem
Error handling across the codebase is inconsistent and broken in many places:
1. **Broken `instanceof Error` pattern** — The API layer (`lib/api.ts`) throws plain `ApiError` objects (`{ success: false, message: "..." }`), NOT `Error` instances. Most catch blocks use `err instanceof Error ? err.message : 'fallback'` which misses `ApiError` and falls back to a generic message instead of showing the server's actual error.
2. **Generic toast titles** — Hundreds of toast calls use `title: "Error"` instead of context-specific titles (e.g. "Upload failed", "Save failed").
3. **Native `confirm()` dialogs** — Browser-native `confirm()` is used for destructive actions instead of proper UI confirmation dialogs.

### Solution: Reusable Helpers
A utility `extractErrorMessage` already exists at `client/src/lib/utils/error.ts` — it handles `Error` instances, plain objects with `message`, strings, and objects with `error`. Only 8 files currently use it. All others should adopt it.

**Helpers to add to `lib/utils/error.ts`:**
- `showErrorToast(err, title, fallback)` — extracts message and shows a destructive toast with a specific title
- Consider a `useApiCall()` hook that wraps async calls with loading/error/success state automatically

**For confirmation dialogs:**
- Create a reusable `<ConfirmDialog>` component (or use an `AlertDialog` from shadcn) to replace all native `confirm()` calls

### Already Fixed (tickets/registration/checkout flow)
These files have been updated to use proper error extraction and user-friendly messages:
- `client/src/pages/RegistrationConfirmation.tsx`
- `client/src/components/event-details/registration-steps/RegistrationStep.tsx`
- `client/src/components/event-details/registration-steps/PaymentStep.tsx`
- `client/src/components/event-details/registration-steps/TicketSelectionStep.tsx`
- `client/src/components/event-details/UnifiedRegistrationModal.tsx`
- `client/src/pages/RegisterEvent.tsx`
- `client/src/pages/user/TicketViewPage.tsx`
- `client/src/pages/user/UserSettingsPage.tsx`
- `server/src/services/auth.service.ts`
- `server/src/services/payment.service.ts`
- `server/src/controllers/ticket.controller.ts`
- `server/src/services/cart.service.ts`

### Remaining: Broken `instanceof Error` Pattern (~55 files)

**Hooks:**
- `hooks/useLocation.ts` — 1 occurrence
- `hooks/useUploadAvatar.ts` — 1 occurrence

**Admin Pages:**
- `pages/admin/AttendeesPage.tsx` — 4 occurrences
- `pages/admin/AttendeeDetailsPage.tsx` — 3 occurrences
- `pages/admin/StaffManagementContent.tsx` — 4 occurrences
- `pages/admin/StaffEditPage.tsx` — 1 occurrence
- `pages/admin/UserRolesPage.tsx` — 1 occurrence
- `pages/admin/AdminNotificationSettingsPage.tsx` — 5 occurrences
- `pages/admin/CommunicationsPage.tsx` — multiple
- `pages/admin/AdminSettingsPage.tsx` — 3 occurrences
- `pages/admin/OrganizerEditPage.tsx` — 1 occurrence
- `pages/admin/PlatformFeedbackPage.tsx` — 4 occurrences
- `pages/admin/organizers/OrganizerPreviewPage.tsx` — 1 occurrence
- `pages/admin/organizers/CreateOrganizerPage.tsx` — 1 occurrence
- `pages/admin/events/UpcomingEventsPage.tsx` — 2 occurrences
- `pages/admin/events/DeclinedEventsPage.tsx` — 2 occurrences
- `pages/admin/events/PendingApprovalPage.tsx` — 2 occurrences
- `pages/admin/events/PastEventsPage.tsx` — 1 occurrence
- `pages/admin/events/AllEventsPage.tsx` — 2 occurrences
- `pages/admin/events/EventDetailsPage.tsx` — 3 occurrences
- `pages/admin/events/featured/CreateFeaturedEventPage.tsx` — 1 occurrence
- `pages/admin/events/featured/EditFeaturedEventPage.tsx` — multiple
- `pages/admin/finance/AdminFinancialManagement.tsx` — multiple
- `pages/admin/service-point/ServicePointScanner.tsx` — 1 occurrence
- `pages/admin/service-point/PrinterManagement.tsx` — 6 occurrences
- `pages/admin/service-point/FacilityZones.tsx` — 5 occurrences
- `pages/admin/tickets/AdminAdvancedTicketTypes.tsx` — multiple
- `pages/admin/tickets/AdminDynamicPricing.tsx` — multiple
- `pages/admin/kyc/KYCEntityManagement.tsx` — multiple
- `pages/admin/marketing/AdminSocialMediaPage.tsx` — 1 occurrence

**Organizer Pages:**
- `pages/organizer/SubscriptionManagement.tsx` — 3 occurrences
- `pages/organizer/EventManagement.tsx` — multiple
- `pages/organizer/EventDraftsManagement.tsx` — multiple
- `pages/organizer/DynamicPricing.tsx` — multiple
- `pages/organizer/VenueManagement.tsx` — multiple
- `pages/organizer/EventTemplatesManagement.tsx` — multiple
- `pages/organizer/EventCollaboration.tsx` — multiple
- `pages/organizer/AttendeeTagsManagement.tsx` — multiple
- `pages/organizer/AttendeeSegmentation.tsx` — multiple
- `pages/organizer/AdvancedTicketTypes.tsx` — multiple
- `pages/organizer/AffiliateProgram.tsx` — multiple
- `pages/organizer/OrganizerProfileSetup.tsx` — 1 occurrence
- `pages/organizer/OrganizerBrandingPage.tsx` — multiple
- `pages/organizer/OrganizerSettingsPage.tsx` — multiple
- `pages/organizer/AttendeeCommunication.tsx` — multiple
- `pages/organizer/FinancialManagement.tsx` — multiple
- `pages/organizer/marketing/PromoCodeManager.tsx` — 7 occurrences
- `pages/organizer/marketing/OrganizerPromoCodeManager.tsx` — 7 occurrences
- `pages/organizer/team/RolesPermissions.tsx` — 4 occurrences
- `pages/organizer/team/StaffManagement.tsx` — 3 occurrences
- `pages/organizer/team/TeamCalendar.tsx` — 1 occurrence
- `pages/organizer/team/TeamPerformance.tsx` — 1 occurrence
- `pages/organizer/analytics/AnalyticsOverview.tsx` — 1 occurrence

**User Pages:**
- `pages/user/MyTickets.tsx` — 1 occurrence
- `pages/user/TicketResale.tsx` — multiple
- `pages/user/TicketTransfer.tsx` — multiple
- `pages/user/PaymentPlans.tsx` — multiple
- `pages/user/DigitalWallet.tsx` — multiple
- `pages/user/DashboardHome.tsx` — 1 occurrence
- `pages/user/SavedEvents.tsx` — 2 occurrences
- `pages/user/EventCalendarIntegration.tsx` — multiple
- `pages/user/EventUpdatesSubscription.tsx` — multiple
- `pages/user/EventReviews.tsx` — 2 occurrences
- `pages/user/DirectMessaging.tsx` — multiple
- `pages/user/NotificationsCenter.tsx` — multiple
- `pages/user/PersonalEventFeed.tsx` — multiple
- `pages/user/InterestManagement.tsx` — multiple
- `pages/user/EventCollections.tsx` — multiple
- `pages/user/NotificationPreferencesPage.tsx` — 2 occurrences
- `pages/user/PersonalAnalytics.tsx` — 1 occurrence
- `pages/user/PersonalizedRecommendations.tsx` — 1 occurrence
- `pages/user/AdvancedSearch.tsx` — 4 occurrences
- `pages/user/SocialNetworking.tsx` — 1 occurrence
- `pages/user/Invoices.tsx` — 3 occurrences
- `pages/TransferAccept.tsx` — 2 occurrences

**Components:**
- `components/AttendeeImportDialog.tsx` — 1 occurrence
- `components/EventStaffAssignment.tsx` — 2 occurrences
- `components/SeatMapSelector.tsx` — 2 occurrences
- `components/organizer/EventSeatMapManager.tsx` — 1 occurrence
- `components/organizer/ConsentStatisticsCard.tsx` — 1 occurrence
- `components/organizer/events/AttendingEventsView.tsx` — 2 occurrences
- `components/verification/VerificationForm.tsx` — 2 occurrences
- `components/admin/EventApprovalDialog.tsx` — 4 occurrences
- `components/kyc/DocumentUploadWizard.tsx` — 2 occurrences
- `components/event-details/registration-steps/ConfirmationStep.tsx` — 1 occurrence

### Remaining: Generic `title: "Error"` Toast Calls (~423 occurrences across ~80 files)
All the files listed above plus many more use `toast({ title: "Error", ... })`.
Each should use a context-specific title like "Save failed", "Upload failed", "Load failed", "Delete failed", etc.

### Remaining: Native `confirm()` Dialogs (41 occurrences across ~30 files)
Replace browser-native `confirm()` / `window.confirm()` with a proper `<AlertDialog>` component.

**Admin Pages:**
- `pages/admin/CommunicationsPage.tsx:304,379,494,619` — delete announcement/notification/template/message
- `pages/admin/AdminNotificationSettingsPage.tsx:236` — delete template
- `pages/admin/finance/AdminFinancialManagement.tsx:204,281` — delete expense/income
- `pages/admin/finance/ExpensesPage.tsx:136` — delete expense
- `pages/admin/finance/IncomePage.tsx:136` — delete income
- `pages/admin/finance/TransactionsPage.tsx:154` — delete transaction
- `pages/admin/finance/WagesPage.tsx:127` — delete wage
- `pages/admin/tickets/AdminDynamicPricing.tsx:181` — delete pricing rule
- `pages/admin/tickets/AdminAdvancedTicketTypes.tsx:200` — delete package
- `pages/admin/marketing/AdminSocialMediaPage.tsx:128` — delete post
- `pages/admin/service-point/ServicePointTemplates.tsx:349` — delete template
- `pages/admin/service-point/FacilityZones.tsx:253` — delete zone
- `pages/admin/white-label/CustomDomainsTab.tsx:172` — delete domain
- `pages/admin/kyc/KYCEntityManagement.tsx:275` — delete requirement

**Organizer Pages:**
- `pages/organizer/EventDraftsManagement.tsx:103,146` — publish/delete draft
- `pages/organizer/DynamicPricing.tsx:139` — delete pricing rule
- `pages/organizer/VenueManagement.tsx:108` — delete venue
- `pages/organizer/EventTemplatesManagement.tsx:120` — delete template
- `pages/organizer/EventCollaboration.tsx:170` — remove collaborator
- `pages/organizer/AdvancedTicketTypes.tsx:157` — delete package
- `pages/organizer/AttendeeSegmentation.tsx:179` — delete segment
- `pages/organizer/AttendeeTagsManagement.tsx:181` — delete tag
- `pages/organizer/marketing/PromoCodeManager.tsx:256` — delete promo code
- `pages/organizer/marketing/OrganizerPromoCodeManager.tsx:199` — delete promo code

**User Pages:**
- `pages/user/DigitalWallet.tsx:104` — remove ticket from wallet
- `pages/user/TicketResale.tsx:234` — cancel listing
- `pages/user/PaymentPlans.tsx:116` — cancel payment plan
- `pages/user/EventCalendarIntegration.tsx:106` — remove calendar sync
- `pages/user/EventUpdatesSubscription.tsx:98` — unsubscribe from event

**Components:**
- `components/event-details/UnifiedRegistrationModal.tsx:188` — cancel registration
- `components/EventStaffAssignment.tsx:212` — remove staff
- `components/organizer/EventSeatMapManager.tsx:136` — remove seat map
- `components/kyc/DocumentUploadWizard.tsx:190` — delete document
- `components/kyc/DirectorsForm.tsx:96` — remove director

### Execution Plan
1. Add `showErrorToast()` helper to `lib/utils/error.ts`
2. Create reusable `<ConfirmDialog>` component (or use shadcn `AlertDialog`)
3. Fix files section by section:
   - **User pages** (user-facing, highest impact)
   - **Organizer pages**
   - **Admin pages**
   - **Hooks and components**
4. For each file: import `extractErrorMessage` (or `showErrorToast`), replace broken patterns, replace generic toast titles, replace `confirm()` with `<ConfirmDialog>`
