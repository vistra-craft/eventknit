/**
 * Organizer Quick Actions Widget
 * Displays quick links and stats for organizers
 * Shows on dashboard for users with organizer role
 */

import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMyEvents } from '@/hooks/useMyEvents';
import { Skeleton } from '@/components/ui/Skeleton';
import { NAV_LABELS } from '@/constants/navigationLabels';

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-section-header">Quick Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-lg border border-border hover:shadow-sm"
              role="article"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <div className="flex items-center gap-2 mb-2">
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

        {/* Quick Actions - Only show Analytics, not redundant buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/user/analytics')}
            className="flex items-center gap-1.5 hover:bg-accent transition-colors"
            aria-label={NAV_LABELS.ANALYTICS}
          >
            <BarChart3 className="h-4 w-4" />
            {NAV_LABELS.ANALYTICS}
          </Button>
        </div>

        {/* Empty State Message - Only show when no events */}
        {totalEvents === 0 && (
          <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
            <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-card-title mb-2">No events yet</p>
            <p className="text-card-description mb-4 max-w-sm mx-auto">
              Start building your community by creating your first event.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
