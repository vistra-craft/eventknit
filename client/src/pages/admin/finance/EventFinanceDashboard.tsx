import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "../AdminLayout";
import { 
  getPaymentTransactions, 
  getDisbursements,
  getRefunds,
  type PaymentTransaction 
} from "@/lib/financial-api";
import { useToast } from "@/hooks/use-toast";
import { CustomLineChart, CustomBarChart } from "@/components/charts/ChartComponents";

type FinanceGrowthPeriod = "monthly" | "quarterly" | "semiannual" | "yearly";

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

  // Finance growth charts (currently mock data)
  const [growthPeriod, setGrowthPeriod] = useState<FinanceGrowthPeriod>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");

  const mockFinanceGrowth: Record<
    FinanceGrowthPeriod,
    {
      totalRevenue: { label: string; value: number }[];
      platformFees: { label: string; value: number }[];
      pendingDisbursements: { label: string; value: number }[];
      totalRefunds: { label: string; value: number }[];
    }
  > = {
    monthly: {
      totalRevenue: [
        { label: "Jan", value: 320_000 },
        { label: "Feb", value: 410_000 },
        { label: "Mar", value: 520_000 },
        { label: "Apr", value: 610_000 },
        { label: "May", value: 720_000 },
        { label: "Jun", value: 810_000 },
      ],
      platformFees: [
        { label: "Jan", value: 32_000 },
        { label: "Feb", value: 41_000 },
        { label: "Mar", value: 52_000 },
        { label: "Apr", value: 61_000 },
        { label: "May", value: 72_000 },
        { label: "Jun", value: 81_000 },
      ],
      pendingDisbursements: [
        { label: "Jan", value: 120_000 },
        { label: "Feb", value: 95_000 },
        { label: "Mar", value: 140_000 },
        { label: "Apr", value: 110_000 },
        { label: "May", value: 160_000 },
        { label: "Jun", value: 135_000 },
      ],
      totalRefunds: [
        { label: "Jan", value: 18_000 },
        { label: "Feb", value: 22_000 },
        { label: "Mar", value: 25_000 },
        { label: "Apr", value: 21_000 },
        { label: "May", value: 26_000 },
        { label: "Jun", value: 29_000 },
      ],
    },
    quarterly: {
      totalRevenue: [
        { label: "Q1", value: 1_250_000 },
        { label: "Q2", value: 1_650_000 },
        { label: "Q3", value: 1_980_000 },
        { label: "Q4", value: 2_300_000 },
      ],
      platformFees: [
        { label: "Q1", value: 125_000 },
        { label: "Q2", value: 165_000 },
        { label: "Q3", value: 198_000 },
        { label: "Q4", value: 230_000 },
      ],
      pendingDisbursements: [
        { label: "Q1", value: 360_000 },
        { label: "Q2", value: 420_000 },
        { label: "Q3", value: 390_000 },
        { label: "Q4", value: 450_000 },
      ],
      totalRefunds: [
        { label: "Q1", value: 65_000 },
        { label: "Q2", value: 78_000 },
        { label: "Q3", value: 82_000 },
        { label: "Q4", value: 90_000 },
      ],
    },
    semiannual: {
      totalRevenue: [
        { label: "H1", value: 2_900_000 },
        { label: "H2", value: 3_600_000 },
      ],
      platformFees: [
        { label: "H1", value: 290_000 },
        { label: "H2", value: 360_000 },
      ],
      pendingDisbursements: [
        { label: "H1", value: 780_000 },
        { label: "H2", value: 920_000 },
      ],
      totalRefunds: [
        { label: "H1", value: 145_000 },
        { label: "H2", value: 168_000 },
      ],
    },
    yearly: {
      totalRevenue: [
        { label: "2022", value: 4_800_000 },
        { label: "2023", value: 6_300_000 },
        { label: "2024", value: 7_900_000 },
      ],
      platformFees: [
        { label: "2022", value: 480_000 },
        { label: "2023", value: 630_000 },
        { label: "2024", value: 790_000 },
      ],
      pendingDisbursements: [
        { label: "2022", value: 980_000 },
        { label: "2023", value: 1_150_000 },
        { label: "2024", value: 1_320_000 },
      ],
      totalRefunds: [
        { label: "2022", value: 260_000 },
        { label: "2023", value: 305_000 },
        { label: "2024", value: 340_000 },
      ],
    },
  };

  const currentGrowth = mockFinanceGrowth[growthPeriod];

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
    totalRevenue: applyGrowthFilters(currentGrowth.totalRevenue),
    platformFees: applyGrowthFilters(currentGrowth.platformFees),
    pendingDisbursements: applyGrowthFilters(currentGrowth.pendingDisbursements),
    totalRefunds: applyGrowthFilters(currentGrowth.totalRefunds),
  };

  useEffect(() => {
    loadFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const pendingDisbursements = disbursementsResponse.success && disbursementsResponse.data
        ? disbursementsResponse.data.reduce((sum, d) => sum + d.totalAmount, 0)
        : 0;

      // Load refunds for total refunds
      const refundsResponse = await getRefunds({
        eventId: "", // Get all refunds
        status: "completed",
      });

      const totalRefunds = refundsResponse.success && refundsResponse.data
        ? refundsResponse.data.reduce((sum, r) => sum + r.refundAmount, 0)
        : 0;

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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Event Finance Dashboard</h1>
            <p className="text-gray-600">Overview of event-related payments and finances</p>
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
                <div className="p-3 rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Revenue</h3>
                <p className="font-semibold text-green-600">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-sm text-gray-600">From all event payments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Platform Fees</h3>
                <p className="font-semibold text-blue-600">
                  {formatCurrency(stats.platformFees)}
                </p>
                <p className="text-sm text-gray-600">Commission earned</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Pending Disbursements</h3>
                <p className="font-semibold text-purple-600">
                  {formatCurrency(stats.pendingDisbursements)}
                </p>
                <p className="text-sm text-gray-600">Awaiting payout to organizers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-red-100">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Refunds</h3>
                <p className="font-semibold text-red-600">
                  {formatCurrency(stats.totalRefunds)}
                </p>
                <p className="text-sm text-gray-600">Refunded to customers</p>
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
                      setGrowthPeriod(option.id as FinanceGrowthPeriod);
                      setSelectedMonth("All");
                      setSelectedYear("All");
                    }}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      growthPeriod === option.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-primary-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {growthPeriod === "monthly" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-44"
                >
                  <option value="All">All months</option>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}

              {growthPeriod === "yearly" && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-44"
                >
                  <option value="All">All years</option>
                  {mockFinanceGrowth.yearly.totalRevenue.map((d) => (
                    <option key={d.label} value={d.label}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Revenue
              </h3>
              <div className="h-56">
                <CustomLineChart
                  data={filteredGrowth.totalRevenue}
                  dataKey="value"
                  xAxisKey="label"
                  height={220}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Platform Fees
              </h3>
              <div className="h-56">
                <CustomBarChart
                  data={filteredGrowth.platformFees}
                  dataKey="value"
                  xAxisKey="label"
                  height={220}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pending Disbursements
              </h3>
              <div className="h-56">
                <CustomLineChart
                  data={filteredGrowth.pendingDisbursements}
                  dataKey="value"
                  xAxisKey="label"
                  height={220}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Refunds
              </h3>
              <div className="h-56">
                <CustomBarChart
                  data={filteredGrowth.totalRefunds}
                  dataKey="value"
                  xAxisKey="label"
                  height={220}
                />
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
                  <p className="text-sm text-gray-600">View all payments</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
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
                  <h3 className="font-semibold text-gray-900">Disbursements</h3>
                  <p className="text-sm text-gray-600">Manage payouts</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
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
                  <h3 className="font-semibold text-gray-900">Refunds</h3>
                  <p className="text-sm text-gray-600">Process refunds</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
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
                  <h3 className="font-semibold text-gray-900">Reconciliation</h3>
                  <p className="text-sm text-gray-600">Sync with Paystack</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        {stats.recentTransactions.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
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
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/admin/finance/payments/${tx.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {tx.event?.title || "Unknown Event"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tx.attendeeName || tx.attendeeEmail} • {tx.transactionNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(tx.amount, tx.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
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
    </AdminLayout>
  );
};

export default EventFinanceDashboard;

