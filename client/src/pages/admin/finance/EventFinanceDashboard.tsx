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

