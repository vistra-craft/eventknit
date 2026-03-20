import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPaymentTransactions, syncPaymentsFromPaystack, type PaymentTransaction } from "@/lib/financial-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";

const PaymentTransactionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    eventId: "",
    search: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.status, filters.eventId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await getPaymentTransactions({
        status: filters.status !== "all" ? filters.status : undefined,
        eventId: filters.eventId || undefined,
        page: filters.page,
        limit: filters.limit,
      });

      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to load payment transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await syncPaymentsFromPaystack({
        // Sync last 30 days by default
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      if (response.success) {
        toast({
          title: "Sync Complete",
          description: `Created ${response.data?.created || 0} transactions, skipped ${response.data?.skipped || 0}`,
        });
        loadTransactions();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to sync payments from Paystack");
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(amount / 100); // Convert from kobo/cents
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
      success: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      cancelled: "bg-muted text-muted-foreground border-border",
    };
    return variants[status] || "bg-muted text-muted-foreground border-border";
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        tx.transactionNumber.toLowerCase().includes(searchLower) ||
        tx.paystackReference.toLowerCase().includes(searchLower) ||
        tx.attendeeEmail.toLowerCase().includes(searchLower) ||
        (tx.attendeeName && tx.attendeeName.toLowerCase().includes(searchLower)) ||
        (tx.event?.title && tx.event.title.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Payment Transactions</h1>
            <p className="text-muted-foreground">View and manage all event payment transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="hover:bg-primary  transition-colors">
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync from Paystack"}
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-primary  transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Payment Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm">{tx.transactionNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tx.event?.title || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">{tx.event?.organizer.organizationName || ""}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tx.attendeeName || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">{tx.attendeeEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(tx.amount, tx.currency)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(tx.paymentStatus)}>{tx.paymentStatus}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(tx.paymentDate)}</TableCell>
                        <TableCell>
                          {tx.platformFee ? (
                            <div className="text-sm">
                              <div className="font-medium">{formatCurrency(tx.platformFee.feeAmount, tx.currency)}</div>
                              <div className="text-muted-foreground">Fee: {tx.platformFee.status}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/finance/payments/${tx.id}`)}
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
                    <div className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                        disabled={filters.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                        disabled={filters.page >= pagination.totalPages}
                      >
                        Next
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

export default PaymentTransactionsPage;

