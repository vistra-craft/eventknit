import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, CheckCircle, Clock, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "../AdminLayout";
import { getDisbursements, getDisbursementSummary, type Disbursement, type DisbursementSummary } from "@/lib/financial-api";
import { useToast } from "@/hooks/useToast";

const DisbursementsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [summary, setSummary] = useState<DisbursementSummary>({
    totalDisbursed: 0,
    totalPending: 0,
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    processingCount: 0,
    failedCount: 0,
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

  const loadDisbursements = useCallback(async (currentPage: number, currentStatus: string, currentSearch: string) => {
    try {
      setLoading(true);
      const response = await getDisbursements({
        status: currentStatus !== "all" ? currentStatus : undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit: 20,
      });

      if (response.success && response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          // Flat array (filtered by organizerId or eventId)
          setDisbursements(data);
          setPagination({ page: 1, limit: 20, total: data.length, totalPages: 1 });
        } else {
          // Paginated response: { disbursements: [...], pagination: {...} }
          const paginated = data as { disbursements: Disbursement[]; pagination: typeof pagination };
          setDisbursements(paginated.disbursements);
          setPagination(paginated.pagination);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load disbursements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadSummary = useCallback(async () => {
    try {
      const summaryResponse = await getDisbursementSummary();
      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch {
      // Summary is non-critical
    }
  }, []);

  useEffect(() => {
    loadDisbursements(pagination.page, status, search);
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadDisbursements(1, status, value);
    }, 300);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    loadDisbursements(1, value, search);
  };

  const handlePageChange = (newPage: number) => {
    loadDisbursements(newPage, status, search);
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
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      completed: {
        className: "bg-success/10 text-success border-success/20",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      pending: {
        className: "bg-warning/10 text-warning border-warning/20",
        icon: <Clock className="h-4 w-4" />,
      },
      processing: {
        className: "bg-primary/10 text-primary border-primary/20",
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      },
      failed: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: <AlertCircle className="h-4 w-4" />,
      },
    };
    const variant = variants[statusVal] || {
      className: "bg-muted text-muted-foreground border-border",
      icon: <Clock className="h-4 w-4" />,
    };
    return variant;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Disbursements</h1>
            <p className="text-muted-foreground">Manage organizer payouts and disbursements</p>
          </div>
          <Button onClick={() => navigate("/admin/finance/disbursements/create")}>
            Create Disbursement
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Disbursed</div>
              <div className="font-semibold text-success">
                {formatCurrency(summary.totalDisbursed)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="font-semibold text-warning">
                {formatCurrency(summary.totalPending)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="font-semibold">{summary.completedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Processing</div>
              <div className="font-semibold text-primary">{summary.processingCount}</div>
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
                  placeholder="Search by disbursement #, event, or organizer..."
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

        {/* Disbursements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Disbursements
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
            ) : disbursements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No disbursements found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disbursement #</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disbursements.map((d) => {
                      const statusBadge = getStatusBadge(d.status);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-sm">{d.disbursementNumber}</TableCell>
                          <TableCell>{d.event?.title || "N/A"}</TableCell>
                          <TableCell>
                            {d.organizer?.organizationName || d.organizer?.email || "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(d.totalAmount, d.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusBadge.className}>
                              <span className="flex items-center gap-1">
                                {statusBadge.icon}
                                {d.status}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(d.scheduledDate)}</TableCell>
                          <TableCell>{formatDate(d.completedAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/finance/disbursements/${d.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
    </AdminLayout>
  );
};

export default DisbursementsPage;
