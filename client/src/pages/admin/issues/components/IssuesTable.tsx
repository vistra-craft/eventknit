import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Issue, IssueListResponse } from '@/types/issues';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STORY_POINT_LABELS,
  TYPE_LABELS,
} from '@/types/issues';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface IssuesTableProps {
  data: IssueListResponse | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  onRowClick: (issue: Issue) => void;
}

function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TableCell key={i}>
          <div className="h-4 animate-pulse rounded bg-muted/60" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function Avatar({ user }: { user: { firstName: string; lastName: string; avatar: string | null } | null }) {
  if (!user) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {user.firstName[0]}{user.lastName[0]}
      </div>
      <span className="text-sm text-foreground hidden lg:inline">
        {user.firstName} {user.lastName}
      </span>
    </div>
  );
}

export function IssuesTable({ data, isLoading, page, onPageChange, onRowClick }: IssuesTableProps) {
  const issues = data?.issues ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-8 text-xs">#</TableHead>
              <TableHead className="text-xs">Title</TableHead>
              <TableHead className="hidden md:table-cell text-xs">Status</TableHead>
              <TableHead className="hidden sm:table-cell text-xs">Priority</TableHead>
              <TableHead className="hidden lg:table-cell text-xs">Type</TableHead>
              <TableHead className="hidden lg:table-cell text-xs">Points</TableHead>
              <TableHead className="hidden md:table-cell text-xs">Assignee</TableHead>
              <TableHead className="hidden xl:table-cell text-xs">Created</TableHead>
              <TableHead className="text-xs w-10 text-center">
                <MessageSquare className="h-3.5 w-3.5 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : issues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    onClick={() => onRowClick(issue)}
                    className="cursor-pointer hover:bg-muted/40"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {issue.number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground line-clamp-1">
                          {issue.title}
                        </span>
                        {issue.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {issue.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-primary/8 px-1 py-0.5 text-xs text-primary/70"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={cn('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[issue.status])}>
                        {STATUS_LABELS[issue.status]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', PRIORITY_COLORS[issue.priority])}>
                        {PRIORITY_LABELS[issue.priority]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {TYPE_LABELS[issue.type]}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {issue.storyPoints ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {STORY_POINT_LABELS[issue.storyPoints]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Avatar user={issue.assignee} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                      {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {(issue._count?.comments ?? 0) > 0 ? issue._count?.comments : '—'}
                    </TableCell>
                  </TableRow>
                ))}

            {!isLoading && issues.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                  No issues found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
