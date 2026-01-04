import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "../AdminLayout";
import { getDisbursements, getDisbursementSummary, type Disbursement } from "@/lib/financial-api";
import { useToast } from "@/hooks/use-toast";

const DisbursementsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [summary, setSummary] = useState({
    totalDisbursed: 0,
    totalPending: 0,
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    processingCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    organizerId: "",
    eventId: "",
    search: "",
  });

  useEffect(() => {
    loadDisbursements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.organizerId, filters.eventId]);

  const loadDisbursements = async () => {
    try {
      setLoading(true);
      const response = await getDisbursements({
        status: filters.status !== "all" ? filters.status : undefined,
        organizerId: filters.organizerId || undefined,
        eventId: filters.eventId || undefined,
      });

      if (response.success && response.data) {
        setDisbursements(response.data);
      }

      // Load summary if organizerId is set
      if (filters.organizerId) {
        const summaryResponse = await getDisbursementSummary(filters.organizerId);
        if (summaryResponse.success && summaryResponse.data) {
          setSummary(summaryResponse.data);
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
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      completed: {
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      pending: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-4 w-4" />,
      },
      processing: {
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Clock className="h-4 w-4" />,
      },
      failed: {
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="h-4 w-4" />,
      },
    };
    const variant = variants[status] || {
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <Clock className="h-4 w-4" />,
    };
    return variant;
  };

  const filteredDisbursements = disbursements.filter((d) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        d.disbursementNumber.toLowerCase().includes(searchLower) ||
        (d.event?.title && d.event.title.toLowerCase().includes(searchLower)) ||
        (d.organizer?.organizationName && d.organizer.organizationName.toLowerCase().includes(searchLower))
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
            <h1 className="text-base font-semibold text-foreground">Disbursements</h1>
            <p className="text-gray-600">Manage organizer payouts and disbursements</p>
          </div>
          <Button onClick={() => navigate("/admin/finance/disbursements/create")}>
            Create Disbursement
          </Button>
        </div>

        {/* Summary Cards */}
        {filters.organizerId && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Total Disbursed</div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(summary.totalDisbursed)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="font-semibold text-yellow-600">
                  {formatCurrency(summary.totalPending)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="font-semibold">{summary.completedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Processing</div>
                <div className="font-semibold text-blue-600">{summary.processingCount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search disbursements..."
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

        {/* Disbursements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Disbursements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredDisbursements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No disbursements found</div>
            ) : (
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
                  {filteredDisbursements.map((d) => {
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
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DisbursementsPage;

