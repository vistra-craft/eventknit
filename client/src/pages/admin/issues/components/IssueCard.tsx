import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MessageSquare, Calendar, CheckSquare, GripVertical, User,
  Bug, Sparkles, TrendingUp, ClipboardList, HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Issue, IssueType } from '@/types/issues';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_CARD_BG,
  STORY_POINT_LABELS,
} from '@/types/issues';
import { format, isPast, isToday } from 'date-fns';

export type CardSize = 'compact' | 'comfortable';

interface IssueCardProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
  size?: CardSize;
  /** true when rendered inside a column (flush to walls); false for drag overlay */
  inColumn?: boolean;
}

// ─── Type icons — Lucide, muted, consistent size ──────────────────────────────

const TYPE_ICON: Record<IssueType, LucideIcon> = {
  BUG:         Bug,
  FEATURE:     Sparkles,
  IMPROVEMENT: TrendingUp,
  TASK:        ClipboardList,
  QUESTION:    HelpCircle,
};

// ─── Tag color — deterministic from tag string ────────────────────────────────

const TAG_PALETTES = [
  'bg-violet-500/15 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-sky-500/15 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-pink-500/15 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-purple-500/15 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-fuchsia-500/15 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
  'bg-teal-500/15 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
];

function tagColor(tag: string): string {
  let h = 5381;
  for (let i = 0; i < tag.length; i++) h = ((h << 5) + h) ^ tag.charCodeAt(i);
  return TAG_PALETTES[Math.abs(h) % TAG_PALETTES.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  user: { firstName: string; lastName: string; avatar: string | null } | null;
  showName?: boolean;
}

function Avatar({ user, showName = false }: AvatarProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted ring-1 ring-border/50">
          <User className="h-2.5 w-2.5 text-muted-foreground/40" />
        </div>
        {showName && <span className="text-xs text-muted-foreground/50">Unassigned</span>}
      </div>
    );
  }

  const img = user.avatar ? (
    <img
      src={user.avatar}
      alt={`${user.firstName} ${user.lastName}`}
      className="h-5 w-5 rounded-full object-cover ring-1 ring-border"
      loading="lazy"
    />
  ) : (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">
      {user.firstName[0]}{user.lastName[0]}
    </div>
  );

  if (!showName) return img;
  return (
    <div className="flex items-center gap-1.5">
      {img}
      <span className="text-xs text-muted-foreground">{user.firstName} {user.lastName}</span>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function IssueCard({ issue, onClick, size = 'compact', inColumn = false }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    data: { issue },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const completedSubtasks = (issue.subtasks ?? []).filter((s) => s.completed).length;
  const totalSubtasks = issue.subtasks?.length ?? 0;
  const commentCount = issue._count?.comments ?? issue.comments?.length ?? 0;
  const isOverdue = issue.dueDate && !isToday(new Date(issue.dueDate)) && isPast(new Date(issue.dueDate));
  const comfortable = size === 'comfortable';
  const TypeIcon = TYPE_ICON[issue.type] ?? ClipboardList;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative select-none transition-all duration-150 cursor-grab active:cursor-grabbing',
        inColumn
          ? 'rounded-none border-b border-x-0'
          : 'rounded-xl border shadow-md dark:shadow-black/40',
        comfortable ? 'px-3 py-4' : 'px-3 py-3',
        PRIORITY_CARD_BG[issue.priority],
        isDragging && 'opacity-40',
      )}
      onClick={() => onClick(issue)}
    >
      {/* Drag handle — visual affordance, no pointer events */}
      <div className="absolute right-2 top-2 pointer-events-none text-transparent transition-colors group-hover:text-muted-foreground/25">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Assignee row — comfortable mode only */}
      {comfortable && (
        <div className="mb-2.5">
          <Avatar user={issue.assignee} showName />
        </div>
      )}

      {/* Type icon + title */}
      <div className={cn('flex items-start gap-1.5 pr-5', comfortable ? 'mb-3' : 'mb-2')}>
        <TypeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        <p className={cn(
          'font-medium leading-snug text-foreground',
          comfortable ? 'text-sm line-clamp-3' : 'text-sm line-clamp-2',
        )}>
          {issue.title}
        </p>
      </div>

      {/* Description snippet — comfortable only */}
      {comfortable && issue.description && (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {issue.description}
        </p>
      )}

      {/* Badges */}
      <div className={cn('flex flex-wrap items-center gap-1', comfortable ? 'mb-3' : 'mb-2.5')}>
        {/* Priority */}
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
          PRIORITY_COLORS[issue.priority],
        )}>
          {PRIORITY_LABELS[issue.priority]}
        </span>

        {/* Story points */}
        {issue.storyPoints && (
          <span className="inline-flex items-center rounded-full bg-muted/70 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {STORY_POINT_LABELS[issue.storyPoints]}
          </span>
        )}

        {/* Tags — intelligently colored */}
        {issue.tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              tagColor(tag),
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground/60">
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs',
              completedSubtasks === totalSubtasks && 'text-emerald-500',
            )}>
              <CheckSquare className="h-3 w-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
          {issue.dueDate && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs',
              isOverdue && 'font-medium text-red-500 dark:text-red-400',
            )}>
              <Calendar className="h-3 w-3" />
              {format(new Date(issue.dueDate), 'MMM d')}
            </span>
          )}
        </div>

        {/* Assignee avatar — compact mode */}
        {!comfortable && <Avatar user={issue.assignee} />}
      </div>

      {/* Issue number */}
      <div className="absolute bottom-2 right-2.5 text-[10px] font-mono text-muted-foreground/25">
        #{issue.number}
      </div>
    </div>
  );
}
