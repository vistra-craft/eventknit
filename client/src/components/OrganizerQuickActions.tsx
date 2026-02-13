/**
 * Organizer Quick Actions Widget
 * Displays quick links and stats for organizers
 * Shows on dashboard for users with organizer role
 */

import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useMyEvents } from '../hooks/useMyEvents';
import { Skeleton } from './ui/Skeleton';
import { CTA_LABELS, NAV_LABELS } from '../constants/navigationLabels';

export const OrganizerQuickActions = () => {
  const navigate = useNavigate();
  const { organizingEvents, organizingLoading } = useMyEvents();

  // Calculate quick stats
  const totalEvents = organizingEvents.length;
  const totalTicketsSold = organizingEvents.reduce((sum, event) => sum + (event.ticketsSold || event.attendees || 0), 0);
  const totalRevenue = organizingEvents.reduce((sum, event) => sum + (event.revenue || 0), 0);
  const activeEvents = organizingEvents.filter(
    (event) => event.status.toLowerCase() === 'published' || event.status.toLowerCase() === 'upcoming'
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickStats = [
    {
      label: 'Total Events',
      value: totalEvents,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Tickets Sold',
      value: totalTicketsSold,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Active Events',
      value: activeEvents,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  const quickActions = [
    {
      label: CTA_LABELS.CREATE_EVENT,
      icon: Plus,
      onClick: () => navigate('/user/create-event'),
      variant: 'default' as const,
    },
    {
      label: NAV_LABELS.ANALYTICS,
      icon: BarChart3,
      onClick: () => navigate('/user/analytics'),
      variant: 'outline' as const,
    },
    {
      label: 'View All Events',
      icon: Calendar,
      onClick: () => navigate('/user/dashboard?tab=organizing'),
      variant: 'outline' as const,
    },
  ];

  if (organizingLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizer Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 flex-1" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Organizer Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickStats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-background rounded-lg p-3 border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-in fade-in-0 zoom-in-95"
              style={{ animationDelay: `${index * 50}ms` }}
              role="article"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mb-0.5">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              className="flex-1 min-w-[140px] hover:scale-105 active:scale-95 transition-transform duration-200 animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${(index + 4) * 50}ms` }}
              aria-label={action.label}
            >
              <action.icon className="h-4 w-4 mr-1.5" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Empty State Message */}
        {totalEvents === 0 && (
          <div className="text-center py-6 bg-background rounded-lg border border-border border-dashed animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              You haven't created any events yet.
            </p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Start building your community by creating your first event. It only takes a few minutes!
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/user/create-event')}
              className="hover:scale-105 active:scale-95 transition-transform duration-200"
              aria-label={CTA_LABELS.CREATE_FIRST_EVENT}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {CTA_LABELS.CREATE_FIRST_EVENT}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
