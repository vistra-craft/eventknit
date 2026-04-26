import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { IssueType, IssuePriority, IssueStoryPoints, AcceptanceCriterion } from '@/types/issues';
import { TYPE_LABELS, PRIORITY_LABELS, STORY_POINT_LABELS } from '@/types/issues';
import { useCreateIssue, useAssignableUsers } from '@/hooks/queries/useIssues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Template {
  id: string;
  label: string;
  emoji: string;
  type: IssueType;
  priority: IssuePriority;
  userStoryAs: string;
  userStoryWant: string;
  userStorySoThat: string;
  criteria: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'bug',
    label: 'Bug Report',
    emoji: '🐛',
    type: 'BUG',
    priority: 'HIGH',
    userStoryAs: 'a user',
    userStoryWant: '',
    userStorySoThat: '',
    criteria: [
      'The bug should not appear after the fix',
      'No regressions introduced',
      'Fix verified in staging',
    ],
  },
  {
    id: 'feature',
    label: 'Feature',
    emoji: '✨',
    type: 'FEATURE',
    priority: 'MEDIUM',
    userStoryAs: 'a user',
    userStoryWant: '',
    userStorySoThat: '',
    criteria: ['To-do', 'To-do', 'To-do'],
  },
  {
    id: 'improvement',
    label: 'Improvement',
    emoji: '⬆️',
    type: 'IMPROVEMENT',
    priority: 'MEDIUM',
    userStoryAs: '',
    userStoryWant: '',
    userStorySoThat: '',
    criteria: ['To-do'],
  },
  {
    id: 'blank',
    label: 'Blank',
    emoji: '📋',
    type: 'TASK',
    priority: 'MEDIUM',
    userStoryAs: '',
    userStoryWant: '',
    userStorySoThat: '',
    criteria: [],
  },
];

interface CreateIssueModalProps {
  defaultStatus?: string;
  onClose: () => void;
}

export function CreateIssueModal({ onClose }: CreateIssueModalProps) {
  const [step, setStep] = useState<'template' | 'form'>('template');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<IssueType>('BUG');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [storyPoints, setStoryPoints] = useState<IssueStoryPoints | ''>('');
  const [description, setDescription] = useState('');
  const [userStoryAs, setUserStoryAs] = useState('');
  const [userStoryWant, setUserStoryWant] = useState('');
  const [userStorySoThat, setUserStorySoThat] = useState('');
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>([]);
  const [newCriterion, setNewCriterion] = useState('');
  const [tags, setTags] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');

  const { data: assignableUsers = [] } = useAssignableUsers();
  const createMutation = useCreateIssue();

  function applyTemplate(t: Template) {
    setType(t.type);
    setPriority(t.priority);
    setUserStoryAs(t.userStoryAs);
    setUserStoryWant(t.userStoryWant);
    setUserStorySoThat(t.userStorySoThat);
    setCriteria(t.criteria.map((text) => ({ id: nanoid(), text, completed: false })));
    setStep('form');
  }

  function addCriterion() {
    if (!newCriterion.trim()) return;
    setCriteria((prev) => [...prev, { id: nanoid(), text: newCriterion.trim(), completed: false }]);
    setNewCriterion('');
  }

  function removeCriterion(id: string) {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSubmit() {
    if (!title.trim()) return;
    createMutation.mutate(
      {
        title: title.trim(),
        type,
        priority,
        storyPoints: storyPoints || null,
        description: description.trim() || null,
        userStoryAs: userStoryAs.trim() || null,
        userStoryWant: userStoryWant.trim() || null,
        userStorySoThat: userStorySoThat.trim() || null,
        acceptanceCriteria: criteria.length ? criteria : null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        assigneeId: assigneeId || null,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {step === 'template' ? 'Choose a template' : 'New Issue'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'template' ? (
          <div className="grid grid-cols-2 gap-3 p-6">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm"
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-sm font-medium text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the issue?"
                autoFocus
              />
            </div>

            {/* Type + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IssueType)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {(Object.keys(TYPE_LABELS) as IssueType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Story points + Assignee row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Story Points</label>
                <select
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value as IssueStoryPoints | '')}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">None</option>
                  {(Object.keys(STORY_POINT_LABELS) as IssueStoryPoints[]).map((sp) => (
                    <option key={sp} value={sp}>{STORY_POINT_LABELS[sp]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* User story */}
            <div className="rounded-lg border border-border/40 p-3 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">User Story</h3>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">As a</span>
                <Input value={userStoryAs} onChange={(e) => setUserStoryAs(e.target.value)} placeholder="a user" className="h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">I want</span>
                <Input value={userStoryWant} onChange={(e) => setUserStoryWant(e.target.value)} placeholder="to..." className="h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">So that</span>
                <Input value={userStorySoThat} onChange={(e) => setUserStorySoThat(e.target.value)} placeholder="I can..." className="h-8 text-sm" />
              </div>
            </div>

            {/* Acceptance criteria */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Acceptance Criteria</h3>
              {criteria.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span className="flex-1 text-sm">{c.text}</span>
                  <button onClick={() => removeCriterion(c.id)} className="text-muted-foreground/30 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder="Add criterion..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
                />
                <Button size="sm" variant="outline" onClick={addCriterion} className="h-8 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional context..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Tags <span className="font-normal">(comma separated)</span>
              </label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="payments, mobile, auth" className="text-sm" />
            </div>
          </div>
        )}

        {/* Footer */}
        {step === 'form' && (
          <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('template')}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || createMutation.isPending}
              size="sm"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
