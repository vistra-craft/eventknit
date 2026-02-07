import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "../AdminLayout";
import { getRefunds, getRefundSummary, type Refund } from "@/lib/financial-api";
import { useToast } from "@/hooks/useToast";

const RefundsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [summary, setSummary] = useState({
    totalRefunded: 0,
    totalPlatformFeeRefunded: 0,
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    processingCount: 0,
    fullRefunds: 0,
    partialRefunds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventId: "",
    status: "all",
    search: "",
  });

  useEffect(() => {
    if (filters.eventId) {
      loadRefunds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.eventId, filters.status]);

  const loadRefunds = async () => {
    if (!filters.eventId) return;

    try {
      setLoading(true);
      const response = await getRefunds({
        eventId: filters.eventId,
        status: filters.status !== "all" ? filters.status : undefined,
      });

      if (response.success && response.data) {
        setRefunds(response.data);
      }

      const summaryResponse = await getRefundSummary(filters.eventId);
      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load refunds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      processing: "bg-primary/10 text-primary border-primary/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      cancelled: "bg-muted text-muted-foreground border-border",
    };
    return variants[status] || "bg-muted text-muted-foreground border-border";
  };

  const filteredRefunds = refunds.filter((r) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        r.refundNumber.toLowerCase().includes(searchLower) ||
        (r.transaction?.transactionNumber &&
          r.transaction.transactionNumber.toLowerCase().includes(searchLower)) ||
        r.refundReason.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Refunds</h1>
            <p className="text-muted-foreground">Manage event refunds and cancellations</p>
          </div>
          <Button onClick={() => navigate("/admin/finance/refunds/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Refund
          </Button>
        </div>

        {/* Summary Cards */}
        {filters.eventId && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Refunded</div>
                <div className="font-semibold text-destructive">
                  {formatCurrency(summary.totalRefunded)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Platform Fee Refunded</div>
                <div className="font-semibold text-warning">
                  {formatCurrency(summary.totalPlatformFeeRefunded)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Full Refunds</div>
                <div className="font-semibold">{summary.fullRefunds}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Partial Refunds</div>
                <div className="font-semibold">{summary.partialRefunds}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Event ID (required)"
                value={filters.eventId}
                onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}
                className="flex-1"
              />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search refunds..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Refunds Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            {!filters.eventId ? (
              <div className="text-center py-8 text-muted-foreground">
                Please enter an Event ID to view refunds
              </div>
            ) : loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredRefunds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No refunds found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund #</TableHead>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.refundNumber}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.transaction?.transactionNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.refundType === "full"
                              ? "bg-primary/10 text-primary"
                              : "bg-purple-500/10 text-purple-600"
                          }
                        >
                          {r.refundType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatCurrency(r.refundAmount, r.currency)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{r.refundReason}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(r.requestedAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/finance/refunds/${r.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RefundsPage;

