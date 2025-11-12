# Profile Pages Implementation Plan

## Requirements

1. **Admin Profile Page** - Personal profile (separate from system settings)
2. **Organizer Profile Page** - Enhanced with all organizer-specific info
3. **Attendee Profile Page** - Enhanced with all attendee info
4. **Role Switching** - UI in all profile pages
5. **Password Change** - Available in all profile pages

## User Information to Display

### Common Fields (All Roles)

- ✅ First Name, Last Name, Other Name
- ✅ Email (read-only)
- ✅ Phone Number
- ✅ Company Affiliation
- ✅ Account Status (ACTIVE/SUSPENDED/DEACTIVATED)
- ✅ Email Verification Status
- ✅ Last Login Date
- ✅ Account Created Date
- ✅ Account Updated Date

### Organizer-Specific Fields

- ✅ Organization Name
- ✅ Business Email
- ✅ KYC Status (PENDING/APPROVED/REJECTED)
- ✅ KYC Submitted Date
- ✅ KYC Approved Date

### Admin-Specific Fields

- ✅ Role (SUPERADMIN, ADMIN_STAFF, etc.)
- ✅ Managed Users Count (if applicable)
- ✅ System Access Level

### Attendee-Specific Fields

- ✅ Registration History
- ✅ Event Participation Stats (optional)

## Role Switching

Based on RoleViewContext:

- ✅ Organizers can switch to ATTENDEE view
- ✅ Attendees can switch to ORGANIZER view
- ✅ Admins can switch to ORGANIZER or ATTENDEE view
- ✅ Show current active view role
- ✅ Allow switching between available roles
- ✅ Show which is the actual role vs view role

## Implementation Plan

1. **Create AdminProfilePage** (`/admin/profile`)

   - Personal information section
   - Account status section
   - Security section (password change)
   - Role switching section

2. **Enhance OrganizerSettingsPage Profile Tab**

   - Add all missing fields (otherName, companyAffiliation, KYC info, etc.)
   - Add role switching
   - Add account status display

3. **Enhance UserProfilePage**

   - Add all missing fields (otherName, companyAffiliation, etc.)
   - Add role switching
   - Add account status display
   - Add registration history link

4. **Add Role Switching UI Component**
   - Reusable component for all profile pages
   - Shows current role and available roles
   - Allows switching between roles
