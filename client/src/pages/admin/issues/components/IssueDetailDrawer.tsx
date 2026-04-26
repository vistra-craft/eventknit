import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, Send, Trash2, Check, Calendar, User,
  Flag, Clock, MessageSquare, Tag, Archive,
  ChevronDown, Zap, FileText, Lightbulb, StickyNote,
  MoreHorizontal, Link2, CheckSquare,
  Bug, Sparkles, TrendingUp, ClipboardList, HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import type {
  IssueStatus, IssuePriority, IssueStoryPoints, IssueType, AcceptanceCriterion,
} from '@/types/issues';
import {
  STATUS_LABELS, STATUS_DOT_COLORS,
  PRIORITY_LABELS, STORY_POINT_LABELS, TYPE_LABELS,
} from '@/types/issues';
import {
  useUpdateIssue, useUpdateIssueStatus, useAssignIssue, useArchiveIssue,
  useDeleteIssue, useAddComment, useDeleteComment, useAddSubtask,
  useUpdateSubtask, useDeleteSubtask, useAssignableUsers, useIssueDetail,
} from '@/hooks/queries/useIssues';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SheetTitle } from '@/components/ui/sheet';
import { UserRole } from '@/types/auth';

// ─── Color system ─────────────────────────────────────────────────────────────
// Dark mode: use explicit dark: classes because opacity-based colors wash out on
// dark surfaces. Each status/priority gets a saturated tint that reads clearly.

const STATUS_BADGE: Record<IssueStatus, string> = {
  NOT_STARTED:
    'bg-zinc-500/10 text-zinc-600 border border-zinc-400/30 ' +
    'dark:bg-zinc-700/40 dark:text-zinc-300 dark:border-zinc-600/40',
  BLOCKED:
    'bg-red-500/10 text-red-700 border border-red-400/30 ' +
    'dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/50',
  IN_PROGRESS:
    'bg-blue-500/10 text-blue-700 border border-blue-400/30 ' +
    'dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/50',
  UNDER_REVIEW:
    'bg-amber-500/10 text-amber-700 border border-amber-400/30 ' +
    'dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50',
  DONE:
    'bg-emerald-500/15 text-emerald-700 border border-emerald-400/40 ' +
    'dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-600/50',
  ARCHIVED:
    'bg-zinc-500/8 text-zinc-500 border border-zinc-400/20 ' +
    'dark:bg-zinc-800/40 dark:text-zinc-500 dark:border-zinc-700/30',
};

const PRIORITY_BADGE: Record<IssuePriority, string> = {
  LOW:
    'bg-slate-500/10 text-slate-600 border border-slate-400/25 ' +
    'dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600/40',
  MEDIUM:
    'bg-amber-500/10 text-amber-700 border border-amber-400/30 ' +
    'dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50',
  HIGH:
    'bg-orange-500/10 text-orange-700 border border-orange-400/30 ' +
    'dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700/50',
  URGENT:
    'bg-rose-500/15 text-rose-700 border border-rose-400/35 ' +
    'dark:bg-rose-900/60 dark:text-rose-300 dark:border-rose-700/55',
};

const PRIORITY_DOT: Record<IssuePriority, string> = {
  LOW:    'bg-slate-400 dark:bg-slate-500',
  MEDIUM: 'bg-amber-500',
  HIGH:   'bg-orange-500',
  URGENT: 'bg-rose-500',
};

const TYPE_ICON: Record<IssueType, LucideIcon> = {
  BUG:         Bug,
  FEATURE:     Sparkles,
  IMPROVEMENT: TrendingUp,
  TASK:        ClipboardList,
  QUESTION:    HelpCircle,
};

const STATUS_GROUPS: { label: string; statuses: IssueStatus[] }[] = [
  { label: 'To-do',     statuses: ['NOT_STARTED'] },
  { label: 'In flight', statuses: ['BLOCKED', 'IN_PROGRESS', 'UNDER_REVIEW'] },
  { label: 'Complete',  statuses: ['DONE', 'ARCHIVED'] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: { firstName: string; lastName: string; avatar: string | null } | null }) {
  if (!user) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted ring-1 ring-border/50">
        <User className="h-2.5 w-2.5 text-muted-foreground/40" />
      </div>
    );
  }
  if (user.avatar) {
    return (
      <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`}
        className="h-5 w-5 rounded-full object-cover ring-1 ring-border" loading="lazy" />
    );
  }
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">
      {user.firstName[0]}{user.lastName[0]}
    </div>
  );
}

// ─── Property row layout ──────────────────────────────────────────────────────

function PropRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="group flex min-h-[34px] items-start gap-0 rounded-md hover:bg-muted/25 transition-colors duration-100">
      <div className="flex w-28 shrink-0 items-center gap-2 px-2 py-2 text-xs text-muted-foreground/70 select-none sm:w-36">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex flex-1 items-center px-2 py-1.5 min-w-0">
        {children}
      </div>
    </div>
  );
}

// ─── Click-to-edit text field with debounced autosave ────────────────────────

interface EditableTextProps {
  value: string | null;
  placeholder: string;
  multiline?: boolean;
  className?: string;
  onSave: (v: string | null) => void;
}

function EditableText({ value, placeholder, multiline = false, className, onSave }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Keep latest onSave + value in refs so debounced callbacks never go stale
  const onSaveRef = useRef(onSave);
  const valueRef = useRef(value);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);
  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    if (editing) (inputRef.current as HTMLElement)?.focus();
  }, [editing]);

  // When value changes externally (server response / optimistic rollback), sync display
  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function scheduleSave(val: string, flush = false) {
    clearTimeout(timerRef.current);
    const next = val.trim() || null;
    const prev = (valueRef.current ?? '').trim() || null;
    if (next === prev) return; // skip no-op saves
    if (flush) {
      onSaveRef.current(next);
    } else {
      timerRef.current = setTimeout(() => onSaveRef.current(next), 1200);
    }
  }

  const start = () => { setDraft(value ?? ''); setEditing(true); };
  const commit = (val: string) => { scheduleSave(val, true); setEditing(false); };
  const cancel = () => { clearTimeout(timerRef.current); setDraft(value ?? ''); setEditing(false); };

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); cancel(); }
    if (!multiline && e.key === 'Enter') { e.preventDefault(); commit(draft); }
    if (multiline && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit(draft);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    setDraft(val);
    scheduleSave(val); // debounced — 1.2 s after last keystroke
  };

  if (editing) {
    const shared = {
      value: draft,
      onChange: handleChange,
      onBlur: (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => commit(e.target.value),
      onKeyDown: keyDown,
      className: cn('w-full text-sm focus-visible:ring-1 focus-visible:ring-primary/50', className),
    };
    return multiline
      ? <Textarea {...(shared as React.ComponentProps<typeof Textarea>)} ref={inputRef as React.RefObject<HTMLTextAreaElement>} rows={3} className={cn(shared.className, 'resize-none')} />
      : <Input {...(shared as React.ComponentProps<typeof Input>)} ref={inputRef as React.RefObject<HTMLInputElement>} />;
  }

  return (
    <button
      onClick={start}
      className={cn(
        'w-full rounded-sm text-left text-sm transition-colors hover:bg-muted/30 px-1 py-0.5 -mx-1',
        value ? 'text-foreground' : 'italic text-muted-foreground/40',
        className,
      )}
    >
      {value || placeholder}
    </button>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-150',
        checked
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
          : 'border-border/60 bg-background hover:border-primary/60 hover:bg-primary/5',
      )}
    >
      {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="border-t border-border/30" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IssueDetailDrawerProps {
  issueId: string;
  onClose: () => void;
}

export function IssueDetailDrawer({ issueId, onClose }: IssueDetailDrawerProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN;

  const { data: issue, isLoading } = useIssueDetail(issueId);
  const { data: assignableUsers = [] } = useAssignableUsers();

  const updateMutation = useUpdateIssue(issueId);
  const updateStatusMutation = useUpdateIssueStatus();
  const assignMutation = useAssignIssue(issueId);
  const archiveMutation = useArchiveIssue();
  const deleteMutation = useDeleteIssue();
  const addCommentMutation = useAddComment(issueId);
  const deleteCommentMutation = useDeleteComment(issueId);
  const addSubtaskMutation = useAddSubtask(issueId);
  const updateSubtaskMutation = useUpdateSubtask(issueId);
  const deleteSubtaskMutation = useDeleteSubtask(issueId);

  const [commentText, setCommentText] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [newCriterion, setNewCriterion] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const showDeleteConfirmRef = useRef(false);
  useEffect(() => { showDeleteConfirmRef.current = showDeleteConfirm; }, [showDeleteConfirm]);

  // Escape to close — guarded so the AlertDialog's own Escape doesn't also close the drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !showDeleteConfirmRef.current) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleComment = useCallback(() => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText.trim() }, { onSuccess: () => setCommentText('') });
  }, [commentText, addCommentMutation]);

  const handleAddSubtask = useCallback(() => {
    if (!newSubtask.trim()) return;
    addSubtaskMutation.mutate({ title: newSubtask.trim() }, { onSuccess: () => setNewSubtask('') });
  }, [newSubtask, addSubtaskMutation]);

  const handleAddCriterion = useCallback(() => {
    if (!newCriterion.trim()) return;
    const criteria: AcceptanceCriterion[] = Array.isArray(issue?.acceptanceCriteria)
      ? (issue!.acceptanceCriteria as AcceptanceCriterion[])
      : [];
    const updated = [...criteria, { id: crypto.randomUUID(), text: newCriterion.trim(), completed: false }];
    updateMutation.mutate({ acceptanceCriteria: updated }, { onSuccess: () => setNewCriterion('') });
  }, [newCriterion, issue, updateMutation]);

  const handleAddTag = useCallback(() => {
    const tag = newTag.trim();
    if (!tag || (issue?.tags ?? []).includes(tag)) return;
    updateMutation.mutate({ tags: [...(issue?.tags ?? []), tag] }, { onSuccess: () => { setNewTag(''); setShowTagInput(false); } });
  }, [newTag, issue, updateMutation]);

  if (isLoading || !issue) {
    return (
      <div className="flex h-full flex-col bg-card">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex-1 space-y-4 px-6 py-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const criteria: AcceptanceCriterion[] = Array.isArray(issue.acceptanceCriteria)
    ? (issue.acceptanceCriteria as AcceptanceCriterion[])
    : [];

  // Relation arrays may be absent from mutation-response cache writes — normalise here
  const subtasks = issue.subtasks ?? [];
  const comments = issue.comments ?? [];
  const tags = issue.tags ?? [];

  const isOverdue = issue.dueDate && !isToday(new Date(issue.dueDate)) && isPast(new Date(issue.dueDate));
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* Accessibility title — visually hidden, required by Radix Sheet */}
      <SheetTitle className="sr-only">
        Issue #{issue.number}: {issue.title}
      </SheetTitle>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-card px-4 py-3.5 shadow-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          {(() => { const Icon = TYPE_ICON[issue.type] ?? ClipboardList; return <Icon className="h-4 w-4 text-muted-foreground/50" />; })()}
          <span className="font-mono text-xs text-muted-foreground/60">#{issue.number}</span>
          <span className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
            STATUS_BADGE[issue.status],
          )}>
            {STATUS_LABELS[issue.status]}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {updateMutation.isPending && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/40 select-none pr-1">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40 animate-pulse" />
              Saving
            </span>
          )}
          {isSuperAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => archiveMutation.mutate(issue.id, { onSuccess: onClose })}
                  disabled={issue.status === 'ARCHIVED'}
                >
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  Archive issue
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-4 py-5 sm:px-6">

          {/* Title — large, click to edit */}
          <div>
            <EditableText
              value={issue.title}
              placeholder="Untitled issue"
              onSave={(v) => v && updateMutation.mutate({ title: v })}
              className="text-xl font-semibold leading-snug text-foreground"
            />
          </div>

          {/* ── Properties ────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border/40 bg-card-surface px-2 py-2 shadow-sm">

            {/* Type */}
            <PropRow icon={<FileText className="h-3.5 w-3.5" />} label="Type">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground hover:bg-muted/50 transition-colors">
                    {(() => { const Icon = TYPE_ICON[issue.type] ?? ClipboardList; return <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />; })()}
                    <span>{TYPE_LABELS[issue.type]}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {(Object.keys(TYPE_LABELS) as IssueType[]).map((t) => {
                    const Icon = TYPE_ICON[t] ?? ClipboardList;
                    return (
                      <DropdownMenuItem
                        key={t}
                        onClick={() => updateMutation.mutate({ type: t })}
                        className={cn('gap-2', issue.type === t && 'font-medium')}
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {TYPE_LABELS[t]}
                        {issue.type === t && <Check className="ml-auto h-3 w-3 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            {/* Priority */}
            <PropRow icon={<Flag className="h-3.5 w-3.5" />} label="Priority">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-80',
                    PRIORITY_BADGE[issue.priority],
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[issue.priority])} />
                    {PRIORITY_LABELS[issue.priority]}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => updateMutation.mutate({ priority: p })}
                      className="gap-2"
                    >
                      <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[p])} />
                      {PRIORITY_LABELS[p]}
                      {issue.priority === p && <Check className="ml-auto h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            {/* Status */}
            <PropRow icon={<Zap className="h-3.5 w-3.5" />} label="Status">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-80',
                    STATUS_BADGE[issue.status],
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT_COLORS[issue.status])} />
                    {STATUS_LABELS[issue.status]}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {STATUS_GROUPS.map((group) => (
                    <div key={group.label}>
                      <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/60 px-2 py-1.5">
                        {group.label}
                      </DropdownMenuLabel>
                      {group.statuses.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => updateStatusMutation.mutate({ id: issue.id, status: s })}
                          className="gap-2"
                        >
                          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_COLORS[s])} />
                          {STATUS_LABELS[s]}
                          {issue.status === s && <Check className="ml-auto h-3 w-3 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                      {group !== STATUS_GROUPS[STATUS_GROUPS.length - 1] && <DropdownMenuSeparator />}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            {/* Story Points */}
            <PropRow icon={<Zap className="h-3.5 w-3.5 opacity-0" />} label="Story points">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground hover:bg-muted/50 transition-colors">
                    {issue.storyPoints ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                        {STORY_POINT_LABELS[issue.storyPoints]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 italic text-xs">Empty</span>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuItem onClick={() => updateMutation.mutate({ storyPoints: null })}>
                    <span className="text-muted-foreground italic">None</span>
                    {!issue.storyPoints && <Check className="ml-auto h-3 w-3 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(Object.keys(STORY_POINT_LABELS) as IssueStoryPoints[]).map((sp) => (
                    <DropdownMenuItem
                      key={sp}
                      onClick={() => updateMutation.mutate({ storyPoints: sp })}
                    >
                      {STORY_POINT_LABELS[sp]}
                      {issue.storyPoints === sp && <Check className="ml-auto h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            {/* Assignee */}
            <PropRow icon={<User className="h-3.5 w-3.5" />} label="Assignee">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50 transition-colors">
                    <Avatar user={issue.assignee} />
                    <span className={cn('text-sm', issue.assignee ? 'text-foreground' : 'italic text-muted-foreground/40')}>
                      {issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem
                    onClick={() => assignMutation.mutate(null)}
                    className="gap-2 italic text-muted-foreground"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted ring-1 ring-border/50">
                      <User className="h-2.5 w-2.5" />
                    </div>
                    Unassigned
                    {!issue.assigneeId && <Check className="ml-auto h-3 w-3 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {assignableUsers.map((u) => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => assignMutation.mutate(u.id)}
                      className="gap-2"
                    >
                      <Avatar user={u} />
                      {u.firstName} {u.lastName}
                      {issue.assigneeId === u.id && <Check className="ml-auto h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            {/* Deadline */}
            <PropRow icon={<Calendar className="h-3.5 w-3.5" />} label="Deadline">
              <div className="relative">
                <button
                  onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted/50',
                    isOverdue ? 'font-medium text-red-500 dark:text-red-400' : issue.dueDate ? 'text-foreground' : 'italic text-muted-foreground/40',
                  )}
                >
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {issue.dueDate ? format(new Date(issue.dueDate), 'MMM d, yyyy') : 'Empty'}
                  {issue.dueDate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ dueDate: null }); }}
                      className="ml-1 opacity-50 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={issue.dueDate ? issue.dueDate.slice(0, 10) : ''}
                  onChange={(e) => updateMutation.mutate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="absolute left-0 top-0 h-0 w-0 opacity-0 pointer-events-none"
                />
              </div>
            </PropRow>

            {/* Tags */}
            <PropRow icon={<Tag className="h-3.5 w-3.5" />} label="Tags">
              <div className="flex flex-wrap items-center gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="group/tag flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {tag}
                    <button
                      onClick={() => updateMutation.mutate({ tags: tags.filter((t) => t !== tag) })}
                      className="opacity-0 transition-opacity group-hover/tag:opacity-100 hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                {showTagInput ? (
                  <Input
                    autoFocus
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onBlur={() => { if (newTag.trim()) handleAddTag(); else setShowTagInput(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.stopPropagation(); handleAddTag(); }
                      if (e.key === 'Escape') { e.stopPropagation(); setShowTagInput(false); setNewTag(''); }
                    }}
                    className="h-5 w-20 px-1.5 text-xs"
                    placeholder="tag..."
                  />
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="flex items-center gap-0.5 rounded-full border border-dashed border-border/50 px-2 py-0.5 text-xs text-muted-foreground/40 hover:border-border hover:text-muted-foreground transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    Add tag
                  </button>
                )}
              </div>
            </PropRow>

            <Divider />

            {/* Reporter */}
            <PropRow icon={<User className="h-3.5 w-3.5 opacity-50" />} label="Reporter">
              <div className="flex items-center gap-2 px-1.5">
                <Avatar user={issue.reporter} />
                <span className="text-sm text-muted-foreground">
                  {issue.reporter.firstName} {issue.reporter.lastName}
                </span>
              </div>
            </PropRow>

            {/* Created */}
            <PropRow icon={<Clock className="h-3.5 w-3.5 opacity-50" />} label="Created">
              <span className="px-1.5 text-sm text-muted-foreground">
                {format(new Date(issue.createdAt), 'MMM d, yyyy HH:mm')}
              </span>
            </PropRow>

            {/* Updated */}
            <PropRow icon={<Clock className="h-3.5 w-3.5 opacity-0" />} label="Last edited">
              <span className="px-1.5 text-sm text-muted-foreground">
                {format(new Date(issue.updatedAt), 'MMM d, yyyy HH:mm')}
              </span>
            </PropRow>
          </div>

          {/* ── Blocked by / Blocking ──────────────────────────────────────── */}
          {((issue.blockedBy?.length ?? 0) > 0 || (issue.blocking?.length ?? 0) > 0) && (
            <div className="space-y-2">
              {(issue.blockedBy?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <SectionHeader icon={<Link2 className="h-3.5 w-3.5" />} label="Blocked by" />
                  {issue.blockedBy!.map((rel) => (
                    <div key={rel.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm bg-red-500/5 border border-red-500/10">
                      <span className="font-mono text-xs text-muted-foreground">#{rel.number}</span>
                      <span className="flex-1 text-foreground truncate">{rel.title}</span>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-medium', STATUS_BADGE[rel.status])}>
                        {STATUS_LABELS[rel.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {(issue.blocking?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <SectionHeader icon={<Link2 className="h-3.5 w-3.5" />} label="Blocking" />
                  {issue.blocking!.map((rel) => (
                    <div key={rel.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm bg-muted/30 border border-border/30">
                      <span className="font-mono text-xs text-muted-foreground">#{rel.number}</span>
                      <span className="flex-1 text-foreground truncate">{rel.title}</span>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-medium', STATUS_BADGE[rel.status])}>
                        {STATUS_LABELS[rel.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Sub-tasks ──────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <SectionHeader
              icon={<CheckSquare className="h-3.5 w-3.5" />}
              label="Sub-tasks"
              count={subtasks.length}
            />
            {subtasks.length > 0 && (
              <>
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${subtasks.length ? (completedSubtasks / subtasks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {completedSubtasks}/{subtasks.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {subtasks.map((st) => (
                    <div key={st.id} className="group/st flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={st.completed}
                        onChange={() => updateSubtaskMutation.mutate({ subtaskId: st.id, data: { completed: !st.completed } })}
                      />
                      <span className={cn(
                        'flex-1 text-sm',
                        st.completed && 'text-muted-foreground line-through',
                      )}>
                        {st.title}
                      </span>
                      <button
                        onClick={() => deleteSubtaskMutation.mutate(st.id)}
                        className="opacity-0 text-muted-foreground/30 transition-all hover:text-destructive group-hover/st:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a sub-task..."
                className="h-8 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleAddSubtask(); } }}
              />
              <Button size="sm" variant="outline" onClick={handleAddSubtask} className="h-8 shrink-0 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Divider />

          {/* ── User Story ─────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="User Story" />
            <div className="rounded-xl border border-border/40 bg-muted/10 p-3 space-y-2.5">
              {(['userStoryAs', 'userStoryWant', 'userStorySoThat'] as const).map((field, i) => {
                const prefixes = ['As a', 'I want', 'So that'];
                return (
                  <div key={field} className="flex items-start gap-2">
                    <span className="mt-1 w-14 shrink-0 text-xs font-semibold text-muted-foreground">
                      {prefixes[i]}
                    </span>
                    <EditableText
                      value={issue[field]}
                      placeholder={`${prefixes[i]}...`}
                      onSave={(v) => updateMutation.mutate({ [field]: v })}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Acceptance Criteria ────────────────────────────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={<CheckSquare className="h-3.5 w-3.5" />} label="Acceptance Criteria" count={criteria.length} />
            <div className="space-y-0.5">
              {criteria.map((c) => (
                <div key={c.id} className="group/ac flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    <Checkbox
                      checked={c.completed}
                      onChange={() => {
                        const updated = criteria.map((x) => x.id === c.id ? { ...x, completed: !x.completed } : x);
                        updateMutation.mutate({ acceptanceCriteria: updated });
                      }}
                    />
                  </div>
                  <span className={cn(
                    'flex-1 text-sm leading-snug',
                    c.completed && 'text-muted-foreground line-through',
                  )}>
                    {c.text}
                  </span>
                  <button
                    onClick={() => {
                      const updated = criteria.filter((x) => x.id !== c.id);
                      updateMutation.mutate({ acceptanceCriteria: updated });
                    }}
                    className="mt-0.5 opacity-0 text-muted-foreground/30 transition-all hover:text-destructive group-hover/ac:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                placeholder="Add acceptance criterion..."
                className="h-8 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleAddCriterion(); } }}
              />
              <Button size="sm" variant="outline" onClick={handleAddCriterion} className="h-8 shrink-0 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Divider />

          {/* ── Description ────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="Description" />
            <EditableText
              value={issue.description}
              placeholder="Add a description..."
              multiline
              onSave={(v) => updateMutation.mutate({ description: v })}
            />
          </div>

          {/* ── Need to Know ───────────────────────────────────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={<Lightbulb className="h-3.5 w-3.5" />} label="Need to Know" />
            <EditableText
              value={issue.needToKnow}
              placeholder="Add context or constraints..."
              multiline
              onSave={(v) => updateMutation.mutate({ needToKnow: v })}
            />
          </div>

          {/* ── Work Notes ─────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={<StickyNote className="h-3.5 w-3.5" />} label="Work Notes" />
            <EditableText
              value={issue.workNotes}
              placeholder="Add notes visible to the team..."
              multiline
              onSave={(v) => updateMutation.mutate({ workNotes: v })}
            />
          </div>

          <Divider />

          {/* ── Comments ───────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <SectionHeader
              icon={<MessageSquare className="h-3.5 w-3.5" />}
              label="Comments"
              count={comments.length}
            />

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <Avatar user={comment.author} />
                <div className="flex-1 min-w-0 rounded-xl border border-border/30 bg-muted/20 px-3 py-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {comment.author.firstName} {comment.author.lastName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground/50">
                        {format(new Date(comment.createdAt), 'MMM d, HH:mm')}
                      </span>
                      {(isSuperAdmin || comment.authorId === user?.id) && (
                        <button
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="text-muted-foreground/20 transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">{comment.content}</p>
                </div>
              </div>
            ))}

            {/* Comment input */}
            <div className="flex gap-2 pt-1">
              <div className="shrink-0">
                <Avatar user={user ? { firstName: user.firstName, lastName: user.lastName, avatar: null } : null} />
              </div>
              <div className="flex flex-1 gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment... (⌘↵ to send)"
                  rows={2}
                  className="flex-1 resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment();
                    if (e.key === 'Escape') e.stopPropagation();
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleComment}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="self-end h-9 w-9 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom padding */}
          <div className="h-4" />

        </div>
      </div>

      {/* Delete confirmation — renders via portal, above the Sheet */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete issue #{issue.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the issue along with all its comments, sub-tasks, and attachments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(issue.id, { onSuccess: onClose })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
