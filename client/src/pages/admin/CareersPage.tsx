import { Shield, AlertTriangle, CheckCircle2, Briefcase, Mail, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import CareerInquiriesTab from '@/components/admin/moderation/CareerInquiriesTab';
import { useCareerInquiries } from '@/hooks/queries/useCareerInquiries';

/**
 * Careers Interest Page
 * Displays emails and information of people who showed interest in careers
 * Accessible from admin sidebar under Support or Management section
 */
const CareersPage = () => {
  const { data: careerData } = useCareerInquiries({ limit: 1 });
  const { data: allData } = useCareerInquiries({ status: undefined, limit: 100 });

  const totalInquiries = careerData?.pagination?.total ?? 0;
  
  // Calculate stats from all data
  const pendingCount = allData?.inquiries?.filter(i => i.status === 'PENDING').length ?? 0;
  const contactedCount = allData?.inquiries?.filter(i => i.status === 'CONTACTED').length ?? 0;
  const hiredCount = allData?.inquiries?.filter(i => i.status === 'HIRED').length ?? 0;

  const stats = [
    {
      title: 'Total Inquiries',
      value: totalInquiries,
      icon: Briefcase,
      gradient: 'from-violet-500 to-violet-600',
      description: 'All career interest submissions',
    },
    {
      title: 'Pending Review',
      value: pendingCount,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      description: 'Awaiting initial contact',
    },
    {
      title: 'Contacted',
      value: contactedCount,
      icon: Mail,
      gradient: 'from-blue-500 to-blue-600',
      description: 'In communication',
    },
    {
      title: 'Hired',
      value: hiredCount,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Successfully onboarded',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Career Interest
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track people who have shown interest in joining EventKnit
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Career Pipeline Management</span>
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

      {/* Info Banner */}
      <Card className="border border-blue-500/20 bg-blue-500/5">
        <div className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Career Interest Management
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track and manage individuals who have expressed interest in career opportunities at EventKnit. 
              Update their status as you progress through the recruitment pipeline. All email addresses are 
              collected from the public careers page and managed here for easy follow-up.
            </p>
          </div>
        </div>
      </Card>

      {/* Main Content - Career Inquiries Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All Career Inquiries</h2>
        </div>
        <CareerInquiriesTab />
      </div>
    </div>
  );
};

export default CareersPage;
