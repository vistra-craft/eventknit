import { Calendar, CheckCircle2, BarChart3 } from 'lucide-react';

export const ProcessOverview = () => {
  const steps = [
    {
      number: 1,
      icon: Calendar,
      title: 'Create Event',
      description: 'Fill out your event details and submit for review',
    },
    {
      number: 2,
      icon: CheckCircle2,
      title: 'Get Approved',
      description: 'Our team reviews your event (usually within 24-48 hours)',
    },
    {
      number: 3,
      icon: BarChart3,
      title: 'Manage Dashboard',
      description: 'Once approved, access your dashboard to manage registrations, track sales, and view analytics',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-page-title mb-2">
          How It Works
        </h2>
        <p className="text-page-subtitle">
          Here's what happens after you sign up
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="relative flex items-start gap-4">
              {/* Step Number & Icon */}
              <div className="flex-shrink-0 relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-muted-foreground">Step {step.number}</span>
                  <h3 className="text-section-header">{step.title}</h3>
                </div>
                <p className="text-card-description">{step.description}</p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

