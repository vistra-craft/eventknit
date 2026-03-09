import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getReconciliations,
  createReconciliation,
  autoFixReconciliation,
  type Reconciliation,
} from "@/lib/financial-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";

const ReconciliationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    eventId: "",
    search: "",
  });
  const [createForm, setCreateForm] = useState({
    startDate: "",
    endDate: "",
    eventId: "",
  });

  useEffect(() => {
    loadReconciliations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.eventId]);

  const loadReconciliations = async () => {
    try {
      setLoading(true);
      const response = await getReconciliations({
        status: filters.status !== "all" ? filters.status : undefined,
        eventId: filters.eventId || undefined,
      });

      if (response.success && response.data) {
        setReconciliations(response.data);
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to load reconciliations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReconciliation = async () => {
    if (!createForm.startDate || !createForm.endDate) {
      showErrorToast(toast, null, "Please select start and end dates");
      return;
    }

    try {
      setCreating(true);
      const response = await createReconciliation({
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        eventId: createForm.eventId || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Reconciliation created successfully",
        });
        setCreateForm({ startDate: "", endDate: "", eventId: "" });
        loadReconciliations();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to create reconciliation");
    } finally {
      setCreating(false);
    }
  };

  const handleAutoFix = async (id: string) => {
    try {
      const response = await autoFixReconciliation(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Reconciliation discrepancies auto-fixed",
        });
        loadReconciliations();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to auto-fix reconciliation");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      completed: {
        className: "bg-success/10 text-success border-success/20",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      discrepancies_found: {
        className: "bg-warning/10 text-warning border-warning/20",
        icon: <AlertTriangle className="h-4 w-4" />,
      },
      in_progress: {
        className: "bg-primary/10 text-primary border-primary/20",
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      },
      failed: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: <AlertTriangle className="h-4 w-4" />,
      },
    };
    const variant = variants[status] || {
      className: "bg-muted text-muted-foreground border-border",
      icon: <RefreshCw className="h-4 w-4" />,
    };
    return variant;
  };

  const filteredReconciliations = reconciliations.filter((r) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return r.reconciliationNumber.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Payment Reconciliation</h1>
            <p className="text-muted-foreground">Reconcile Paystack transactions with system records</p>
          </div>
        </div>

        {/* Create Reconciliation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Create Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Event ID (Optional)
                </label>
                <Input
                  placeholder="Leave empty for all events"
                  value={createForm.eventId}
                  onChange={(e) => setCreateForm({ ...createForm, eventId: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleCreateReconciliation}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search reconciliations..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="discrepancies_found">Discrepancies Found</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reconciliations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Reconciliations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredReconciliations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No reconciliations found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reconciliation #</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Paystack Transactions</TableHead>
                    <TableHead>System Transactions</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>Discrepancies</TableHead>
                    <TableHead>Amount Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReconciliations.map((r) => {
                    const statusBadge = getStatusBadge(r.status);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">
                          {r.reconciliationNumber}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(r.startDate)}</div>
                            <div className="text-muted-foreground">to {formatDate(r.endDate)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{r.totalPaystackTransactions}</TableCell>
                        <TableCell>{r.totalSystemTransactions}</TableCell>
                        <TableCell className="text-success font-semibold">
                          {r.matchedTransactions}
                        </TableCell>
                        <TableCell className="text-destructive font-semibold">
                          {r.unmatchedTransactions}
                        </TableCell>
                        <TableCell
                          className={
                            r.discrepancyAmount === 0
                              ? "text-success"
                              : "text-destructive font-semibold"
                          }
                        >
                          {formatCurrency(r.discrepancyAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>
                            <span className="flex items-center gap-1">
                              {statusBadge.icon}
                              {r.status.replace(/_/g, " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/finance/reconciliation/${r.id}`)}
                            >
                              View
                            </Button>
                            {r.status === "discrepancies_found" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAutoFix(r.id)}
                              >
                                Auto-Fix
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default ReconciliationPage;

