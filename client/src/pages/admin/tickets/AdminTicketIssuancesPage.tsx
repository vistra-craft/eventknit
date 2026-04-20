import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TicketCheck,
  Clock,
  XCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  Ban,
} from "lucide-react";
import {
  getAdminTicketIssuances,
  cancelAdminTicketIssuance,
  type AdminTicketIssuance,
} from "@/lib/admin-api";
import { useToast } from "@/hooks/useToast";


const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CLAIMED", label: "Claimed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  PENDING: { label: "Pending", variant: "secondary", icon: Clock },
  CLAIMED: { label: "Claimed", variant: "default", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: XCircle },
  EXPIRED: { label: "Expired", variant: "outline", icon: XCircle },
};

const PAGE_SIZE = 50;

const AdminTicketIssuancesPage = () => {
  const { toast } = useToast();
  const [issuances, setIssuances] = useState<AdminTicketIssuance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eventSearch, setEventSearch] = useState("");

  const [cancelTarget, setCancelTarget] = useState<AdminTicketIssuance | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchIssuances = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await getAdminTicketIssuances({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page: pg,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setIssuances(res.data.issuances);
        setTotal(res.data.total);
      }
    } catch {
      toast({ title: "Failed to load issuances", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    setPage(1);
    fetchIssuances(1);
  }, [fetchIssuances]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelAdminTicketIssuance(cancelTarget.id);
      toast({ title: "Issuance cancelled" });
      setCancelTarget(null);
      fetchIssuances(page);
    } catch {
      toast({ title: "Failed to cancel issuance", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  // Client-side event title filter (applied after fetch)
  const filtered = issuances.filter((i) =>
    eventSearch.trim()
      ? i.package.event.title.toLowerCase().includes(eventSearch.toLowerCase())
      : true,
  );

  // Stats derived from current page — for a real breakdown use a separate count API
  const counts = {
    total,
    pending: issuances.filter((i) => i.status === "PENDING").length,
    claimed: issuances.filter((i) => i.status === "CLAIMED").length,
    cancelled: issuances.filter((i) => i.status === "CANCELLED" || i.status === "EXPIRED").length,
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statCards = [
    {
      title: "Total Issuances",
      value: total,
      icon: TicketCheck,
      gradient: "from-violet-500 to-indigo-600",
    },
    {
      title: "Pending Claim",
      value: counts.pending,
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      title: "Claimed",
      value: counts.claimed,
      icon: CheckCircle2,
      gradient: "from-emerald-400 to-green-600",
    },
    {
      title: "Cancelled / Expired",
      value: counts.cancelled,
      icon: XCircle,
      gradient: "from-red-400 to-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ticket Issuances</h1>
        <p className="text-muted-foreground mt-1">
          All complementary tickets issued across events on the platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
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

      {/* Filters */}
      <Card className="border-border/40 bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by event name…"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchIssuances(page)}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading && filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <TicketCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No issuances found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((issuance) => {
                  const meta = STATUS_META[issuance.status] ?? STATUS_META.PENDING;
                  const StatusIcon = meta.icon;
                  return (
                    <TableRow key={issuance.id}>
                      <TableCell className="font-mono text-sm">{issuance.email}</TableCell>
                      <TableCell>
                        <span className="line-clamp-1 max-w-[180px] block">
                          {issuance.package.event.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-1 max-w-[140px] block text-muted-foreground">
                          {issuance.package.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{issuance.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={meta.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(issuance.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {issuance.expiresAt
                          ? new Date(issuance.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {issuance.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setCancelTarget(issuance)}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 px-6 py-3">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} &middot; {total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    setPage((p) => p - 1);
                    fetchIssuances(page - 1);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchIssuances(page + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this issuance?</AlertDialogTitle>
            <AlertDialogDescription>
              The claim link sent to <strong>{cancelTarget?.email}</strong> will be invalidated.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {cancelling ? "Cancelling…" : "Cancel Issuance"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTicketIssuancesPage;
