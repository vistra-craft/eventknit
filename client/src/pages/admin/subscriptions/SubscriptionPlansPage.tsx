import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  X,
  Plus,
  Check,
  Users,
} from "lucide-react";

const TIER_ORDER: SubscriptionTier[] = ["BASIC", "STANDARD", "PREMIUM"];

const TIER_CONFIG: Record<SubscriptionTier, { icon: React.ElementType; color: string; bgColor: string }> = {
  BASIC: { icon: Shield, color: "text-muted-foreground", bgColor: "bg-muted" },
  STANDARD: { icon: Zap, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950" },
  PREMIUM: { icon: Crown, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950" },
};

/** Known feature keys and their display labels */
const FEATURE_LABELS: Record<string, string> = {
  attendee_list: "Attendee List Access",
  export: "Basic Data Export",
  demographics: "Demographic Data",
  analytics: "Advanced Analytics",
  advanced_export: "Advanced Exports",
};

interface PlanEditState {
  price: string;
  description: string;
  features: string[];
  newFeature: string;
}

const SubscriptionPlansPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [editState, setEditState] = useState<PlanEditState>({
    price: "",
    description: "",
    features: [],
    newFeature: "",
  });
  const [saving, setSaving] = useState(false);
  const [togglingTier, setTogglingTier] = useState<SubscriptionTier | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data.plans);
      }
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
        setPlans(prev => prev.map(p => (p.tier === plan.tier ? response.data.plan : p)));
        toast({
          title: plan.isActive ? "Plan deactivated" : "Plan activated",
          description: `${plan.name} is now ${plan.isActive ? "hidden from" : "available to"} organizers.`,
        });
      }
    } catch (err) {
      showErrorToast(toast, err, "Failed to update plan status");
    } finally {
      setTogglingTier(null);
    }
  };

  const startEditing = (plan: SubscriptionPlan) => {
    setEditingTier(plan.tier);
    setEditState({
      price: plan.price,
      description: plan.description ?? "",
      features: [...plan.features],
      newFeature: "",
    });
  };

  const cancelEditing = () => {
    setEditingTier(null);
  };

  const addFeature = () => {
    const feature = editState.newFeature.trim();
    if (feature && !editState.features.includes(feature)) {
      setEditState(prev => ({
        ...prev,
        features: [...prev.features, feature],
        newFeature: "",
      }));
    }
  };

  const removeFeature = (feature: string) => {
    setEditState(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature),
    }));
  };

  const handleSave = async () => {
    if (!editingTier) return;

    const price = parseFloat(editState.price);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Validation error",
        description: "Price must be a non-negative number",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await updateSubscriptionPlan(editingTier, {
        price,
        description: editState.description || undefined,
        features: editState.features,
      });

      if (response.success) {
        // Update local state
        setPlans(prev =>
          prev.map(p => (p.tier === editingTier ? response.data.plan : p))
        );
        setEditingTier(null);
        toast({
          title: "Plan updated",
          description: `${editingTier} plan configuration saved successfully`,
        });
      }
    } catch (err) {
      showErrorToast(toast, err, "Failed to update subscription plan");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = parseFloat(plan.price);
    if (price === 0) return "Free";
    return `${plan.currency} ${price.toFixed(2)}/month`;
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
          <p className="text-muted-foreground mt-1">
            Configure subscription tier pricing, descriptions, and feature access for organizers.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No subscription plans found</p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Subscription plans are initialised automatically on server startup. Try refreshing.
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
        <p className="text-muted-foreground mt-1">
          Configure subscription tier pricing, descriptions, and feature access for organizers.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {sortedPlans.map(plan => {
          const config = TIER_CONFIG[plan.tier];
          const Icon = config.icon;
          const isEditing = editingTier === plan.tier;

          return (
            <Card key={plan.id} className={isEditing ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {plan.subscriberCount ?? 0} subscriber{(plan.subscriberCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {isEditing ? (
                    <Input
                      value={editState.description}
                      onChange={e =>
                        setEditState(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Plan description"
                      className="text-sm"
                    />
                  ) : (
                    plan.description || "No description"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Monthly Price
                  </Label>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{plan.currency}</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editState.price}
                        onChange={e =>
                          setEditState(prev => ({ ...prev, price: e.target.value }))
                        }
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold mt-1">{formatPrice(plan)}</p>
                  )}
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Data Access Features
                  </Label>
                  <div className="mt-2 space-y-2">
                    {isEditing ? (
                      <>
                        {editState.features.map(feature => (
                          <div
                            key={feature}
                            className="flex items-center justify-between rounded-md border px-3 py-1.5"
                          >
                            <span className="text-sm">
                              {FEATURE_LABELS[feature] ?? feature}
                            </span>
                            <button
                              onClick={() => removeFeature(feature)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <select
                            value={editState.newFeature}
                            onChange={e =>
                              setEditState(prev => ({
                                ...prev,
                                newFeature: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
                          >
                            <option value="">Add feature...</option>
                            {Object.entries(FEATURE_LABELS)
                              .filter(([key]) => !editState.features.includes(key))
                              .map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addFeature}
                            disabled={!editState.newFeature}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : plan.features.length > 0 ? (
                      plan.features.map(feature => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-sm">
                            {FEATURE_LABELS[feature] ?? feature}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No data access features
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={cancelEditing} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => startEditing(plan)}
                  >
                    Edit Plan
                  </Button>
                )}

                {/* Active toggle — always visible, outside edit mode */}
                {!isEditing && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm text-muted-foreground">
                      {plan.isActive ? "Visible to organizers" : "Hidden from organizers"}
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
                )}

                {/* Metadata */}
                <p className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {new Date(plan.updatedAt).toLocaleDateString("en-US", {
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

      {/* Feature Key Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Key Reference</CardTitle>
          <CardDescription>
            These feature keys control what data organizers can access based on their subscription tier.
            The features are checked by the backend when organizers attempt to view attendee data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border p-3">
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {key}
                </Badge>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPlansPage;
