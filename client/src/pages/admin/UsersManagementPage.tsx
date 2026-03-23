import { useState } from "react";
import { Users, Shield, UserCheck, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonMetricCard } from "@/components/ui/Skeleton";
import { useUsersStats } from "@/hooks/queries";
import StaffManagementContent from "./StaffManagementContent";
import OrganizersContent from "./OrganizersContent";
import AttendeesPage from "./AttendeesPage";
import { extractErrorMessage } from "@/lib/utils/error";

const UsersManagementPage = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [timeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Fetch user stats
  const { data: statsData, isLoading: statsLoading, error: statsError } = useUsersStats(timeRange);

  // Transform stats data for rendering
  const stats = statsData ? [
    {
      title: "Total Staff",
      value: statsData.stats.totalStaff.value,
      change: statsData.stats.totalStaff.change,
      changeType: statsData.stats.totalStaff.changeType,
      icon: Shield,
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      title: "Total Organizers",
      value: statsData.stats.totalOrganizers.value,
      change: statsData.stats.totalOrganizers.change,
      changeType: statsData.stats.totalOrganizers.changeType,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: "Total Attendees",
      value: statsData.stats.totalAttendees.value,
      change: statsData.stats.totalAttendees.change,
      changeType: statsData.stats.totalAttendees.changeType,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: "Active Users",
      value: statsData.stats.activeUsers.value,
      change: statsData.stats.activeUsers.change,
      changeType: statsData.stats.activeUsers.changeType,
      icon: Activity,
      gradient: 'from-amber-500 to-orange-500',
    },
  ] : [];

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage staff, organizers, and attendees</p>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonMetricCard key={i} />
            ))}
          </div>
        ) : statsError ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <p className="font-semibold">Error loading user stats</p>
            <p className="text-sm mt-1">{extractErrorMessage(statsError, 'Failed to fetch user statistics')}</p>
          </div>
        ) : stats.length > 0 ? (
          <section className="md:sticky md:top-0 z-10 bg-background pb-2 pt-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {stat.title}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
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
                      <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-muted-foreground">
            <p>No stats data available</p>
          </div>
        )}

        {/* Tabs */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="staff"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 data-[state=inactive]:hover:bg-primary data-[state=inactive]:hover:text-primary-foreground transition-colors"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Staff
                </TabsTrigger>
                <TabsTrigger
                  value="organizers"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 data-[state=inactive]:hover:bg-primary data-[state=inactive]:hover:text-primary-foreground transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Organizers
                </TabsTrigger>
                <TabsTrigger
                  value="attendees"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 data-[state=inactive]:hover:bg-primary data-[state=inactive]:hover:text-primary-foreground transition-colors"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Attendees
                </TabsTrigger>
              </TabsList>

              <TabsContent value="staff" className="m-0 p-6">
                <StaffManagementContent />
              </TabsContent>

              <TabsContent value="organizers" className="m-0 p-6">
                <OrganizersContent />
              </TabsContent>

              <TabsContent value="attendees" className="m-0 p-6">
                <AttendeesPage />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
};

export default UsersManagementPage;

