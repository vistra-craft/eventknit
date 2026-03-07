import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getPaymentTransactions,
  getDisbursements,
  getRefunds,
  getFinanceInsights,
  type PaymentTransaction,
  type FinanceInsights,
  type FinanceInsightsPeriod,
} from "@/lib/financial-api";
import { useToast } from "@/hooks/useToast";
import { CustomLineChart, CustomBarChart } from "@/components/charts/ChartComponents";

const EventFinanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFees: 0,
    organizerAmounts: 0,
    pendingDisbursements: 0,
    totalRefunds: 0,
    recentTransactions: [] as PaymentTransaction[],
  });

  // Finance growth charts (backend data)
  const [growthPeriod, setGrowthPeriod] = useState<FinanceInsightsPeriod>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [financeGrowth, setFinanceGrowth] = useState<FinanceInsights | null>(null);
  const [growthLoading, setGrowthLoading] = useState<boolean>(false);

  const applyGrowthFilters = (data: { label: string; value: number }[]) => {
    if (growthPeriod === "monthly" && selectedMonth !== "All") {
      return data.filter((d) => d.label === selectedMonth);
    }
    if (growthPeriod === "yearly" && selectedYear !== "All") {
      return data.filter((d) => d.label === selectedYear);
    }
    return data;
  };

  const filteredGrowth = {
    totalRevenue: financeGrowth ? applyGrowthFilters(financeGrowth.totalRevenue) : [],
    platformFees: financeGrowth ? applyGrowthFilters(financeGrowth.platformFees) : [],
    pendingDisbursements: financeGrowth ? applyGrowthFilters(financeGrowth.pendingDisbursements) : [],
    totalRefunds: financeGrowth ? applyGrowthFilters(financeGrowth.totalRefunds) : [],
  };

  useEffect(() => {
    loadFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load finance insights for charts whenever the period changes
  useEffect(() => {
    const loadInsights = async () => {
      try {
        setGrowthLoading(true);
        const response = await getFinanceInsights(growthPeriod);
        if (response.success && response.data) {
          setFinanceGrowth(response.data);
        }
      } catch (error) {
        console.error("Failed to load finance insights:", error);
      } finally {
        setGrowthLoading(false);
      }
    };

    loadInsights();
  }, [growthPeriod]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      // Load recent transactions
      const transactionsResponse = await getPaymentTransactions({
        status: "success",
        limit: 10,
        page: 1,
      });

      // Load pending disbursements
      const disbursementsResponse = await getDisbursements({
        status: "pending",
      });

      // Calculate stats
      const transactions = transactionsResponse.success && transactionsResponse.data
        ? transactionsResponse.data.transactions
        : [];

      const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const platformFees = transactions.reduce(
        (sum, tx) => sum + (tx.platformFee?.feeAmount || 0),
        0
      );
      const organizerAmounts = transactions.reduce(
        (sum, tx) => sum + (tx.platformFee?.organizerAmount || 0),
        0
      );

      // Extract disbursements from response (may be flat array or paginated object)
      type DisbursementItem = { totalAmount: number };
      let disbursementsList: DisbursementItem[] = [];
      if (disbursementsResponse.success && disbursementsResponse.data) {
        const dData: unknown = disbursementsResponse.data;
        if (Array.isArray(dData)) {
          disbursementsList = dData as DisbursementItem[];
        } else if (typeof dData === 'object' && dData !== null && 'disbursements' in dData) {
          disbursementsList = (dData as { disbursements: DisbursementItem[] }).disbursements ?? [];
        }
      }
      const pendingDisbursements = disbursementsList.reduce((sum, d) => sum + d.totalAmount, 0);

      // Load refunds for total refunds
      const refundsResponse = await getRefunds({
        status: "completed",
      });

      // Extract refunds from response (may be flat array or paginated object)
      type RefundItem = { refundAmount: number };
      let refundsList: RefundItem[] = [];
      if (refundsResponse.success && refundsResponse.data) {
        const rData: unknown = refundsResponse.data;
        if (Array.isArray(rData)) {
          refundsList = rData as RefundItem[];
        } else if (typeof rData === 'object' && rData !== null && 'refunds' in rData) {
          refundsList = (rData as { refunds: RefundItem[] }).refunds ?? [];
        }
      }
      const totalRefunds = refundsList.reduce((sum, r) => sum + r.refundAmount, 0);

      setStats({
        totalRevenue,
        platformFees,
        organizerAmounts,
        pendingDisbursements,
        totalRefunds,
        recentTransactions: transactions.slice(0, 5),
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to load financial data",
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
    }).format(amount / 100); // Convert from kobo/cents
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Event Finance Dashboard</h1>
            <p className="text-muted-foreground">Overview of event-related payments and finances</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadFinancialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Revenue</h3>
                <p className="font-semibold text-success">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-sm text-muted-foreground">From all event payments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Platform Fees</h3>
                <p className="font-semibold text-primary">
                  {formatCurrency(stats.platformFees)}
                </p>
                <p className="text-sm text-muted-foreground">Commission earned</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-muted">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Pending Disbursements</h3>
                <p className="font-semibold text-muted-foreground">
                  {formatCurrency(stats.pendingDisbursements)}
                </p>
                <p className="text-sm text-muted-foreground">Awaiting payout to organizers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Refunds</h3>
                <p className="font-semibold text-destructive">
                  {formatCurrency(stats.totalRefunds)}
                </p>
                <p className="text-sm text-muted-foreground">Refunded to customers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finance Growth Charts */}
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Finance insights
              </h2>
              <p className="text-xs text-muted-foreground">
                Trends for revenue, platform fees, disbursements, and refunds.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
                {[
                  { id: "monthly", label: "Monthly" },
                  { id: "quarterly", label: "Quarterly" },
                  { id: "semiannual", label: "Semi-annually" },
                  { id: "yearly", label: "Yearly" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setGrowthPeriod(option.id as FinanceInsightsPeriod);
                      setSelectedMonth("All");
                      setSelectedYear("All");
                    }}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      growthPeriod === option.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-primary "
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {growthPeriod === "monthly" && (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="mt-1 w-full sm:w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All months</SelectItem>
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {growthPeriod === "yearly" && (
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="mt-1 w-full sm:w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All years</SelectItem>
                    {financeGrowth?.totalRevenue.map((d) => (
                      <SelectItem key={d.label} value={d.label}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Revenue
              </h3>
              <div className="h-56 flex items-center justify-center">
                {growthLoading ? (
                  <p className="text-xs text-muted-foreground">Loading chart data...</p>
                ) : filteredGrowth.totalRevenue.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No data available for this period.
                  </p>
                ) : (
                  <CustomLineChart
                    data={filteredGrowth.totalRevenue}
                    dataKey="value"
                    xAxisKey="label"
                    height={220}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Platform Fees
              </h3>
              <div className="h-56 flex items-center justify-center">
                {growthLoading ? (
                  <p className="text-xs text-muted-foreground">Loading chart data...</p>
                ) : filteredGrowth.platformFees.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No data available for this period.
                  </p>
                ) : (
                  <CustomBarChart
                    data={filteredGrowth.platformFees}
                    dataKey="value"
                    xAxisKey="label"
                    height={220}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pending Disbursements
              </h3>
              <div className="h-56 flex items-center justify-center">
                {growthLoading ? (
                  <p className="text-xs text-muted-foreground">Loading chart data...</p>
                ) : filteredGrowth.pendingDisbursements.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No data available for this period.
                  </p>
                ) : (
                  <CustomLineChart
                    data={filteredGrowth.pendingDisbursements}
                    dataKey="value"
                    xAxisKey="label"
                    height={220}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Refunds
              </h3>
              <div className="h-56 flex items-center justify-center">
                {growthLoading ? (
                  <p className="text-xs text-muted-foreground">Loading chart data...</p>
                ) : filteredGrowth.totalRefunds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No data available for this period.
                  </p>
                ) : (
                  <CustomBarChart
                    data={filteredGrowth.totalRefunds}
                    dataKey="value"
                    xAxisKey="label"
                    height={220}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="border-border bg-card hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate("/admin/finance/payments")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Payment Transactions</h3>
                  <p className="text-sm text-muted-foreground">View all payments</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border bg-card hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate("/admin/finance/disbursements")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Disbursements</h3>
                  <p className="text-sm text-muted-foreground">Manage payouts</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border bg-card hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate("/admin/finance/refunds")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Refunds</h3>
                  <p className="text-sm text-muted-foreground">Process refunds</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border bg-card hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate("/admin/finance/reconciliation")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Reconciliation</h3>
                  <p className="text-sm text-muted-foreground">Sync with Paystack</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        {stats.recentTransactions.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin/finance/payments")}
                >
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <div className="space-y-3">
                {stats.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border border-border/40 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/admin/finance/payments/${tx.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {tx.event?.title || "Unknown Event"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tx.attendeeName || tx.attendeeEmail} • {tx.transactionNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-success">
                        {formatCurrency(tx.amount, tx.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tx.paymentDate
                          ? new Date(tx.paymentDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default EventFinanceDashboard;

