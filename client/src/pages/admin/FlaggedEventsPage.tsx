import { Flag, AlertTriangle, CheckCircle2, Shield, XCircle, TrendingUp, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import EventReportsTab from '@/components/admin/moderation/EventReportsTab';
import { useEventReportStats } from '@/hooks/queries/useEventReports';

/**
 * Flagged Events Page
 * Displays all flagged/reported events with reasons and status
 * Allows admins to review, investigate, resolve, or dismiss reports
 * Accessible from admin sidebar under Support or Management section
 */
const FlaggedEventsPage = () => {
  const { data: reportStats } = useEventReportStats();

  const totalReports = reportStats?.total ?? 0;
  const pendingReports = reportStats?.pending ?? 0;
  const investigatingReports = reportStats?.investigating ?? 0;
  const resolvedReports = reportStats?.resolved ?? 0;
  const dismissedReports = reportStats?.dismissed ?? 0;

  const stats = [
    {
      title: 'Total Reports',
      value: totalReports,
      icon: Shield,
      gradient: 'from-blue-500 to-blue-600',
      description: 'All event reports submitted',
    },
    {
      title: 'Pending Review',
      value: pendingReports,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-amber-600',
      description: 'Awaiting initial review',
    },
    {
      title: 'Under Investigation',
      value: investigatingReports,
      icon: Eye,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Currently being investigated',
    },
    {
      title: 'Resolved',
      value: resolvedReports,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Actions taken and resolved',
    },
  ];

  // Calculate category breakdown if available
  const categoryStats = reportStats?.byCategory || {};
  const topCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flag className="h-7 w-7 text-red-500" />
            Flagged Events
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage reported events to maintain platform integrity and safety
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Content Moderation</span>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="group relative overflow-hidden border border-border/40 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div
                  className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        ))}
      </section>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Info Banner - Report Categories */}
        <Card className="border border-purple-500/20 bg-purple-500/5">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Top Report Categories
                </h3>
                {topCategories.length > 0 ? (
                  <div className="space-y-1.5">
                    {topCategories.map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {category.toLowerCase().replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-foreground">{count as number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No reports yet</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Info Banner - Policy Notice */}
        <Card className="border border-blue-500/20 bg-blue-500/5">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Report Review Process
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All reports are reviewed according to our Community Guidelines and Terms of Service. 
                  Investigations are conducted confidentially, and appropriate actions are taken based on 
                  severity and policy violations. Reporter identities are protected throughout the process.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content - Event Reports Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All Event Reports</h2>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground hidden sm:block">
              {dismissedReports > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  {dismissedReports} dismissed
                </span>
              )}
            </div>
          </div>
        </div>
        <EventReportsTab />
      </div>
    </div>
  );
};

export default FlaggedEventsPage;
