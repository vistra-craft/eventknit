import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Issue, KanbanColumnStatus } from '@/types/issues';
import {
  STATUS_LABELS,
  STATUS_DOT_COLORS,
  COLUMN_TINT,
  COLUMN_RING,
  COLUMN_HOVER_TINT,
} from '@/types/issues';
import { IssueCard, type CardSize } from './IssueCard';

interface KanbanColumnProps {
  status: KanbanColumnStatus;
  issues: Issue[];
  onCardClick: (issue: Issue) => void;
  onAddClick: (status: KanbanColumnStatus) => void;
  size?: CardSize;
}

// Header badge colors per status — Notion-inspired solid pills
const HEADER_BADGE: Record<KanbanColumnStatus, string> = {
  NOT_STARTED:  'bg-issues-pill-ns text-issues-pill-txt',
  BLOCKED:      'bg-issues-pill-bl text-issues-pill-txt',
  IN_PROGRESS:  'bg-issues-pill-ip text-issues-pill-txt',
  UNDER_REVIEW: 'bg-issues-pill-ur text-issues-pill-txt',
  DONE:         'bg-issues-pill-dn text-issues-pill-txt',
};

export function KanbanColumn({ status, issues, onCardClick, onAddClick, size }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={cn(
      'flex w-[248px] shrink-0 flex-col overflow-hidden rounded-2xl border transition-colors duration-200 min-h-[600px] lg:w-full lg:min-w-0',
      COLUMN_TINT[status],
      COLUMN_RING[status],
    )}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_COLORS[status])} />
          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            HEADER_BADGE[status],
          )}>
            {STATUS_LABELS[status]}
          </span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black/5 dark:bg-white/8 px-1.5 text-xs font-medium text-muted-foreground">
            {issues.length}
          </span>
        </div>
        <button
          onClick={() => onAddClick(status)}
          className="rounded-md p-0.5 text-muted-foreground/40 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
          title={`Add to ${STATUS_LABELS[status]}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Drop zone — no x padding; cards go edge-to-edge; gap handles vertical spacing */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2 pb-2 transition-colors duration-150',
          isOver ? COLUMN_HOVER_TINT[status] : 'bg-transparent',
        )}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={onCardClick} size={size} inColumn />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <button
            onClick={() => onAddClick(status)}
            className={cn(
              'mx-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-5',
              'text-xs text-muted-foreground/40 transition-colors',
              'hover:text-muted-foreground border-current/20 hover:border-current/40',
            )}
          >
            <Plus className="h-3 w-3" />
            New issue
          </button>
        )}
      </div>
    </div>
  );
}
