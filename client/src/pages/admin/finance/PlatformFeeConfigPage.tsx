import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { getSetting, setSetting } from "@/lib/system-settings-api";
import {
  Percent,
  Calculator,
  Loader2,
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  CreditCard,
  Smartphone,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { showErrorToast } from "@/lib/utils/error";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeePlan {
  id: string;
  name: string;
  feePercentage: number;
  minimumFee: number;
  maximumFee: number;
  /** Paystack card transaction cost %, e.g. 2.9 */
  providerFeeCard: number;
  /** Safaricom M-Pesa transaction cost %, e.g. 1.0 */
  providerFeeMpesa: number;
}

type PlanForm = Omit<FeePlan, "id">;

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTING_KEYS = {
  feePlans: "finance.feePlans",
  activePlanId: "finance.activeFeeplanId",
  feePercentage: "finance.platformFeePercentage",
  minimumFee: "finance.minimumFee",
  maximumFee: "finance.maximumFee",
} as const;

const DEFAULT_PLANS: FeePlan[] = [
  {
    id: "standard",
    name: "Standard",
    feePercentage: 7.5,
    minimumFee: 0,
    maximumFee: 0,
    providerFeeCard: 2.9,
    providerFeeMpesa: 1.0,
  },
  {
    id: "growth",
    name: "Growth",
    feePercentage: 5.0,
    minimumFee: 30,
    maximumFee: 0,
    providerFeeCard: 2.9,
    providerFeeMpesa: 1.0,
  },
  {
    id: "launch",
    name: "Launch",
    feePercentage: 3.0,
    minimumFee: 20,
    maximumFee: 0,
    providerFeeCard: 2.9,
    providerFeeMpesa: 1.0,
  },
];

const EMPTY_FORM: PlanForm = {
  name: "",
  feePercentage: 5.0,
  minimumFee: 0,
  maximumFee: 0,
  providerFeeCard: 2.9,
  providerFeeMpesa: 1.0,
};

const fmt = (n: number) => `KSh ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Fee Breakdown Badge ──────────────────────────────────────────────────────

function MarginChip({ margin }: { margin: number }) {
  const cls =
    margin < 0.5
      ? "text-orange-600 bg-orange-50 border-orange-200"
      : margin < 2
      ? "text-yellow-700 bg-yellow-50 border-yellow-200"
      : "text-green-700 bg-green-50 border-green-200";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${cls}`}>
      {margin.toFixed(2)}% EventKnit
    </span>
  );
}

// ─── Fee Breakdown Section ────────────────────────────────────────────────────

function FeeBreakdown({ plan }: { plan: FeePlan }) {
  const cardMargin = Math.max(0, plan.feePercentage - plan.providerFeeCard);
  const mpesaMargin = Math.max(0, plan.feePercentage - plan.providerFeeMpesa);

  return (
    <div className="rounded-md bg-muted/40 border p-3 space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        Fee Breakdown
      </p>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground w-32 shrink-0">Paystack (card)</span>
          <span className="font-mono text-muted-foreground">{plan.providerFeeCard}%</span>
          <span className="text-muted-foreground">+</span>
          <MarginChip margin={cardMargin} />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground w-32 shrink-0">Safaricom (M-Pesa)</span>
          <span className="font-mono text-muted-foreground">{plan.providerFeeMpesa}%</span>
          <span className="text-muted-foreground">+</span>
          <MarginChip margin={mpesaMargin} />
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isActive,
  onActivate,
  onEdit,
  onDelete,
  activating,
}: {
  plan: FeePlan;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  activating: boolean;
}) {
  return (
    <Card
      className={`relative flex flex-col transition-all duration-200 ${
        isActive ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:shadow-sm"
      }`}
    >
      {/* Active badge pinned to top edge */}
      {isActive && (
        <div className="absolute -top-3 left-4 z-10">
          <Badge className="gap-1 pl-1.5 text-xs bg-primary text-primary-foreground">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
          <div className="flex items-center gap-0.5 -mt-1 -mr-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            {!isActive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Big fee number */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-4xl font-extrabold tracking-tight text-primary">
            {plan.feePercentage}%
          </span>
          <span className="text-sm text-muted-foreground">of sale</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1">
        {/* Min / Cap row */}
        <div className="flex items-center gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Min fee: </span>
            <span className="font-medium text-xs">
              {plan.minimumFee === 0 ? "None" : `KSh ${plan.minimumFee.toLocaleString()}`}
            </span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div>
            <span className="text-muted-foreground text-xs">Cap: </span>
            <span className="font-medium text-xs">
              {plan.maximumFee === 0 ? "Unlimited" : `KSh ${plan.maximumFee.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <FeeBreakdown plan={plan} />

        {/* Activate button (spacer-pushed to bottom) */}
        <div className="mt-auto">
          {!isActive ? (
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              onClick={onActivate}
              disabled={activating}
            >
              {activating ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-3.5 w-3.5" />
              )}
              Activate Plan
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Currently applied to all transactions
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Plan Form Dialog (shared by Add + Edit) ──────────────────────────────────

function PlanFormDialog({
  title,
  form,
  onChange,
  onSave,
  onClose,
  saving,
}: {
  title: string;
  form: PlanForm;
  onChange: (f: PlanForm) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const set =
    (key: keyof PlanForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...form, [key]: key === "name" ? e.target.value : Number(e.target.value) });

  const cardMargin = Math.max(0, form.feePercentage - form.providerFeeCard);
  const mpesaMargin = Math.max(0, form.feePercentage - form.providerFeeMpesa);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Plan Name</Label>
            <Input value={form.name} onChange={set("name")} placeholder="e.g. Growth" />
          </div>

          {/* Fee % + min + cap */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Percent className="h-3.5 w-3.5" />
                Fee %
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.feePercentage}
                onChange={set("feePercentage")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Min Fee (KSh)</Label>
              <Input type="number" min={0} step={1} value={form.minimumFee} onChange={set("minimumFee")} />
            </div>
            <div className="space-y-1.5">
              <Label>Cap (KSh)</Label>
              <Input type="number" min={0} step={1} value={form.maximumFee} onChange={set("maximumFee")} />
            </div>
          </div>

          <Separator />

          {/* Provider costs */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Payment Provider Costs
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <CreditCard className="h-3.5 w-3.5" />
                  Paystack card (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={form.providerFeeCard}
                  onChange={set("providerFeeCard")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <Smartphone className="h-3.5 w-3.5" />
                  Safaricom M-Pesa (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={form.providerFeeMpesa}
                  onChange={set("providerFeeMpesa")}
                />
              </div>
            </div>
          </div>

          {/* Live margin preview */}
          <div className="rounded-md bg-muted/40 border p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              EventKnit Net Margin
            </p>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Card:</span>
                <span className="font-semibold">{cardMargin.toFixed(2)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">M-Pesa:</span>
                <span className="font-semibold">{mpesaMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PlatformFeeConfigPage = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<FeePlan[]>(DEFAULT_PLANS);
  const [activePlanId, setActivePlanId] = useState<string>("standard");
  const [activating, setActivating] = useState<string | null>(null);

  const [editingPlan, setEditingPlan] = useState<FeePlan | null>(null);
  const [editForm, setEditForm] = useState<PlanForm>(EMPTY_FORM);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<PlanForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [previewAmount, setPreviewAmount] = useState("10000");

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0];

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, activeRes] = await Promise.all([
        getSetting(SETTING_KEYS.feePlans).catch(() => null),
        getSetting(SETTING_KEYS.activePlanId).catch(() => null),
      ]);

      if (plansRes?.success && plansRes.data?.setting?.value) {
        try {
          const plansValue = plansRes.data.setting.value;
          if (typeof plansValue === "string") {
            const parsed: FeePlan[] = JSON.parse(plansValue);
            if (Array.isArray(parsed) && parsed.length > 0) setPlans(parsed);
          }
        } catch {
          /* keep defaults */
        }
      }
      if (activeRes?.success && activeRes.data?.setting?.value) {
        const activeValue = activeRes.data.setting.value;
        if (typeof activeValue === "string") {
          setActivePlanId(activeValue);
        }
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to load fee configuration. Using defaults.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ── Persist helpers ───────────────────────────────────────────────────────

  const persistAll = async (updatedPlans: FeePlan[], newActiveId: string) => {
    const active = updatedPlans.find((p) => p.id === newActiveId) ?? updatedPlans[0];
    await Promise.all([
      setSetting(SETTING_KEYS.feePlans, JSON.stringify(updatedPlans), "string", "general", {
        description: "All configured platform fee plans",
        changeReason: "Updated via Platform Fee Config page",
      }),
      setSetting(SETTING_KEYS.activePlanId, newActiveId, "string", "general", {
        description: "ID of the currently active fee plan",
        changeReason: "Updated via Platform Fee Config page",
      }),
      setSetting(SETTING_KEYS.feePercentage, active.feePercentage, "number", "general", {
        description: "Global platform fee percentage applied to ticket sales",
        changeReason: "Synced from active fee plan",
      }),
      setSetting(SETTING_KEYS.minimumFee, active.minimumFee, "number", "general", {
        description: "Minimum platform fee per transaction",
        changeReason: "Synced from active fee plan",
      }),
      setSetting(SETTING_KEYS.maximumFee, active.maximumFee, "number", "general", {
        description: "Maximum platform fee cap per transaction",
        changeReason: "Synced from active fee plan",
      }),
    ]);
  };

  // ── Activate ──────────────────────────────────────────────────────────────

  const handleActivate = async (planId: string) => {
    setActivating(planId);
    try {
      await persistAll(plans, planId);
      setActivePlanId(planId);
      const name = plans.find((p) => p.id === planId)?.name ?? planId;
      toast({ title: "Plan activated", description: `"${name}" is now applied to all transactions.` });
    } catch (error) {
      showErrorToast(toast, error, "Failed to activate plan.");
    } finally {
      setActivating(null);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const openEdit = (plan: FeePlan) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      feePercentage: plan.feePercentage,
      minimumFee: plan.minimumFee,
      maximumFee: plan.maximumFee,
      providerFeeCard: plan.providerFeeCard,
      providerFeeMpesa: plan.providerFeeMpesa,
    });
  };

  const handleEditSave = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const updated = plans.map((p) => (p.id === editingPlan.id ? { id: p.id, ...editForm } : p));
      await persistAll(updated, activePlanId);
      setPlans(updated);
      setEditingPlan(null);
      toast({ title: "Plan updated" });
    } catch (error) {
      showErrorToast(toast, error, "Failed to save plan.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (planId: string) => {
    const updated = plans.filter((p) => p.id !== planId);
    try {
      await persistAll(updated, activePlanId);
      setPlans(updated);
      toast({ title: "Plan deleted" });
    } catch (error) {
      showErrorToast(toast, error, "Failed to delete plan.");
    }
  };

  // ── Add ───────────────────────────────────────────────────────────────────

  const handleAddSave = async () => {
    setSaving(true);
    try {
      const newPlan: FeePlan = { id: uid(), ...addForm };
      const updated = [...plans, newPlan];
      await persistAll(updated, activePlanId);
      setPlans(updated);
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      toast({ title: "Plan added" });
    } catch (error) {
      showErrorToast(toast, error, "Failed to add plan.");
    } finally {
      setSaving(false);
    }
  };

  // ── Calculator ────────────────────────────────────────────────────────────

  const calcPreview = () => {
    const amount = Number(previewAmount) || 0;
    const p = activePlan;
    let fee = (amount * p.feePercentage) / 100;
    if (p.minimumFee > 0 && fee < p.minimumFee) fee = p.minimumFee;
    if (p.maximumFee > 0 && fee > p.maximumFee) fee = p.maximumFee;
    fee = Math.min(fee, amount);

    const cardProvider = (amount * p.providerFeeCard) / 100;
    const mpesaProvider = (amount * p.providerFeeMpesa) / 100;

    return {
      grossAmount: amount,
      feeAmount: +fee.toFixed(2),
      organizerAmount: +(amount - fee).toFixed(2),
      cardProvider: +cardProvider.toFixed(2),
      mpesaProvider: +mpesaProvider.toFixed(2),
      eventKnitCard: +Math.max(0, fee - cardProvider).toFixed(2),
      eventKnitMpesa: +Math.max(0, fee - mpesaProvider).toFixed(2),
    };
  };

  const pv = calcPreview();

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Platform Fee Configuration</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Select the active fee plan for all paid ticket sales. Each plan shows the split between
            payment provider costs and EventKnit's net margin.
          </p>
        </div>
        <Button
          onClick={() => {
            setAddForm(EMPTY_FORM);
            setShowAdd(true);
          }}
          className="shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={plan.id === activePlanId}
            onActivate={() => handleActivate(plan.id)}
            onEdit={() => openEdit(plan)}
            onDelete={() => handleDelete(plan.id)}
            activating={activating === plan.id}
          />
        ))}
      </div>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            Fee Preview Calculator
          </CardTitle>
          <CardDescription>
            Simulates the{" "}
            <span className="font-medium text-foreground">{activePlan.name}</span> plan (
            {activePlan.feePercentage}%) on a sample transaction amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Input + quick amounts */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sample Sale Amount (KSh)</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={previewAmount}
                  onChange={(e) => setPreviewAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Quick amounts</p>
                <div className="flex flex-wrap gap-2">
                  {[1000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setPreviewAmount(String(amt))}
                    >
                      {amt.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Amount</span>
                <span className="font-medium">{fmt(pv.grossAmount)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-red-600">
                <span className="font-medium">
                  Platform Fee ({activePlan.feePercentage}%)
                </span>
                <span className="font-bold">− {fmt(pv.feeAmount)}</span>
              </div>

              {/* Provider split */}
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3" />
                    Paystack card ({activePlan.providerFeeCard}%)
                  </span>
                  <span>{fmt(pv.cardProvider)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="h-3 w-3" />
                    Safaricom M-Pesa ({activePlan.providerFeeMpesa}%)
                  </span>
                  <span>{fmt(pv.mpesaProvider)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-green-600">
                <span className="font-medium">Organizer Receives</span>
                <span className="text-base font-bold">{fmt(pv.organizerAmount)}</span>
              </div>

              {/* EventKnit margin box */}
              <div className="rounded-md bg-muted/40 border p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  EventKnit Net Margin
                </p>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CreditCard className="h-3 w-3" /> via card
                  </span>
                  <span className="font-medium">{fmt(pv.eventKnitCard)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Smartphone className="h-3 w-3" /> via M-Pesa
                  </span>
                  <span className="font-medium">{fmt(pv.eventKnitMpesa)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Resale Marketplace</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Ticket resales use a separate hardcoded 10% fee, independent of this configuration.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Refunds</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Refunds are managed by event organizers and are not affected by the platform fee plan.
            </p>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      {editingPlan && (
        <PlanFormDialog
          title={`Edit "${editingPlan.name}"`}
          form={editForm}
          onChange={setEditForm}
          onSave={handleEditSave}
          onClose={() => setEditingPlan(null)}
          saving={saving}
        />
      )}

      {/* Add dialog */}
      {showAdd && (
        <PlanFormDialog
          title="Add New Plan"
          form={addForm}
          onChange={setAddForm}
          onSave={handleAddSave}
          onClose={() => setShowAdd(false)}
          saving={saving}
        />
      )}
    </div>
  );
};

export default PlatformFeeConfigPage;
