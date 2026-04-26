export type IssueStatus =
  | 'NOT_STARTED'
  | 'BLOCKED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'DONE'
  | 'ARCHIVED';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type IssueStoryPoints =
  | 'SP_1'
  | 'SP_2'
  | 'SP_3'
  | 'SP_5'
  | 'SP_8'
  | 'SP_13'
  | 'SPIKE'
  | 'BUG_NO_POINTS';

export type IssueType = 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION';

export interface AcceptanceCriterion {
  id: string;
  text: string;
  completed: boolean;
}

export interface IssueUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
}

export interface IssueSubtask {
  id: string;
  issueId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  content: string;
  isInternal: boolean;
  authorId: string;
  author: IssueUser;
  createdAt: string;
  updatedAt: string;
}

export interface IssueRelation {
  id: string;
  number: number;
  title: string;
  status: IssueStatus;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  storyPoints: IssueStoryPoints | null;
  description: string | null;
  userStoryAs: string | null;
  userStoryWant: string | null;
  userStorySoThat: string | null;
  needToKnow: string | null;
  workNotes: string | null;
  acceptanceCriteria: AcceptanceCriterion[] | null;
  tags: string[];
  dueDate: string | null;
  kanbanOrder: number;
  createdById: string;
  assigneeId: string | null;
  reporter: IssueUser;
  assignee: IssueUser | null;
  subtasks?: IssueSubtask[];
  comments?: IssueComment[];
  blockedBy?: IssueRelation[];
  blocking?: IssueRelation[];
  _count?: { comments: number };
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type KanbanColumnStatus = Exclude<IssueStatus, 'ARCHIVED'>;

export interface KanbanBoard {
  NOT_STARTED: Issue[];
  BLOCKED: Issue[];
  IN_PROGRESS: Issue[];
  UNDER_REVIEW: Issue[];
  DONE: Issue[];
}

export interface IssueListResponse {
  issues: Issue[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateIssuePayload {
  title: string;
  status?: IssueStatus;
  type?: IssueType;
  priority?: IssuePriority;
  storyPoints?: IssueStoryPoints | null;
  description?: string | null;
  userStoryAs?: string | null;
  userStoryWant?: string | null;
  userStorySoThat?: string | null;
  needToKnow?: string | null;
  workNotes?: string | null;
  acceptanceCriteria?: AcceptanceCriterion[] | null;
  tags?: string[];
  dueDate?: string | null;
  assigneeId?: string | null;
  templateId?: string | null;
  blockedByIds?: string[];
}

export interface UpdateIssuePayload extends Partial<CreateIssuePayload> {}

export interface IssueStats {
  statusCounts: Array<{ status: IssueStatus; _count: number }>;
  priorityCounts: Array<{ priority: IssuePriority; _count: number }>;
  total: number;
}

// ── Display helpers ──────────────────────────────────────────────────────────

export const KANBAN_COLUMNS: KanbanColumnStatus[] = [
  'NOT_STARTED',
  'BLOCKED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'DONE',
];

export const STATUS_LABELS: Record<IssueStatus, string> = {
  NOT_STARTED: 'Not Started',
  BLOCKED: 'Blocked',
  IN_PROGRESS: 'In Progress',
  UNDER_REVIEW: 'Under Review',
  DONE: 'Done',
  ARCHIVED: 'Archived',
};

export const STATUS_COLORS: Record<IssueStatus, string> = {
  NOT_STARTED:  'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-700/40 dark:text-zinc-300',
  BLOCKED:      'bg-red-500/10 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  IN_PROGRESS:  'bg-blue-500/10 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  UNDER_REVIEW: 'bg-amber-500/10 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  DONE:         'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  ARCHIVED:     'bg-zinc-500/8 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-500',
};

export const STATUS_DOT_COLORS: Record<IssueStatus, string> = {
  NOT_STARTED: 'bg-muted-foreground/50',
  BLOCKED: 'bg-red-500',
  IN_PROGRESS: 'bg-blue-500',
  UNDER_REVIEW: 'bg-amber-500',
  DONE: 'bg-emerald-500',
  ARCHIVED: 'bg-muted-foreground/30',
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  LOW:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  HIGH:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  URGENT: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200',
};

export const PRIORITY_CARD_BG: Record<IssuePriority, string> = {
  LOW:    'bg-issues-lt-low border-issues-lt-low-bd dark:bg-issues-dk-low dark:border-issues-dk-low-bd',
  MEDIUM: 'bg-issues-lt-med border-issues-lt-med-bd dark:bg-issues-dk-med dark:border-issues-dk-med-bd',
  HIGH:   'bg-issues-lt-hi border-issues-lt-hi-bd dark:bg-issues-dk-hi dark:border-issues-dk-hi-bd',
  URGENT: 'bg-issues-lt-urg border-issues-lt-urg-bd dark:bg-issues-dk-urg dark:border-issues-dk-urg-bd',
};

export const COLUMN_TINT: Record<KanbanColumnStatus, string> = {
  NOT_STARTED:  'bg-issues-lt-col-ns dark:bg-issues-dk-col-ns',
  BLOCKED:      'bg-issues-lt-col-bl dark:bg-issues-dk-col-bl',
  IN_PROGRESS:  'bg-issues-lt-col-ip dark:bg-issues-dk-col-ip',
  UNDER_REVIEW: 'bg-issues-lt-col-ur dark:bg-issues-dk-col-ur',
  DONE:         'bg-issues-lt-col-dn dark:bg-issues-dk-col-dn',
};

export const COLUMN_RING: Record<KanbanColumnStatus, string> = {
  NOT_STARTED:  'border-issues-lt-col-ns-bd dark:border-issues-dk-col-ns-bd',
  BLOCKED:      'border-issues-lt-col-bl-bd dark:border-issues-dk-col-bl-bd',
  IN_PROGRESS:  'border-issues-lt-col-ip-bd dark:border-issues-dk-col-ip-bd',
  UNDER_REVIEW: 'border-issues-lt-col-ur-bd dark:border-issues-dk-col-ur-bd',
  DONE:         'border-issues-lt-col-dn-bd dark:border-issues-dk-col-dn-bd',
};

export const COLUMN_HOVER_TINT: Record<KanbanColumnStatus, string> = {
  NOT_STARTED:  'bg-issues-lt-hv-ns dark:bg-issues-dk-hv-ns',
  BLOCKED:      'bg-issues-lt-hv-bl dark:bg-issues-dk-hv-bl',
  IN_PROGRESS:  'bg-issues-lt-hv-ip dark:bg-issues-dk-hv-ip',
  UNDER_REVIEW: 'bg-issues-lt-hv-ur dark:bg-issues-dk-hv-ur',
  DONE:         'bg-issues-lt-hv-dn dark:bg-issues-dk-hv-dn',
};

export const STORY_POINT_LABELS: Record<IssueStoryPoints, string> = {
  SP_1: '1',
  SP_2: '2',
  SP_3: '3',
  SP_5: '5',
  SP_8: '8',
  SP_13: '13',
  SPIKE: 'Spike',
  BUG_NO_POINTS: 'Bug',
};

export const TYPE_LABELS: Record<IssueType, string> = {
  TASK: 'Task',
  BUG: 'Bug',
  FEATURE: 'Feature',
  IMPROVEMENT: 'Improvement',
  QUESTION: 'Question',
};
