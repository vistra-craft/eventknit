import { Calendar, ShieldCheck, LayoutDashboard } from 'lucide-react';

const STEPS = [
  {
    icon: Calendar,
    title: 'Create your event',
    description: 'Fill out your event details and submit for review. Your first events go through a quick one-time check.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: ShieldCheck,
    title: 'Quick review',
    description: 'Our team reviews new organizers within 24-48 hours. After 3 approved events you get instant publishing.',
    color: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    icon: LayoutDashboard,
    title: 'Manage everything',
    description: 'Track registrations, monitor ticket sales, view analytics, and manage attendees from your dashboard.',
    color: 'text-violet-600 bg-violet-500/10',
  },
];

export const ProcessOverview = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">Here's how it works</h2>
      <p className="text-sm text-muted-foreground">
        Simple three-step process to get your events in front of attendees.
      </p>
    </div>

    <div className="space-y-4">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${step.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-px flex-1 bg-border mt-2" />
              )}
            </div>
            <div className="pb-6">
              <p className="text-sm font-semibold text-foreground mb-0.5">{step.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
