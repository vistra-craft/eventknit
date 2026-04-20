import { useMemo } from "react";
import {
  Users,
  DollarSign,
  Target,
  Clock,
  Mic,
  Star,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Send,
  QrCode,
  UserPlus,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { CustomAreaChart } from "../charts/ChartComponents";
import { CHART_COLORS } from "../charts/chartConstants";
import { ConsentStatisticsCard } from "./ConsentStatisticsCard";
import { SeatAllocationOverviewCard } from "./SeatAllocationOverviewCard";
import { SeatAllocationByTypeCard } from "./SeatAllocationByTypeCard";
import type { OrganizerSubscription } from "../../lib/organizer-api";
import type { OrganizerRefund } from "../../lib/organizer-api";

interface Attendee {
  id?: string;
  status?: string;
  totalAmount?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  ticketType?: string;
  createdAt?: string;
  registeredDate?: string;
  quantity?: number;
}

interface EventOverviewTabProps {
  eventData: {
    capacity?: number | null;
    hasSeatMap?: boolean;
    currency?: string;
    ticketTypes?: Array<{ name: string; price?: number; quantity?: number | null }>;
    speakers?: Array<{ name?: string; company?: string; bio?: string }>;
    sponsors?: Array<{ name?: string; level?: string; website?: string }>;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
  attendees: Attendee[];
  hasPaymentDetailsAccess: boolean;
  pendingAttendees: number;
  confirmedAttendees: number;
  totalRevenue: number;
  refunds: OrganizerRefund[];
  subscription: OrganizerSubscription | null;
  subscriptionLoading: boolean;
  eventId: string;
  onNavigate: (section: string) => void;
}

/**
 * Builds a registration trend from attendee dates, grouping by day.
 */
function buildRegistrationTrend(attendees: Attendee[]) {
  const dateMap = new Map<string, number>();

  attendees.forEach((a) => {
    const raw = a.registeredDate || a.createdAt;
    if (!raw) return;
    // Normalize to YYYY-MM-DD
    const date = new Date(raw);
    if (isNaN(date.getTime())) return;
    const key = date.toISOString().split("T")[0];
    dateMap.set(key, (dateMap.get(key) || 0) + 1);
  });

  if (dateMap.size === 0) return [];

  // Sort by date and build cumulative
  const sorted = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  let cumulative = 0;
  return sorted.map(([date, count]) => {
    cumulative += count;
    const d = new Date(date);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      registrations: count,
      total: cumulative,
    };
  });
}

export function EventOverviewTab({
  eventData,
  attendees,
  hasPaymentDetailsAccess,
  pendingAttendees,
  confirmedAttendees,
  totalRevenue,
  refunds,
  subscription,
  subscriptionLoading,
  eventId,
  onNavigate,
}: EventOverviewTabProps) {
  const speakers = eventData?.speakers && Array.isArray(eventData.speakers) ? eventData.speakers : [];
  const sponsors = eventData?.sponsors && Array.isArray(eventData.sponsors) ? eventData.sponsors : [];
  const fillRate =
    eventData.capacity && eventData.capacity > 0
      ? ((attendees.length / eventData.capacity) * 100).toFixed(0)
      : "0";
  const pendingRefunds = refunds.filter((r) => r.status === "pending").length;
  const hasPendingActions = pendingAttendees > 0 || pendingRefunds > 0;

  const trendData = useMemo(() => buildRegistrationTrend(attendees), [attendees]);

  // ---- Metrics ----
  const metrics = [
    {
      label: "Attendees",
      value: attendees.length,
      subtitle: `of ${eventData.capacity || "\u221E"}`,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Revenue",
      value: hasPaymentDetailsAccess
        ? `${eventData.currency || "$"}${totalRevenue.toLocaleString()}`
        : `${eventData.currency || "$"}---`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Fill Rate",
      value: `${fillRate}%`,
      icon: Target,
      gradient: "from-violet-500 to-violet-600",
    },
    {
      label: "Pending",
      value: pendingAttendees,
      subtitle: pendingAttendees > 0 ? "needs review" : "registrations",
      icon: Clock,
      gradient: "from-amber-500 to-amber-600",
      alert: pendingAttendees > 0,
    },
  ];

  // ---- Quick Actions ----
  const quickActions = [
    { label: "View Attendees", icon: Users, section: "attendees" },
    { label: "Send Message", icon: Send, section: "communication" },
    { label: "Check-In", icon: QrCode, section: "scan-settings" },
    { label: "View Analytics", icon: TrendingUp, section: "analytics" },
    { label: "Add Staff", icon: UserPlus, section: "staff" },
    { label: "Event Settings", icon: Eye, section: "settings" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Primary Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {m.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground truncate">
                    {m.value}
                  </p>
                  {m.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{m.subtitle}</p>
                  )}
                </div>
                <div
                  className={`w-11 h-11 bg-gradient-to-br ${m.gradient} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}
                >
                  <m.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            {m.alert && (
              <div className="absolute top-2 right-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Pending Actions Alert ── */}
      {hasPendingActions && (
        <Alert className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Action Required
              </p>
              {pendingAttendees > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {pendingAttendees} registration{pendingAttendees !== 1 ? "s" : ""} need
                    {pendingAttendees === 1 ? "s" : ""} confirmation
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => onNavigate("attendees")}
                  >
                    Review
                  </Button>
                </div>
              )}
              {pendingRefunds > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {pendingRefunds} refund request{pendingRefunds !== 1 ? "s" : ""} waiting
                    for review
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => onNavigate("refunds")}
                  >
                    Review
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Two-column layout: Chart + Quick Actions / Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Registration Trend */}
        <Card className="lg:col-span-2 border-border/40 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Registration Trend</CardTitle>
              {trendData.length > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  {trendData.length} day{trendData.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trendData.length > 1 ? (
              <CustomAreaChart
                data={trendData}
                dataKey="total"
                xAxisKey="date"
                height={200}
                color={CHART_COLORS.primary}
                showGrid={false}
                showLegend={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">
                  {trendData.length === 1
                    ? "Need more data points to show trend"
                    : "No registrations yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/40 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.section)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/60 transition-colors text-center group"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Seat Allocation (conditional) ── */}
      {eventData.hasSeatMap && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SeatAllocationOverviewCard eventId={eventId} />
          <SeatAllocationByTypeCard eventId={eventId} />
        </div>
      )}

      {/* ── At a Glance: Speakers, Confirmed, Sponsors ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-violet-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold">{speakers.length}</p>
            <p className="text-xs text-muted-foreground">Speakers</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold">{confirmedAttendees}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold">{sponsors.length}</p>
            <p className="text-xs text-muted-foreground">Sponsors</p>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <Card className="border-border/40 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </CardTitle>
            {attendees.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNavigate("attendees")}
              >
                View all
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {attendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No registrations yet</p>
              <p className="text-xs mt-1">
                Activity will appear here as attendees register
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {attendees.slice(0, 5).map((attendee, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {(attendee.name || attendee.firstName || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attendee.name || `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim() || "Guest"}{" "}
                      <span className="font-normal text-muted-foreground">registered</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{attendee.ticketType}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {attendee.registeredDate}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Consent Statistics (collapsible) ── */}
      {!subscriptionLoading && eventId && (
        <ConsentStatisticsCard
          eventId={eventId}
          subscriptionTier={subscription?.tier}
        />
      )}
    </div>
  );
}
