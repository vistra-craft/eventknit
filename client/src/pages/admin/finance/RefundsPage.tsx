import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRefunds, getRefundSummary, type Refund, type RefundSummary } from "@/lib/financial-api";
import { useToast } from "@/hooks/useToast";

const RefundsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [summary, setSummary] = useState<RefundSummary>({
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRefunds = useCallback(async (currentPage: number, currentStatus: string, currentSearch: string) => {
    try {
      setLoading(true);
      const response = await getRefunds({
        status: currentStatus !== "all" ? currentStatus : undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit: 20,
      });

      if (response.success && response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          // Flat array (filtered by eventId)
          setRefunds(data);
          setPagination({ page: 1, limit: 20, total: data.length, totalPages: 1 });
        } else {
          // Paginated response: { refunds: [...], pagination: {...} }
          const paginated = data as { refunds: Refund[]; pagination: typeof pagination };
          setRefunds(paginated.refunds);
          setPagination(paginated.pagination);
        }
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
  }, [toast]);

  const loadSummary = useCallback(async () => {
    try {
      const summaryResponse = await getRefundSummary();
      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch {
      // Summary is non-critical
    }
  }, []);

  useEffect(() => {
    loadRefunds(pagination.page, status, search);
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadRefunds(1, status, value);
    }, 300);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    loadRefunds(1, value, search);
  };

  const handlePageChange = (newPage: number) => {
    loadRefunds(newPage, status, search);
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

  const getStatusBadge = (statusVal: string) => {
    const variants: Record<string, string> = {
      completed: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      processing: "bg-primary/10 text-primary border-primary/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      cancelled: "bg-muted text-muted-foreground border-border",
    };
    return variants[statusVal] || "bg-muted text-muted-foreground border-border";
  };

  return (
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

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by refund #, transaction #, event, or attendee..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
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
            <CardTitle className="text-base font-semibold text-foreground">
              Refunds
              {pagination.total > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({pagination.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No refunds found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Refund #</TableHead>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.refundNumber}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {r.transaction?.transactionNumber || "N/A"}
                        </TableCell>
                        <TableCell>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(r as any).event?.title || "N/A"}
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default RefundsPage;
