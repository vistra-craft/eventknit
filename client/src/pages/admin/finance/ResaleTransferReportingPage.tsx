import { useState, useEffect } from "react";
import {
  DollarSign,
  ArrowLeftRight,
  TrendingUp,
  AlertCircle,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAdminResaleStats,
  getAdminTransferStats,
  getAdminResaleActivity,
  getAdminResalePendingPayouts,
  type AdminResaleStats,
  type AdminTransferStats,
  type AdminResaleActivity,
  type ResalePayoutItem,
} from "@/lib/admin-api";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/lib/utils/error";
import BackButton from "@/components/BackButton";

const ResaleTransferReportingPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "payouts">("overview");
  const [loading, setLoading] = useState(true);
  const [resaleStats, setResaleStats] = useState<AdminResaleStats | null>(null);
  const [transferStats, setTransferStats] = useState<AdminTransferStats | null>(null);
  const [resaleActivity, setResaleActivity] = useState<AdminResaleActivity[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingPayouts, setPendingPayouts] = useState<ResalePayoutItem[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<{ totalPending: number; totalPayoutAmount: number; totalPlatformFees: number } | null>(null);

  // Load stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [resaleRes, transferRes] = await Promise.all([
          getAdminResaleStats(),
          getAdminTransferStats(),
        ]);
        if (resaleRes.success && resaleRes.data) setResaleStats(resaleRes.data);
        if (transferRes.success && transferRes.data) setTransferStats(transferRes.data);
      } catch (err) {
        toast({
          title: "Load failed",
          description: extractErrorMessage(err, "Failed to load resale & transfer stats"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  // Load activity when tab or filters change
  useEffect(() => {
    if (activeTab !== "activity") return;
    const fetchActivity = async () => {
      try {
        const res = await getAdminResaleActivity({
          status: statusFilter !== "all" ? statusFilter : undefined,
          page: activityPage,
          limit: 25,
        });
        if (res.success && res.data) {
          setResaleActivity(res.data.listings);
          setActivityTotal(res.data.total);
        }
      } catch (err) {
        toast({
          title: "Load failed",
          description: extractErrorMessage(err, "Failed to load resale activity"),
          variant: "destructive",
        });
      }
    };
    fetchActivity();
  }, [activeTab, statusFilter, activityPage, toast]);

  // Load pending payouts when tab changes
  useEffect(() => {
    if (activeTab !== "payouts") return;
    const fetchPayouts = async () => {
      try {
        const res = await getAdminResalePendingPayouts({ limit: 50 });
        if (res.success && res.data) {
          setPendingPayouts(res.data.payouts);
          setPayoutSummary(res.data.summary);
        }
      } catch (err) {
        toast({
          title: "Load failed",
          description: extractErrorMessage(err, "Failed to load pending payouts"),
          variant: "destructive",
        });
      }
    };
    fetchPayouts();
  }, [activeTab, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Resale Listings",
      value: resaleStats?.totalListings || 0,
      subtitle: `${resaleStats?.activeListings || 0} active · ${resaleStats?.soldListings || 0} sold`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Resale Platform Fees",
      value: `$${(resaleStats?.totalPlatformFees || 0).toLocaleString()}`,
      subtitle: `$${(resaleStats?.totalResaleValue || 0).toLocaleString()} total value`,
      icon: TrendingUp,
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Pending Payouts",
      value: `$${(resaleStats?.pendingPayouts?.amount || 0).toLocaleString()}`,
      subtitle: `${resaleStats?.pendingPayouts?.count || 0} sellers awaiting payout`,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      title: "Total Transfers",
      value: transferStats?.totalTransfers || 0,
      subtitle: `${transferStats?.acceptedTransfers || 0} completed · ${transferStats?.pendingTransfers || 0} pending`,
      icon: ArrowLeftRight,
      gradient: "from-blue-500 to-blue-600",
    },
  ];

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "activity" as const, label: "Resale Activity" },
    { key: "payouts" as const, label: "Seller Payouts" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-page-title">Resale & Transfer Reporting</h1>
          <p className="text-sm text-muted-foreground">Platform-wide ticket resale and transfer analytics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="sticky top-0 z-10 bg-background pb-2 pt-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Events by Resale */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Events by Resale Volume</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(!resaleStats?.topEvents || resaleStats.topEvents.length === 0) ? (
                <div className="p-8 text-center">
                  <Share2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No resale data yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground">Event</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Resales</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Total Value</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Platform Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resaleStats.topEvents.map((event) => (
                        <tr key={event.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium">{event.title}</td>
                          <td className="p-3 text-right">{event.resaleCount}</td>
                          <td className="p-3 text-right">${event.totalValue.toLocaleString()}</td>
                          <td className="p-3 text-right text-muted-foreground">${event.totalFees.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer breakdown */}
          {transferStats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Transfer Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Pending", value: transferStats.pendingTransfers, icon: Clock, color: "text-yellow-600" },
                    { label: "Accepted", value: transferStats.acceptedTransfers, icon: CheckCircle, color: "text-green-600" },
                    { label: "Rejected", value: transferStats.rejectedTransfers, icon: XCircle, color: "text-red-600" },
                    { label: "Cancelled", value: transferStats.cancelledTransfers, icon: XCircle, color: "text-muted-foreground" },
                    { label: "Expired", value: transferStats.expiredTransfers, icon: AlertCircle, color: "text-orange-600" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <div>
                        <p className="text-xl font-bold">{item.value}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setActivityPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="LISTED">Listed</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{activityTotal} listing{activityTotal !== 1 ? 's' : ''}</p>
          </div>

          {/* Activity Table */}
          <Card>
            <CardContent className="p-0">
              {resaleActivity.length === 0 ? (
                <div className="p-8 text-center">
                  <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No resale activity found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground">Event</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Seller</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Ticket</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Original</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Resale</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Fee</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Buyer</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resaleActivity.map((item) => (
                        <tr key={item.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <p className="font-medium max-w-[200px] truncate">{item.event.title}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-medium">{item.seller.firstName} {item.seller.lastName}</p>
                            <p className="text-xs text-muted-foreground">{item.seller.email}</p>
                          </td>
                          <td className="p-3">{item.ticketType}</td>
                          <td className="p-3 text-right text-muted-foreground line-through">${item.originalPrice}</td>
                          <td className="p-3 text-right font-medium">${item.resalePrice}</td>
                          <td className="p-3 text-right text-muted-foreground">${item.platformFee || 0}</td>
                          <td className="p-3">
                            <Badge className={
                              item.status === 'SOLD' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              item.status === 'LISTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              item.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-muted text-muted-foreground'
                            }>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {item.buyer ? (
                              <span>{item.buyer.firstName} {item.buyer.lastName}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(item.listedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {activityTotal > 25 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {activityPage} of {Math.ceil(activityTotal / 25)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  disabled={activityPage <= 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setActivityPage((p) => p + 1)}
                  disabled={activityPage >= Math.ceil(activityTotal / 25)}
                  className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="space-y-4">
          {/* Payout Summary */}
          {payoutSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">Pending Seller Payouts</p>
                  <p className="text-2xl font-bold mt-1">{payoutSummary.totalPending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">Total Payout Amount</p>
                  <p className="text-2xl font-bold mt-1 text-primary">${payoutSummary.totalPayoutAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">Platform Fees Earned</p>
                  <p className="text-2xl font-bold mt-1 text-success">${payoutSummary.totalPlatformFees.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pending Payouts Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending Seller Payouts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingPayouts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No pending payouts</p>
                  <p className="text-xs text-muted-foreground mt-1">All resale seller payouts have been processed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground">Seller</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Event</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Ticket</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Resale Price</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Platform Fee</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Seller Payout</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Sold At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayouts.map((payout) => (
                        <tr key={payout.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <p className="font-medium">{payout.seller.firstName} {payout.seller.lastName}</p>
                            <p className="text-xs text-muted-foreground">{payout.seller.email}</p>
                          </td>
                          <td className="p-3">
                            <p className="max-w-[200px] truncate">{payout.event.title}</p>
                          </td>
                          <td className="p-3">{payout.ticketType}</td>
                          <td className="p-3 text-right">${payout.resalePrice}</td>
                          <td className="p-3 text-right text-muted-foreground">${payout.platformFee}</td>
                          <td className="p-3 text-right font-bold text-primary">${payout.sellerPayout}</td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {payout.soldAt ? new Date(payout.soldAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResaleTransferReportingPage;
