import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getKYCStats,
  getKYCSubmissions,
  type KYCSubmissionSummary,
  type KYCStats,
} from '@/lib/admin-api';

export default function KYCReviewDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [submissions, setSubmissions] = useState<KYCSubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, submissionsRes] = await Promise.all([
        getKYCStats(),
        getKYCSubmissions({
          status: statusFilter || undefined,
          search: debouncedSearch || undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
      ]);

      if (statsRes.success) setStats(statsRes.data.stats);
      if (submissionsRes.success) {
        setSubmissions(submissionsRes.data.submissions);
        setPagination((prev) => ({ ...prev, ...submissionsRes.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to load KYC data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [statusFilter, debouncedSearch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatEntityType = (type: string | null) => {
    if (!type) return '—';
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const statsCards = stats
    ? [
        {
          title: 'Pending Review',
          value: stats.totalPending,
          icon: Clock,
          gradient: 'from-amber-500 to-orange-500',
        },
        {
          title: 'Approved (Month)',
          value: stats.approvedThisMonth,
          icon: ShieldCheck,
          gradient: 'from-emerald-500 to-green-500',
        },
        {
          title: 'Rejected (Month)',
          value: stats.rejectedThisMonth,
          icon: ShieldX,
          gradient: 'from-red-500 to-rose-500',
        },
        {
          title: 'Total Submissions',
          value: stats.totalSubmissions,
          icon: Users,
          gradient: 'from-blue-500 to-indigo-500',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title">KYC Review</h1>
        <p className="text-page-subtitle">
          Review and approve organizer identity verification submissions
        </p>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
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
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v as typeof statusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shield className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No KYC submissions found</p>
            <p className="text-sm">
              {statusFilter || debouncedSearch
                ? 'Try adjusting your filters'
                : 'No organizers have submitted KYC yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Organizer
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Entity Type
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Documents
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Submitted
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {submissions.map((sub) => (
                  <tr
                    key={sub.userId}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/kyc/review/${sub.userId}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {sub.avatar ? (
                            <img
                              src={sub.avatar}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-primary">
                              {sub.firstName?.[0]}
                              {sub.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {sub.firstName} {sub.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {formatEntityType(sub.entityType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{sub.documentCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {sub.submittedAt
                          ? new Date(sub.submittedAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(sub.kycStatus)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/kyc/review/${sub.userId}`);
                        }}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
