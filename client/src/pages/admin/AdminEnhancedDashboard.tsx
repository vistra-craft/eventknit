import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, DollarSign, Plus, ArrowUpRight, ArrowDownRight, Building2 } from "lucide-react";
import { getAdminDashboardStats, getAdminDashboardGrowth } from "../../lib/admin-api";
import type { AdminDashboardGrowthPeriod, AdminDashboardGrowthPoint } from "../../lib/admin-api";
import { CustomLineChart, CustomBarChart } from "../../components/charts/ChartComponents";

const AdminEnhancedDashboard = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: "Total Events",
      value: "1,247",
      change: "+18%",
      changeType: "positive",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
    {
      title: "Active Staff",
      value: "12,456",
      change: "+24%",
      changeType: "positive",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
    {
      title: "Organizers",
      value: "1,089",
      change: "+15%",
      changeType: "positive",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
    {
      title: "Platform Revenue",
      value: "$2,847,450",
      change: "+32%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
  ]);
  // Dashboard growth charts (real data)
  const [growthPeriod, setGrowthPeriod] = useState<AdminDashboardGrowthPeriod>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [growthLoading, setGrowthLoading] = useState<boolean>(false);
  const [growthData, setGrowthData] = useState<{
    organizers: AdminDashboardGrowthPoint[];
    events: AdminDashboardGrowthPoint[];
    revenue: AdminDashboardGrowthPoint[];
    attendees: AdminDashboardGrowthPoint[];
  } | null>(null);

  const applyGrowthFilters = (data: AdminDashboardGrowthPoint[]) => {
    if (growthPeriod === "monthly" && selectedMonth !== "All") {
      return data.filter((d) => d.label === selectedMonth);
    }
    if (growthPeriod === "yearly" && selectedYear !== "All") {
      return data.filter((d) => d.label === selectedYear);
    }
    return data;
  };

  const filteredGrowth = growthData
    ? {
        organizers: applyGrowthFilters(growthData.organizers),
        events: applyGrowthFilters(growthData.events),
        revenue: applyGrowthFilters(growthData.revenue),
        attendees: applyGrowthFilters(growthData.attendees),
      }
    : {
        organizers: [],
        events: [],
        revenue: [],
        attendees: [],
      };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsResponse = await getAdminDashboardStats(timeRange);

        // Update stats
        if (statsResponse.success && statsResponse.data.stats) {
          const dashboardStats = statsResponse.data.stats;
          setStats([
            {
              title: "Total Events",
              value: dashboardStats.totalEvents.value,
              change: dashboardStats.totalEvents.change,
              changeType: dashboardStats.totalEvents.changeType,
              icon: Calendar,
              color: "text-primary",
              bgColor: "bg-card",
              borderColor: "border-border",
            },
            {
              title: "Active Staff",
              value: dashboardStats.activeStaff.value,
              change: dashboardStats.activeStaff.change,
              changeType: dashboardStats.activeStaff.changeType,
              icon: Users,
              color: "text-primary",
              bgColor: "bg-card",
              borderColor: "border-border",
            },
            {
              title: "Organizers",
              value: dashboardStats.organizers.value,
              change: dashboardStats.organizers.change,
              changeType: dashboardStats.organizers.changeType,
              icon: Building2,
              color: "text-primary",
              bgColor: "bg-card",
              borderColor: "border-border",
            },
            {
              title: "Platform Revenue",
              value: dashboardStats.platformRevenue.value,
              change: dashboardStats.platformRevenue.change,
              changeType: dashboardStats.platformRevenue.changeType,
              icon: DollarSign,
              color: "text-primary",
              bgColor: "bg-card",
              borderColor: "border-border",
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        setGrowthLoading(true);
        const response = await getAdminDashboardGrowth(growthPeriod);
        if (response.success && response.data) {
          setGrowthData({
            organizers: response.data.organizers,
            events: response.data.events,
            revenue: response.data.revenue,
            attendees: response.data.attendees,
          });
        } else {
          setGrowthData(null);
        }
      } catch (error) {
        console.error("Failed to fetch admin growth data:", error);
        setGrowthData(null);
      } finally {
        setGrowthLoading(false);
      }
    };

    fetchGrowthData();
  }, [growthPeriod]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase mb-1">
              EventKnit
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              Admin dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              High-level overview of your platform performance and system health.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d" | "1y")}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Link
              to="/admin/events/create"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create event
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card/40 py-12">
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <section aria-labelledby="stats-heading">
              <div className="mb-4 flex items-center justify-between">
                <h2
                  id="stats-heading"
                  className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Key metrics
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-card/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex items-center space-x-1 rounded-full bg-muted px-2 py-1 text-xs font-medium">
                        {stat.changeType === "positive" ? (
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-600" />
                        )}
                        <span
                          className={
                            stat.changeType === "positive" ? "text-green-700" : "text-red-700"
                          }
                        >
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Growth insights
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Organizers, events, revenue, and attendees over time.
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
                          setGrowthPeriod(option.id as AdminDashboardGrowthPeriod);
                          setSelectedMonth("All");
                          setSelectedYear("All");
                        }}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          growthPeriod === option.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-gray-900 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {growthPeriod === "monthly" && growthData && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-gray-900 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary sm:w-44"
                    >
                      <option value="All">All months</option>
                      {growthData.organizers.map((d) => (
                        <option key={d.label} value={d.label}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {growthPeriod === "yearly" && growthData && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-gray-900 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary sm:w-44"
                    >
                      <option value="All">All years</option>
                      {growthData.organizers.map((d) => (
                        <option key={d.label} value={d.label}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Organizer growth
                  </h3>
                  <div className="h-52 flex items-center justify-center">
                    {growthLoading ? (
                      <p className="text-xs text-muted-foreground">Loading chart data...</p>
                    ) : filteredGrowth.organizers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No data available for this period.
                      </p>
                    ) : (
                      <CustomLineChart
                        data={filteredGrowth.organizers}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Events created
                  </h3>
                  <div className="h-52 flex items-center justify-center">
                    {growthLoading ? (
                      <p className="text-xs text-muted-foreground">Loading chart data...</p>
                    ) : filteredGrowth.events.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No data available for this period.
                      </p>
                    ) : (
                      <CustomBarChart
                        data={filteredGrowth.events}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Platform revenue
                  </h3>
                  <div className="h-52 flex items-center justify-center">
                    {growthLoading ? (
                      <p className="text-xs text-muted-foreground">Loading chart data...</p>
                    ) : filteredGrowth.revenue.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No data available for this period.
                      </p>
                    ) : (
                      <CustomLineChart
                        data={filteredGrowth.revenue}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Attendees / users
                  </h3>
                  <div className="h-52 flex items-center justify-center">
                    {growthLoading ? (
                      <p className="text-xs text-muted-foreground">Loading chart data...</p>
                    ) : filteredGrowth.attendees.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No data available for this period.
                      </p>
                    ) : (
                      <CustomBarChart
                        data={filteredGrowth.attendees}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminEnhancedDashboard;

