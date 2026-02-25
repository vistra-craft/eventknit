import { useState } from 'react';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { useEventReports } from '@/hooks/queries/useEventReports';
import { useUpdateEventReport } from '@/hooks/mutations/useEventReportActions';
import type { ReportStatus, ReportCategory } from '@/lib/event-report-api';

const categoryLabels: Record<ReportCategory, string> = {
  FRAUD_SCAM: 'Fraud/Scam',
  INAPPROPRIATE: 'Inappropriate',
  SPAM: 'Spam',
  SAFETY: 'Safety',
  WRONG_DETAILS: 'Wrong Details',
  DUPLICATE: 'Duplicate',
  OTHER: 'Other',
};

const categoryColors: Record<ReportCategory, string> = {
  FRAUD_SCAM: 'bg-red-500/10 text-red-600 border-red-500/20',
  INAPPROPRIATE: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  SPAM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  SAFETY: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  WRONG_DETAILS: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DUPLICATE: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  OTHER: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const statusColors: Record<ReportStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  INVESTIGATING: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  DISMISSED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function EventReportsTab() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const { data, isLoading } = useEventReports({
    status: statusFilter === 'all' ? undefined : statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    page,
    limit,
  });

  const updateMutation = useUpdateEventReport();

  const reports = data?.reports || [];
  const pagination = data?.pagination;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getReporterName = (reporter: { firstName: string | null; lastName: string | null; email: string }) => {
    const name = [reporter.firstName, reporter.lastName].filter(Boolean).join(' ');
    return name || reporter.email;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border border-border/40 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as ReportStatus | 'all'); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as ReportCategory | 'all'); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-border/40 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reporter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 bg-muted/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                          {report.event.title}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-foreground">{getReporterName(report.reporter)}</span>
                      <p className="text-xs text-muted-foreground">{report.reporter.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${categoryColors[report.category]}`}>
                        {categoryLabels[report.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${statusColors[report.status]}`}>
                        {report.status.charAt(0) + report.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{formatDate(report.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => window.open(`/events/${report.eventId}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Event
                          </DropdownMenuItem>
                          {report.status !== 'INVESTIGATING' && (
                            <DropdownMenuItem
                              onClick={() => updateMutation.mutate({ id: report.id, status: 'INVESTIGATING' })}
                            >
                              Investigate
                            </DropdownMenuItem>
                          )}
                          {report.status !== 'RESOLVED' && (
                            <DropdownMenuItem
                              onClick={() => updateMutation.mutate({ id: report.id, status: 'RESOLVED' })}
                            >
                              Resolve
                            </DropdownMenuItem>
                          )}
                          {report.status !== 'DISMISSED' && (
                            <DropdownMenuItem
                              onClick={() => updateMutation.mutate({ id: report.id, status: 'DISMISSED' })}
                            >
                              Dismiss
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
