import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import {
  getSubscriptionPlans,
  updateSubscriptionPlan,
  type SubscriptionPlan,
  type SubscriptionTier,
} from "@/lib/admin-api";
import { showErrorToast } from "@/lib/utils/error";
import {
  Crown,
  Zap,
  Shield,
  Save,
  Loader2,
  Check,
  Minus,
  Users,
  Edit2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_ORDER: SubscriptionTier[] = ["BASIC", "STANDARD", "PREMIUM"];

const TIER_CONFIG: Record<
  SubscriptionTier,
  { icon: React.ElementType; color: string; bgColor: string; ring: string }
> = {
  BASIC: {
    icon: Shield,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    ring: "ring-border",
  },
  STANDARD: {
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    ring: "ring-blue-300 dark:ring-blue-700",
  },
  PREMIUM: {
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    ring: "ring-amber-300 dark:ring-amber-700",
  },
};

/**
 * All gated feature keys with their display labels and the tier they're
 * naturally expected to belong to. The admin can reassign them freely.
 */
const ALL_FEATURES: { key: string; label: string; description: string; defaultTier: SubscriptionTier }[] = [
  {
    key: "attendee_list",
    label: "Attendee List Access",
    description: "View attendee names and contact info",
    defaultTier: "STANDARD",
  },
  {
    key: "export",
    label: "Basic Data Export",
    description: "Export attendee data to CSV",
    defaultTier: "STANDARD",
  },
  {
    key: "email_attendees",
    label: "Email Communication",
    description: "Send emails to consented attendees",
    defaultTier: "STANDARD",
  },
  {
    key: "forms",
    label: "Participant Forms",
    description: "Create application forms & manage participants",
    defaultTier: "STANDARD",
  },
  {
    key: "demographics",
    label: "Demographic Data",
    description: "Access demographic breakdowns and segments",
    defaultTier: "PREMIUM",
  },
  {
    key: "analytics",
    label: "Advanced Analytics",
    description: "Multi-event comparisons and trend analysis",
    defaultTier: "PREMIUM",
  },
  {
    key: "advanced_export",
    label: "Advanced Exports",
    description: "Custom export formats and scheduled reports",
    defaultTier: "PREMIUM",
  },
  {
    key: "heatmaps",
    label: "Geographic Heatmaps",
    description: "Visualise attendee location data",
    defaultTier: "PREMIUM",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(plan: SubscriptionPlan): string {
  const price = parseFloat(plan.price);
  if (price === 0) return "Free";
  return `${plan.currency} ${price.toLocaleString()}/mo`;
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  plan: SubscriptionPlan;
  onSave: (updates: { price: number; description: string; features: string[] }) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function EditDialog({ plan, onSave, onClose, saving }: EditDialogProps) {
  const [price, setPrice] = useState(plan.price);
  const [description, setDescription] = useState(plan.description ?? "");
  const [features, setFeatures] = useState<string[]>([...plan.features]);

  const toggleFeature = (key: string) =>
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );

  const handleSave = () => {
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) return;
    onSave({ price: parsed, description, features });
  };

  const cfg = TIER_CONFIG[plan.tier];
  const Icon = cfg.icon;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${cfg.bgColor}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
            </div>
            Edit {plan.name} Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Price */}
          <div className="space-y-1.5">
            <Label>
              Monthly Price ({plan.currency})
              <span className="ml-1 text-muted-foreground font-normal text-xs">
                — set 0 for free tier
              </span>
            </Label>
            <Input
              type="number"
              min={0}
              step={100}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description shown to organizers on the pricing page"
              rows={2}
            />
          </div>

          <Separator />

          {/* Feature checkboxes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Gated Features
            </Label>
            <p className="text-xs text-muted-foreground">
              Check features that organizers on this tier can access.
            </p>
            <div className="space-y-2 pt-1">
              {ALL_FEATURES.map(({ key, label, description: desc }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    checked={features.includes(key)}
                    onCheckedChange={() => toggleFeature(key)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feature Matrix ───────────────────────────────────────────────────────────

function FeatureMatrix({ plans }: { plans: SubscriptionPlan[] }) {
  const sorted = [...plans].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Comparison Matrix</CardTitle>
        <CardDescription>
          Shows which features are enabled per tier based on the current configuration above.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-48">Feature</th>
                {sorted.map((plan) => {
                  const cfg = TIER_CONFIG[plan.tier];
                  const Icon = cfg.icon;
                  return (
                    <th key={plan.tier} className="text-center py-2 px-4 font-medium">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`p-1.5 rounded-md ${cfg.bgColor} inline-flex`}>
                          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        <span className="text-xs">{plan.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map(({ key, label }) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 text-muted-foreground">{label}</td>
                  {sorted.map((plan) => (
                    <td key={plan.tier} className="text-center py-2.5 px-4">
                      {plan.features.includes(key) ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SubscriptionPlansPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingTier, setTogglingTier] = useState<SubscriptionTier | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSubscriptionPlans();
      if (response.success) setPlans(response.data.plans);
    } catch (err) {
      showErrorToast(toast, err, "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    setTogglingTier(plan.tier);
    try {
      const response = await updateSubscriptionPlan(plan.tier, { isActive: !plan.isActive });
      if (response.success) {
        setPlans((prev) => prev.map((p) => (p.tier === plan.tier ? response.data.plan : p)));
        toast({
          title: plan.isActive ? "Plan hidden" : "Plan visible",
          description: `${plan.name} is now ${plan.isActive ? "hidden from" : "visible to"} organizers.`,
        });
      }
    } catch (err) {
      showErrorToast(toast, err, "Failed to update plan status");
    } finally {
      setTogglingTier(null);
    }
  };

  const handleSave = async (updates: { price: number; description: string; features: string[] }) => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const response = await updateSubscriptionPlan(editingPlan.tier, updates);
      if (response.success) {
        setPlans((prev) => prev.map((p) => (p.tier === editingPlan.tier ? response.data.plan : p)));
        setEditingPlan(null);
        toast({ title: "Plan updated", description: `${editingPlan.name} saved.` });
      }
    } catch (err) {
      showErrorToast(toast, err, "Failed to update subscription plan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedPlans = [...plans].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  );

  if (sortedPlans.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure tier pricing, descriptions, and feature access for organizers.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No subscription plans found</p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Plans are initialised automatically on server startup. Try refreshing.
          </p>
          <button
            className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => void loadPlans()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure tier pricing, descriptions, and feature access for organizers.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {sortedPlans.map((plan) => {
          const cfg = TIER_CONFIG[plan.tier];
          const Icon = cfg.icon;
          const price = parseFloat(plan.price);

          return (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${cfg.bgColor}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-none">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant={plan.isActive ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {plan.isActive ? "Visible" : "Hidden"}
                        </Badge>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {plan.subscriberCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground -mt-0.5 -mr-1"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Price */}
                <div className="mt-3">
                  <span className="text-3xl font-extrabold">
                    {price === 0 ? "Free" : `${plan.currency} ${price.toLocaleString()}`}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground ml-1">/month</span>
                  )}
                </div>

                {plan.description && (
                  <CardDescription className="mt-1.5 text-xs">
                    {plan.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                <Separator />

                {/* Features */}
                <div className="flex-1 space-y-1.5">
                  {plan.features.length > 0 ? (
                    plan.features.map((key) => {
                      const meta = ALL_FEATURES.find((f) => f.key === key);
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span className="text-xs">
                            {meta?.label ?? key}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No additional features
                    </p>
                  )}
                </div>

                <Separator />

                {/* Visibility toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Visible to organizers
                  </span>
                  {togglingTier === plan.tier ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={() => handleToggleActive(plan)}
                      disabled={togglingTier !== null}
                    />
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Updated{" "}
                  {new Date(plan.updatedAt).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature comparison matrix */}
      <FeatureMatrix plans={sortedPlans} />

      {/* Edit dialog */}
      {editingPlan && (
        <EditDialog
          plan={editingPlan}
          onSave={handleSave}
          onClose={() => setEditingPlan(null)}
          saving={saving}
        />
      )}
    </div>
  );
};

export default SubscriptionPlansPage;
