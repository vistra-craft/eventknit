# Dashboard Mock Data Audit & Implementation Status

## Summary

This document tracks which dashboard features are using real API data vs mock data.

---

## ✅ ADMIN DASHBOARD (`AdminEnhancedDashboard.tsx`)

### ✅ **Fully Implemented (Using Real APIs)**

- ✅ **Stats Grid**: Total Events, Active Staff, Organizers, Platform Revenue, System Health
  - API: `GET /api/v1/admin/dashboard/stats`
  - Status: ✅ Connected to real data
- ✅ **Recent Events**: List of recent events with organizer, date, attendees, revenue, status
  - API: `GET /api/v1/admin/dashboard/events`
  - Status: ✅ Connected to real data
- ✅ **System Alerts**: System health alerts
  - API: `GET /api/v1/admin/dashboard/alerts`
  - Status: ✅ Connected (placeholder implementation)
- ✅ **Recent Activity**: Activity logs from audit system
  - API: `GET /api/v1/admin/dashboard/activity`
  - Status: ✅ Connected to real audit logs

### ❌ **Missing Features**

- ❌ **Event Approvals UI**: Need admin page to approve/reject events
  - Backend: ✅ Exists (`POST /api/v1/events/:id/approve`, `POST /api/v1/events/:id/reject`)
  - Frontend: ❌ Need UI component
- ❌ **Attendee Management**: Revoke/remove attendees
  - Backend: ✅ Exists (`POST /api/v1/events/registrations/:id/cancel` - attendee can cancel)
  - Frontend: ❌ Need admin/organizer UI to revoke attendees

---

## ⚠️ ORGANIZER DASHBOARD (`EnhancedDashboard.tsx`)

### ✅ **Partially Implemented**

#### **Stats Grid** ✅

- Total Events, Speakers, Exhibitors, Active Attendees, Total Revenue
- API: `GET /api/v1/organizer/dashboard/stats`
- Status: ✅ Connected to real data

#### **Recent Events** ✅

- API: `GET /api/v1/organizer/dashboard/events`
- Status: ✅ Connected to real data
- Returns: speakers, exhibitors, sponsors, revenue, attendees, capacity, conversion

#### **OrganizerEventCard Component** ⚠️

- Currently uses `mockMetrics` for:
  - `attendees`, `capacity` ✅ (from API)
  - `revenue` ✅ (from API)
  - `speakers`, `exhibitors`, `sponsors` ✅ (from API)
  - `views` ❌ (hardcoded to 0 in backend)
  - `conversion` ✅ (calculated from API data)

### ❌ **Mock Data Still Used**

#### **1. Performance Insights Card** (Lines 259-300)

- ❌ Best Performing Event: "Tech Innovation Summit" (hardcoded)
- ❌ Total Revenue Growth: "+24%" (hardcoded)
- ❌ Average Attendance: "87%" (hardcoded)
- **Needs**: API endpoint for performance metrics

#### **2. Upcoming Deadlines Card** (Lines 302-343)

- ❌ Speaker Confirmations: "Business Workshop" (hardcoded)
- ❌ Abstract Submissions: "Tech Summit" (hardcoded)
- ❌ Early Bird Pricing: "Startup Competition" (hardcoded)
- **Needs**:
  - Speaker confirmation deadlines (from event data)
  - Abstract submission deadlines (new feature)
  - Early bird pricing deadlines (from ticket types)

#### **3. Event Health Score Card** (Lines 345-392)

- ❌ Overall Health Score: "92" (hardcoded)
- ❌ Registration Rate: "85%" (hardcoded)
- ❌ Speaker Confirmation: "75%" (hardcoded)
- ❌ Sponsor Engagement: "95%" (hardcoded)
- **Needs**: API endpoint to calculate health scores

---

## ⚠️ USER DASHBOARD (`DashboardHome.tsx`)

### ✅ **Partially Implemented**

#### **User Registered Events** ✅

- API: `GET /api/v1/events/user/registered`
- Status: ✅ Connected to real data

### ❌ **Mock Data Still Used**

#### **1. User Profile Section** (Lines 112-137, 283-317)

- ❌ User name, job title, company: Hardcoded to props
- ❌ User initials: From props
- **Needs**: User profile API or use authenticated user data

#### **2. Event Details View** (When event selected)

- ❌ **Sponsors Section** (Lines 214-227): Hardcoded "tietoevry", "vernost"
- ❌ **Event Features** (Lines 167-212): Links exist but no real data:
  - Speakers: `/user/dashboard?section=speakers` (no API)
  - Exhibitors: `/user/dashboard?section=exhibitors` (no API)
  - Agenda: `/user/dashboard?section=agenda` (no API)
  - My Badge: `/user/dashboard?section=badge` (no API)
  - Submit Abstract: `/user/dashboard?section=abstracts` (no API)

**Needs**:

- Speakers API: `GET /api/v1/events/:id/speakers` (speakers already in event JSON)
- Exhibitors API: `GET /api/v1/events/:id/exhibitors` (sponsors already in event JSON)
- Agenda API: `GET /api/v1/events/:id/agenda` (new feature)
- Badge API: Use template system
- Abstracts API: `POST /api/v1/events/:id/abstracts` (new feature)

---

## 📊 MISSING BACKEND APIs NEEDED

### **Organizer Dashboard**

1. ❌ **Performance Insights API**

   - `GET /api/v1/organizer/dashboard/insights`
   - Returns: Best performing event, revenue growth, average attendance

2. ❌ **Upcoming Deadlines API**

   - `GET /api/v1/organizer/dashboard/deadlines`
   - Returns: Speaker confirmations, abstract submissions, early bird pricing deadlines

3. ❌ **Event Health Score API**

   - `GET /api/v1/organizer/dashboard/health`
   - Returns: Overall health score, registration rate, speaker confirmation rate, sponsor engagement

4. ❌ **Event Views Tracking**
   - Add view tracking to Event model
   - Increment views on event page views

### **User Dashboard**

1. ❌ **User Profile API**

   - `GET /api/v1/users/profile` (get current user)
   - `PUT /api/v1/users/profile` (update profile)

2. ❌ **Event Speakers API**

   - `GET /api/v1/events/:id/speakers`
   - Returns: Speakers array from event (already in event JSON)

3. ❌ **Event Exhibitors API**

   - `GET /api/v1/events/:id/exhibitors`
   - Returns: Sponsors array from event (already in event JSON)

4. ❌ **Event Agenda API**

   - `GET /api/v1/events/:id/agenda`
   - Returns: Event sessions/schedule (new feature needed)

5. ❌ **Abstracts API**
   - `GET /api/v1/events/:id/abstracts` (user's abstracts)
   - `POST /api/v1/events/:id/abstracts` (submit abstract)
   - `PUT /api/v1/abstracts/:id` (update abstract)
   - `DELETE /api/v1/abstracts/:id` (delete abstract)

### **Admin Features**

1. ❌ **Admin Attendee Management**

   - `DELETE /api/v1/admin/events/:eventId/registrations/:registrationId`
   - Allow admin/organizer to revoke attendee registration

2. ✅ **Event Approvals** (Backend exists, need UI)
   - `POST /api/v1/events/:id/approve` ✅
   - `POST /api/v1/events/:id/reject` ✅
   - Need: Admin UI page for pending approvals

---

## 💰 FINANCIAL FEATURES

### ✅ **What Exists**

- ✅ Revenue calculation from registrations
- ✅ Payment status tracking (`PENDING`, `COMPLETED`)
- ✅ Total amount tracking per registration

### ❌ **What's Missing**

- ❌ Payment processing integration (Stripe, PayPal, etc.)
- ❌ Refund management
- ❌ Financial reports/invoices
- ❌ Commission/fee calculation
- ❌ Payout management for organizers

---

## 📱 SOCIAL MEDIA FEATURES

### ❌ **Not Implemented**

- ❌ Social media sharing (Facebook, Twitter, LinkedIn, etc.)
- ❌ Event promotion tools
- ❌ Social media integration
- ❌ Share buttons on event pages

---

## 🎫 EVENT APPROVALS

### ✅ **Backend Implemented**

- ✅ `POST /api/v1/events/:id/approve` - Approve event
- ✅ `POST /api/v1/events/:id/reject` - Reject event with reason
- ✅ Event status workflow: PENDING → APPROVED/REJECTED

### ❌ **Frontend Missing**

- ❌ Admin page to view pending events
- ❌ UI to approve/reject events
- ❌ Rejection reason input form

---

## 👥 ATTENDEE MANAGEMENT

### ✅ **What Exists**

- ✅ Attendee can cancel own registration
- ✅ Organizer can view registrations
- ✅ Registration status tracking

### ❌ **What's Missing**

- ❌ Admin/Organizer can revoke attendee registration
- ❌ Bulk attendee management
- ❌ Export attendee list
- ❌ Check-in system

---

## 📝 NEXT STEPS TO COMPLETE

### **Priority 1: Replace Mock Data in Organizer Dashboard**

1. Create Performance Insights API
2. Create Upcoming Deadlines API
3. Create Event Health Score API
4. Add event views tracking

### **Priority 2: Replace Mock Data in User Dashboard**

1. Create User Profile API
2. Extract speakers/exhibitors from event data (already available)
3. Create Event Agenda API
4. Create Abstracts API

### **Priority 3: Admin Features**

1. Create Admin Approvals UI page
2. Add attendee revocation endpoint
3. Create Admin Attendee Management UI

### **Priority 4: Additional Features**

1. Social media sharing
2. Payment processing integration
3. Financial reports


