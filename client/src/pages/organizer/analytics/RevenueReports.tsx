import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Target,
  RotateCcw,
} from "lucide-react";
import {
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";
import {
  getRevenueAnalytics,
  getOrganizerEvents,
  type FinancialTotals,
  type RevenueByTicketType,
  type RefundStats,
  type AverageOrderValue,
  type RevenueForecast,
} from "@/lib/organizer-dashboard-api";
import { extractErrorMessage } from "@/lib/utils/error";

interface RevenueAnalyticsData {
  summary: FinancialTotals;
  byTicketType: RevenueByTicketType[];
  refunds: RefundStats;
  averageOrderValue: AverageOrderValue;
  forecasting: RevenueForecast;
}

interface EventItem {
  id: string;
  title: string;
  startDate?: string;
  status?: string;
  category?: string;
}

const getDateRange = (range: string): { startDate?: string; endDate?: string } => {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  const start = new Date(now);
  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      return {};
  }
  return { startDate: start.toISOString().split("T")[0], endDate: end };
};

const formatCurrency = (amount: number, currency = "NGN") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const RevenueReports = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsData | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      const eventId = selectedEventId !== "all" ? selectedEventId : undefined;

      const [analyticsResponse, eventsResponse] = await Promise.all([
        getRevenueAnalytics({ eventId, startDate, endDate }),
        getOrganizerEvents({ limit: 100 }),
      ]);

      if (analyticsResponse.success && analyticsResponse.data) {
        setRevenueData(analyticsResponse.data);
      }
      if (eventsResponse.success && eventsResponse.data?.events) {
        setEvents(eventsResponse.data.events as EventItem[]);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load revenue data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedEventId]);

  const currency = revenueData?.summary.currency ?? "NGN";

  const statCards = revenueData
    ? [
        {
          title: "Gross Revenue",
          value: formatCurrency(revenueData.summary.gross, currency),
          description: "Total collected before deductions",
          icon: DollarSign,
          gradient: "from-success to-success/70",
          positive: true,
        },
        {
          title: "Net Revenue",
          value: formatCurrency(revenueData.summary.net, currency),
          description: "After platform fees",
          icon: TrendingUp,
          gradient: "from-primary to-primary/70",
          positive: true,
        },
        {
          title: "Platform Fees",
          value: formatCurrency(revenueData.summary.platformFees ?? 0, currency),
          description: "EventKnit service fees",
          icon: BarChart3,
          gradient: "from-warning to-warning/70",
          positive: false,
        },
        {
          title: "Avg Order Value",
          value: formatCurrency(revenueData.averageOrderValue.value, currency),
          description: `Range: ${formatCurrency(revenueData.averageOrderValue.min, currency)} – ${formatCurrency(revenueData.averageOrderValue.max, currency)}`,
          icon: Target,
          gradient: "from-primary/80 to-primary/50",
          positive: true,
        },
        {
          title: "Refunds",
          value: formatCurrency(revenueData.refunds.amount, currency),
          description: `${revenueData.refunds.count} refund${revenueData.refunds.count !== 1 ? "s" : ""}`,
          icon: RotateCcw,
          gradient: "from-destructive to-destructive/70",
          positive: false,
        },
        {
          title: "Projected Revenue",
          value: formatCurrency(revenueData.forecasting.projectedRevenue, currency),
          description: `${revenueData.forecasting.projectedRegistrations} registrations • ${Math.round(revenueData.forecasting.confidence * 100)}% confidence`,
          icon: TrendingUp,
          gradient: "from-success/80 to-success/50",
          positive: true,
        },
      ]
    : [];

  const ticketTypeChartData = (revenueData?.byTicketType ?? []).map((t) => ({
    type: t.ticketType,
    revenue: t.revenue,
    count: t.count,
  }));

  const handleExport = () => {
    if (!revenueData) return;

    const rows = [
      ["Metric", "Value"],
      ["Gross Revenue", revenueData.summary.gross],
      ["Net Revenue", revenueData.summary.net],
      ["Platform Fees", revenueData.summary.platformFees ?? 0],
      ["Avg Order Value", revenueData.averageOrderValue.value],
      ["Refund Amount", revenueData.refunds.amount],
      ["Refund Count", revenueData.refunds.count],
      ["Projected Revenue", revenueData.forecasting.projectedRevenue],
      [],
      ["Ticket Type", "Count", "Revenue"],
      ...(revenueData.byTicketType.map((t) => [t.ticketType, t.count, t.revenue])),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-page-title">Revenue Reports</h1>
            <p className="text-page-subtitle mt-1">
              Real-time financial analytics powered by actual payment data
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="all">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!revenueData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map((stat, index) => (
              <Card
                key={index}
                className="group overflow-hidden border border-border/40 bg-card hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                        {stat.title}
                      </p>
                      <p className="mt-1 text-lg font-bold text-foreground leading-tight">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {stat.description}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-9 shrink-0 bg-gradient-to-r ${stat.gradient} rounded-lg flex items-center justify-center`}
                    >
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Ticket Breakdown</TabsTrigger>
            <TabsTrigger value="refunds">Refunds & Forecast</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Ticket Type - Bar */}
              <Card className="border-border/40 bg-card">
                <CardHeader>
                  <CardTitle>Revenue by Ticket Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {ticketTypeChartData.length > 0 ? (
                    <CustomBarChart
                      data={ticketTypeChartData}
                      xAxisKey="type"
                      bars={[
                        {
                          dataKey: "revenue",
                          name: "Revenue",
                          color: CHART_COLORS.success,
                        },
                      ]}
                      height={300}
                      formatter={(value) => formatCurrency(value as number, currency)}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                      No ticket sales in this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Split - Pie */}
              <Card className="border-border/40 bg-card">
                <CardHeader>
                  <CardTitle>Revenue Split</CardTitle>
                </CardHeader>
                <CardContent>
                  {ticketTypeChartData.length > 0 ? (
                    <CustomPieChart
                      data={ticketTypeChartData}
                      dataKey="revenue"
                      nameKey="type"
                      height={300}
                      formatter={(value) => formatCurrency(value as number, currency)}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                      No ticket sales in this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Summary Row */}
            {revenueData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/40 bg-card">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Revenue Waterfall</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gross Revenue</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(revenueData.summary.gross, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Fees</span>
                        <span className="font-medium text-destructive">
                          −{formatCurrency(revenueData.summary.platformFees ?? 0, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Refunds</span>
                        <span className="font-medium text-destructive">
                          −{formatCurrency(revenueData.refunds.amount, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-border/60">
                        <span className="font-semibold text-foreground">Net Revenue</span>
                        <span className="font-bold text-success">
                          {formatCurrency(revenueData.summary.net, currency)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-card">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Order Analytics</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Order Value</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(revenueData.averageOrderValue.value, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Minimum</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(revenueData.averageOrderValue.min, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Maximum</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(revenueData.averageOrderValue.max, currency)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-card">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Revenue Forecast</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Projected</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(revenueData.forecasting.projectedRevenue, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registrations</span>
                        <span className="font-medium text-foreground">
                          {revenueData.forecasting.projectedRegistrations.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <Badge variant="secondary" className="bg-success-light text-success text-xs">
                          {Math.round(revenueData.forecasting.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Ticket Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            <Card className="border-border/40 bg-card">
              <CardHeader>
                <CardTitle>Revenue by Ticket Type</CardTitle>
              </CardHeader>
              <CardContent>
                {ticketTypeChartData.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No ticket sale data available for this period
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                              Ticket Type
                            </th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                              Tickets Sold
                            </th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                              Revenue
                            </th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                              Share
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticketTypeChartData.map((t, i) => {
                            const totalRevenue = ticketTypeChartData.reduce(
                              (sum, r) => sum + r.revenue,
                              0,
                            );
                            const share =
                              totalRevenue > 0
                                ? ((t.revenue / totalRevenue) * 100).toFixed(1)
                                : "0";
                            return (
                              <tr
                                key={i}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium text-foreground">
                                  {t.type}
                                </td>
                                <td className="py-3 px-4 text-right text-muted-foreground">
                                  {t.count.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-foreground">
                                  {formatCurrency(t.revenue, currency)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 bg-muted rounded-full h-1.5">
                                      <div
                                        className="bg-primary h-1.5 rounded-full"
                                        style={{ width: `${share}%` }}
                                      />
                                    </div>
                                    <span className="text-muted-foreground w-10 text-right">
                                      {share}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border">
                            <td className="py-3 px-4 font-bold text-foreground">Total</td>
                            <td className="py-3 px-4 text-right font-bold text-foreground">
                              {ticketTypeChartData
                                .reduce((s, t) => s + t.count, 0)
                                .toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-success">
                              {formatCurrency(
                                ticketTypeChartData.reduce((s, t) => s + t.revenue, 0),
                                currency,
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-muted-foreground">
                              100%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Bar chart */}
                    <CustomAreaChart
                      data={ticketTypeChartData}
                      dataKey="revenue"
                      xAxisKey="type"
                      height={240}
                      color={CHART_COLORS.primary}
                      formatter={(value) => formatCurrency(value as number, currency)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds & Forecast Tab */}
          <TabsContent value="refunds" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Refund Summary */}
              <Card className="border-border/40 bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-destructive" />
                    Refund Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {revenueData ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                          <p className="text-xs text-muted-foreground uppercase font-medium">
                            Total Refunded
                          </p>
                          <p className="text-2xl font-bold text-destructive mt-1">
                            {formatCurrency(revenueData.refunds.amount, currency)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted border border-border/40 p-4">
                          <p className="text-xs text-muted-foreground uppercase font-medium">
                            Refund Count
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {revenueData.refunds.count}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gross Revenue</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(revenueData.summary.gross, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Refund Rate</span>
                          <span
                            className={`font-semibold ${revenueData.summary.gross > 0 && (revenueData.refunds.amount / revenueData.summary.gross) > 0.05 ? "text-destructive" : "text-success"}`}
                          >
                            {revenueData.summary.gross > 0
                              ? (
                                  (revenueData.refunds.amount / revenueData.summary.gross) *
                                  100
                                ).toFixed(2)
                              : "0.00"}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Refund</span>
                          <span className="font-medium text-foreground">
                            {revenueData.refunds.count > 0
                              ? formatCurrency(
                                  revenueData.refunds.amount / revenueData.refunds.count,
                                  currency,
                                )
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <p className="text-xs text-muted-foreground">
                          Refund requests are processed by EventKnit support. To dispute a refund
                          decision, contact support with your event ID.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No refund data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Forecast */}
              <Card className="border-border/40 bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Revenue Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {revenueData ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-success-light border border-success/20 p-4">
                          <p className="text-xs text-muted-foreground uppercase font-medium">
                            Projected Revenue
                          </p>
                          <p className="text-2xl font-bold text-success mt-1">
                            {formatCurrency(revenueData.forecasting.projectedRevenue, currency)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                          <p className="text-xs text-muted-foreground uppercase font-medium">
                            Projected Registrations
                          </p>
                          <p className="text-2xl font-bold text-primary mt-1">
                            {revenueData.forecasting.projectedRegistrations.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Forecast Confidence</span>
                          <span className="text-sm font-semibold text-foreground">
                            {Math.round(revenueData.forecasting.confidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round(revenueData.forecasting.confidence * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2 pt-2 border-t border-border/60">
                        {revenueData.forecasting.confidence >= 0.7 ? (
                          <TrendingUp className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {revenueData.forecasting.confidence >= 0.7
                            ? "Strong forecast signal. Keep up current event performance to hit projections."
                            : "Low confidence forecast. More data needed for accurate projections."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No forecast data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RevenueReports;
