import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  X,
  RefreshCw,
  AlertCircle,
  User as UserIcon,
  Mail,
  Calendar,
  MessageSquare,
  Search,
  Loader2,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import {
  getAdminPromoCodeById,
  createAdminPromoCode,
  updateAdminPromoCode,
  checkCodeAvailability,
  generatePromoCode,
  type PromoCodeScope,
  type DiscountType,
  type CreateAdminPromoCodeData,
} from "@/lib/admin-promo-code-api";
import { getEvents, EventStatus } from "@/lib/event-api";
import { getUsers, type User } from "@/lib/admin-api";
import {
  approvePromoCodeRequest,
  getPromoCodeRequestById,
  type PromoCodeRequest,
} from "@/lib/promo-code-request-api";

// ── Code availability status ──
type CodeStatus = "idle" | "checking" | "available" | "taken" | "too-short";

const AdminPromoCodeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { toast } = useToast();

  // Request context from URL params
  const requestId = searchParams.get("requestId");
  const requestOrganizerId = searchParams.get("organizerId");
  const requestEventId = searchParams.get("eventId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);

  // Request context data (fetched when requestId is present)
  const [requestData, setRequestData] = useState<PromoCodeRequest | null>(null);

  // Organizer search (for ORGANIZER scope)
  const [organizerSearch, setOrganizerSearch] = useState("");
  const [organizerResults, setOrganizerResults] = useState<User[]>([]);
  const [organizerLoading, setOrganizerLoading] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<User | null>(null);
  const organizerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Referrer user search
  const [referrerSearch, setReferrerSearch] = useState("");
  const [referrerResults, setReferrerResults] = useState<User[]>([]);
  const [referrerLoading, setReferrerLoading] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<User | null>(null);
  const referrerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Code validation state
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [generatingCode, setGeneratingCode] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedCodeRef = useRef<string>("");

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

  // ── Code validation with debounce ──
  const checkCode = useCallback(async (code: string) => {
    if (code.length < 3) {
      setCodeStatus("too-short");
      return;
    }

    // Don't re-check the same code
    if (code === lastCheckedCodeRef.current) return;

    setCodeStatus("checking");
    const response = await checkCodeAvailability(code);

    if (response.success && response.data) {
      lastCheckedCodeRef.current = code;
      setCodeStatus(response.data.available ? "available" : "taken");
    } else {
      setCodeStatus("idle");
    }
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    const uppercased = newCode.toUpperCase();
    setFormData((prev) => ({ ...prev, code: uppercased }));

    // Reset last checked so we re-check
    if (uppercased !== lastCheckedCodeRef.current) {
      setCodeStatus(uppercased.length < 3 ? "too-short" : "idle");
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (uppercased.length < 3) {
      setCodeStatus("too-short");
      return;
    }

    // Debounce 500ms
    debounceTimerRef.current = setTimeout(() => {
      checkCode(uppercased);
    }, 500);
  }, [checkCode]);

  // ── Auto-generate code ──
  const handleGenerateCode = useCallback(async () => {
    setGeneratingCode(true);
    const response = await generatePromoCode();

    if (response.success && response.data) {
      const code = response.data.code;
      setFormData((prev) => ({ ...prev, code }));
      lastCheckedCodeRef.current = code;
      setCodeStatus("available");
    } else {
      toast({ title: "Error", description: "Failed to generate code", variant: "destructive" });
    }

    setGeneratingCode(false);
  }, [toast]);

  // Debounced organizer search
  const handleOrganizerSearch = useCallback((query: string) => {
    setOrganizerSearch(query);
    if (organizerDebounceRef.current) clearTimeout(organizerDebounceRef.current);
    if (!query.trim()) { setOrganizerResults([]); return; }
    organizerDebounceRef.current = setTimeout(async () => {
      setOrganizerLoading(true);
      try {
        const res = await getUsers({ search: query, limit: 8 });
        if (res.success && res.data?.users) {
          setOrganizerResults(res.data.users.filter(u => u.role === 'ORGANIZER'));
        }
      } finally {
        setOrganizerLoading(false);
      }
    }, 400);
  }, []);

  // Debounced referrer user search
  const handleReferrerSearch = useCallback((query: string) => {
    setReferrerSearch(query);
    if (referrerDebounceRef.current) clearTimeout(referrerDebounceRef.current);
    if (!query.trim()) { setReferrerResults([]); return; }
    referrerDebounceRef.current = setTimeout(async () => {
      setReferrerLoading(true);
      try {
        const res = await getUsers({ search: query, limit: 8 });
        if (res.success && res.data?.users) {
          setReferrerResults(res.data.users);
        }
      } finally {
        setReferrerLoading(false);
      }
    }, 400);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const eventsRes = await getEvents({ status: EventStatus.APPROVED, limit: 100 });
      if (eventsRes.success && eventsRes.data?.events) {
        setEvents(eventsRes.data.events.map((e) => ({ id: e.id, title: e.title })));
      }

      if (isEditing && id) {
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
          lastCheckedCodeRef.current = code.code;
          setCodeStatus("available");
        } else {
          toast({ title: "Error", description: "Promo code not found", variant: "destructive" });
          navigate("/admin/tickets/promo-codes");
        }
      } else if (requestId) {
        // Fetch full request data for context card
        const reqRes = await getPromoCodeRequestById(requestId);
        if (reqRes.success && reqRes.data) {
          setRequestData(reqRes.data);
        }

        // Pre-fill form from request context
        setFormData((prev) => ({
          ...prev,
          scope: requestEventId ? "EVENT" as PromoCodeScope : "PLATFORM" as PromoCodeScope,
          eventId: requestEventId || undefined,
          organizerId: requestOrganizerId || undefined,
        }));

        // Auto-generate a code
        const codeRes = await generatePromoCode();
        if (codeRes.success && codeRes.data) {
          setFormData((prev) => ({ ...prev, code: codeRes.data!.code }));
          lastCheckedCodeRef.current = codeRes.data.code;
          setCodeStatus("available");
        }
      } else {
        // Normal create mode — auto-generate a code
        const codeRes = await generatePromoCode();
        if (codeRes.success && codeRes.data) {
          setFormData((prev) => ({ ...prev, code: codeRes.data!.code }));
          lastCheckedCodeRef.current = codeRes.data.code;
          setCodeStatus("available");
        }
      }
    } catch (err: unknown) {
      console.error("Error loading data:", err);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, isEditing, navigate, toast, requestId, requestEventId, requestOrganizerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (organizerDebounceRef.current) clearTimeout(organizerDebounceRef.current);
      if (referrerDebounceRef.current) clearTimeout(referrerDebounceRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code) {
      toast({ title: "Error", description: "Code is required", variant: "destructive" });
      return;
    }

    if (codeStatus === "taken") {
      toast({ title: "Error", description: "This code is already taken. Please choose a different one.", variant: "destructive" });
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

    if (formData.scope === "ORGANIZER" && !formData.organizerId) {
      toast({ title: "Error", description: "Please select an organizer for organizer-scoped codes", variant: "destructive" });
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
        // If creating from a request, approve the request with the new promo code ID
        if (requestId && !isEditing && response.data?.id) {
          const approveRes = await approvePromoCodeRequest(requestId, response.data.id);
          if (approveRes.success) {
            toast({ title: "Success", description: "Promo code created and request approved" });
          } else {
            toast({ title: "Partial Success", description: "Promo code created but failed to approve request. Please approve manually.", variant: "destructive" });
          }
          navigate("/admin/tickets/promo-codes?tab=requests");
        } else {
          toast({ title: "Success", description: isEditing ? "Promo code updated" : "Promo code created" });
          navigate("/admin/tickets/promo-codes");
        }
      } else {
        toast({ title: "Error", description: response.message || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save promo code", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Code field border color ──
  const getCodeInputClass = () => {
    switch (codeStatus) {
      case "available":
        return "border-emerald-500 focus-visible:ring-emerald-500/30";
      case "taken":
        return "border-red-500 focus-visible:ring-red-500/30";
      default:
        return "";
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Request Context Card */}
        {requestId && !isEditing && requestData && (
          <Card className="border border-border/60 bg-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Promo Code Request
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {requestData.organizer && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          <span className="text-foreground font-medium">
                            {requestData.organizer.firstName} {requestData.organizer.lastName}
                          </span>
                          {requestData.organizer.organizationName && (
                            <span className="text-muted-foreground"> ({requestData.organizer.organizationName})</span>
                          )}
                        </span>
                      </div>
                    )}
                    {requestData.organizer && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>{requestData.organizer.email}</span>
                      </div>
                    )}
                    {requestData.event && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Event: <span className="text-foreground font-medium">{requestData.event.title}</span></span>
                      </div>
                    )}
                  </div>
                  {requestData.message && (
                    <div className="mt-3 px-3 py-2.5 bg-muted/50 rounded-lg border-l-2 border-muted-foreground/20">
                      <p className="text-sm text-foreground italic">"{requestData.message}"</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    The request will be automatically approved when you create this code.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => requestId ? navigate("/admin/tickets/promo-codes?tab=requests") : navigate("/admin/tickets/promo-codes")}
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
            <Button type="button" variant="outline" onClick={() => navigate("/admin/tickets/promo-codes")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || codeStatus === "taken" || codeStatus === "checking"}>
              {saving && <Loader size="sm" className="mr-2" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm overflow-hidden relative">
          {/* Progress bar at top of card */}
          {codeStatus === "checking" && (
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
              <div className="h-full w-full bg-primary/20">
                <div
                  className="h-full bg-primary"
                  style={{
                    animation: "indeterminate 1.5s ease-in-out infinite",
                    width: "40%",
                  }}
                />
              </div>
            </div>
          )}
          <style>{`
            @keyframes indeterminate {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(350%); }
            }
            @keyframes checkmark-draw {
              0% { stroke-dashoffset: 24; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes scale-in {
              0% { transform: scale(0); opacity: 0; }
              60% { transform: scale(1.15); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-4px); }
              75% { transform: translateX(4px); }
            }
          `}</style>

          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <div className="relative">
                  <Input
                    value={formData.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g., SUMMER20"
                    disabled={isEditing}
                    className={`pr-20 font-mono tracking-wider ${getCodeInputClass()}`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {/* Status indicator */}
                    {codeStatus === "checking" && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
                    )}
                    {codeStatus === "available" && !isEditing && (
                      <div
                        className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                        style={{ animation: "scale-in 0.3s ease-out" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6.5L4.5 9L10 3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              strokeDasharray: 24,
                              strokeDashoffset: 0,
                              animation: "checkmark-draw 0.3s ease-out",
                            }}
                          />
                        </svg>
                      </div>
                    )}
                    {codeStatus === "taken" && (
                      <AlertCircle
                        className="w-5 h-5 text-red-500"
                        style={{ animation: "shake 0.3s ease-out" }}
                      />
                    )}

                    {/* Generate button */}
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={handleGenerateCode}
                        disabled={generatingCode}
                        title="Generate new code"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${generatingCode ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Status messages below field */}
                <div className="h-5">
                  {codeStatus === "too-short" && formData.code.length > 0 && (
                    <p className="text-xs text-muted-foreground">Minimum 3 characters</p>
                  )}
                  {codeStatus === "available" && !isEditing && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Code is available</p>
                  )}
                  {codeStatus === "taken" && (
                    <p
                      className="text-xs text-red-600 dark:text-red-400 font-medium"
                      style={{ animation: "shake 0.3s ease-out" }}
                    >
                      This code is already in use
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Scope *</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(v) => {
                    setFormData({ ...formData, scope: v as PromoCodeScope, eventId: undefined, eventIds: [], organizerId: undefined });
                    setSelectedOrganizer(null);
                    setOrganizerSearch("");
                    setOrganizerResults([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLATFORM">Platform-wide</SelectItem>
                    <SelectItem value="ORGANIZER">Organizer-specific</SelectItem>
                    <SelectItem value="EVENT">Single Event</SelectItem>
                    <SelectItem value="MULTI_EVENT">Multiple Events</SelectItem>
                  </SelectContent>
                </Select>
                {formData.scope === "ORGANIZER" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Code applies to all events created by the selected organizer.
                  </p>
                )}
              </div>
            </div>

            {formData.scope === "ORGANIZER" && (
              <div className="mt-4 space-y-2">
                <Label>Organizer *</Label>
                {selectedOrganizer ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">
                        {selectedOrganizer.firstName} {selectedOrganizer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedOrganizer.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => {
                        setSelectedOrganizer(null);
                        setFormData(prev => ({ ...prev, organizerId: undefined }));
                        setOrganizerSearch("");
                        setOrganizerResults([]);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={organizerSearch}
                      onChange={e => handleOrganizerSearch(e.target.value)}
                      placeholder="Search organizer by name or email…"
                      className="pl-9"
                    />
                    {organizerLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {organizerResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-border/60 bg-popover shadow-lg overflow-hidden">
                        {organizerResults.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                            onClick={() => {
                              setSelectedOrganizer(u);
                              setFormData(prev => ({ ...prev, organizerId: u.id }));
                              setOrganizerSearch("");
                              setOrganizerResults([]);
                            }}
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <UserIcon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                <div>
                  <span className="text-sm">First-time only</span>
                  <p className="text-xs text-muted-foreground">Only usable by attendees with no prior orders</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.isStackable ?? false}
                  onCheckedChange={(v) => setFormData({ ...formData, isStackable: v })}
                />
                <div>
                  <span className="text-sm">Stackable</span>
                  <p className="text-xs text-muted-foreground">Can be combined with other promo codes at checkout</p>
                </div>
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
                  <Label>Influencer / Referrer</Label>
                  {selectedReferrer ? (
                    <div className="flex items-center gap-3 max-w-md rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserIcon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {selectedReferrer.firstName} {selectedReferrer.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedReferrer.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {selectedReferrer.role}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => {
                          setSelectedReferrer(null);
                          setFormData(prev => ({ ...prev, referrerUserId: undefined }));
                          setReferrerSearch("");
                          setReferrerResults([]);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={referrerSearch}
                        onChange={e => handleReferrerSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        className="pl-9"
                      />
                      {referrerLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {referrerResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-border/60 bg-popover shadow-lg overflow-hidden">
                          {referrerResults.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                              onClick={() => {
                                setSelectedReferrer(u);
                                setFormData(prev => ({ ...prev, referrerUserId: u.id }));
                                setReferrerSearch("");
                                setReferrerResults([]);
                              }}
                            >
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <UserIcon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {u.role}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                      placeholder="\u221E"
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
  );
};

export default AdminPromoCodeFormPage;
