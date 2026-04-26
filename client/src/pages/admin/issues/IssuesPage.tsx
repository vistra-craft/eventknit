import { useState, useCallback, useMemo, useEffect, useRef, type ElementType } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, LayoutGrid, List, Search, AlertCircle, Loader, CheckCircle2, Clock, Ban,
  Filter, Settings2, X, AlignJustify,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Issue, IssueStatus, IssuePriority, IssueType, KanbanBoard as KanbanBoardType } from '@/types/issues';
import { STATUS_LABELS, PRIORITY_LABELS, TYPE_LABELS, KANBAN_COLUMNS as KB_COLS } from '@/types/issues';
import { useIssueBoard, useIssueStats, useIssueList, useAssignableUsers } from '@/hooks/queries/useIssues';
import { KanbanBoard } from './components/KanbanBoard';
import { IssueDetailDrawer } from './components/IssueDetailDrawer';
import { CreateIssueDrawer } from './components/CreateIssueDrawer';
import { IssuesTable } from './components/IssuesTable';
import type { CardSize } from './components/IssueCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SkeletonMetricCard, SkeletonKanbanBoard } from '@/components/ui/Skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';

type ViewMode = 'board' | 'list';

interface ActiveFilters {
  priority: IssuePriority | null;
  type: IssueType | null;
  assigneeId: string | null;
}

const EMPTY_FILTERS: ActiveFilters = { priority: null, type: null, assigneeId: null };

const STAT_META: Record<IssueStatus, { icon: ElementType; gradient: string }> = {
  NOT_STARTED:  { icon: Clock,         gradient: 'from-slate-500 to-slate-600' },
  BLOCKED:      { icon: Ban,           gradient: 'from-red-500 to-red-600' },
  IN_PROGRESS:  { icon: Loader,        gradient: 'from-blue-500 to-blue-600' },
  UNDER_REVIEW: { icon: AlertCircle,   gradient: 'from-amber-500 to-orange-500' },
  DONE:         { icon: CheckCircle2,  gradient: 'from-emerald-500 to-emerald-600' },
  ARCHIVED:     { icon: Clock,         gradient: 'from-slate-400 to-slate-500' },
};

function filterBoard(board: KanbanBoardType, filters: ActiveFilters, search: string): KanbanBoardType {
  const q = search.toLowerCase().trim();
  const matches = (issue: Issue) => {
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.type && issue.type !== filters.type) return false;
    if (filters.assigneeId) {
      if (filters.assigneeId === '__unassigned__') {
        if (issue.assigneeId !== null) return false;
      } else {
        if (issue.assigneeId !== filters.assigneeId) return false;
      }
    }
    if (q && !issue.title.toLowerCase().includes(q)) return false;
    return true;
  };
  return {
    NOT_STARTED:  board.NOT_STARTED.filter(matches),
    BLOCKED:      board.BLOCKED.filter(matches),
    IN_PROGRESS:  board.IN_PROGRESS.filter(matches),
    UNDER_REVIEW: board.UNDER_REVIEW.filter(matches),
    DONE:         board.DONE.filter(matches),
  };
}

export default function IssuesPage() {
  const location = useLocation();
  const defaultView: ViewMode = location.pathname.endsWith('/list') ? 'list' : 'board';

  const [view, setView]                   = useState<ViewMode>(defaultView);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<IssueStatus>('NOT_STARTED');
  const [search, setSearch]               = useState('');
  const [page, setPage]                   = useState(1);

  // Toolbar feature states
  const [cardSize, setCardSize]           = useState<CardSize>('compact');
  const [showSearch, setShowSearch]       = useState(false);
  const [showFilters, setShowFilters]     = useState(false);
  const [showSizeMenu, setShowSizeMenu]   = useState(false);
  const [filters, setFilters]             = useState<ActiveFilters>(EMPTY_FILTERS);
  const [includeArchived, setIncludeArchived] = useState(false);

  const sizeMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: board, isLoading: boardLoading }   = useIssueBoard();
  const { data: stats, isLoading: statsLoading }   = useIssueStats();
  const { data: listData, isLoading: listLoading } = useIssueList({
    search: search || undefined,
    priority: filters.priority || undefined,
    type: filters.type || undefined,
    assigneeId: (filters.assigneeId && filters.assigneeId !== '__unassigned__') ? filters.assigneeId : undefined,
    includeArchived: includeArchived || undefined,
    page,
    limit: 20,
  });
  const { data: assignableUsers = [] } = useAssignableUsers();

  const hasActiveFilters = filters.priority !== null || filters.type !== null || filters.assigneeId !== null || includeArchived;

  const filteredBoard = useMemo(() => {
    if (!board) return null;
    if (!hasActiveFilters && !search) return board;
    return filterBoard(board, filters, search);
  }, [board, filters, search, hasActiveFilters]);

  // Close size menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) {
        setShowSizeMenu(false);
      }
    }
    if (showSizeMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSizeMenu]);

  // Focus input when search revealed
  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
    else setSearch('');
  }, [showSearch]);

  const handleCardClick = useCallback((issue: Issue) => {
    setSelectedIssueId(issue.id);
  }, []);

  const handleCloseDetail = useCallback(() => setSelectedIssueId(null), []);

  const handleAddClick = useCallback((status: IssueStatus) => {
    setDefaultStatus(status);
    setShowCreate(true);
  }, []);

  const clearFilters = () => { setFilters(EMPTY_FILTERS); setIncludeArchived(false); setPage(1); };

  const totalOpen = stats
    ? stats.statusCounts
        .filter((s) => s.status !== 'ARCHIVED' && s.status !== 'DONE')
        .reduce((sum, s) => sum + s._count, 0)
    : null;

  const showFilterRow = showFilters || hasActiveFilters;

  return (
    <div className="flex h-full flex-col gap-0">
      {/* Stats strip */}
      <section className="md:sticky md:top-0 z-10 bg-background pb-2 pt-1">
        {statsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {KB_COLS.map((s) => <SkeletonMetricCard key={s} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {KB_COLS.map((status) => {
              const count = stats?.statusCounts.find((s) => s.status === status)?._count ?? 0;
              const { icon: Icon, gradient } = STAT_META[status];
              return (
                <div
                  key={status}
                  className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {STATUS_LABELS[status]}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{count}</p>
                        <p className="mt-1 text-xs text-muted-foreground">issues</p>
                      </div>
                      <div className={cn('flex-shrink-0 w-12 h-12 bg-gradient-to-r rounded-xl flex items-center justify-center shadow-lg', gradient)}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left — title + count */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Issues</h1>
            {totalOpen !== null && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {totalOpen} open
              </span>
            )}
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-1.5">
            {/* Animated search input */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out',
                showSearch ? 'w-48 opacity-100' : 'w-0 opacity-0',
              )}
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search issues..."
                  className="h-8 pl-8 text-sm"
                  onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
                />
              </div>
            </div>

            {/* Search icon toggle */}
            <button
              onClick={() => setShowSearch((v) => !v)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border border-border/50 transition-colors',
                showSearch
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title="Search"
            >
              {showSearch ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
            </button>

            {/* Filter icon toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border border-border/50 transition-colors',
                showFilters || hasActiveFilters
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title="Filter"
            >
              <Filter className="h-3.5 w-3.5" />
              {hasActiveFilters && (
                <span className="sr-only">Active filters</span>
              )}
            </button>

            {/* Card size settings — desktop only */}
            <div className="relative hidden sm:block" ref={sizeMenuRef}>
              <button
                onClick={() => setShowSizeMenu((v) => !v)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md border border-border/50 transition-colors',
                  showSizeMenu
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                title="Card size"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>

              {showSizeMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-border bg-card p-1 shadow-xl">
                  <button
                    onClick={() => { setCardSize('compact'); setShowSizeMenu(false); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors',
                      cardSize === 'compact'
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <AlignJustify className="h-3.5 w-3.5" />
                    Compact
                  </button>
                  <button
                    onClick={() => { setCardSize('comfortable'); setShowSizeMenu(false); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors',
                      cardSize === 'comfortable'
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Comfortable
                  </button>
                </div>
              )}
            </div>

            {/* View toggle — desktop only */}
            <div className="hidden sm:flex rounded-lg border border-border/50 bg-muted/30 p-0.5">
              <button
                onClick={() => setView('board')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  view === 'board' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Board
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => { setDefaultStatus('NOT_STARTED'); setShowCreate(true); }}
              className="h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              New Issue
            </Button>
          </div>
        </div>

        {/* Filter row — animated slide-in */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200 ease-in-out',
            showFilterRow ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
            {/* Priority filter */}
            <div className="relative flex items-center">
              <select
                value={filters.priority ?? ''}
                onChange={(e) => { setFilters((f) => ({ ...f, priority: (e.target.value as IssuePriority) || null })); setPage(1); }}
                className={cn(
                  'h-7 cursor-pointer appearance-none rounded-full border px-3 pr-6 text-xs transition-colors',
                  filters.priority
                    ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                    : 'border-border/50 bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                <option value="">Priority</option>
                {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((k) => (
                  <option key={k} value={k}>{PRIORITY_LABELS[k]}</option>
                ))}
              </select>
              {filters.priority && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, priority: null }))}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="relative flex items-center">
              <select
                value={filters.type ?? ''}
                onChange={(e) => { setFilters((f) => ({ ...f, type: (e.target.value as IssueType) || null })); setPage(1); }}
                className={cn(
                  'h-7 cursor-pointer appearance-none rounded-full border px-3 pr-6 text-xs transition-colors',
                  filters.type
                    ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                    : 'border-border/50 bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                <option value="">Type</option>
                {(Object.keys(TYPE_LABELS) as IssueType[]).map((k) => (
                  <option key={k} value={k}>{TYPE_LABELS[k]}</option>
                ))}
              </select>
              {filters.type && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, type: null }))}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Assignee filter */}
            <div className="relative flex items-center">
              <select
                value={filters.assigneeId ?? ''}
                onChange={(e) => { setFilters((f) => ({ ...f, assigneeId: e.target.value || null })); setPage(1); }}
                className={cn(
                  'h-7 cursor-pointer appearance-none rounded-full border px-3 pr-6 text-xs transition-colors',
                  filters.assigneeId
                    ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                    : 'border-border/50 bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                <option value="">Assignee</option>
                <option value="__unassigned__">Unassigned</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
              {filters.assigneeId && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, assigneeId: null }))}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Show archived — only affects list view */}
            {view === 'list' && (
              <button
                onClick={() => { setIncludeArchived((v) => !v); setPage(1); }}
                className={cn(
                  'h-7 cursor-pointer rounded-full border px-3 text-xs transition-colors',
                  includeArchived
                    ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                    : 'border-border/50 bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                {includeArchived ? 'Archived shown' : 'Show archived'}
              </button>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content — always full width, drawer overlays */}
      <div className="flex-1 overflow-auto min-h-0">
        {view === 'board' ? (
          boardLoading ? (
            <SkeletonKanbanBoard />
          ) : filteredBoard ? (
            <KanbanBoard
              board={filteredBoard}
              onCardClick={handleCardClick}
              onAddClick={handleAddClick}
              size={cardSize}
            />
          ) : null
        ) : (
          <IssuesTable
            data={listData}
            isLoading={listLoading}
            page={page}
            onPageChange={setPage}
            onRowClick={handleCardClick}
          />
        )}
      </div>

      {/* Detail drawer — true overlay Sheet */}
      <Sheet
        open={!!selectedIssueId}
        onOpenChange={(open) => { if (!open) handleCloseDetail(); }}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[540px] lg:w-[600px] xl:w-[660px] !max-w-none p-0 overflow-hidden border-l border-border/40 bg-card shadow-2xl [&>button:first-child]:hidden"
        >
          {selectedIssueId && (
            <IssueDetailDrawer
              issueId={selectedIssueId}
              onClose={handleCloseDetail}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create issue drawer */}
      <Sheet
        open={showCreate}
        onOpenChange={(open) => { if (!open) setShowCreate(false); }}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[540px] lg:w-[600px] xl:w-[660px] !max-w-none p-0 overflow-hidden border-l border-border/40 bg-card shadow-2xl [&>button:first-child]:hidden"
        >
          {showCreate && (
            <CreateIssueDrawer
              defaultStatus={defaultStatus}
              onClose={() => setShowCreate(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
