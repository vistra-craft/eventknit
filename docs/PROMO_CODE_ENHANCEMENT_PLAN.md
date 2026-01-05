# Promo Code Marketing Enhancement Plan

## Overview

Enhance the promo code system to serve as a comprehensive marketing tool with influencer tracking, tiered discounts, and campaign attribution.

---

## Current State

### Existing Capabilities
- **Discount Types**: PERCENTAGE, FIXED_AMOUNT
- **Scopes**: PLATFORM, ORGANIZER, EVENT, MULTI_EVENT
- **Features**: Usage limits, date validity, ticket type restrictions, min order amounts, first-time only, stackable flag
- **Referral Fields**: `isReferral` boolean, `referrerUserId` (exists but underutilized)
- **Bulk Generation**: Up to 1000 codes with batch tracking
- **Analytics**: Basic stats (total codes, redemptions, discount given)

### Known Issues
- Scope field not rendering in create modal (needs investigation)
- `isReferral` and `referrerUserId` not exposed in admin UI
- No tiered discount support
- No campaign tracking

---

## Enhancement Requirements

### 1. Form UI Fix
- Ensure Scope field is visible in create/edit modal
- Both discount type AND scope must be editable

### 2. Influencer/Affiliate Tracking
- Assign promo codes to specific influencers (users)
- Track registrations per influencer
- Simple attribution reporting (no commission system)

### 3. Tiered Usage Discounts
- Dynamic discounts based on usage count
- Example: First 50 uses: 30% off, Uses 51-150: 20% off, Uses 151+: 10% off

### 4. Campaign Attribution
- Associate codes with marketing campaigns
- Filter and report by campaign

---

## Implementation Plan

### Phase 1: Database Schema Changes

**File**: `server/prisma/schema.prisma`

Add new fields to `PromoCode` model:

```prisma
model PromoCode {
  // ... existing fields ...

  // Campaign Attribution (NEW)
  campaignName   String?  // e.g., "Summer Sale 2024"
  campaignSource String?  // e.g., "Instagram", "Email", "Facebook"

  // Tiered Discounts (NEW)
  isTiered       Boolean  @default(false)
  discountTiers  Json?    // Array of {minUsage, maxUsage, discountValue, discountType}

  // ... existing relations ...
}
```

**Tiered Discount JSON Structure**:
```json
[
  { "minUsage": 0, "maxUsage": 50, "discountValue": 30, "discountType": "PERCENTAGE" },
  { "minUsage": 51, "maxUsage": 150, "discountValue": 20, "discountType": "PERCENTAGE" },
  { "minUsage": 151, "maxUsage": null, "discountValue": 10, "discountType": "PERCENTAGE" }
]
```

**Migration Command**:
```bash
npx prisma migrate dev --name add_promo_code_marketing_fields
```

---

### Phase 2: Backend Service Updates

**File**: `server/src/services/promo-code.service.ts`

#### 2.1 Update `validatePromoCode()` method

Add tiered discount calculation:

```typescript
// After checking code is valid, calculate discount
let effectiveDiscountValue = promoCode.discountValue;
let effectiveDiscountType = promoCode.discountType;

if (promoCode.isTiered && promoCode.discountTiers) {
  const tiers = promoCode.discountTiers as DiscountTier[];
  const currentUsage = promoCode.usedCount;

  // Find applicable tier based on current usage
  const applicableTier = tiers.find(tier =>
    currentUsage >= tier.minUsage &&
    (tier.maxUsage === null || currentUsage < tier.maxUsage)
  );

  if (applicableTier) {
    effectiveDiscountValue = new Decimal(applicableTier.discountValue);
    effectiveDiscountType = applicableTier.discountType;
  }
}

// Use effectiveDiscountValue and effectiveDiscountType for calculation
```

#### 2.2 Add Influencer Analytics Methods

```typescript
// Get registrations brought by an influencer's codes
async getInfluencerStats(influencerId: string) {
  const codes = await prisma.promoCode.findMany({
    where: { referrerUserId: influencerId, isReferral: true },
    include: {
      redemptions: {
        include: {
          registration: { include: { event: true, attendee: true } }
        }
      }
    }
  });

  return {
    totalCodes: codes.length,
    totalRedemptions: codes.reduce((sum, c) => sum + c.redemptions.length, 0),
    totalRevenue: codes.reduce((sum, c) =>
      sum + c.redemptions.reduce((s, r) => s + Number(r.finalAmount), 0), 0),
    registrations: codes.flatMap(c => c.redemptions)
  };
}

// Get campaign analytics
async getCampaignStats(campaignName: string) {
  const codes = await prisma.promoCode.findMany({
    where: { campaignName },
    include: { redemptions: true }
  });

  return {
    totalCodes: codes.length,
    activeCodes: codes.filter(c => c.isActive).length,
    totalRedemptions: codes.reduce((sum, c) => sum + c.redemptions.length, 0),
    totalDiscountGiven: codes.reduce((sum, c) =>
      sum + c.redemptions.reduce((s, r) => s + Number(r.discountAmount), 0), 0)
  };
}
```

---

### Phase 3: API Endpoint Updates

**File**: `server/src/controllers/admin-promo-code.controller.ts`

#### 3.1 Update Create/Update to Accept New Fields

```typescript
// In createPromoCode and updatePromoCode
const {
  // ... existing fields ...
  campaignName,
  campaignSource,
  isTiered,
  discountTiers,
  referrerUserId,  // For assigning to influencer
  isReferral
} = req.body;
```

#### 3.2 Add New Endpoints

**File**: `server/src/routes/admin-promo-code.routes.ts`

```typescript
// Influencer stats
router.get('/influencer/:userId/stats', authorize('ADMIN_STAFF'), getInfluencerStats);

// Campaign stats
router.get('/campaign/:campaignName/stats', authorize('ADMIN_STAFF'), getCampaignStats);

// List all campaigns
router.get('/campaigns', authorize('ADMIN_STAFF'), listCampaigns);

// List all influencers with codes
router.get('/influencers', authorize('ADMIN_STAFF'), listInfluencers);
```

---

### Phase 4: Frontend Admin UI Updates

**File**: `client/src/pages/admin/marketing/AdminPromotionsPage.tsx`

#### 4.1 Fix Scope Field Visibility
- Debug why scope is not rendering (possibly conditional rendering issue)
- Ensure scope select is always visible in the form

#### 4.2 Update Form State

```typescript
const [formData, setFormData] = useState<CreateAdminPromoCodeData>({
  // ... existing fields ...
  campaignName: "",
  campaignSource: "",
  isTiered: false,
  discountTiers: [],
  isReferral: false,
  referrerUserId: undefined,
});
```

#### 4.3 Add Form Sections

**Campaign Attribution Section**:
```tsx
<div className="space-y-4 border-t pt-4">
  <h4 className="font-medium">Campaign Attribution (Optional)</h4>
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Campaign Name</Label>
      <Input
        value={formData.campaignName || ""}
        onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
        placeholder="e.g., Summer Sale 2024"
      />
    </div>
    <div className="space-y-2">
      <Label>Campaign Source</Label>
      <Select value={formData.campaignSource} onValueChange={(v) => setFormData({ ...formData, campaignSource: v })}>
        <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Instagram">Instagram</SelectItem>
          <SelectItem value="Facebook">Facebook</SelectItem>
          <SelectItem value="Twitter">Twitter</SelectItem>
          <SelectItem value="Email">Email Campaign</SelectItem>
          <SelectItem value="SMS">SMS</SelectItem>
          <SelectItem value="Influencer">Influencer</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</div>
```

**Influencer Assignment Section**:
```tsx
<div className="space-y-4 border-t pt-4">
  <div className="flex items-center space-x-2">
    <Switch
      checked={formData.isReferral}
      onCheckedChange={(checked) => setFormData({ ...formData, isReferral: checked })}
    />
    <Label>Assign to Influencer/Affiliate</Label>
  </div>

  {formData.isReferral && (
    <div className="space-y-2">
      <Label>Select Influencer</Label>
      <UserSearchCombobox
        value={formData.referrerUserId}
        onValueChange={(userId) => setFormData({ ...formData, referrerUserId: userId })}
        placeholder="Search for user..."
      />
      <p className="text-xs text-muted-foreground">
        Registrations using this code will be attributed to this influencer
      </p>
    </div>
  )}
</div>
```

**Tiered Discount Section**:
```tsx
<div className="space-y-4 border-t pt-4">
  <div className="flex items-center space-x-2">
    <Switch
      checked={formData.isTiered}
      onCheckedChange={(checked) => setFormData({ ...formData, isTiered: checked, discountTiers: checked ? [] : undefined })}
    />
    <Label>Enable Tiered Discounts</Label>
  </div>

  {formData.isTiered && (
    <TieredDiscountEditor
      tiers={formData.discountTiers || []}
      onChange={(tiers) => setFormData({ ...formData, discountTiers: tiers })}
    />
  )}
</div>
```

#### 4.4 Create TieredDiscountEditor Component

```tsx
// client/src/components/TieredDiscountEditor.tsx
interface DiscountTier {
  minUsage: number;
  maxUsage: number | null;
  discountValue: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
}

function TieredDiscountEditor({ tiers, onChange }) {
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? (lastTier.maxUsage || 0) + 1 : 0;
    onChange([...tiers, { minUsage: newMin, maxUsage: null, discountValue: 10, discountType: 'PERCENTAGE' }]);
  };

  return (
    <div className="space-y-2">
      {tiers.map((tier, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded">
          <span>Uses {tier.minUsage}</span>
          <span>to</span>
          <Input type="number" value={tier.maxUsage || ""} placeholder="∞" className="w-20" ... />
          <span>:</span>
          <Input type="number" value={tier.discountValue} className="w-20" ... />
          <Select value={tier.discountType} ...>
            <SelectItem value="PERCENTAGE">%</SelectItem>
            <SelectItem value="FIXED_AMOUNT">Fixed</SelectItem>
          </Select>
          <Button variant="ghost" onClick={() => removeTier(index)}>×</Button>
        </div>
      ))}
      <Button variant="outline" onClick={addTier}>+ Add Tier</Button>
    </div>
  );
}
```

#### 4.5 Add Influencer Stats Tab/Section

New tab in admin promotions page showing:
- List of influencers with assigned codes
- Per-influencer stats: codes count, total redemptions, total revenue
- Drill-down to see specific registrations

---

### Phase 5: Update API Types

**File**: `client/src/lib/admin-promo-code-api.ts`

```typescript
export interface CreateAdminPromoCodeData {
  // ... existing fields ...
  campaignName?: string;
  campaignSource?: string;
  isTiered?: boolean;
  discountTiers?: DiscountTier[];
  isReferral?: boolean;
  referrerUserId?: string;
}

export interface DiscountTier {
  minUsage: number;
  maxUsage: number | null;
  discountValue: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
}

export interface InfluencerStats {
  userId: string;
  userName: string;
  totalCodes: number;
  totalRedemptions: number;
  totalRevenue: number;
}

export interface CampaignStats {
  campaignName: string;
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
}

// New API functions
export const getInfluencerStats = async (userId: string): Promise<ApiResponse<InfluencerStats>> => { ... };
export const getCampaignStats = async (campaignName: string): Promise<ApiResponse<CampaignStats>> => { ... };
export const listInfluencers = async (): Promise<ApiResponse<InfluencerStats[]>> => { ... };
export const listCampaigns = async (): Promise<ApiResponse<string[]>> => { ... };
```

---

## Implementation Order

### Week 1: Foundation
1. Fix scope field visibility in create modal
2. Add database fields (campaignName, campaignSource, isTiered, discountTiers)
3. Run migration
4. Update backend service for tiered discount calculation

### Week 2: Influencer Tracking
5. Expose isReferral and referrerUserId in admin UI
6. Add user search/select for influencer assignment
7. Add influencer stats endpoints
8. Create influencer stats display in admin

### Week 3: Campaign & Polish
9. Add campaign fields to UI
10. Add campaign filtering and stats
11. Add TieredDiscountEditor component
12. Testing and bug fixes

---

## Files to Modify

| File | Changes |
|------|---------|
| `server/prisma/schema.prisma` | Add campaignName, campaignSource, isTiered, discountTiers |
| `server/src/services/promo-code.service.ts` | Tiered discount logic, influencer/campaign stats |
| `server/src/controllers/admin-promo-code.controller.ts` | Handle new fields, new stats endpoints |
| `server/src/routes/admin-promo-code.routes.ts` | New routes for stats |
| `client/src/lib/admin-promo-code-api.ts` | New types and API functions |
| `client/src/pages/admin/marketing/AdminPromotionsPage.tsx` | Form updates, new sections |
| `client/src/components/TieredDiscountEditor.tsx` | New component |
| `client/src/components/UserSearchCombobox.tsx` | New component (or reuse existing) |

---

## Testing Checklist

- [ ] Create promo code with all scopes (PLATFORM, EVENT, MULTI_EVENT)
- [ ] Create tiered discount code, verify correct discount at each tier
- [ ] Assign code to influencer, verify attribution in stats
- [ ] Create codes for campaign, verify campaign filtering works
- [ ] Bulk generate codes with campaign/influencer assignment
- [ ] Verify existing codes still work (backward compatibility)
