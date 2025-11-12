# Guest Checkout & Payment Flow Integration - Implementation Plan

## Overview

This plan addresses the gaps identified in the guest checkout account creation logic, with payment flow fixes scheduled for last as requested.

---

## Phase 1: Foundation & User Management Fixes

**Priority: High | Estimated Time: 4-6 hours**

### 1.1 Fix Existing User Handling

**Issue**: Existing users with passwords still receive account invitation emails, and their profile data isn't updated.

**Tasks**:

- [ ] Update `registerAsGuest` to check if existing user has password
- [ ] Skip account invitation email for users who already have passwords
- [ ] Update existing user's profile data (firstName, lastName, phoneNumber) if new data provided
- [ ] Add logic to verify existing user's email if not already verified
- [ ] Add test cases for existing user scenarios

**Files to Modify**:

- `server/src/services/event.service.ts` (lines 1684-1689, 1830-1913)

**Acceptance Criteria**:

- Existing users with passwords don't receive account invitation emails
- Existing user profile data is updated with new information from registration
- Email verification status is updated for existing users

---

### 1.2 Fix Race Condition in User Creation

**Issue**: Potential race condition when checking and creating users simultaneously.

**Tasks**:

- [ ] Wrap user creation in database transaction
- [ ] Add unique constraint handling for email conflicts
- [ ] Implement retry logic for concurrent user creation attempts
- [ ] Add proper error handling for race conditions

**Files to Modify**:

- `server/src/services/event.service.ts` (lines 1646-1681)

**Acceptance Criteria**:

- No duplicate users created even under concurrent requests
- Proper error messages for race condition scenarios
- Transaction rollback on failure

---

### 1.3 Allow Re-registration for Cancelled Registrations

**Issue**: Users cannot re-register if their previous registration was cancelled.

**Tasks**:

- [ ] Update registration check logic to allow re-registration for CANCELLED status
- [ ] Handle case where cancelled registration exists (update vs create new)
- [ ] Add test cases for cancelled registration scenarios

**Files to Modify**:

- `server/src/services/event.service.ts` (lines 1691-1703)

**Acceptance Criteria**:

- Users can re-register after cancelling previous registration
- Old cancelled registration is properly handled (either updated or archived)

---

## Phase 2: Email & Notification Improvements

**Priority: Medium | Estimated Time: 3-4 hours**

### 2.1 Fix Duplicate Ticket Emails

**Issue**: Ticket email is sent twice - once during registration and once during payment webhook.

**Tasks**:

- [ ] Remove ticket email from `registerAsGuest` for paid events
- [ ] Send "Payment Pending" email instead during registration for paid events
- [ ] Keep ticket email only in payment webhook for paid events
- [ ] For free events, keep ticket email in registration (no payment needed)
- [ ] Update email templates accordingly

**Files to Modify**:

- `server/src/services/event.service.ts` (lines 1810-1827)
- `server/src/services/payment.service.ts` (lines 222-234)
- `server/src/services/ticket.service.ts` (add new "Payment Pending" email template)

**Acceptance Criteria**:

- Paid events: "Payment Pending" email on registration, ticket email on payment confirmation
- Free events: Ticket email on registration only
- No duplicate ticket emails

---

### 2.2 Improve Email Failure Handling

**Issue**: Email failures are silent and users might not receive important emails.

**Tasks**:

- [ ] Create email retry queue/mechanism
- [ ] Add email delivery status tracking
- [ ] Add admin notification for persistent email failures
- [ ] Add user-facing error message if critical emails fail
- [ ] Implement exponential backoff for retries

**Files to Modify**:

- `server/src/services/email.service.ts` (add retry logic)
- `server/src/services/event.service.ts` (improve error handling)
- Create new: `server/src/services/email-queue.service.ts` (optional)

**Acceptance Criteria**:

- Failed emails are retried automatically
- Admin is notified of persistent failures
- Users see appropriate messages if emails fail

---

### 2.3 Add Email Resend Functionality

**Issue**: Users cannot request new account invitation if token expires.

**Tasks**:

- [ ] Create endpoint to resend account invitation email
- [ ] Invalidate old tokens when new invitation is sent
- [ ] Add rate limiting for resend requests
- [ ] Add UI button in CreateAccount page to request new invitation

**Files to Modify**:

- `server/src/services/auth.service.ts` (add resend invitation method)
- `server/src/controllers/auth.controller.ts` (add resend endpoint)
- `server/src/routes/auth.routes.ts` (add route)
- `client/src/pages/auth/CreateAccount.tsx` (add resend button)

**Acceptance Criteria**:

- Users can request new account invitation email
- Old tokens are invalidated when new one is sent
- Rate limiting prevents abuse

---

## Phase 3: Security & Validation Enhancements

**Priority: High | Estimated Time: 3-4 hours**

### 3.1 Add Rate Limiting

**Issue**: No rate limiting on guest registration and account creation endpoints.

**Tasks**:

- [ ] Add rate limiting middleware to `/register-guest` endpoint
- [ ] Add rate limiting middleware to `/create-account` endpoint
- [ ] Add rate limiting middleware to resend invitation endpoint
- [ ] Configure appropriate limits (e.g., 5 registrations per hour per IP)
- [ ] Add rate limit headers to responses

**Files to Modify**:

- `server/src/routes/event.routes.ts` (add rate limiter)
- `server/src/routes/auth.routes.ts` (add rate limiter)
- `server/src/middleware/rateLimiter.middleware.ts` (verify/update config)

**Acceptance Criteria**:

- Rate limiting prevents abuse
- Appropriate error messages for rate limit exceeded
- Limits are configurable via environment variables

---

### 3.2 Add Token Cleanup Job

**Issue**: Expired tokens accumulate in database with no cleanup.

**Tasks**:

- [ ] Create scheduled job to clean expired EmailVerification tokens
- [ ] Run cleanup daily (remove tokens expired > 7 days ago)
- [ ] Add logging for cleanup operations
- [ ] Add admin dashboard metric for token cleanup

**Files to Modify**:

- Create new: `server/src/jobs/token-cleanup.job.ts`
- `server/src/config/cron.config.ts` (add scheduled job)
- Or use existing cron system if available

**Acceptance Criteria**:

- Expired tokens are automatically cleaned up
- Cleanup runs on schedule without manual intervention
- Logs show cleanup statistics

---

### 3.3 Add Payment Validation

**Issue**: Payment webhook doesn't validate amount, email, or duplicate payments.

**Tasks**:

- [ ] Validate payment amount matches registration `totalAmount`
- [ ] Validate payment email matches attendee email
- [ ] Check registration hasn't already been paid before updating
- [ ] Add logging for validation failures
- [ ] Add admin alert for payment mismatches

**Files to Modify**:

- `server/src/services/payment.service.ts` (lines 180-220)

**Acceptance Criteria**:

- Payment amount is validated before updating registration
- Email mismatch is detected and logged
- Duplicate payments are prevented
- Admin is alerted to suspicious payments

---

## Phase 4: Database & Transaction Improvements

**Priority: High | Estimated Time: 4-5 hours**

### 4.1 Fix Capacity Race Condition

**Issue**: Capacity check and update are not atomic, allowing overbooking.

**Tasks**:

- [ ] Wrap capacity check and registration creation in transaction
- [ ] Use database-level locking (SELECT FOR UPDATE)
- [ ] Add unique constraint or optimistic locking
- [ ] Handle capacity exceeded errors gracefully
- [ ] Add test cases for concurrent registrations

**Files to Modify**:

- `server/src/services/event.service.ts` (lines 1724-1808)

**Acceptance Criteria**:

- No overbooking even under high concurrency
- Proper error messages when capacity is exceeded
- Database constraints prevent race conditions

---

### 4.2 Add Payment Timeout Mechanism

**Issue**: PENDING registrations never expire, blocking capacity indefinitely.

**Tasks**:

- [ ] Create scheduled job to cancel abandoned payments
- [ ] Cancel registrations with PENDING payment status older than 24 hours
- [ ] Restore event capacity for cancelled registrations
- [ ] Send notification email before cancellation (optional)
- [ ] Add admin dashboard for abandoned payments

**Files to Modify**:

- Create new: `server/src/jobs/payment-timeout.job.ts`
- `server/src/services/event.service.ts` (add cancel method)
- `server/src/config/cron.config.ts` (add scheduled job)

**Acceptance Criteria**:

- Abandoned payments are automatically cancelled after 24 hours
- Capacity is restored for cancelled registrations
- Users are notified (optional) before cancellation
- Admin can see abandoned payments in dashboard

---

### 4.3 Improve Registration Status Management

**Issue**: Registration status can become inconsistent with payment status.

**Tasks**:

- [ ] Add status transition validation
- [ ] Ensure registration status and payment status are always in sync
- [ ] Add status history tracking (optional)
- [ ] Add admin endpoint to manually fix status inconsistencies

**Files to Modify**:

- `server/src/services/event.service.ts` (add status validation)
- `server/src/services/payment.service.ts` (ensure status sync)

**Acceptance Criteria**:

- Registration status always matches payment status
- Status transitions are validated
- Admin can fix inconsistencies if needed

---

## Phase 5: Payment Flow Integration (LAST)

**Priority: Critical | Estimated Time: 6-8 hours**

### 5.1 Fix Guest Payment Authentication

**Issue**: Guest users cannot initialize payment because endpoint requires authentication.

**Tasks**:

- [ ] Create guest payment initialization endpoint (no auth required)
- [ ] Validate registration ownership via email + registration ID
- [ ] Add optional email verification code for extra security
- [ ] Update frontend to use guest payment endpoint
- [ ] Keep authenticated endpoint for logged-in users
- [ ] Add rate limiting for guest payment endpoint

**Files to Modify**:

- `server/src/controllers/payment.controller.ts` (add guest endpoint)
- `server/src/services/payment.service.ts` (add guest validation)
- `server/src/routes/payment.routes.ts` (add guest route)
- `client/src/lib/payment-api.ts` (add guest payment function)
- `client/src/pages/Payment.tsx` (update to use guest endpoint)

**Acceptance Criteria**:

- Guest users can initialize payment without authentication
- Registration ownership is validated via email
- Both guest and authenticated payment flows work
- Rate limiting prevents abuse

---

### 5.2 Implement Payment Rollback Mechanism

**Issue**: Registration is created before payment, with no rollback if payment fails.

**Tasks**:

- [ ] Wrap registration creation in transaction
- [ ] Add "reserved" status for registrations awaiting payment
- [ ] Implement rollback if payment initialization fails
- [ ] Add cleanup for failed payment initializations
- [ ] Update capacity management to handle reserved registrations

**Files to Modify**:

- `server/src/services/event.service.ts` (add transaction wrapping)
- `server/src/services/payment.service.ts` (add rollback logic)
- `server/prisma/schema.prisma` (consider adding RESERVED status - optional)

**Acceptance Criteria**:

- Registration creation and capacity update are atomic
- Failed payment initialization triggers rollback
- Capacity is restored if payment fails
- No orphaned registrations

---

### 5.3 Add Payment Retry & Verification

**Issue**: No retry mechanism for failed webhooks or manual verification.

**Tasks**:

- [ ] Add payment status polling endpoint for frontend
- [ ] Add manual payment verification endpoint (admin)
- [ ] Add retry mechanism for failed webhooks
- [ ] Add payment history/audit log
- [ ] Add admin dashboard for payment reconciliation

**Files to Modify**:

- `server/src/services/payment.service.ts` (add retry logic)
- `server/src/controllers/payment.controller.ts` (add polling/verification endpoints)
- `server/src/routes/payment.routes.ts` (add new routes)
- Create new: `server/src/services/payment-audit.service.ts` (optional)

**Acceptance Criteria**:

- Frontend can poll payment status
- Admin can manually verify payments
- Failed webhooks are retried
- Payment history is tracked

---

### 5.4 Improve Payment Error Handling

**Issue**: Payment errors are not well communicated to users.

**Tasks**:

- [ ] Add comprehensive error messages for payment failures
- [ ] Add payment status page for users to check status
- [ ] Add retry payment functionality
- [ ] Add support contact information for payment issues
- [ ] Improve webhook error logging

**Files to Modify**:

- `server/src/services/payment.service.ts` (improve error handling)
- `server/src/controllers/payment.controller.ts` (better error responses)
- `client/src/pages/Payment.tsx` (improve error display)
- Create new: `client/src/pages/PaymentStatus.tsx` (optional)

**Acceptance Criteria**:

- Users see clear error messages for payment failures
- Users can check payment status
- Users can retry failed payments
- Support information is easily accessible

---

## Phase 6: Testing & Documentation

**Priority: Medium | Estimated Time: 4-5 hours**

### 6.1 Add Unit Tests

**Tasks**:

- [ ] Test existing user handling scenarios
- [ ] Test race condition handling
- [ ] Test payment rollback scenarios
- [ ] Test email retry logic
- [ ] Test capacity management under concurrency

**Files to Create/Modify**:

- `server/tests/event.service.test.ts`
- `server/tests/payment.service.test.ts`
- `server/tests/auth.service.test.ts`

---

### 6.2 Add Integration Tests

**Tasks**:

- [ ] Test full guest checkout flow
- [ ] Test payment flow end-to-end
- [ ] Test email delivery
- [ ] Test webhook handling

**Files to Create/Modify**:

- `server/tests/integration/guest-checkout.test.ts`
- `server/tests/integration/payment-flow.test.ts`

---

### 6.3 Update Documentation

**Tasks**:

- [ ] Document guest checkout flow
- [ ] Document payment integration
- [ ] Document API endpoints
- [ ] Add troubleshooting guide

**Files to Create/Modify**:

- `server/docs/GUEST_CHECKOUT_FLOW.md`
- `server/docs/PAYMENT_INTEGRATION.md`
- `server/docs/API.md` (update)

---

## Implementation Order Summary

1. **Phase 1**: Foundation fixes (user handling, race conditions)
2. **Phase 2**: Email improvements (duplicate emails, retry, resend)
3. **Phase 3**: Security enhancements (rate limiting, token cleanup, validation)
4. **Phase 4**: Database improvements (capacity, timeout, status management)
5. **Phase 5**: Payment flow fixes (LAST - authentication, rollback, retry)
6. **Phase 6**: Testing & documentation

---

## Dependencies & Prerequisites

### Before Starting:

- [ ] Review current database schema
- [ ] Set up test database
- [ ] Review Paystack webhook configuration
- [ ] Review email service configuration

### External Dependencies:

- Paystack API (for payment processing)
- Email service (for sending emails)
- Cron job system (for scheduled tasks)
- Database (PostgreSQL with transaction support)

---

## Risk Assessment

### High Risk:

- Payment flow changes (Phase 5) - could break existing payments
- Database transaction changes (Phase 4) - could affect performance
- Capacity management changes (Phase 4) - could cause overbooking if not careful

### Medium Risk:

- Email changes (Phase 2) - could affect user experience
- Rate limiting (Phase 3) - could block legitimate users if misconfigured

### Low Risk:

- Token cleanup (Phase 3) - cleanup job only
- Documentation (Phase 6) - no code changes

---

## Success Metrics

- [ ] Zero orphaned registrations
- [ ] Zero duplicate ticket emails
- [ ] 100% payment success rate for valid payments
- [ ] Zero capacity overbooking
- [ ] All guest users can complete payment
- [ ] Abandoned payments cleaned up within 24 hours
- [ ] Email delivery rate > 99%

---

## Estimated Total Time: 24-32 hours

**Breakdown**:

- Phase 1: 4-6 hours
- Phase 2: 3-4 hours
- Phase 3: 3-4 hours
- Phase 4: 4-5 hours
- Phase 5: 6-8 hours (Payment - LAST)
- Phase 6: 4-5 hours

---

## Notes

- Payment handling is scheduled for Phase 5 (last) as requested
- Each phase can be implemented independently, but order is recommended
- Testing should be done after each phase
- Consider feature flags for gradual rollout
- Monitor error rates and user feedback after each phase


