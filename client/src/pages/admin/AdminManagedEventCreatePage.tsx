/**
 * AdminManagedEventCreatePage
 *
 * Two-step form for creating a new platform-managed event:
 *   Step 1 — Client details (who commissioned this event)
 *   Step 2 — Event details (title, dates, location, pricing, etc.)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "../../components/ui/select";
import { useToast } from "@/hooks/useToast";
import { createManagedEvent, type CreateManagedEventPayload, type ManagedClientType } from "@/lib/managed-events-api";
import { getCategoriesByGroup } from "@/lib/event-categories";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLIENT_TYPE_OPTIONS: { value: ManagedClientType; label: string }[] = [
  { value: "CORPORATE", label: "Corporate" },
  { value: "NGO", label: "NGO / Non-Profit" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "PLATFORM", label: "Platform / EventKnit" },
  { value: "OTHER", label: "Other" },
];

const TIMEZONES = [
  "UTC",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

// ─── Form state types ─────────────────────────────────────────────────────────

interface ClientFormData {
  clientName: string;
  clientType: ManagedClientType | "";
  clientContactEmail: string;
  clientContactPhone: string;
  clientContractRef: string;
}

interface EventFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  venue: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isFree: boolean;
  price: string;
  capacity: string;
  isOnline: boolean;
  onlineLink: string;
  timezone: string;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: 1 | 2;
}

const StepIndicator = ({ current }: StepIndicatorProps) => (
  <div className="flex items-center gap-3 mb-6">
    {([1, 2] as const).map((step) => {
      const done = step < current;
      const active = step === current;
      return (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              done
                ? "bg-primary text-primary-foreground"
                : active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : step}
          </div>
          <span
            className={`text-sm font-medium ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {step === 1 ? "Client Details" : "Event Details"}
          </span>
          {step < 2 && (
            <div className="mx-2 h-px w-8 bg-border" />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminManagedEventCreatePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const categoryGroups = getCategoriesByGroup();

  // ── Client form state ──────────────────────────────────────────────────────
  const [clientData, setClientData] = useState<ClientFormData>({
    clientName: "",
    clientType: "",
    clientContactEmail: "",
    clientContactPhone: "",
    clientContractRef: "",
  });

  // ── Event form state ───────────────────────────────────────────────────────
  const [eventData, setEventData] = useState<EventFormData>({
    title: "",
    description: "",
    category: "",
    location: "",
    venue: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    isFree: false,
    price: "",
    capacity: "",
    isOnline: false,
    onlineLink: "",
    timezone: "Africa/Nairobi",
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!clientData.clientName.trim()) {
      toast({ title: "Client name is required", variant: "destructive" });
      return false;
    }
    if (!clientData.clientType) {
      toast({ title: "Client type is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!eventData.title.trim()) {
      toast({ title: "Event title is required", variant: "destructive" });
      return false;
    }
    if (!eventData.description.trim()) {
      toast({ title: "Event description is required", variant: "destructive" });
      return false;
    }
    if (!eventData.location.trim()) {
      toast({ title: "Location is required", variant: "destructive" });
      return false;
    }
    if (!eventData.startDate) {
      toast({ title: "Start date is required", variant: "destructive" });
      return false;
    }
    if (!eventData.isFree && (!eventData.price || Number(eventData.price) <= 0)) {
      toast({ title: "Please enter a valid ticket price", variant: "destructive" });
      return false;
    }
    return true;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setSubmitting(true);
    try {
      const payload: CreateManagedEventPayload = {
        clientName: clientData.clientName.trim(),
        clientType: clientData.clientType as ManagedClientType,
        clientContactEmail: clientData.clientContactEmail.trim() || undefined,
        clientContactPhone: clientData.clientContactPhone.trim() || undefined,
        clientContractRef: clientData.clientContractRef.trim() || undefined,
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        location: eventData.location.trim(),
        startDate: eventData.startDate,
        endDate: eventData.endDate || undefined,
        startTime: eventData.startTime || undefined,
        endTime: eventData.endTime || undefined,
        isFree: eventData.isFree,
        price: eventData.isFree ? undefined : Number(eventData.price),
        capacity: eventData.capacity ? Number(eventData.capacity) : undefined,
        category: eventData.category || undefined,
        venue: eventData.venue.trim() || undefined,
        isOnline: eventData.isOnline,
        onlineLink: eventData.isOnline ? eventData.onlineLink.trim() || undefined : undefined,
        timezone: eventData.timezone || "UTC",
      };

      await createManagedEvent(payload);
      toast({ title: "Managed event created successfully" });
      navigate("/admin/managed-events");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create managed event";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Client field helper ────────────────────────────────────────────────────
  const setClient = (field: keyof ClientFormData, value: string) =>
    setClientData((prev) => ({ ...prev, [field]: value }));

  const setEvent = (field: keyof EventFormData, value: string | boolean) =>
    setEventData((prev) => ({ ...prev, [field]: value }));

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/admin/managed-events")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">New Managed Event</h1>
          <p className="text-sm text-muted-foreground">
            Create an event commissioned and run by EventKnit for a client.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ── Step 1: Client Details ─────────────────────────────────────────── */}
      {step === 1 && (
        <Card className="border border-border/40 bg-card shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base">Client Details</CardTitle>
                <CardDescription className="text-xs">
                  Information about the organisation commissioning this event.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Client Name */}
            <div className="space-y-1.5">
              <Label htmlFor="clientName">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                placeholder="e.g. Safaricom PLC"
                value={clientData.clientName}
                onChange={(e) => setClient("clientName", e.target.value)}
              />
            </div>

            {/* Client Type */}
            <div className="space-y-1.5">
              <Label htmlFor="clientType">
                Client Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={clientData.clientType}
                onValueChange={(v) => setClient("clientType", v)}
              >
                <SelectTrigger id="clientType">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Email */}
            <div className="space-y-1.5">
              <Label htmlFor="clientContactEmail">Contact Email</Label>
              <Input
                id="clientContactEmail"
                type="email"
                placeholder="client@example.com"
                value={clientData.clientContactEmail}
                onChange={(e) => setClient("clientContactEmail", e.target.value)}
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="clientContactPhone">Contact Phone</Label>
              <Input
                id="clientContactPhone"
                type="tel"
                placeholder="+254 700 000 000"
                value={clientData.clientContactPhone}
                onChange={(e) => setClient("clientContactPhone", e.target.value)}
              />
            </div>

            {/* Contract Reference */}
            <div className="space-y-1.5">
              <Label htmlFor="clientContractRef">Contract Reference</Label>
              <Input
                id="clientContractRef"
                placeholder="e.g. SAF-2026-004"
                value={clientData.clientContractRef}
                onChange={(e) => setClient("clientContractRef", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Internal reference number or contract ID for this engagement.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <Button onClick={handleNextStep} className="gap-2">
                Next: Event Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Event Details ──────────────────────────────────────────── */}
      {step === 2 && (
        <Card className="border border-border/40 bg-card shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Event Details</CardTitle>
                <CardDescription className="text-xs">
                  Core information about the event itself.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Safaricom Annual Leadership Summit 2026"
                value={eventData.title}
                onChange={(e) => setEvent("title", e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the event — its purpose, audience, and highlights…"
                rows={4}
                value={eventData.description}
                onChange={(e) => setEvent("description", e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                value={eventData.category}
                onValueChange={(v) => setEvent("category", v)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryGroups).map(([group, cats]) => (
                    <SelectGroup key={group}>
                      <SelectLabel className="capitalize">{group}</SelectLabel>
                      {cats.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g. Nairobi, Kenya"
                value={eventData.location}
                onChange={(e) => setEvent("location", e.target.value)}
              />
            </div>

            {/* Venue */}
            <div className="space-y-1.5">
              <Label htmlFor="venue">Venue Name</Label>
              <Input
                id="venue"
                placeholder="e.g. KICC, Kenyatta International Convention Centre"
                value={eventData.venue}
                onChange={(e) => setEvent("venue", e.target.value)}
              />
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={eventData.startDate}
                  onChange={(e) => setEvent("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={eventData.endDate}
                  min={eventData.startDate}
                  onChange={(e) => setEvent("endDate", e.target.value)}
                />
              </div>
            </div>

            {/* Times row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={eventData.startTime}
                  onChange={(e) => setEvent("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventData.endTime}
                  onChange={(e) => setEvent("endTime", e.target.value)}
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={eventData.timezone}
                onValueChange={(v) => setEvent("timezone", v)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing section */}
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-medium text-foreground">Pricing</p>

              {/* Is Free toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-primary"
                  checked={eventData.isFree}
                  onChange={(e) => setEvent("isFree", e.target.checked)}
                />
                <span className="text-sm text-foreground">This is a free event</span>
              </label>

              {/* Price — only when not free */}
              {!eventData.isFree && (
                <div className="space-y-1.5">
                  <Label htmlFor="price">
                    Ticket Price (KES) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 5000"
                    value={eventData.price}
                    onChange={(e) => setEvent("price", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Capacity */}
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="Maximum number of attendees"
                value={eventData.capacity}
                onChange={(e) => setEvent("capacity", e.target.value)}
              />
            </div>

            {/* Online section */}
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-medium text-foreground">Online / Hybrid</p>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-primary"
                  checked={eventData.isOnline}
                  onChange={(e) => setEvent("isOnline", e.target.checked)}
                />
                <span className="text-sm text-foreground">
                  This event has an online component
                </span>
              </label>

              {eventData.isOnline && (
                <div className="space-y-1.5">
                  <Label htmlFor="onlineLink">Online Link</Label>
                  <Input
                    id="onlineLink"
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={eventData.onlineLink}
                    onChange={(e) => setEvent("onlineLink", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Create Managed Event
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminManagedEventCreatePage;
