import { useState, useRef } from 'react';
import {
  X, Plus, Trash2, Check, Calendar, User,
  Flag, Zap, FileText, Lightbulb, StickyNote, ChevronDown, Tag, CheckSquare,
  Bug, Sparkles, TrendingUp, ClipboardList, HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import type {
  IssueType, IssuePriority, IssueStoryPoints, IssueStatus,
  AcceptanceCriterion, KanbanColumnStatus,
} from '@/types/issues';
import {
  STATUS_LABELS, STATUS_DOT_COLORS,
  PRIORITY_LABELS, STORY_POINT_LABELS, TYPE_LABELS,
} from '@/types/issues';
import { useCreateIssue, useAssignableUsers } from '@/hooks/queries/useIssues';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SheetTitle } from '@/components/ui/sheet';

// ─── Color system (mirrors IssueDetailDrawer exactly) ────────────────────────

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
  { label: 'Complete',  statuses: ['DONE'] },
];

// ─── Subcomponents (mirrors IssueDetailDrawer) ────────────────────────────────

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

function Avatar({ user }: { user: { firstName: string; lastName: string; avatar: string | null } | null }) {
  if (!user) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted ring-1 ring-border/50">
        <User className="h-2.5 w-2.5 text-muted-foreground/40" />
      </div>
    );
  }
  if (user.avatar) {
    return <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="h-5 w-5 rounded-full object-cover ring-1 ring-border" loading="lazy" />;
  }
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">
      {user.firstName[0]}{user.lastName[0]}
    </div>
  );
}

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border/30" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CreateIssueDrawerProps {
  defaultStatus?: KanbanColumnStatus;
  onClose: () => void;
}

export function CreateIssueDrawer({ defaultStatus = 'NOT_STARTED', onClose }: CreateIssueDrawerProps) {
  const [title, setTitle]               = useState('');
  const [type, setType]                 = useState<IssueType>('TASK');
  const [priority, setPriority]         = useState<IssuePriority>('MEDIUM');
  const [status, setStatus]             = useState<IssueStatus>(defaultStatus);
  const [storyPoints, setStoryPoints]   = useState<IssueStoryPoints | null>(null);
  const [assigneeId, setAssigneeId]     = useState<string | null>(null);
  const [dueDate, setDueDate]           = useState<string | null>(null);
  const [tags, setTags]                 = useState<string[]>([]);
  const [newTag, setNewTag]             = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [userStoryAs, setUserStoryAs]         = useState('');
  const [userStoryWant, setUserStoryWant]     = useState('');
  const [userStorySoThat, setUserStorySoThat] = useState('');
  const [criteria, setCriteria]         = useState<AcceptanceCriterion[]>([]);
  const [newCriterion, setNewCriterion] = useState('');
  const [description, setDescription]   = useState('');
  const [needToKnow, setNeedToKnow]     = useState('');
  const [workNotes, setWorkNotes]       = useState('');

  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const { data: assignableUsers = [] } = useAssignableUsers();
  const createMutation = useCreateIssue();

  const selectedAssignee = assigneeId ? (assignableUsers.find((u) => u.id === assigneeId) ?? null) : null;
  const TypeIcon = TYPE_ICON[type] ?? ClipboardList;

  function handleAddCriterion() {
    if (!newCriterion.trim()) return;
    setCriteria((prev) => [...prev, { id: nanoid(), text: newCriterion.trim(), completed: false }]);
    setNewCriterion('');
  }

  function handleAddTag() {
    const tag = newTag.trim();
    if (!tag || tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
    setNewTag('');
    setShowTagInput(false);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    createMutation.mutate(
      {
        title: title.trim(),
        status,
        type,
        priority,
        storyPoints: storyPoints ?? null,
        description: description.trim() || null,
        userStoryAs: userStoryAs.trim() || null,
        userStoryWant: userStoryWant.trim() || null,
        userStorySoThat: userStorySoThat.trim() || null,
        needToKnow: needToKnow.trim() || null,
        workNotes: workNotes.trim() || null,
        acceptanceCriteria: criteria.length ? criteria : null,
        tags,
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ?? null,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <SheetTitle className="sr-only">Create New Issue</SheetTitle>

      {/* Header — mirrors IssueDetailDrawer */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-card px-4 py-3.5 shadow-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <TypeIcon className="h-4 w-4 text-muted-foreground/50" />
          <span className="font-mono text-xs text-muted-foreground/60">New</span>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide', STATUS_BADGE[status])}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-4 py-5 sm:px-6">

          {/* Title — large, matches detail drawer title style */}
          <textarea
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled issue"
            rows={2}
            className="w-full resize-none bg-transparent text-xl font-semibold text-foreground placeholder:text-muted-foreground/25 focus:outline-none leading-snug"
            onKeyDown={(e) => { if (e.key === 'Escape') e.stopPropagation(); }}
          />

          {/* Properties — identical card to detail drawer */}
          <div className="rounded-2xl border border-border/40 bg-card-surface px-2 py-2 shadow-sm">

            <PropRow icon={<FileText className="h-3.5 w-3.5" />} label="Type">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground hover:bg-muted/50 transition-colors">
                    {(() => { const Icon = TYPE_ICON[type] ?? ClipboardList; return <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />; })()}
                    <span>{TYPE_LABELS[type]}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {(Object.keys(TYPE_LABELS) as IssueType[]).map((t) => {
                    const Icon = TYPE_ICON[t] ?? ClipboardList;
                    return (
                      <DropdownMenuItem key={t} onClick={() => setType(t)} className="gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {TYPE_LABELS[t]}
                        {type === t && <Check className="ml-auto h-3 w-3 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            <PropRow icon={<Flag className="h-3.5 w-3.5" />} label="Priority">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-80',
                    PRIORITY_BADGE[priority],
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[priority])} />
                    {PRIORITY_LABELS[priority]}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((p) => (
                    <DropdownMenuItem key={p} onClick={() => setPriority(p)} className="gap-2">
                      <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[p])} />
                      {PRIORITY_LABELS[p]}
                      {priority === p && <Check className="ml-auto h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            <PropRow icon={<Zap className="h-3.5 w-3.5" />} label="Status">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-80',
                    STATUS_BADGE[status],
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT_COLORS[status])} />
                    {STATUS_LABELS[status]}
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
                        <DropdownMenuItem key={s} onClick={() => setStatus(s)} className="gap-2">
                          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_COLORS[s])} />
                          {STATUS_LABELS[s]}
                          {status === s && <Check className="ml-auto h-3 w-3 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                      {group !== STATUS_GROUPS[STATUS_GROUPS.length - 1] && <DropdownMenuSeparator />}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            <PropRow icon={<Zap className="h-3.5 w-3.5 opacity-0" />} label="Story points">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground hover:bg-muted/50 transition-colors">
                    {storyPoints ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                        {STORY_POINT_LABELS[storyPoints]}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground/40 text-xs">Empty</span>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuItem onClick={() => setStoryPoints(null)}>
                    <span className="italic text-muted-foreground">None</span>
                    {!storyPoints && <Check className="ml-auto h-3 w-3 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(Object.keys(STORY_POINT_LABELS) as IssueStoryPoints[]).map((sp) => (
                    <DropdownMenuItem key={sp} onClick={() => setStoryPoints(sp)}>
                      {STORY_POINT_LABELS[sp]}
                      {storyPoints === sp && <Check className="ml-auto h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            <PropRow icon={<User className="h-3.5 w-3.5" />} label="Assignee">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50 transition-colors">
                    <Avatar user={selectedAssignee} />
                    <span className={cn('text-sm', selectedAssignee ? 'text-foreground' : 'italic text-muted-foreground/40')}>
                      {selectedAssignee ? `${selectedAssignee.firstName} ${selectedAssignee.lastName}` : 'Unassigned'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem onClick={() => setAssigneeId(null)} className="gap-2 italic text-muted-foreground">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted ring-1 ring-border/50">
                      <User className="h-2.5 w-2.5" />
                    </div>
                    Unassigned
                    {!assigneeId && <Check className="ml-auto h-3 w-3 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {assignableUsers.map((u) => (
                    <DropdownMenuItem key={u.id} onClick={() => setAssigneeId(u.id)} className="gap-2">
                      <Avatar user={u} />
                      {u.firstName} {u.lastName}
                      {assigneeId === u.id && <Check className="ml-auto h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropRow>

            <PropRow icon={<Calendar className="h-3.5 w-3.5" />} label="Deadline">
              <div className="relative">
                <button
                  onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                  {dueDate
                    ? <span className="text-foreground">{format(new Date(dueDate), 'MMM d, yyyy')}</span>
                    : <span className="italic text-muted-foreground/40 text-xs">Empty</span>
                  }
                  {dueDate && (
                    <button onClick={(e) => { e.stopPropagation(); setDueDate(null); }} className="ml-1 opacity-50 hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dueDate ? dueDate.slice(0, 10) : ''}
                  onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="absolute left-0 top-0 h-0 w-0 opacity-0 pointer-events-none"
                />
              </div>
            </PropRow>

            <PropRow icon={<Tag className="h-3.5 w-3.5" />} label="Tags">
              <div className="flex flex-wrap items-center gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="group/tag flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {tag}
                    <button
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
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
          </div>

          {/* Sub-tasks */}
          <div className="space-y-2">
            <SectionHeader icon={<CheckSquare className="h-3.5 w-3.5" />} label="Sub-tasks" />
            <p className="text-xs text-muted-foreground/40 px-1">
              Sub-tasks can be added after creating the issue.
            </p>
          </div>

          <Divider />

          {/* User Story */}
          <div className="space-y-2">
            <SectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="User Story" />
            <div className="rounded-xl border border-border/40 bg-muted/10 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-semibold text-muted-foreground">As a</span>
                <Input value={userStoryAs} onChange={(e) => setUserStoryAs(e.target.value)} placeholder="a user" className="h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-semibold text-muted-foreground">I want</span>
                <Input value={userStoryWant} onChange={(e) => setUserStoryWant(e.target.value)} placeholder="to..." className="h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-semibold text-muted-foreground">So that</span>
                <Input value={userStorySoThat} onChange={(e) => setUserStorySoThat(e.target.value)} placeholder="I can..." className="h-8 text-sm" />
              </div>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-2">
            <SectionHeader icon={<CheckSquare className="h-3.5 w-3.5" />} label="Acceptance Criteria" count={criteria.length} />
            <div className="space-y-0.5">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/20 transition-colors">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <span className="flex-1 text-sm text-foreground">{c.text}</span>
                  <button
                    onClick={() => setCriteria((prev) => prev.filter((x) => x.id !== c.id))}
                    className="text-muted-foreground/30 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
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

          {/* Description */}
          <div className="space-y-2">
            <SectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="Description" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Need to Know */}
          <div className="space-y-2">
            <SectionHeader icon={<Lightbulb className="h-3.5 w-3.5" />} label="Need to Know" />
            <Textarea
              value={needToKnow}
              onChange={(e) => setNeedToKnow(e.target.value)}
              placeholder="Add context or constraints..."
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Work Notes */}
          <div className="space-y-2">
            <SectionHeader icon={<StickyNote className="h-3.5 w-3.5" />} label="Work Notes" />
            <Textarea
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              placeholder="Add notes visible to the team..."
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-border/40 bg-card px-4 py-4 sm:px-6">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Issue'}
        </Button>
      </div>
    </div>
  );
}
