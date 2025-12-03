import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, DollarSign, Plus, ArrowUpRight, ArrowDownRight, Building2 } from "lucide-react";
import { getAdminDashboardStats } from "../../lib/admin-api";
import { CustomLineChart, CustomBarChart } from "../../components/charts/ChartComponents";

type GrowthPeriod = "monthly" | "quarterly" | "semiannual" | "yearly";

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
  // Dashboard growth charts (mock data)
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");

  const mockGrowthData: Record<
    GrowthPeriod,
    {
      organizers: { label: string; value: number }[];
      events: { label: string; value: number }[];
      revenue: { label: string; value: number }[];
      attendees: { label: string; value: number }[];
    }
  > = {
    monthly: {
      organizers: [
        { label: "Jan", value: 12 },
        { label: "Feb", value: 18 },
        { label: "Mar", value: 24 },
        { label: "Apr", value: 30 },
        { label: "May", value: 37 },
        { label: "Jun", value: 45 },
      ],
      events: [
        { label: "Jan", value: 28 },
        { label: "Feb", value: 35 },
        { label: "Mar", value: 40 },
        { label: "Apr", value: 52 },
        { label: "May", value: 60 },
        { label: "Jun", value: 72 },
      ],
      revenue: [
        { label: "Jan", value: 24_000 },
        { label: "Feb", value: 32_500 },
        { label: "Mar", value: 41_200 },
        { label: "Apr", value: 55_800 },
        { label: "May", value: 68_300 },
        { label: "Jun", value: 81_900 },
      ],
      attendees: [
        { label: "Jan", value: 3_200 },
        { label: "Feb", value: 4_100 },
        { label: "Mar", value: 5_600 },
        { label: "Apr", value: 7_200 },
        { label: "May", value: 8_900 },
        { label: "Jun", value: 10_400 },
      ],
    },
    quarterly: {
      organizers: [
        { label: "Q1", value: 24 },
        { label: "Q2", value: 45 },
        { label: "Q3", value: 63 },
        { label: "Q4", value: 80 },
      ],
      events: [
        { label: "Q1", value: 88 },
        { label: "Q2", value: 135 },
        { label: "Q3", value: 160 },
        { label: "Q4", value: 210 },
      ],
      revenue: [
        { label: "Q1", value: 97_000 },
        { label: "Q2", value: 148_500 },
        { label: "Q3", value: 192_300 },
        { label: "Q4", value: 238_900 },
      ],
      attendees: [
        { label: "Q1", value: 12_500 },
        { label: "Q2", value: 18_700 },
        { label: "Q3", value: 24_900 },
        { label: "Q4", value: 31_200 },
      ],
    },
    semiannual: {
      organizers: [
        { label: "H1", value: 45 },
        { label: "H2", value: 92 },
      ],
      events: [
        { label: "H1", value: 150 },
        { label: "H2", value: 310 },
      ],
      revenue: [
        { label: "H1", value: 245_000 },
        { label: "H2", value: 512_000 },
      ],
      attendees: [
        { label: "H1", value: 21_000 },
        { label: "H2", value: 44_500 },
      ],
    },
    yearly: {
      organizers: [
        { label: "2022", value: 50 },
        { label: "2023", value: 95 },
        { label: "2024", value: 140 },
      ],
      events: [
        { label: "2022", value: 280 },
        { label: "2023", value: 410 },
        { label: "2024", value: 560 },
      ],
      revenue: [
        { label: "2022", value: 480_000 },
        { label: "2023", value: 730_000 },
        { label: "2024", value: 1_020_000 },
      ],
      attendees: [
        { label: "2022", value: 38_000 },
        { label: "2023", value: 57_500 },
        { label: "2024", value: 79_200 },
      ],
    },
  };

  const currentGrowth = mockGrowthData[growthPeriod];

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
    organizers: applyGrowthFilters(currentGrowth.organizers),
    events: applyGrowthFilters(currentGrowth.events),
    revenue: applyGrowthFilters(currentGrowth.revenue),
    attendees: applyGrowthFilters(currentGrowth.attendees),
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

  return (
    <div className="min-h-screen bg-background">
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
                          setGrowthPeriod(option.id as GrowthPeriod);
                          setSelectedMonth("All");
                          setSelectedYear("All");
                        }}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          growthPeriod === option.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
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
                      {mockGrowthData.yearly.organizers.map((d) => (
                        <option key={d.label} value={d.label}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {currentGrowth && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Organizer growth
                    </h3>
                    <div className="h-52">
                      <CustomLineChart
                        data={filteredGrowth.organizers}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Events created
                    </h3>
                    <div className="h-52">
                      <CustomBarChart
                        data={filteredGrowth.events}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Platform revenue
                    </h3>
                    <div className="h-52">
                      <CustomLineChart
                        data={filteredGrowth.revenue}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Attendees / users
                    </h3>
                    <div className="h-52">
                      <CustomBarChart
                        data={filteredGrowth.attendees}
                        dataKey="value"
                        xAxisKey="label"
                        height={200}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminEnhancedDashboard;

