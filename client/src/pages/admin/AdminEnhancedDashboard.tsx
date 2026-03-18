import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, DollarSign, Plus, Building2, Activity, TrendingUp, Zap } from "lucide-react";
import { useAdminDashboardStats, useAdminDashboardGrowth } from "@/hooks/queries";
import type { AdminDashboardGrowthPeriod, AdminDashboardGrowthPoint } from "@/lib/admin-api";
import { CustomLineChart, CustomBarChart, CustomAreaChart } from "../../components/charts/ChartComponents";
import { CHART_COLORS } from "../../components/charts/chartConstants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSkeleton, ChartCardSkeleton } from "@/components/loaders/DashboardSkeleton";

const AdminEnhancedDashboard = () => {
  // State for filters
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [growthPeriod, setGrowthPeriod] = useState<AdminDashboardGrowthPeriod>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");

  // React Query hooks - automatic caching and refetching
  const { data: statsData, isLoading: statsLoading } = useAdminDashboardStats(timeRange);
  const { data: growthData, isLoading: growthLoading } = useAdminDashboardGrowth(growthPeriod);

  // Transform stats data for rendering
  const stats = statsData ? [
    {
      title: "Total Events",
      value: statsData.stats.totalEvents.value,
      change: statsData.stats.totalEvents.change,
      changeType: statsData.stats.totalEvents.changeType,
      icon: Calendar,
    },
    {
      title: "Active Staff",
      value: statsData.stats.activeStaff.value,
      change: statsData.stats.activeStaff.change,
      changeType: statsData.stats.activeStaff.changeType,
      icon: Users,
    },
    {
      title: "Organizers",
      value: statsData.stats.organizers.value,
      change: statsData.stats.organizers.change,
      changeType: statsData.stats.organizers.changeType,
      icon: Building2,
    },
    {
      title: "Platform Revenue",
      value: statsData.stats.platformRevenue.value,
      change: statsData.stats.platformRevenue.change,
      changeType: statsData.stats.platformRevenue.changeType,
      icon: DollarSign,
    },
  ] : [];

  // Filter growth data based on selected period
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header - Following industry standards (title in content, not header) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "7d" | "30d" | "90d" | "1y")}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Link
            to="/admin/events/create"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 h-9"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </div>
      </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section aria-labelledby="stats-heading">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2
                    id="stats-heading"
                    className="text-section-header uppercase tracking-wide"
                  >
                    Key metrics
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Real-time platform performance indicators</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  <span className="font-medium">Live</span>
                </div>
              </div>

              {/* Enhanced Stats Cards with Gradients */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => {
                  // Define gradient colors for each metric
                  const gradientColors = [
                    'from-emerald-500 to-emerald-600', // Events
                    'from-indigo-500 to-indigo-600',   // Staff
                    'from-blue-500 to-blue-600',       // Organizers
                    'from-amber-500 to-orange-500',    // Revenue
                  ];

                  return (
                    <div
                      key={index}
                      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    >
                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              {stat.title}
                            </p>
                            <p className="mt-2 text-3xl font-bold text-foreground">
                              {stat.value}
                            </p>
                            <div className="mt-2 flex items-center">
                              <span className={`text-sm font-semibold ${
                                stat.changeType === "positive"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}>
                                {stat.change}
                              </span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                vs last period
                              </span>
                            </div>
                          </div>

                          {/* Gradient Icon Badge */}
                          <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${gradientColors[index]} rounded-xl flex items-center justify-center shadow-lg`}>
                            <stat.icon className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {!statsLoading && (
          <>

            <section className="space-y-6 border-t border-border/40 pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-section-header uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Growth insights
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Organizers, events, revenue, and attendees over time
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-card p-1 text-xs shadow-sm">
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
                        className={`px-3 py-1.5 rounded-full transition-all duration-200 font-medium ${
                          growthPeriod === option.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {growthPeriod === "monthly" && growthData && (
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="mt-1 w-full sm:w-44 h-9 text-xs border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All months</SelectItem>
                        {growthData.organizers.map((d) => (
                          <SelectItem key={d.label} value={d.label}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {growthPeriod === "yearly" && growthData && (
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="mt-1 w-full sm:w-44 h-9 text-xs border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All years</SelectItem>
                        {growthData.organizers.map((d) => (
                          <SelectItem key={d.label} value={d.label}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Charts Grid - 2 columns on large screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organizer Growth */}
                {growthLoading ? (
                  <ChartCardSkeleton title="Organizer Growth" />
                ) : (
                  <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-info" />
                          Organizer Growth
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">New organizers joining platform</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1.5 text-xs font-medium text-info">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Active
                      </div>
                    </div>
                    <div className="h-56 flex items-center justify-center">
                      {filteredGrowth.organizers.length === 0 ? (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">No data available for this period</p>
                        </div>
                      ) : (
                        <CustomLineChart
                          data={filteredGrowth.organizers}
                          dataKey="value"
                          xAxisKey="label"
                          height={224}
                          color={CHART_COLORS.info}
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Events Created */}
                {growthLoading ? (
                  <ChartCardSkeleton title="Events Created" />
                ) : (
                  <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-secondary" />
                          Events Created
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Total events launched</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Growing
                      </div>
                    </div>
                    <div className="h-56 flex items-center justify-center">
                      {filteredGrowth.events.length === 0 ? (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">No data available for this period</p>
                        </div>
                      ) : (
                        <CustomBarChart
                          data={filteredGrowth.events}
                          dataKey="value"
                          xAxisKey="label"
                          height={224}
                          color={CHART_COLORS.secondary}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Platform Revenue */}
                {growthLoading ? (
                  <ChartCardSkeleton title="Platform Revenue" />
                ) : (
                  <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          Platform Revenue
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Total revenue generated</p>
                      </div>
                      {statsData?.stats?.platformRevenue?.change && (
                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                          statsData?.stats?.platformRevenue?.changeType === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          <TrendingUp className="h-3.5 w-3.5" />
                          {statsData?.stats?.platformRevenue?.change}
                        </div>
                      )}
                    </div>
                    <div className="h-56 flex items-center justify-center">
                      {filteredGrowth.revenue.length === 0 ? (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">No data available for this period</p>
                        </div>
                      ) : (
                        <CustomAreaChart
                          data={filteredGrowth.revenue}
                          dataKey="value"
                          xAxisKey="label"
                          height={224}
                          color={CHART_COLORS.primary}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Attendees / Users */}
                {growthLoading ? (
                  <ChartCardSkeleton title="Attendees / Users" />
                ) : (
                  <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Users className="h-5 w-5 text-teal-500" />
                          Attendees / Users
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Platform user base growth</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
                        <Zap className="h-3.5 w-3.5" />
                        Engaged
                      </div>
                    </div>
                    <div className="h-56 flex items-center justify-center">
                      {filteredGrowth.attendees.length === 0 ? (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">No data available for this period</p>
                        </div>
                      ) : (
                        <CustomAreaChart
                          data={filteredGrowth.attendees}
                          dataKey="value"
                          xAxisKey="label"
                          height={224}
                          color={CHART_COLORS.teal}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
    </div>
  );
};

export default AdminEnhancedDashboard;

