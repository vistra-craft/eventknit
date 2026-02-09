# White Label & Branding System

This document covers the white-label branding and custom domain system on the EventKnit platform: how organizers customize their brand presence, how admins manage and approve branding, how custom domains are configured and verified, and how branded emails are rendered. It serves as both a **technical reference** for engineers and a **stakeholder guide** for understanding the white-label operations.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Branding Management](#2-branding-management)
3. [Custom Domain Management](#3-custom-domain-management)
4. [Email Branding](#4-email-branding)
5. [Workflows](#5-workflows)
6. [API Reference](#6-api-reference)
7. [Data Models](#7-data-models)
8. [Branding Fields Reference](#8-branding-fields-reference)
9. [Color Format Reference](#9-color-format-reference)

---

## 1. System Overview

### What is White Label?

White labeling allows organizers to replace EventKnit's default branding with their own — logos, colors, fonts, domain names, and email templates. Attendees see the organizer's brand instead of EventKnit's, creating a seamless experience.

### Key Participants

| Role | Actions |
|------|---------|
| **Organizer** | Submits branding, manages custom domains, configures email templates |
| **Admin** | Reviews/approves/rejects branding, verifies domains, sets up branding on behalf of organizers (assisted onboarding) |
| **Attendee** | Sees branded event pages, receives branded emails |
| **System** | Renders branded emails, resolves custom domains |

### Status Lifecycles

**Branding:** `PENDING_APPROVAL` → `ACTIVE` | `INACTIVE`

**Custom Domain:** `PENDING` → `VERIFIED` | `FAILED` | `SUSPENDED`

### Architecture

```
Organizer submits branding
       |
       v
Status: PENDING_APPROVAL, isActive: false
       |
       v
Admin reviews branding
       |
       +---> Approve: status=ACTIVE, isActive=true
       +---> Reject: status=INACTIVE, rejectionReason set
       |
       v
Active branding applied to:
  - Event pages (public)
  - Confirmation emails
  - Ticket PDFs
  - Custom domain pages
```

When an admin creates branding on behalf of an organizer (assisted onboarding), the branding is **auto-approved** — it skips the approval queue and goes directly to `ACTIVE` status.

---

## 2. Branding Management

### 2.1 Organizer Self-Service

Organizers submit their branding through the organizer dashboard. All organizer-submitted branding starts as `PENDING_APPROVAL` and requires admin review before activation.

**Service:** `WhiteLabelService.upsertBranding()`
**File:** `server/src/services/white-label.service.ts`

**Steps:**
1. Validate branding data (color formats, email formats, URL formats)
2. Upsert branding record keyed by `organizerId` (unique constraint)
3. Set status to `PENDING_APPROVAL`, `isActive` to `false`
4. Return the created/updated branding

**Validation Rules:**
- Colors must be valid hex format (e.g., `#FF5733`, `#fff`)
- Support email must be valid email format
- URLs (logos, favicon, website) must be valid URL format
- Brand name maximum length enforced at DB level

### 2.2 Admin-Assisted Onboarding

Admins can create or edit branding for any organizer. This is used for:
- Less tech-savvy organizers who need help setting up
- Assisted onboarding during initial platform setup
- Bulk setup for enterprise clients

**Service:** `WhiteLabelService.adminUpsertBranding()`

**Key Difference:** Admin-created branding is **auto-approved**:
- `status` → `ACTIVE`
- `isActive` → `true`
- `approvedBy` → admin's user ID
- `approvedAt` → current timestamp

### 2.3 Branding Approval

Admins review pending branding submissions and approve or reject them.

**Service:** `WhiteLabelService.updateBrandingStatus()`

**Approval:**
- Sets `status` to `ACTIVE`
- Sets `isActive` to `true`
- Records `approvedBy` (admin ID) and `approvedAt`
- Clears any previous `rejectionReason`

**Rejection:**
- Sets `status` to `INACTIVE`
- Sets `isActive` to `false`
- Records `rejectionReason` (required for transparency)
- Organizer can resubmit with corrections

### 2.4 Retrieving Active Branding

Public-facing pages resolve an organizer's active branding to render branded UI.

**Service:** `WhiteLabelService.getActiveBranding()`

**Logic:** Finds branding where `status = ACTIVE` AND `isActive = true` for the given `organizerId`. Returns `null` if no active branding exists (falls back to EventKnit default).

---

## 3. Custom Domain Management

### 3.1 Domain Setup

Organizers (or admins on their behalf) can configure custom domains to serve their event pages under their own domain name.

**Service:** `WhiteLabelService.addCustomDomain()`

**Steps:**
1. Validate domain format (regex: standard domain name pattern)
2. Check for duplicate domains (unique constraint)
3. Generate `verificationCode` (UUID) and `verificationToken` (UUID) for DNS verification
4. Create domain record with `status: PENDING`
5. If `isPrimary: true`, unset other primary domains for the organizer

**Example Domain:** `events.acmeevents.com`

### 3.2 DNS Verification

After adding a domain, the organizer must add a DNS TXT record containing the verification code. An admin then verifies the domain.

**Service:** `WhiteLabelService.verifyCustomDomain()`

**Verification Flow:**
```
Organizer adds domain
       |
       v
System generates verification code
       |
       v
Organizer adds DNS TXT record:
  _eventknit-verify.events.acmeevents.com → {verificationCode}
       |
       v
Admin triggers verification
       |
       +---> Success: status=VERIFIED, verifiedAt set
       +---> Failure: status=FAILED, failureReason set
```

**Domain Statuses:**
| Status | Meaning |
|--------|---------|
| `PENDING` | Domain added, awaiting DNS verification |
| `VERIFIED` | DNS verified, domain is active |
| `FAILED` | DNS verification failed (reason stored) |
| `SUSPENDED` | Domain suspended by admin (abuse, expiry, etc.) |

### 3.3 SSL Configuration

Custom domains support SSL configuration for HTTPS:
- `sslEnabled` — Whether SSL is active
- `sslCertificate` — PEM-encoded certificate
- `sslKey` — PEM-encoded private key
- `sslExpiresAt` — Certificate expiration date

### 3.4 CNAME and A Record Setup

Domains can be configured via:
- **CNAME:** Points to `cnameTarget` (e.g., `proxy.eventknit.com`)
- **A Record:** Points to `ipAddress` (for root domains)

---

## 4. Email Branding

### 4.1 Branded Email Rendering

When an organizer has active branding, all platform emails (confirmations, reminders, receipts) are wrapped in the organizer's branded template.

**Service:** `WhiteLabelService.renderBrandedEmail()`

**Rendering Logic:**
1. Look up organizer's active branding
2. If no active branding, return the original HTML unmodified
3. If branding exists, wrap the HTML in a branded template:
   - Header: logo image (if `logoUrl` set)
   - Body: original email content
   - Footer: `emailFooterText` (if set)
   - Signature: `emailSignature` (if set)
   - Colors: `primaryColor` applied to header/links, `backgroundColor` as page background, `textColor` for body text
   - Font: `fontFamily` applied to body

### 4.2 Email Template Structure

```html
<div style="background-color: {backgroundColor}; font-family: {fontFamily}">
  <!-- Header with logo -->
  <div style="background-color: {primaryColor}">
    <img src="{logoUrl}" alt="{brandName}" />
  </div>

  <!-- Email body -->
  <div style="color: {textColor}">
    {original email content}
  </div>

  <!-- Footer -->
  <div>
    <p>{emailFooterText}</p>
    <div>{emailSignature}</div>
  </div>
</div>
```

---

## 5. Workflows

### 5.1 Organizer Self-Service Workflow

```
1. Organizer navigates to branding settings in dashboard
2. Fills in brand details (logo, colors, fonts, contact info)
3. Submits → branding created as PENDING_APPROVAL
4. Admin receives notification of pending branding
5. Admin reviews in White Label admin page
6. Admin approves or rejects with reason
7. If approved, branding goes live on organizer's events
8. If rejected, organizer notified with reason, can resubmit
```

### 5.2 Admin Assisted Onboarding Workflow

```
1. Admin navigates to White Label page in admin dashboard
2. Clicks "Set Up Branding"
3. Searches for and selects an organizer
4. Fills in branding details with live preview
5. Saves → branding auto-approved and immediately active
6. Organizer's events immediately reflect the new branding
```

### 5.3 Custom Domain Workflow

```
1. Organizer (or admin) adds a custom domain
2. System generates verification code
3. Organizer adds DNS records:
   - TXT record: _eventknit-verify.{domain} → {verificationCode}
   - CNAME: {domain} → proxy.eventknit.com
4. Admin verifies the domain in the admin dashboard
5. If DNS resolves correctly → status=VERIFIED, domain is active
6. If DNS fails → status=FAILED, organizer notified with reason
```

---

## 6. API Reference

### 6.1 Admin Endpoints

All admin endpoints require `ADMIN_STAFF` or higher role. Auth enforced by `requireMinRole(UserRole.ADMIN_STAFF)` middleware on the admin router.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/white-label/brandings` | List all brandings with organizer details. Supports `status`, `isActive`, `search` query filters |
| `PUT` | `/api/v1/admin/white-label/brandings/:brandingId/status` | Approve or reject branding. Body: `{status, rejectionReason?}` |
| `GET` | `/api/v1/admin/white-label/brandings/:organizerId` | Get branding for a specific organizer |
| `PUT` | `/api/v1/admin/white-label/brandings/:organizerId` | Create/update branding for organizer (auto-approved) |
| `GET` | `/api/v1/admin/white-label/custom-domains` | List all custom domains across organizers. Supports `status`, `isActive`, `search`, `organizerId` filters |
| `POST` | `/api/v1/admin/white-label/custom-domains/:organizerId` | Add custom domain for organizer |
| `PUT` | `/api/v1/admin/white-label/custom-domains/:domainId/verify` | Verify or fail a custom domain |
| `DELETE` | `/api/v1/admin/white-label/custom-domains/:domainId` | Delete any custom domain |

### 6.2 Organizer Endpoints

All organizer endpoints require `ORGANIZER` or higher role. Scoped to the authenticated organizer's own data.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/organizer/branding` | Get own branding (creates default if none exists) |
| `PUT` | `/api/v1/organizer/branding` | Create/update own branding (sets PENDING_APPROVAL) |
| `GET` | `/api/v1/organizer/custom-domains` | List own custom domains |
| `POST` | `/api/v1/organizer/custom-domains` | Add a custom domain |
| `GET` | `/api/v1/organizer/custom-domains/:domainId` | Get specific custom domain |
| `PUT` | `/api/v1/organizer/custom-domains/:domainId` | Update custom domain settings |
| `DELETE` | `/api/v1/organizer/custom-domains/:domainId` | Delete own custom domain |

### 6.3 Search Filters

**Branding Search** (`GET /brandings`):
- `status` — Filter by `ACTIVE`, `INACTIVE`, or `PENDING_APPROVAL`
- `isActive` — Filter by activation status (`true`/`false`)
- `search` — Searches across `brandName`, `organizer.organizationName`, `organizer.email`

**Custom Domain Search** (`GET /custom-domains`):
- `status` — Filter by `PENDING`, `VERIFIED`, `FAILED`, or `SUSPENDED`
- `isActive` — Filter by activation status
- `search` — Searches across `domain`, `organizer.organizationName`, `organizer.email`
- `organizerId` — Filter to a specific organizer's domains

---

## 7. Data Models

### 7.1 WhiteLabelBranding

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | Auto-generated | Primary key |
| `organizerId` | UUID (unique) | Required | FK to User — one branding per organizer |
| `logoUrl` | String? | null | Main logo URL |
| `logoLightUrl` | String? | null | Logo for light backgrounds |
| `logoDarkUrl` | String? | null | Logo for dark backgrounds |
| `faviconUrl` | String? | null | Browser favicon URL |
| `coverImageUrl` | String? | null | Cover/hero image |
| `primaryColor` | String? | null | Primary brand color (hex) |
| `secondaryColor` | String? | null | Secondary brand color (hex) |
| `accentColor` | String? | null | Accent color (hex) |
| `backgroundColor` | String? | null | Page background color (hex) |
| `textColor` | String? | null | Primary text color (hex) |
| `linkColor` | String? | null | Link color (hex) |
| `fontFamily` | String? | null | Primary font family |
| `headingFont` | String? | null | Heading font family |
| `brandName` | String? | null | Custom brand name |
| `tagline` | String? | null | Brand tagline/slogan |
| `supportEmail` | String? | null | Custom support email |
| `supportPhone` | String? | null | Custom support phone |
| `websiteUrl` | String? | null | Organization website |
| `emailHeaderImage` | String? | null | Image for email headers |
| `emailFooterText` | String? | null | Custom email footer text |
| `emailSignature` | Text? | null | Email signature (HTML) |
| `socialLinks` | Json? | null | Social media links object |
| `status` | BrandingStatus | `PENDING_APPROVAL` | Current approval status |
| `isActive` | Boolean | `false` | Whether branding is live |
| `approvedBy` | String? | null | Admin who approved |
| `approvedAt` | DateTime? | null | When approved |
| `rejectionReason` | Text? | null | Why it was rejected |
| `metadata` | Json? | null | Additional settings |
| `createdAt` | DateTime | Auto | Record creation time |
| `updatedAt` | DateTime | Auto | Last update time |

### 7.2 CustomDomain

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | Auto-generated | Primary key |
| `organizerId` | UUID | Required | FK to User — many domains per organizer |
| `domain` | String (unique) | Required | Full domain name (e.g., `events.example.com`) |
| `subdomain` | String? | null | Subdomain component if applicable |
| `isPrimary` | Boolean | `false` | Whether this is the primary domain |
| `status` | CustomDomainStatus | `PENDING` | Current verification status |
| `verificationToken` | String? | null | Token for DNS verification |
| `verificationCode` | String? | null | Code to add to DNS TXT record |
| `verifiedAt` | DateTime? | null | When verified |
| `verifiedBy` | String? | null | Admin who verified |
| `sslEnabled` | Boolean | `false` | Whether SSL is active |
| `sslCertificate` | Text? | null | PEM-encoded SSL certificate |
| `sslKey` | Text? | null | PEM-encoded SSL private key |
| `sslExpiresAt` | DateTime? | null | SSL certificate expiration |
| `cnameTarget` | String? | null | CNAME target for DNS setup |
| `ipAddress` | String? | null | IP address for A record |
| `isActive` | Boolean | `false` | Whether domain is live |
| `lastCheckedAt` | DateTime? | null | Last DNS verification check |
| `failureReason` | Text? | null | Why verification failed |
| `metadata` | Json? | null | Additional domain metadata |
| `createdAt` | DateTime | Auto | Record creation time |
| `updatedAt` | DateTime | Auto | Last update time |

### 7.3 Enums

**BrandingStatus:**
| Value | Meaning |
|-------|---------|
| `PENDING_APPROVAL` | Submitted by organizer, awaiting admin review |
| `ACTIVE` | Approved and live |
| `INACTIVE` | Rejected or deactivated |

**CustomDomainStatus:**
| Value | Meaning |
|-------|---------|
| `PENDING` | Added, awaiting DNS verification |
| `VERIFIED` | DNS verified, domain is active |
| `FAILED` | DNS verification failed |
| `SUSPENDED` | Suspended by admin |

---

## 8. Branding Fields Reference

### Identity Fields
| Field | Purpose | Example |
|-------|---------|---------|
| `brandName` | Displayed instead of EventKnit | "Acme Events" |
| `tagline` | Shown under brand name | "Premium event experiences" |
| `logoUrl` | Main logo (used in headers, emails) | `https://cdn.example.com/logo.png` |
| `logoLightUrl` | Logo for light backgrounds | |
| `logoDarkUrl` | Logo for dark backgrounds | |
| `faviconUrl` | Browser tab icon | `https://cdn.example.com/favicon.ico` |
| `coverImageUrl` | Hero/cover image | |

### Color Fields
| Field | Purpose | Format |
|-------|---------|--------|
| `primaryColor` | Buttons, headers, links | `#1D9BF0` |
| `secondaryColor` | Secondary UI elements | `#6B7280` |
| `accentColor` | Highlights, badges | `#F59E0B` |
| `backgroundColor` | Page background | `#FFFFFF` |
| `textColor` | Body text | `#0F1419` |
| `linkColor` | Clickable links | `#1D9BF0` |

### Typography Fields
| Field | Purpose | Example |
|-------|---------|---------|
| `fontFamily` | Body text font | "Inter" |
| `headingFont` | Heading font | "Poppins" |

### Contact Fields
| Field | Purpose | Example |
|-------|---------|---------|
| `supportEmail` | Custom support email | "help@acmeevents.com" |
| `supportPhone` | Custom support phone | "+254 700 123 456" |
| `websiteUrl` | Organization website | "https://acmeevents.com" |

### Email Branding Fields
| Field | Purpose |
|-------|---------|
| `emailHeaderImage` | Image shown at top of branded emails |
| `emailFooterText` | Text shown at bottom of emails |
| `emailSignature` | HTML signature block appended to emails |

### Social Links (JSON)
Stored as a JSON object with optional keys:
```json
{
  "facebook": "https://facebook.com/acmeevents",
  "twitter": "https://twitter.com/acmeevents",
  "instagram": "https://instagram.com/acmeevents",
  "linkedin": "https://linkedin.com/company/acmeevents",
  "youtube": "https://youtube.com/@acmeevents",
  "tiktok": "https://tiktok.com/@acmeevents"
}
```

---

## 9. Color Format Reference

All color fields use **hex color format**. The service validates colors using a hex regex pattern.

**Valid formats:**
- 6-digit hex: `#FF5733`, `#1D9BF0`
- 3-digit shorthand: `#FFF`, `#000`

**Invalid formats (rejected):**
- RGB: `rgb(255, 87, 51)` — not supported
- HSL: `hsl(210, 100%, 50%)` — not supported
- Named colors: `red`, `blue` — not supported

**Validation regex:** `/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/`

When no colors are set, the platform defaults are used (EventKnit blue: `#1D9BF0`).
