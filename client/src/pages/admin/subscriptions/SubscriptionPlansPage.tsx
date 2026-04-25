import React, { useState, useEffect, useCallback } from "react";
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
import { Crown, Zap, Shield, Building2, Save, Loader2, Check, Minus, Users, Edit2, Clock } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_ORDER: SubscriptionTier[] = ["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"];

const TIER_CONFIG: Record<SubscriptionTier, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  priceSuffix: string;
}> = {
  BASIC:      { icon: Shield,    color: "text-muted-foreground", bgColor: "bg-muted",                           priceSuffix: "forever" },
  STANDARD:   { icon: Zap,       color: "text-blue-600",         bgColor: "bg-blue-50 dark:bg-blue-950",        priceSuffix: "/month"  },
  PREMIUM:    { icon: Crown,     color: "text-amber-600",        bgColor: "bg-amber-50 dark:bg-amber-950",      priceSuffix: "/month"  },
  ENTERPRISE: { icon: Building2, color: "text-purple-600",       bgColor: "bg-purple-50 dark:bg-purple-950",    priceSuffix: "/month"  },
};

/**
 * Every gated feature key with metadata for the admin UI.
 * `comingSoon` = not yet built but already gated in the tier structure.
 */
const ALL_FEATURES: {
  key: string;
  label: string;
  description: string;
  defaultTier: SubscriptionTier;
  comingSoon?: boolean;
}[] = [
  // ── STANDARD ──────────────────────────────────────────────────────────────
  { key: "attendee_list",              label: "Attendee List Access",           description: "View attendee names and contact info",                                      defaultTier: "STANDARD" },
  { key: "export",                     label: "CSV Data Export",                description: "Export attendee data to CSV",                                               defaultTier: "STANDARD" },
  { key: "email_attendees",            label: "Email Communication",            description: "Send emails to consented attendees",                                        defaultTier: "STANDARD" },
  { key: "forms",                      label: "Participant Forms & People",      description: "Build application forms and manage speakers, sponsors, exhibitors",         defaultTier: "STANDARD" },
  { key: "custom_branding",            label: "Custom Branding",                description: "Remove EventKnit branding, add your own colours and logo",                  defaultTier: "STANDARD" },
  { key: "promo_codes",                label: "Promotional Codes",              description: "Discount codes (% off, fixed amount, BOGO)",                               defaultTier: "STANDARD" },
  { key: "whatsapp_delivery",          label: "WhatsApp Ticket Delivery",       description: "Send tickets directly to attendees via WhatsApp",                           defaultTier: "STANDARD" },
  { key: "whatsapp_reminders",         label: "WhatsApp Event Reminders",       description: "Automated reminders 24h and 1h before event",                              defaultTier: "STANDARD" },
  { key: "team_members",               label: "Team Members (up to 5)",         description: "Add check-in staff and managers with role-based access",                    defaultTier: "STANDARD" },
  { key: "tracking_links",             label: "Tracking Links",                 description: "UTM tracking links per channel (WhatsApp, Instagram, email)",               defaultTier: "STANDARD" },
  { key: "on_site_sales",              label: "On-Site Ticket Sales",           description: "Sell walk-in tickets at the door via M-Pesa or cash",                      defaultTier: "STANDARD" },
  { key: "multi_day_events",           label: "Multi-Day Events",               description: "Events that span multiple days (conferences, festivals)",                   defaultTier: "STANDARD" },
  { key: "event_templates",            label: "Event Templates & Duplication",  description: "Duplicate past events and save templates for reuse",                        defaultTier: "STANDARD" },
  { key: "offline_scanning",           label: "Offline QR Scanning",            description: "Scan tickets without internet — syncs when back online",                   defaultTier: "STANDARD" },
  { key: "realtime_checkin_dashboard", label: "Real-Time Check-In Dashboard",   description: "Live attendee count and capacity view on the organizer screen",            defaultTier: "STANDARD" },
  { key: "post_event_survey",          label: "Post-Event Survey",              description: "Collect attendee feedback automatically after the event",                   defaultTier: "STANDARD" },

  // ── PREMIUM ───────────────────────────────────────────────────────────────
  { key: "demographics",              label: "Demographic Data",               description: "Segment breakdowns by age, gender, location",                              defaultTier: "PREMIUM" },
  { key: "analytics",                 label: "Advanced Analytics",             description: "Traffic sources, geographic breakdown, repeat vs new, cohort analysis",    defaultTier: "PREMIUM" },
  { key: "advanced_export",           label: "Advanced Exports",               description: "Excel, custom formats, and scheduled automatic exports",                   defaultTier: "PREMIUM" },
  { key: "heatmaps",                  label: "Geographic Heatmaps",            description: "Visualise where your attendees travel from",                               defaultTier: "PREMIUM" },
  { key: "whatsapp_ai_registration",  label: "WhatsApp AI Registration",       description: "Attendees text your number on WhatsApp and get tickets conversationally",  defaultTier: "PREMIUM", comingSoon: true },
  { key: "whatsapp_broadcast",        label: "WhatsApp Broadcast",             description: "Send bulk messages to past attendees for new events",                      defaultTier: "PREMIUM" },
  { key: "promoter_network",          label: "Promoter & Affiliate Network",   description: "Add promoters who earn a commission per ticket sold",                      defaultTier: "PREMIUM", comingSoon: true },
  { key: "recurring_events",          label: "Recurring Events",               description: "Set up daily / weekly / monthly recurring event series",                   defaultTier: "PREMIUM", comingSoon: true },
  { key: "seating_plans",             label: "Seating Plan Builder",           description: "Drag-and-drop seating plan for theaters, galas, and conferences",          defaultTier: "PREMIUM", comingSoon: true },
  { key: "embed_widget",              label: "Embed Widget",                   description: "Sell tickets directly on your own website via an iframe",                  defaultTier: "PREMIUM", comingSoon: true },
  { key: "api_access",                label: "API Access & Webhooks",          description: "REST API and webhooks for custom integrations",                            defaultTier: "PREMIUM" },
  { key: "split_payouts",             label: "Split Payouts",                  description: "Distribute revenue between multiple recipients (e.g. venue + organizer)", defaultTier: "PREMIUM", comingSoon: true },
  { key: "priority_support",          label: "Priority Support",               description: "24h response time from the EventKnit support team",                       defaultTier: "PREMIUM" },
  { key: "tax_reports",               label: "Tax Reports & Invoicing",        description: "KRA-ready tax reports and invoice generation per event",                   defaultTier: "PREMIUM", comingSoon: true },
  { key: "event_comparison",          label: "Event Comparison",               description: "Compare metrics across your event history",                                defaultTier: "PREMIUM" },
  { key: "revenue_forecast",          label: "Revenue Payout Forecast",        description: "Estimated payout date and amount after fees",                              defaultTier: "PREMIUM" },
  { key: "social_login",              label: "Social Login for Attendees",     description: "Google / Apple sign-in at attendee checkout",                              defaultTier: "PREMIUM" },
  { key: "retargeting_pixels",        label: "Retargeting Pixels",             description: "Pass Meta Pixel and Google Tag through event pages",                       defaultTier: "PREMIUM" },
  { key: "early_payout",              label: "Early Payout Request",           description: "Request partial payout before the event date",                             defaultTier: "PREMIUM" },
  { key: "unlimited_team",            label: "Unlimited Team Members",         description: "No cap on team size (Standard is limited to 5)",                          defaultTier: "PREMIUM" },

  // ── ENTERPRISE ────────────────────────────────────────────────────────────
  { key: "white_label",               label: "White-Label / Custom Domain",    description: "Full white-label platform under your own brand and domain",               defaultTier: "ENTERPRISE" },
  { key: "custom_integrations",       label: "Custom Integrations",            description: "Salesforce, HubSpot, or bespoke CRM/ERP connections",                     defaultTier: "ENTERPRISE" },
  { key: "sso",                       label: "SSO / SAML",                     description: "Single sign-on via your company identity provider",                        defaultTier: "ENTERPRISE" },
  { key: "dedicated_support",         label: "Dedicated Account Manager",      description: "Named account manager + guaranteed SLA",                                   defaultTier: "ENTERPRISE" },
  { key: "on_site_hardware",          label: "On-Site Hardware & Field Team",  description: "Scanner/printer rental and EventKnit field support at your venue",        defaultTier: "ENTERPRISE" },
  { key: "agency_management",         label: "Agency Sub-Account Management",  description: "Manage multiple organizer accounts under one agency login",               defaultTier: "ENTERPRISE" },
  { key: "custom_analytics",          label: "Custom Analytics / Data Warehouse", description: "Data warehouse export and custom reporting dashboards",               defaultTier: "ENTERPRISE" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(plan: SubscriptionPlan): string {
  const price = parseFloat(plan.price);
  if (price === 0) return "Free";
  if (plan.tier === "ENTERPRISE") return `KES ${price.toLocaleString()}+`;
  return `KES ${price.toLocaleString()}`;
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditDialog({
  plan,
  onSave,
  onClose,
  saving,
}: {
  plan: SubscriptionPlan;
  onSave: (updates: { price: number; description: string; features: string[] }) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [price, setPrice] = useState(plan.price);
  const [description, setDescription] = useState(plan.description ?? "");
  const [features, setFeatures] = useState<string[]>([...plan.features]);

  const toggle = (key: string) =>
    setFeatures((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);

  const cfg = TIER_CONFIG[plan.tier];
  const Icon = cfg.icon;

  // Group features by default tier for the dialog
  const featuresByTier: Record<SubscriptionTier, typeof ALL_FEATURES> = {
    BASIC: [],
    STANDARD: ALL_FEATURES.filter((f) => f.defaultTier === "STANDARD"),
    PREMIUM: ALL_FEATURES.filter((f) => f.defaultTier === "PREMIUM"),
    ENTERPRISE: ALL_FEATURES.filter((f) => f.defaultTier === "ENTERPRISE"),
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${cfg.bgColor}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
            </div>
            Edit {plan.name} Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Price (KES/month) <span className="text-muted-foreground font-normal text-xs">— 0 = free</span></Label>
              <Input type="number" min={0} step={100} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground pb-2">
                {plan.tier === "ENTERPRISE" ? "Custom pricing — displayed as 'KES X+'" : "Billed monthly"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <Separator />

          {(["STANDARD", "PREMIUM", "ENTERPRISE"] as SubscriptionTier[])
            .filter((t) => featuresByTier[t].length > 0)
            .map((groupTier) => (
              <div key={groupTier} className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {groupTier} features
                </p>
                <div className="space-y-1.5">
                  {featuresByTier[groupTier].map(({ key, label, description: desc, comingSoon }) => (
                    <label key={key} className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                      <Checkbox checked={features.includes(key)} onCheckedChange={() => toggle(key)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium leading-none">{label}</p>
                          {comingSoon && (
                            <span className="inline-flex items-center gap-0.5 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              <Clock className="h-2.5 w-2.5" /> Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => onSave({ price: parseFloat(price) || 0, description, features })} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feature Matrix ───────────────────────────────────────────────────────────

function FeatureMatrix({ plans }: { plans: SubscriptionPlan[] }) {
  const sorted = [...plans].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));

  // Collect every key present in any plan — catches admin-added keys not in ALL_FEATURES
  const knownKeys = new Set(ALL_FEATURES.map((f) => f.key));
  const allKeysInPlans = Array.from(new Set(plans.flatMap((p) => p.features)));
  const customKeys = allKeysInPlans.filter((k) => !knownKeys.has(k));

  const groupedFeatures: { group: string; items: { key: string; label: string; comingSoon?: boolean }[] }[] = [
    { group: "Standard Features",   items: ALL_FEATURES.filter((f) => f.defaultTier === "STANDARD")   },
    { group: "Premium Features",    items: ALL_FEATURES.filter((f) => f.defaultTier === "PREMIUM")    },
    { group: "Enterprise Features", items: ALL_FEATURES.filter((f) => f.defaultTier === "ENTERPRISE") },
    ...(customKeys.length > 0
      ? [{ group: "Custom Features", items: customKeys.map((k) => ({ key: k, label: k })) }]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Comparison Matrix</CardTitle>
        <CardDescription>Live view of which features are enabled per tier based on the configuration above.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-52">Feature</th>
                {sorted.map((plan) => {
                  const cfg = TIER_CONFIG[plan.tier];
                  const Icon = cfg.icon;
                  return (
                    <th key={plan.tier} className="text-center py-2 px-3 font-medium min-w-[90px]">
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
              {groupedFeatures.map(({ group, items }) => (
                <React.Fragment key={group}>
                  <tr className="bg-muted/30">
                    <td colSpan={sorted.length + 1} className="py-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {group}
                    </td>
                  </tr>
                  {items.map(({ key, label, comingSoon }) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        <span>{label}</span>
                        {comingSoon && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded border border-amber-300 bg-amber-50 px-1 py-0.5 text-[9px] font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="h-2 w-2" /> Soon
                          </span>
                        )}
                      </td>
                      {sorted.map((plan) => (
                        <td key={plan.tier} className="text-center py-2 px-3">
                          {plan.features.includes(key) ? (
                            <Check className="h-3.5 w-3.5 text-green-500 mx-auto" />
                          ) : (
                            <Minus className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
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

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    setTogglingTier(plan.tier);
    try {
      const response = await updateSubscriptionPlan(plan.tier, { isActive: !plan.isActive });
      if (response.success) {
        setPlans((prev) => prev.map((p) => (p.tier === plan.tier ? response.data.plan : p)));
        toast({ title: plan.isActive ? "Plan hidden" : "Plan visible" });
      }
    } catch (err) {
      showErrorToast(toast, err, "Failed to update plan");
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
        toast({ title: "Plan updated" });
      }
    } catch (err) {
      showErrorToast(toast, err, "Failed to update plan");
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

  const sortedPlans = [...plans].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure tier pricing, descriptions, and feature access. Prices in KES. Features are cumulative — Premium includes all Standard features.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                      <CardTitle className="text-sm font-semibold leading-none">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={plan.isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {plan.isActive ? "Visible" : "Hidden"}
                        </Badge>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" /> {plan.subscriberCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mt-0.5 -mr-1 text-muted-foreground hover:text-foreground" onClick={() => setEditingPlan(plan)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold">
                      {price === 0 ? "Free" : `KES ${price.toLocaleString()}`}
                    </span>
                    {price > 0 && <span className="text-xs text-muted-foreground">{cfg.priceSuffix}</span>}
                  </div>
                  {plan.tier === "ENTERPRISE" && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Custom pricing available</p>
                  )}
                </div>

                {plan.description && (
                  <CardDescription className="mt-1.5 text-xs line-clamp-2">{plan.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-3">
                <Separator />
                <div className="flex-1 space-y-1">
                  {plan.features.slice(0, 6).map((key) => {
                    const meta = ALL_FEATURES.find((f) => f.key === key);
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="text-xs truncate">{meta?.label ?? key}</span>
                      </div>
                    );
                  })}
                  {plan.features.length > 6 && (
                    <p className="text-xs text-muted-foreground pl-4.5">+{plan.features.length - 6} more features</p>
                  )}
                  {plan.features.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Base plan — no additional feature gates</p>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Visible to organizers</span>
                  {togglingTier === plan.tier ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch checked={plan.isActive} onCheckedChange={() => handleToggleActive(plan)} disabled={togglingTier !== null} />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature matrix */}
      {sortedPlans.length > 0 && <FeatureMatrix plans={sortedPlans} />}

      {/* Edit dialog */}
      {editingPlan && (
        <EditDialog plan={editingPlan} onSave={handleSave} onClose={() => setEditingPlan(null)} saving={saving} />
      )}
    </div>
  );
};

export default SubscriptionPlansPage;
