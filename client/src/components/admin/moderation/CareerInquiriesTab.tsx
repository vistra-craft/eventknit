import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { useCareerInquiries } from '@/hooks/queries/useCareerInquiries';
import { useUpdateCareerInquiry } from '@/hooks/mutations/useCareerInquiryActions';
import type { CareerInquiryStatus } from '@/lib/careers-api';

const statusColors: Record<CareerInquiryStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  CONTACTED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  RESPONDED: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  REVIEWING: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  HIRED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

const statusLabels: Record<CareerInquiryStatus, string> = {
  PENDING: 'Pending',
  CONTACTED: 'Contacted',
  RESPONDED: 'Responded',
  REVIEWING: 'Reviewing',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
};

export default function CareerInquiriesTab() {
  const [statusFilter, setStatusFilter] = useState<CareerInquiryStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const { data, isLoading } = useCareerInquiries({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit,
  });

  const updateMutation = useUpdateCareerInquiry();

  const inquiries = data?.inquiries || [];
  const pagination = data?.pagination;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleStatusUpdate = (id: string, status: CareerInquiryStatus) => {
    updateMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border border-border/40 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as CareerInquiryStatus | 'all'); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusLabels).map(([val, label]) => (
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Notes</th>
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
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No career inquiries found
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{inquiry.email}</span>
                      {inquiry.firstName && (
                        <p className="text-xs text-muted-foreground">{inquiry.firstName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${statusColors[inquiry.status as CareerInquiryStatus]}`}>
                        {statusLabels[inquiry.status as CareerInquiryStatus] || inquiry.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{inquiry.source || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{formatDate(inquiry.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                        {inquiry.notes || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {inquiry.status !== 'CONTACTED' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inquiry.id, 'CONTACTED')}>
                              Mark as Contacted
                            </DropdownMenuItem>
                          )}
                          {inquiry.status !== 'RESPONDED' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inquiry.id, 'RESPONDED')}>
                              Mark as Responded
                            </DropdownMenuItem>
                          )}
                          {inquiry.status !== 'REVIEWING' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inquiry.id, 'REVIEWING')}>
                              Mark as Reviewing
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {inquiry.status !== 'HIRED' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inquiry.id, 'HIRED')}>
                              Mark as Hired
                            </DropdownMenuItem>
                          )}
                          {inquiry.status !== 'REJECTED' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inquiry.id, 'REJECTED')}>
                              Mark as Rejected
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
