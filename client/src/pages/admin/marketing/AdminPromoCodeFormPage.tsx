import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "../AdminLayout";
import {
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import {
  getAdminPromoCodeById,
  createAdminPromoCode,
  updateAdminPromoCode,
  type PromoCodeScope,
  type DiscountType,
  type CreateAdminPromoCodeData,
} from "@/lib/admin-promo-code-api";
import { getEvents, EventStatus } from "@/lib/event-api";

const AdminPromoCodeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);

  const [formData, setFormData] = useState<CreateAdminPromoCodeData>({
    code: "",
    scope: "PLATFORM",
    discountType: "PERCENTAGE",
    discountValue: 0,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
    firstTimeOnly: false,
    isStackable: false,
    isReferral: false,
    referrerUserId: undefined,
    campaignName: "",
    campaignSource: "",
    isTiered: false,
    discountTiers: [],
  });

  const loadData = useCallback(async () => {
    try {
      const eventsRes = await getEvents({ status: EventStatus.APPROVED, limit: 100 });
      if (eventsRes.success && eventsRes.data?.events) {
        setEvents(eventsRes.data.events.map((e) => ({ id: e.id, title: e.title })));
      }

      if (isEditing && id) {
        setLoading(true);
        const res = await getAdminPromoCodeById(id);
        if (res.success && res.data) {
          const code = res.data;
          setFormData({
            code: code.code,
            scope: code.scope,
            eventId: code.eventId,
            eventIds: code.eventIds,
            discountType: code.discountType,
            discountValue: code.discountValue,
            minOrderAmount: code.minOrderAmount,
            maxDiscount: code.maxDiscount,
            usageLimit: code.usageLimit,
            maxUsesPerUser: code.maxUsesPerUser,
            validFrom: new Date(code.validFrom).toISOString().slice(0, 16),
            validUntil: new Date(code.validUntil).toISOString().slice(0, 16),
            isActive: code.isActive,
            firstTimeOnly: code.firstTimeOnly,
            isStackable: code.isStackable,
            isReferral: code.isReferral,
            referrerUserId: code.referrerUserId,
            campaignName: code.campaignName || "",
            campaignSource: code.campaignSource || "",
            isTiered: code.isTiered,
            discountTiers: code.discountTiers || [],
          });
        } else {
          toast({ title: "Error", description: "Promo code not found", variant: "destructive" });
          navigate("/admin/marketing/promo-codes");
        }
      }
    } catch (err: unknown) {
      console.error("Error loading data:", err);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, isEditing, navigate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code) {
      toast({ title: "Error", description: "Code is required", variant: "destructive" });
      return;
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      toast({ title: "Error", description: "Discount value must be greater than 0", variant: "destructive" });
      return;
    }

    if (formData.discountType === "PERCENTAGE" && formData.discountValue > 100) {
      toast({ title: "Error", description: "Percentage discount cannot exceed 100%", variant: "destructive" });
      return;
    }

    if (formData.scope === "EVENT" && !formData.eventId) {
      toast({ title: "Error", description: "Please select an event for single-event scope", variant: "destructive" });
      return;
    }

    if (formData.scope === "MULTI_EVENT" && (!formData.eventIds || formData.eventIds.length === 0)) {
      toast({ title: "Error", description: "Please select at least one event for multi-event scope", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = isEditing && id
        ? await updateAdminPromoCode(id, formData)
        : await createAdminPromoCode(formData);

      if (response.success) {
        toast({ title: "Success", description: isEditing ? "Promo code updated" : "Promo code created" });
        navigate("/admin/marketing/promo-codes");
      } else {
        toast({ title: "Error", description: response.message || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save promo code", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/marketing/promo-codes")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {isEditing ? "Edit Promo Code" : "Create Promo Code"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? "Update the promo code details" : "Create a new promotional code"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/marketing/promo-codes")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader size="sm" className="mr-2" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Scope *</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(v) => setFormData({ ...formData, scope: v as PromoCodeScope, eventId: undefined, eventIds: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLATFORM">Platform-wide</SelectItem>
                    <SelectItem value="EVENT">Single Event</SelectItem>
                    <SelectItem value="MULTI_EVENT">Multiple Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.scope === "EVENT" && (
              <div className="mt-4 space-y-2">
                <Label>Event *</Label>
                <Select value={formData.eventId} onValueChange={(v) => setFormData({ ...formData, eventId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.scope === "MULTI_EVENT" && (
              <div className="mt-4 space-y-2">
                <Label>Select Events * ({(formData.eventIds || []).length} selected)</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {events.map((e) => (
                    <label key={e.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={(formData.eventIds || []).includes(e.id)}
                        onCheckedChange={(checked) => {
                          const ids = formData.eventIds || [];
                          setFormData({
                            ...formData,
                            eventIds: checked ? [...ids, e.id] : ids.filter(i => i !== e.id)
                          });
                        }}
                      />
                      <span className="text-sm">{e.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount Settings */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Discount Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v as DiscountType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountValue === 0 ? "" : formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.discountType === "PERCENTAGE" ? "10" : "5.00"}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount || ""}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || undefined })}
                  placeholder="No minimum"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Discount</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxDiscount || ""}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || undefined })}
                  placeholder="No cap"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage & Validity */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Usage Limits & Validity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Total Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.usageLimit || ""}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || undefined })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label>Per User</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxUsesPerUser || ""}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || undefined })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Valid From *</Label>
                <Input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until *</Label>
                <Input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.firstTimeOnly}
                  onCheckedChange={(v) => setFormData({ ...formData, firstTimeOnly: v })}
                />
                <span className="text-sm">First-time only</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Campaign & Tracking */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Campaign & Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Select
                  value={formData.campaignSource || ""}
                  onValueChange={(v) => setFormData({ ...formData, campaignSource: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Twitter">Twitter/X</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Influencer">Influencer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.isReferral}
                  onCheckedChange={(v) => setFormData({ ...formData, isReferral: v, referrerUserId: v ? formData.referrerUserId : undefined })}
                />
                <span className="text-sm">This is an influencer/referral code</span>
              </label>
              {formData.isReferral && (
                <div className="mt-3 space-y-2">
                  <Label>Influencer User ID</Label>
                  <Input
                    value={formData.referrerUserId || ""}
                    onChange={(e) => setFormData({ ...formData, referrerUserId: e.target.value || undefined })}
                    placeholder="Enter user ID"
                    className="max-w-md"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tiered Discounts */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Tiered Discounts</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.isTiered}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    isTiered: v,
                    discountTiers: v ? [{ minUsage: 0, maxUsage: 50, discountValue: 30, discountType: "PERCENTAGE" as DiscountType }] : []
                  })}
                />
                <span className="text-sm">Enable</span>
              </label>
            </div>

            {formData.isTiered && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Discount changes based on total code usage count
                </p>
                {(formData.discountTiers || []).map((tier, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Tier {index + 1}:</span>
                    <span className="text-sm">Uses</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-20 h-8"
                      value={tier.minUsage}
                      onChange={(e) => {
                        const tiers = [...(formData.discountTiers || [])];
                        tiers[index] = { ...tier, minUsage: parseInt(e.target.value) || 0 };
                        setFormData({ ...formData, discountTiers: tiers });
                      }}
                    />
                    <span className="text-sm">to</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-20 h-8"
                      value={tier.maxUsage === null ? "" : tier.maxUsage}
                      placeholder="∞"
                      onChange={(e) => {
                        const tiers = [...(formData.discountTiers || [])];
                        tiers[index] = { ...tier, maxUsage: e.target.value === "" ? null : parseInt(e.target.value) };
                        setFormData({ ...formData, discountTiers: tiers });
                      }}
                    />
                    <span className="text-sm">=</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-20 h-8"
                      value={tier.discountValue}
                      onChange={(e) => {
                        const tiers = [...(formData.discountTiers || [])];
                        tiers[index] = { ...tier, discountValue: parseFloat(e.target.value) || 0 };
                        setFormData({ ...formData, discountTiers: tiers });
                      }}
                    />
                    <Select
                      value={tier.discountType}
                      onValueChange={(v) => {
                        const tiers = [...(formData.discountTiers || [])];
                        tiers[index] = { ...tier, discountType: v as DiscountType };
                        setFormData({ ...formData, discountTiers: tiers });
                      }}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">%</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">$</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        const tiers = (formData.discountTiers || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, discountTiers: tiers, isTiered: tiers.length > 0 });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tiers = formData.discountTiers || [];
                    const lastTier = tiers[tiers.length - 1];
                    setFormData({
                      ...formData,
                      discountTiers: [
                        ...tiers,
                        { minUsage: lastTier ? (lastTier.maxUsage || 0) + 1 : 0, maxUsage: null, discountValue: 10, discountType: "PERCENTAGE" as DiscountType }
                      ]
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Tier
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPromoCodeFormPage;
