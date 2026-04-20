import { Shield, AlertTriangle, CheckCircle2, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEventReportStats } from '@/hooks/queries/useEventReports';
import { useCareerInquiries } from '@/hooks/queries/useCareerInquiries';
import EventReportsTab from '@/components/admin/moderation/EventReportsTab';
import CareerInquiriesTab from '@/components/admin/moderation/CareerInquiriesTab';

const ModerationPage = () => {
  const { data: reportStats } = useEventReportStats();
  const { data: careerData } = useCareerInquiries({ limit: 1 });

  const totalReports = reportStats?.total ?? 0;
  const pendingReports = reportStats?.pending ?? 0;
  const resolvedReports = reportStats?.resolved ?? 0;
  const totalInquiries = careerData?.pagination?.total ?? 0;

  const stats = [
    {
      title: 'Total Reports',
      value: totalReports,
      icon: Shield,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Pending Reports',
      value: pendingReports,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      title: 'Resolved',
      value: resolvedReports,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Career Inquiries',
      value: totalInquiries,
      icon: Briefcase,
      gradient: 'from-violet-500 to-violet-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Moderation</h1>
        <p className="text-muted-foreground">
          Review event reports and manage career inquiries
        </p>
      </div>

      {/* Stats Cards */}
      <section className="sticky top-0 z-10 bg-background pb-2 pt-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Event Reports</TabsTrigger>
          <TabsTrigger value="careers">Career Inquiries</TabsTrigger>
        </TabsList>
        <TabsContent value="reports">
          <EventReportsTab />
        </TabsContent>
        <TabsContent value="careers">
          <CareerInquiriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModerationPage;
