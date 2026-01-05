# Promo Codes Documentation

## Overview

EventKnit's promo code system provides a comprehensive marketing tool for managing discounts, tracking campaigns, and attributing registrations to influencers and affiliates.

---

## Table of Contents

1. [Creating Promo Codes](#creating-promo-codes)
2. [Promo Code Types](#promo-code-types)
3. [Scopes](#scopes)
4. [Tiered Discounts](#tiered-discounts)
5. [Campaign Attribution](#campaign-attribution)
6. [Influencer Tracking](#influencer-tracking)
7. [Application & Usage](#application--usage)
8. [Validation Rules](#validation-rules)
9. [Analytics & Reporting](#analytics--reporting)
10. [API Reference](#api-reference)

---

## Creating Promo Codes

### Admin Portal

Navigate to **Admin Dashboard > Marketing > Promotions** to access the promo code management interface.

#### Single Code Creation

1. Click **Create Code** button
2. Fill in required fields:
   - **Code**: Unique alphanumeric code (auto-uppercased)
   - **Scope**: Where the code applies (Platform, Single Event, Multiple Events)
   - **Discount Type**: Percentage or Fixed Amount
   - **Discount Value**: The discount amount
   - **Valid From/Until**: Date range for code validity

3. Optional settings:
   - **Min Order Amount**: Minimum cart value required
   - **Max Discount**: Cap on discount (useful for percentage discounts)
   - **Usage Limit**: Total number of times the code can be used
   - **Max Uses Per User**: How many times one user can use it
   - **First-time customers only**: Restrict to new customers

4. Marketing settings (optional):
   - **Campaign Name**: Associate with a marketing campaign
   - **Campaign Source**: Track the source (Instagram, Email, etc.)
   - **Influencer Code**: Assign to an influencer for attribution

5. Tiered discounts (optional):
   - Enable tiered discounts for dynamic pricing based on usage

#### Bulk Code Generation

Generate multiple unique codes at once:

1. Click **Bulk Generate** button
2. Set a **Prefix** (e.g., "SUMMER") - codes will be `SUMMER-XXXXXX`
3. Set **Count** (1-1000 codes)
4. Configure discount settings (same as single codes)
5. All codes share the same settings but have unique suffixes

---

## Promo Code Types

### Discount Types

| Type | Description | Example |
|------|-------------|---------|
| **PERCENTAGE** | Percentage off the total | 20% off |
| **FIXED_AMOUNT** | Fixed amount discount | $10 off |

### Code Categories

| Category | Description |
|----------|-------------|
| **Standard** | Regular discount codes |
| **Referral** | Codes assigned to influencers for tracking |
| **Bulk** | Auto-generated codes with common prefix |
| **Tiered** | Codes with usage-based discount levels |

---

## Scopes

Scopes determine where a promo code can be used:

| Scope | Description | Created By |
|-------|-------------|------------|
| **PLATFORM** | Works on any event | Admin only |
| **ORGANIZER** | Works on all events by an organizer | Organizer |
| **EVENT** | Works on a single specific event | Organizer/Admin |
| **MULTI_EVENT** | Works on selected multiple events | Organizer/Admin |

### Scope Validation Flow

```
User applies code → System checks scope:
├─ PLATFORM → Valid for any event
├─ ORGANIZER → Check if event belongs to organizer
├─ EVENT → Check if eventId matches
└─ MULTI_EVENT → Check if eventId is in eventIds array
```

---

## Tiered Discounts

Tiered discounts allow dynamic pricing based on how many times the code has been used.

### Example Configuration

| Tier | Usage Range | Discount |
|------|-------------|----------|
| 1 | Uses 0-50 | 30% off |
| 2 | Uses 51-150 | 20% off |
| 3 | Uses 151+ | 10% off |

### How It Works

1. When a tiered code is validated, the system checks `usedCount`
2. Finds the applicable tier based on current usage
3. Applies that tier's discount type and value
4. After redemption, `usedCount` increments

### Configuration

```json
{
  "isTiered": true,
  "discountTiers": [
    { "minUsage": 0, "maxUsage": 50, "discountValue": 30, "discountType": "PERCENTAGE" },
    { "minUsage": 51, "maxUsage": 150, "discountValue": 20, "discountType": "PERCENTAGE" },
    { "minUsage": 151, "maxUsage": null, "discountValue": 10, "discountType": "PERCENTAGE" }
  ]
}
```

Note: `maxUsage: null` means unlimited (last tier continues indefinitely)

---

## Campaign Attribution

Track which marketing campaigns drive registrations.

### Fields

| Field | Description | Example |
|-------|-------------|---------|
| **campaignName** | Name of the campaign | "Summer Sale 2024" |
| **campaignSource** | Channel/source | Instagram, Email, Facebook, etc. |

### Available Sources

- Instagram
- Facebook
- Twitter/X
- TikTok
- Email Campaign
- SMS
- Influencer
- Affiliate
- Print Media
- Other

### Use Cases

1. **A/B Testing**: Create different codes for different channels to measure performance
2. **ROI Tracking**: Attribute revenue to specific campaigns
3. **Budget Allocation**: Identify best-performing marketing channels

---

## Influencer Tracking

Track registrations attributed to specific influencers.

### Setup

1. Enable **Influencer/Referral Code** toggle when creating a code
2. Enter the influencer's **User ID**
3. Share the code with the influencer

### Tracking

When a registration uses an influencer's code:
- `PromoCodeRedemption` record links the registration to the code
- `referrerUserId` identifies the influencer
- Reports can aggregate by influencer

### Use Cases

1. **Commission Calculation**: Track sales per influencer (handled externally)
2. **Performance Comparison**: Compare influencer effectiveness
3. **Campaign Analysis**: Link influencers to specific campaigns

---

## Application & Usage

### For Event Attendees

Promo codes can be applied during registration:

1. **Manual Entry**: User enters code in promo code field
2. **URL Parameter**: Auto-apply via `?promo=CODE` in event URL

### Auto-Apply via URL

Share links like:
```
https://eventknit.com/events/{eventId}?promo=SUMMER20
```

The code will be automatically validated and applied when the user reaches the registration page.

### Application Flow

```
1. User enters/auto-applies code
2. Frontend calls /api/v1/promo-codes/validate
3. Backend runs 10 validation checks
4. If valid: discount amount returned
5. User completes registration with discount
6. Backend creates PromoCodeRedemption record
7. usedCount incremented on PromoCode
```

---

## Validation Rules

When a promo code is validated, the system checks (in order):

| # | Check | Error Message |
|---|-------|---------------|
| 1 | Code exists | "Invalid promo code" |
| 2 | Code is active | "This promo code is no longer active" |
| 3 | Within valid date range | "Not valid yet" / "Expired" |
| 4 | Scope matches event | "Not valid for this event" |
| 5 | Ticket type allowed | "Not valid for this ticket type" |
| 6 | Min order amount met | "Minimum purchase required" |
| 7 | Usage limit not reached | "Code has reached max usage" |
| 8 | User usage limit not reached | "You've used this code max times" |
| 9 | First-time user (if required) | "Only for first-time customers" |
| 10 | Calculate discount | Returns discount amount |

### Discount Calculation

```
For PERCENTAGE:
  discountAmount = (totalAmount × discountValue) / 100

For FIXED_AMOUNT:
  discountAmount = discountValue

Apply cap:
  if (maxDiscount && discountAmount > maxDiscount)
    discountAmount = maxDiscount

Ensure non-negative:
  discountAmount = min(discountAmount, totalAmount)
```

---

## Analytics & Reporting

### Available Metrics

| Metric | Description |
|--------|-------------|
| **Total Codes** | Number of promo codes created |
| **Active Codes** | Currently active codes |
| **Total Redemptions** | Number of times codes were used |
| **Total Discount Given** | Sum of all discounts applied |
| **By Scope** | Breakdown by PLATFORM/EVENT/etc. |

### Per-Code Stats

- `usedCount`: Times the code has been used
- `redemptions`: List of all redemptions with:
  - User info
  - Registration info
  - Original/Final amounts
  - Discount applied
  - Timestamp

### Campaign Analytics

Filter and group codes by `campaignName` to analyze:
- Total codes per campaign
- Total redemptions per campaign
- Revenue impact
- ROI calculation

---

## API Reference

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/promo-codes/validate` | POST | Validate a promo code |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/promo-codes` | GET | List all promo codes |
| `/api/v1/admin/promo-codes` | POST | Create promo code |
| `/api/v1/admin/promo-codes/:id` | GET | Get single code |
| `/api/v1/admin/promo-codes/:id` | PUT | Update code |
| `/api/v1/admin/promo-codes/:id` | DELETE | Delete code |
| `/api/v1/admin/promo-codes/:id/toggle` | PATCH | Toggle active status |
| `/api/v1/admin/promo-codes/bulk-generate` | POST | Bulk generate codes |
| `/api/v1/admin/promo-codes/stats` | GET | Get statistics |
| `/api/v1/admin/promo-codes/batch/:batchId` | GET | Get batch codes |
| `/api/v1/admin/promo-codes/batch/:batchId` | DELETE | Delete batch |

### Request/Response Examples

#### Validate Code

```json
// POST /api/v1/promo-codes/validate
{
  "code": "SUMMER20",
  "eventId": "event-uuid",
  "ticketType": "general",
  "totalAmount": 100
}

// Response
{
  "success": true,
  "data": {
    "valid": true,
    "discountAmount": 20,
    "promoCode": {
      "id": "code-uuid",
      "code": "SUMMER20",
      "discountType": "PERCENTAGE",
      "discountValue": 20
    }
  }
}
```

#### Create Code

```json
// POST /api/v1/admin/promo-codes
{
  "code": "NEWUSER25",
  "scope": "PLATFORM",
  "discountType": "PERCENTAGE",
  "discountValue": 25,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z",
  "usageLimit": 1000,
  "maxUsesPerUser": 1,
  "firstTimeOnly": true,
  "campaignName": "New User Acquisition",
  "campaignSource": "Email"
}
```

---

## Database Schema

### PromoCode Model

```prisma
model PromoCode {
  id                    String    @id
  code                  String    @unique
  scope                 PromoCodeScope
  eventId               String?
  eventIds              String[]

  discountType          DiscountType
  discountValue         Decimal
  minOrderAmount        Decimal?
  maxDiscount           Decimal?

  isActive              Boolean
  usageLimit            Int?
  usedCount             Int
  maxUsesPerUser        Int?

  validFrom             DateTime
  validUntil            DateTime

  firstTimeOnly         Boolean
  isStackable           Boolean
  isReferral            Boolean
  referrerUserId        String?

  campaignName          String?
  campaignSource        String?
  isTiered              Boolean
  discountTiers         Json?

  codePrefix            String?
  batchId               String?

  createdAt             DateTime
  updatedAt             DateTime
  createdBy             String?
}
```

### PromoCodeRedemption Model

```prisma
model PromoCodeRedemption {
  id              String
  promoCodeId     String
  registrationId  String    @unique
  userId          String

  discountAmount  Decimal
  originalAmount  Decimal
  finalAmount     Decimal
  redeemedAt      DateTime
}
```

---

## Best Practices

### Code Naming

- Use clear, memorable codes (e.g., `SUMMER20`, `NEWUSER25`)
- For bulk codes, use descriptive prefixes (e.g., `VIP-`, `LAUNCH-`)
- Avoid confusing characters (O/0, I/l/1)

### Usage Limits

- Set appropriate limits to prevent abuse
- Use `maxUsesPerUser: 1` for most promotional codes
- Leave `usageLimit: null` for unlimited use (with caution)

### Validity Periods

- Set clear start/end dates
- Consider time zones for international events
- Don't make codes valid too far in advance

### Tiered Discounts

- Start with higher discounts to create urgency
- Ensure tiers don't overlap
- Set reasonable tier boundaries

### Campaign Tracking

- Always set campaign name/source for marketing codes
- Use consistent naming conventions
- Review analytics regularly to optimize

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Code not working | Scope mismatch | Check if code applies to this event |
| "Code expired" | Date range | Update validUntil date |
| "Usage limit reached" | usedCount >= usageLimit | Increase limit or create new code |
| Discount not applying | Min order not met | Check minOrderAmount setting |

### Debug Checklist

1. Is the code active (`isActive: true`)?
2. Is current date within valid range?
3. Does scope match the event?
4. Is usage limit reached?
5. Has user exceeded their usage limit?
6. Is total amount above minimum order?

---

## Migration Guide

### Adding Marketing Fields

If upgrading from an older version:

```bash
# Run migration
npx prisma db push

# Or create migration
npx prisma migrate dev --name add_promo_code_marketing_fields
```

New fields added:
- `campaignName` (String?)
- `campaignSource` (String?)
- `isTiered` (Boolean, default: false)
- `discountTiers` (Json?)
