import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrganizerLayout from "./OrganizerLayout";
import {
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getPayoutPreferences,
  updatePayoutPreferences,
  getPayoutHistory,
  getPayoutSummary,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";

interface PayoutPreferences {
  id: string;
  primaryMethod: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  bankCode: string | null;
  routingNumber: string | null;
  paystackRecipientCode: string | null;
  autoPayoutEnabled: boolean;
  autoPayoutThreshold: number | null;
  autoPayoutSchedule: string | null;
  taxId: string | null;
  taxCountry: string | null;
}

interface DisbursementRecord {
  id: string;
  disbursementNumber: string;
  eventId: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  scheduledDate: string | null;
  completedAt: string | null;
  createdAt: string;
  event?: { id: string; title: string };
}

interface PayoutSummaryData {
  pending: { amount: number; count: number };
  scheduled: { amount: number; count: number };
  totalPaid: number;
  totalDisbursements: number;
  lastPayoutDate?: string | null;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const formatCurrency = (amount: number, currency = "NGN") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PayoutManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preferences");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<PayoutPreferences | null>(null);
  const [formData, setFormData] = useState({
    primaryMethod: "bank_transfer",
    bankName: "",
    accountName: "",
    accountNumber: "",
    bankCode: "",
    routingNumber: "",
    autoPayoutEnabled: false,
    autoPayoutThreshold: "",
    autoPayoutSchedule: "weekly",
  });

  // History state
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const HISTORY_LIMIT = 10;

  // Summary state
  const [summary, setSummary] = useState<PayoutSummaryData | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      const res = await getPayoutPreferences();
      if (res.success && res.data?.preferences) {
        const p = res.data.preferences;
        setPreferences(p);
        setFormData({
          primaryMethod: p.primaryMethod || "bank_transfer",
          bankName: p.bankName || "",
          accountName: p.accountName || "",
          accountNumber: p.accountNumber || "",
          bankCode: p.bankCode || "",
          routingNumber: p.routingNumber || "",
          autoPayoutEnabled: p.autoPayoutEnabled || false,
          autoPayoutThreshold: p.autoPayoutThreshold?.toString() || "",
          autoPayoutSchedule: p.autoPayoutSchedule || "weekly",
        });
      }
    } catch {
      toast({ title: "Failed to load payout preferences", variant: "destructive" });
    }
  }, [toast]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const filters: Record<string, string | number> = {
        page: historyPage,
        limit: HISTORY_LIMIT,
      };
      if (historyFilter) filters.status = historyFilter;
      const res = await getPayoutHistory(filters as any);
      if (res.success && res.data) {
        setDisbursements(res.data.disbursements || []);
        setHistoryTotal(res.data.pagination?.totalPages || 1);
      }
    } catch {
      toast({ title: "Failed to load payout history", variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historyFilter, toast]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await getPayoutSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadPreferences(), loadSummary()]);
      setLoading(false);
    };
    init();
  }, [loadPreferences, loadSummary]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        primaryMethod: formData.primaryMethod,
        bankName: formData.bankName || null,
        accountName: formData.accountName || null,
        accountNumber: formData.accountNumber || null,
        bankCode: formData.bankCode || null,
        routingNumber: formData.routingNumber || null,
        autoPayoutEnabled: formData.autoPayoutEnabled,
        autoPayoutSchedule: formData.autoPayoutSchedule,
      };
      if (formData.autoPayoutThreshold) {
        payload.autoPayoutThreshold = parseFloat(formData.autoPayoutThreshold);
      }
      const res = await updatePayoutPreferences(payload as any);
      if (res.success) {
        toast({ title: "Payout preferences updated" });
        await loadPreferences();
      } else {
        toast({ title: res.message || "Failed to update preferences", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Management</h1>
          <p className="text-muted-foreground">
            Manage your bank details, auto-payout settings, and view payout history.
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.pending?.amount || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.pending?.count || 0} disbursement(s)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.scheduled?.amount || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.scheduled?.count || 0} scheduled
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.totalPaid || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.totalDisbursements || 0} total payouts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Last Payout</p>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {summary.lastPayoutDate ? formatDate(summary.lastPayoutDate) : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="preferences">
              <Building2 className="h-4 w-4 mr-2" />
              Bank & Preferences
            </TabsTrigger>
            <TabsTrigger value="history">
              <Wallet className="h-4 w-4 mr-2" />
              Payout History
            </TabsTrigger>
          </TabsList>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryMethod">Payout Method</Label>
                    <Select
                      value={formData.primaryMethod}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, primaryMethod: v }))
                      }
                    >
                      <SelectTrigger id="primaryMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paystack_transfer">Paystack Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, bankName: e.target.value }))
                      }
                      placeholder="e.g. First Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={formData.accountName}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, accountName: e.target.value }))
                      }
                      placeholder="Account holder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, accountNumber: e.target.value }))
                      }
                      placeholder="Account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankCode">Bank Code</Label>
                    <Input
                      id="bankCode"
                      value={formData.bankCode}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, bankCode: e.target.value }))
                      }
                      placeholder="Bank code (e.g. 011)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, routingNumber: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auto-Payout Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Auto-Payout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically receive payouts after events end (5 business day grace period)
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoPayoutEnabled}
                    onCheckedChange={(checked) =>
                      setFormData((f) => ({ ...f, autoPayoutEnabled: checked }))
                    }
                  />
                </div>
                {formData.autoPayoutEnabled && (
                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Minimum Payout Threshold</Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={formData.autoPayoutThreshold}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            autoPayoutThreshold: e.target.value,
                          }))
                        }
                        placeholder="e.g. 5000 (skip if below this amount)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-payouts below this amount will be held until the threshold is met
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedule">Payout Schedule</Label>
                      <Select
                        value={formData.autoPayoutSchedule}
                        onValueChange={(v) =>
                          setFormData((f) => ({ ...f, autoPayoutSchedule: v }))
                        }
                      >
                        <SelectTrigger id="schedule">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={historyFilter}
                onValueChange={(v) => {
                  setHistoryFilter(v === "all" ? "" : v);
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                {historyLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : disbursements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Wallet className="h-8 w-8 mb-2" />
                    <p>No payout history found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout #</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disbursements.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-sm">
                            {d.disbursementNumber}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {d.event?.title || d.eventId}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(d.totalAmount, d.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={statusStyles[d.status] || ""}
                            >
                              {d.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {d.paymentMethod?.replace("_", " ")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {d.completedAt
                              ? formatDate(d.completedAt)
                              : formatDate(d.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {historyTotal > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {historyPage} of {historyTotal}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage >= historyTotal}
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </OrganizerLayout>
  );
};

export default PayoutManagement;
