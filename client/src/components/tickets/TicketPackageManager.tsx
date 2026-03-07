import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Ticket,
  Plus,
  Trash2,
  Pencil,
  Users,
  Gift,
  Heart,
  Armchair,
  ChevronDown,
  Info,
  Grid3X3,
  Loader2,
  Star,
  Clock,
  TicketCheck,
  Send,
  X,
  Mail,
  Ban,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createTicketPackage,
  getEventTicketPackages,
  updateTicketPackage,
  deleteTicketPackage,
  issueComplementaryTickets,
  getPackageIssuances,
  cancelIssuance,
  type TicketPackage,
  type TicketPackageType,
  type TicketIssuance,
} from "@/lib/organizer-dashboard-api";
import { EventSeatMapManager } from "@/components/organizer/EventSeatMapManager";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/lib/utils/error";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TicketPackageManagerProps {
  eventId: string;
  /** 'admin' shows the isActive toggle and uses admin-context copy */
  mode: "organizer" | "admin";
}

type PackageFormData = {
  name: string;
  description: string;
  type: TicketPackageType;
  price: string;
  minQuantity: string;
  maxQuantity: string;
  isDonation: boolean;
  minDonation: string;
  maxDonation: string;
  hasReservedSeating: boolean;
  quantity: string;
  isActive: boolean;
  availableFrom: string;
  availableUntil: string;
};

const DEFAULT_FORM: PackageFormData = {
  name: "",
  description: "",
  type: "group",
  price: "",
  minQuantity: "",
  maxQuantity: "",
  isDonation: false,
  minDonation: "",
  maxDonation: "",
  hasReservedSeating: false,
  quantity: "",
  isActive: true,
  availableFrom: "",
  availableUntil: "",
};

// ---------------------------------------------------------------------------
// Type metadata — icons, labels, colours, descriptions
// ---------------------------------------------------------------------------

const TYPE_META: Record<
  TicketPackageType,
  {
    icon: React.ElementType;
    label: string;
    gradient: string;
    description: string;
  }
> = {
  group: {
    icon: Users,
    label: "Group Package",
    gradient: "from-blue-500 to-blue-600",
    description:
      "Sell tickets in bulk for groups. Set a min/max party size and a per-ticket price. Ideal for corporate bookings, school trips, or team outings.",
  },
  bundle: {
    icon: Gift,
    label: "Bundle",
    gradient: "from-purple-500 to-purple-600",
    description:
      "Combine multiple ticket types at a single bundled price. Simplifies checkout for events with VIP + general admission tiers.",
  },
  donation: {
    icon: Heart,
    label: "Donation",
    gradient: "from-rose-500 to-rose-600",
    description:
      "Let attendees pay what they want within a range. Perfect for charity events, community gatherings, or pay-what-you-can shows.",
  },
  complementary: {
    icon: TicketCheck,
    label: "Complementary",
    gradient: "from-emerald-500 to-emerald-600",
    description:
      "Issue free tickets to specific guests — speakers, sponsors, VIP invitees, press, or staff. Sent via email with a unique claim link.",
  },
  vip: {
    icon: Star,
    label: "VIP",
    gradient: "from-amber-500 to-amber-600",
    description:
      "Premium access with exclusive perks: priority entry, backstage access, dedicated seating, or special gifts. Price can be higher than general admission.",
  },
  early_bird: {
    icon: Clock,
    label: "Early Bird",
    gradient: "from-teal-500 to-teal-600",
    description:
      "Discounted tickets available only until a set date. Reward early registrants and create urgency. Automatically closes when the deadline passes.",
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TicketPackageManager({ eventId, mode }: TicketPackageManagerProps) {
  const { toast } = useToast();
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("packages");
  const [infoOpen, setInfoOpen] = useState(false);

  // Dialog state — null = closed, undefined = create, TicketPackage = edit
  const [dialogPackage, setDialogPackage] = useState<TicketPackage | null | undefined>(
    undefined,
  );
  const isDialogOpen = dialogPackage !== undefined;

  // Issue dialog state
  const [issuePackage, setIssuePackage] = useState<TicketPackage | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getEventTicketPackages(eventId);
      if (response.success && response.data) {
        setPackages(response.data.packages ?? []);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: extractErrorMessage(err, "Failed to load ticket packages"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const openCreate = () => setDialogPackage(null);
  const openEdit = (pkg: TicketPackage) => setDialogPackage(pkg);
  const closeDialog = () => setDialogPackage(undefined);

  const handleSave = async (data: PackageFormData, editingId?: string) => {
    try {
      if (editingId) {
        // Edit
        const response = await updateTicketPackage(editingId, {
          name: data.name,
          description: data.description || undefined,
          price: data.price ? parseFloat(data.price) : undefined,
          minQuantity: data.minQuantity ? parseInt(data.minQuantity) : undefined,
          maxQuantity: data.maxQuantity ? parseInt(data.maxQuantity) : undefined,
          minDonation: data.minDonation ? parseFloat(data.minDonation) : undefined,
          maxDonation: data.maxDonation ? parseFloat(data.maxDonation) : undefined,
          hasReservedSeating: data.hasReservedSeating,
          quantity: data.quantity ? parseInt(data.quantity) : undefined,
          isActive: data.isActive,
          availableFrom: data.availableFrom || undefined,
          availableUntil: data.availableUntil || undefined,
        });
        if (response.success) {
          toast({ title: "Package updated" });
          closeDialog();
          fetchPackages();
        }
      } else {
        // Create
        const response = await createTicketPackage({
          eventId,
          name: data.name,
          description: data.description || undefined,
          type: data.type,
          price: data.price ? parseFloat(data.price) : undefined,
          minQuantity: data.minQuantity ? parseInt(data.minQuantity) : undefined,
          maxQuantity: data.maxQuantity ? parseInt(data.maxQuantity) : undefined,
          isDonation: data.type === "donation",
          minDonation: data.minDonation ? parseFloat(data.minDonation) : undefined,
          maxDonation: data.maxDonation ? parseFloat(data.maxDonation) : undefined,
          hasReservedSeating: data.hasReservedSeating,
          quantity: data.quantity ? parseInt(data.quantity) : undefined,
          availableFrom: data.availableFrom || undefined,
          availableUntil: data.availableUntil || undefined,
        });
        if (response.success) {
          toast({ title: "Package created" });
          closeDialog();
          fetchPackages();
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: extractErrorMessage(err, "Failed to save package"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (pkg: TicketPackage) => {
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;
    try {
      const response = await deleteTicketPackage(pkg.id);
      if (response.success) {
        toast({ title: "Package deleted" });
        setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
      }
    } catch (err) {
      toast({
        title: "Error",
        description: extractErrorMessage(err, "Failed to delete package"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Ticket Types</h1>
          <p className="text-muted-foreground mt-1">
            {mode === "admin"
              ? "Manage group packages, bundles, and donations for organizer events"
              : "Create packages, bundles, and donations for your event"}
          </p>
        </div>
        {activeTab === "packages" && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Package
          </Button>
        )}
      </div>

      {/* Info banner */}
      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors">
            <span className="flex items-center gap-2 font-medium">
              <Info className="h-4 w-4 text-primary" />
              What can I create here?
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${infoOpen ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 grid gap-3 sm:grid-cols-3 rounded-xl border border-border/40 bg-card p-4">
            {(Object.entries(TYPE_META) as [TicketPackageType, typeof TYPE_META[TicketPackageType]][]).map(
              ([type, meta]) => {
                const Icon = meta.icon;
                return (
                  <div key={type} className="flex gap-3">
                    <div
                      className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                );
              },
            )}
            <div className="flex gap-3 sm:col-span-3 pt-3 border-t border-border/40">
              <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Grid3X3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Reserved Seating</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use the Seating tab to define your venue layout — rows, sections, seat
                  types, and pricing. Attendees pick their spot during checkout. You can
                  also mark individual packages as requiring reserved seats.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="packages">
            <Ticket className="h-4 w-4 mr-2" />
            Packages
            {packages.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {packages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="seating">
            <Armchair className="h-4 w-4 mr-2" />
            Reserved Seating
          </TabsTrigger>
        </TabsList>

        {/* Packages tab */}
        <TabsContent value="packages" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : packages.length === 0 ? (
            <Card className="border-border/40 bg-card">
              <CardContent className="py-16 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <Ticket className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-semibold text-lg">No packages yet</p>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  Create your first ticket package to give attendees flexible ways to
                  register.
                </p>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onIssue={pkg.type === "complementary" ? setIssuePackage : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reserved seating tab */}
        <TabsContent value="seating" className="mt-4">
          <EventSeatMapManager eventId={eventId} />
        </TabsContent>
      </Tabs>

      {/* Create / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogPackage ? "Edit Package" : "Create Ticket Package"}
            </DialogTitle>
          </DialogHeader>
          {isDialogOpen && (
            <PackageForm
              initialPackage={dialogPackage ?? undefined}
              showActiveToggle={mode === "admin" || dialogPackage != null}
              onSave={handleSave}
              onCancel={closeDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Complementary issuance dialog */}
      {issuePackage && (
        <IssueDialog
          pkg={issuePackage}
          onClose={() => setIssuePackage(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Package card
// ---------------------------------------------------------------------------

function PackageCard({
  pkg,
  onEdit,
  onDelete,
  onIssue,
}: {
  pkg: TicketPackage;
  onEdit: (pkg: TicketPackage) => void;
  onDelete: (pkg: TicketPackage) => void;
  onIssue?: (pkg: TicketPackage) => void;
}) {
  const meta = TYPE_META[pkg.type];
  const Icon = meta.icon;

  return (
    <Card className="border-border/40 bg-card hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight truncate">
                {pkg.name}
              </CardTitle>
              <Badge variant="outline" className="mt-1 text-xs font-normal">
                {meta.label}
              </Badge>
            </div>
          </div>
          <Badge variant={pkg.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
            {pkg.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        {pkg.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {pkg.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Price / donation range */}
        {pkg.type === "donation" ? (
          <Row
            label="Donation range"
            value={`${pkg.minDonation ? `$${pkg.minDonation}` : "Free"} – ${
              pkg.maxDonation ? `$${pkg.maxDonation}` : "Open"
            }`}
          />
        ) : pkg.price != null ? (
          <Row label="Price" value={`$${pkg.price.toFixed(2)}`} />
        ) : null}

        {/* Group size */}
        {pkg.type === "group" && pkg.minQuantity != null && (
          <Row
            label="Group size"
            value={`${pkg.minQuantity}–${pkg.maxQuantity ?? "∞"} people`}
          />
        )}

        {/* Availability */}
        <Row
          label="Sold / Available"
          value={`${pkg.soldQuantity} / ${pkg.quantity ?? "∞"}`}
        />

        {/* Reserved seating badge */}
        {pkg.hasReservedSeating && (
          <div className="pt-1">
            <Badge variant="secondary" className="gap-1 text-xs">
              <Armchair className="h-3 w-3" />
              Reserved Seating
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {onIssue && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onIssue(pkg)}
            >
              <TicketCheck className="h-3.5 w-3.5 mr-1.5" />
              Issue Tickets
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(pkg)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(pkg)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Package form — handles both create and edit
// ---------------------------------------------------------------------------

function PackageForm({
  initialPackage,
  showActiveToggle,
  onSave,
  onCancel,
}: {
  initialPackage?: TicketPackage;
  showActiveToggle: boolean;
  onSave: (data: PackageFormData, editingId?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PackageFormData>(() => {
    if (!initialPackage) return DEFAULT_FORM;
    return {
      name: initialPackage.name,
      description: initialPackage.description ?? "",
      type: initialPackage.type,
      price: initialPackage.price?.toString() ?? "",
      minQuantity: initialPackage.minQuantity?.toString() ?? "",
      maxQuantity: initialPackage.maxQuantity?.toString() ?? "",
      isDonation: initialPackage.isDonation,
      minDonation: initialPackage.minDonation?.toString() ?? "",
      maxDonation: initialPackage.maxDonation?.toString() ?? "",
      hasReservedSeating: initialPackage.hasReservedSeating,
      quantity: initialPackage.quantity?.toString() ?? "",
      isActive: initialPackage.isActive,
      availableFrom: initialPackage.availableFrom
        ? new Date(initialPackage.availableFrom).toISOString().slice(0, 16)
        : "",
      availableUntil: initialPackage.availableUntil
        ? new Date(initialPackage.availableUntil).toISOString().slice(0, 16)
        : "",
    };
  });

  const set = (patch: Partial<PackageFormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form, initialPackage?.id);
    } finally {
      setSaving(false);
    }
  };

  const isDonation = form.type === "donation";
  const isGroup = form.type === "group";
  const isEarlyBird = form.type === "early_bird";
  const isComplementary = form.type === "complementary";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="pkg-name">Package Name *</Label>
        <Input
          id="pkg-name"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g., Corporate Group Package"
          required
        />
      </div>

      {/* Type — only for create */}
      {!initialPackage && (
        <div className="space-y-1.5">
          <Label htmlFor="pkg-type">Package Type *</Label>
          <Select
            value={form.type}
            onValueChange={(v: TicketPackageType) => set({ type: v })}
          >
            <SelectTrigger id="pkg-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TYPE_META) as [TicketPackageType, typeof TYPE_META[TicketPackageType]][]).map(
                ([value, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {meta.label}
                      </span>
                    </SelectItem>
                  );
                },
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {TYPE_META[form.type].description}
          </p>
        </div>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="pkg-desc">Description</Label>
        <Textarea
          id="pkg-desc"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Describe what's included in this package…"
          rows={3}
        />
      </div>

      {/* Donation-specific fields */}
      {isDonation && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="min-donation">Min Donation ($)</Label>
            <Input
              id="min-donation"
              type="number"
              step="0.01"
              min={0}
              value={form.minDonation}
              onChange={(e) => set({ minDonation: e.target.value })}
              placeholder="5.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-donation">Max Donation ($)</Label>
            <Input
              id="max-donation"
              type="number"
              step="0.01"
              min={0}
              value={form.maxDonation}
              onChange={(e) => set({ maxDonation: e.target.value })}
              placeholder="1000.00"
            />
          </div>
        </div>
      )}

      {/* Non-donation fields */}
      {!isDonation && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pkg-price">Price ($)</Label>
            <Input
              id="pkg-price"
              type="number"
              step="0.01"
              min={0}
              value={form.price}
              onChange={(e) => set({ price: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-qty">Total Quantity</Label>
            <Input
              id="pkg-qty"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => set({ quantity: e.target.value })}
              placeholder="Unlimited"
            />
          </div>
        </div>
      )}

      {/* Group-specific fields */}
      {isGroup && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="min-qty">Min Group Size</Label>
            <Input
              id="min-qty"
              type="number"
              min={2}
              value={form.minQuantity}
              onChange={(e) => set({ minQuantity: e.target.value })}
              placeholder="2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-qty">Max Group Size</Label>
            <Input
              id="max-qty"
              type="number"
              min={2}
              value={form.maxQuantity}
              onChange={(e) => set({ maxQuantity: e.target.value })}
              placeholder="10"
            />
          </div>
        </div>
      )}

      {/* Early Bird — deadline fields */}
      {isEarlyBird && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 p-4">
          <div className="col-span-2">
            <p className="text-xs font-medium text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Sale window — ticket stops showing after the deadline
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avail-from">Sale Opens</Label>
            <Input
              id="avail-from"
              type="datetime-local"
              value={form.availableFrom}
              onChange={e => set({ availableFrom: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avail-until">Sale Closes *</Label>
            <Input
              id="avail-until"
              type="datetime-local"
              value={form.availableUntil}
              onChange={e => set({ availableUntil: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Complementary — informational note */}
      {isComplementary && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
            <TicketCheck className="h-3.5 w-3.5" />
            Complementary ticket issuance
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            After creating this package, use the <strong>Issue Tickets</strong> button on the
            package card to send free tickets directly to specific email addresses. Each
            recipient receives a unique claim link.
          </p>
        </div>
      )}

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="reserved-seating"
            checked={form.hasReservedSeating}
            onCheckedChange={(c) => set({ hasReservedSeating: !!c })}
            className="mt-0.5"
          />
          <div>
            <span className="text-sm font-medium leading-none">
              Requires Reserved Seating
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Purchasers of this package will be prompted to choose seats from the
              venue layout.
            </p>
          </div>
        </label>

        {showActiveToggle && (
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              id="pkg-active"
              checked={form.isActive}
              onCheckedChange={(c) => set({ isActive: !!c })}
            />
            <span className="text-sm font-medium">
              Active (available for purchase)
            </span>
          </label>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : initialPackage ? (
            "Save Changes"
          ) : (
            "Create Package"
          )}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Issue Dialog — complementary ticket issuance workflow
// ---------------------------------------------------------------------------

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING: Mail,
  CLAIMED: CheckCircle2,
  EXPIRED: AlertCircle,
  CANCELLED: Ban,
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-500",
  CLAIMED: "text-emerald-500",
  EXPIRED: "text-muted-foreground",
  CANCELLED: "text-destructive",
};

function IssueDialog({
  pkg,
  onClose,
}: {
  pkg: TicketPackage;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sending, setSending] = useState(false);
  const [issuances, setIssuances] = useState<TicketIssuance[]>([]);
  const [loadingIssuances, setLoadingIssuances] = useState(true);

  const fetchIssuances = useCallback(async () => {
    setLoadingIssuances(true);
    try {
      const res = await getPackageIssuances(pkg.id);
      if (res.success && res.data) setIssuances(res.data.issuances ?? []);
    } finally {
      setLoadingIssuances(false);
    }
  }, [pkg.id]);

  useEffect(() => { fetchIssuances(); }, [fetchIssuances]);

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    // Support comma or space separated batch entry
    const parsed = trimmed.split(/[\s,]+/).filter(e => e.includes("@"));
    const unique = parsed.filter(e => !emails.includes(e));
    if (unique.length) setEmails(prev => [...prev, ...unique]);
    setEmailInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); }
  };

  const removeEmail = (email: string) => setEmails(prev => prev.filter(e => e !== email));

  const handleSend = async () => {
    if (!emails.length) return;
    setSending(true);
    try {
      const res = await issueComplementaryTickets(pkg.id, {
        emails,
        quantity: parseInt(quantity) || 1,
        note: note || undefined,
        expiresAt: expiresAt || undefined,
      });
      if (res.success) {
        toast({
          title: `${emails.length} invitation${emails.length !== 1 ? "s" : ""} sent`,
          description: "Recipients will receive an email with a unique claim link.",
        });
        setEmails([]);
        setEmailInput("");
        setNote("");
        setExpiresAt("");
        fetchIssuances();
      }
    } catch (err) {
      toast({ title: "Error", description: extractErrorMessage(err, "Failed to send"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (issuanceId: string) => {
    try {
      await cancelIssuance(issuanceId);
      setIssuances(prev => prev.map(i => i.id === issuanceId ? { ...i, status: "CANCELLED" as const } : i));
      toast({ title: "Issuance cancelled" });
    } catch (err) {
      toast({ title: "Error", description: extractErrorMessage(err, "Failed to cancel"), variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketCheck className="h-5 w-5 text-emerald-500" />
            Issue Complimentary Tickets
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Package: <span className="font-medium text-foreground">{pkg.name}</span>
        </p>

        {/* Compose section */}
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Recipient Emails *</Label>
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="name@example.com — press Enter or comma to add"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addEmail} disabled={!emailInput.trim()}>
                Add
              </Button>
            </div>
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {emails.map(email => (
                  <span
                    key={email}
                    className="flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1"
                  >
                    {email}
                    <button type="button" onClick={() => removeEmail(email)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="issue-qty">Tickets per person</Label>
              <Input
                id="issue-qty"
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue-expiry">Link expires</Label>
              <Input
                id="issue-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issue-note">Internal note</Label>
            <Input
              id="issue-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g., Keynote speaker, Press, Sponsor tier A"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSend}
            disabled={sending || emails.length === 0}
          >
            {sending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
            ) : (
              <><Send className="h-4 w-4 mr-2" />Send {emails.length > 0 ? `to ${emails.length} recipient${emails.length !== 1 ? "s" : ""}` : "Invitations"}</>
            )}
          </Button>
        </div>

        {/* Issued tickets list */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3">
            Issued Tickets
            {issuances.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">({issuances.length})</span>
            )}
          </h4>
          {loadingIssuances ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : issuances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tickets issued yet. Send your first invitation above.
            </p>
          ) : (
            <div className="space-y-2">
              {issuances.map(issuance => {
                const Icon = STATUS_ICON[issuance.status] ?? Mail;
                return (
                  <div key={issuance.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card px-3 py-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${STATUS_COLOR[issuance.status] ?? ""}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issuance.email}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{issuance.quantity} ticket{issuance.quantity !== 1 ? "s" : ""}</span>
                        {issuance.note && <span className="truncate">{issuance.note}</span>}
                        {issuance.claimedAt && (
                          <span>Claimed {new Date(issuance.claimedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={issuance.status === "CLAIMED" ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {issuance.status}
                    </Badge>
                    {issuance.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleCancel(issuance.id)}
                        title="Cancel this issuance"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
