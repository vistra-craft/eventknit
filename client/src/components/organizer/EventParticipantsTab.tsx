import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Users, Plus, Copy, Check, Trash2, ChevronDown,
  ChevronRight, ExternalLink, RefreshCw, Loader2,
  CheckCircle, XCircle, Clock, AlertCircle, Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import {
  listForms, createForm, updateForm, deleteForm,
  listResponses, reviewResponse,
  type EventForm, type FormResponse, type FormPurpose,
} from '@/lib/form-api';
import { listParticipants, type Participant, type ParticipantType } from '@/lib/participant-api';
import { listBuiltInTemplates, FORM_PURPOSE_LABELS } from '@/lib/form-template-api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTICIPANT_PURPOSES: { purpose: FormPurpose; icon: string }[] = [
  { purpose: 'SPEAKER_APPLICATION',   icon: '🎤' },
  { purpose: 'SPONSOR_APPLICATION',   icon: '💼' },
  { purpose: 'EXHIBITOR_APPLICATION', icon: '🏢' },
  { purpose: 'PERFORMER_APPLICATION', icon: '🎭' },
  { purpose: 'VOLUNTEER_APPLICATION', icon: '🙋' },
  { purpose: 'VENDOR_APPLICATION',    icon: '🛒' },
  { purpose: 'JUDGE_APPLICATION',     icon: '⚖️' },
  { purpose: 'MEDIA_APPLICATION',     icon: '📸' },
];

const PURPOSE_TO_PARTICIPANT: Partial<Record<FormPurpose, ParticipantType>> = {
  SPEAKER_APPLICATION:   'SPEAKER',
  EXHIBITOR_APPLICATION: 'EXHIBITOR',
  SPONSOR_APPLICATION:   'SPONSOR',
  VOLUNTEER_APPLICATION: 'VOLUNTEER',
  PERFORMER_APPLICATION: 'PERFORMER',
  VENDOR_APPLICATION:    'VENDOR',
  JUDGE_APPLICATION:     'JUDGE',
  MEDIA_APPLICATION:     'MEDIA',
};

const PARTICIPANT_TYPES: { type: ParticipantType; label: string }[] = [
  { type: 'SPEAKER',   label: 'Speakers' },
  { type: 'SPONSOR',   label: 'Sponsors' },
  { type: 'EXHIBITOR', label: 'Exhibitors' },
  { type: 'PERFORMER', label: 'Performers' },
  { type: 'VOLUNTEER', label: 'Volunteers' },
  { type: 'VENDOR',    label: 'Vendors' },
  { type: 'JUDGE',     label: 'Judges' },
  { type: 'MEDIA',     label: 'Media' },
  { type: 'VIP',       label: 'VIPs' },
];

function getPublicFormUrl(shareToken: string) {
  return `${window.location.origin}/f/${shareToken}`;
}

function statusColor(status: string) {
  switch (status) {
    case 'ACTIVE':    return 'bg-success/10 text-success border-success/20';
    case 'DRAFT':     return 'bg-muted text-muted-foreground border-border';
    case 'ARCHIVED':  return 'bg-muted/50 text-muted-foreground border-border';
    case 'APPROVED':
    case 'CONFIRMED': return 'bg-success/10 text-success border-success/20';
    case 'SUBMITTED': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'UNDER_REVIEW': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'REJECTED':  return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'WAITLISTED':return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    default:          return 'bg-muted text-muted-foreground border-border';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  );
}

interface ResponseRowProps {
  response: FormResponse;
  formId: string;
  onReviewed: () => void;
}

function ResponseRow({ response, formId, onReviewed }: ResponseRowProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const review = async (status: 'APPROVED' | 'REJECTED' | 'WAITLISTED') => {
    setLoading(true);
    try {
      await reviewResponse(formId, response.id, {
        status,
        createParticipant: status === 'APPROVED',
      });
      toast({ title: status === 'APPROVED' ? 'Approved — participant created' : `Marked as ${status.toLowerCase()}` });
      onReviewed();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isPending = response.status === 'SUBMITTED' || response.status === 'UNDER_REVIEW';

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{response.respondentName || response.respondentEmail}</p>
        <p className="text-xs text-muted-foreground truncate">{response.respondentEmail}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(response.submittedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <Badge variant="outline" className={`text-xs ${statusColor(response.status)}`}>
          {response.status.replace('_', ' ')}
        </Badge>
        {isPending && (
          <div className="flex gap-1">
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-success hover:bg-success/10"
              disabled={loading}
              onClick={() => void review('APPROVED')}
              title="Approve"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              disabled={loading}
              onClick={() => void review('WAITLISTED')}
              title="Waitlist"
            >
              <Clock className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
              disabled={loading}
              onClick={() => void review('REJECTED')}
              title="Reject"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FormCardProps {
  form: EventForm;
  onDeleted: () => void;
  onStatusChanged: () => void;
}

function FormCard({ form, onDeleted, onStatusChanged }: FormCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadResponses = useCallback(async () => {
    setLoadingResponses(true);
    try {
      const res = await listResponses(form.id, { limit: 50 });
      setResponses(res.responses);
    } catch {
      // ignore
    } finally {
      setLoadingResponses(false);
    }
  }, [form.id]);

  useEffect(() => {
    if (expanded) void loadResponses();
  }, [expanded, loadResponses]);

  const toggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const newStatus = form.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      await updateForm(form.id, { status: newStatus });
      toast({ title: newStatus === 'ACTIVE' ? 'Form is now live' : 'Form set to draft' });
      onStatusChanged();
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${form.title}"? This also removes all responses.`)) return;
    setDeleting(true);
    try {
      await deleteForm(form.id);
      toast({ title: 'Form deleted' });
      onDeleted();
    } catch {
      toast({ title: 'Failed to delete form', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const shareUrl = getPublicFormUrl(form.shareToken);
  const responseCount = form._count.responses;
  const purposeLabel = FORM_PURPOSE_LABELS[form.purpose] ?? form.purpose;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm truncate">{form.title}</h4>
              <Badge variant="outline" className={`text-xs shrink-0 ${statusColor(form.status)}`}>
                {form.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{purposeLabel}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs px-2"
              onClick={toggleStatus}
              disabled={togglingStatus}
            >
              {togglingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : (form.status === 'ACTIVE' ? 'Pause' : 'Activate')}
            </Button>
            <Button
              variant="ghost" size="sm"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Share link row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-muted rounded px-2 py-1.5 flex items-center gap-1.5">
            <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{shareUrl}</span>
          </div>
          <CopyLinkButton url={shareUrl} />
          {form.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" asChild>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" title="Preview form">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}
        </div>

        {/* Responses toggle */}
        <button
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>{responseCount} response{responseCount !== 1 ? 's' : ''}</span>
          {responseCount > 0 && !expanded && (
            <span className="text-primary">· View &amp; review</span>
          )}
        </button>

        {/* Expanded responses */}
        {expanded && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden">
            {loadingResponses ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : responses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No responses yet</p>
            ) : (
              responses.map(r => (
                <ResponseRow
                  key={r.id}
                  response={r}
                  formId={form.id}
                  onReviewed={() => void loadResponses()}
                />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Create Form Dialog ───────────────────────────────────────────────────────

interface CreateFormDialogProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateFormDialog({ eventId, open, onClose, onCreated }: CreateFormDialogProps) {
  const { toast } = useToast();
  const [purpose, setPurpose] = useState<FormPurpose>('SPEAKER_APPLICATION');
  const [title, setTitle] = useState('Speaker Application');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setTitle(FORM_PURPOSE_LABELS[purpose] ?? purpose);
  }, [purpose]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      // Fetch built-in template questions for the chosen purpose
      const tplRes = await listBuiltInTemplates(purpose);
      const questions = tplRes.templates[0]?.questions ?? [];

      await createForm({
        title: title.trim(),
        eventId,
        purpose,
        targetParticipantType: PURPOSE_TO_PARTICIPANT[purpose],
        questions,
        isPublic: true,
      });

      toast({ title: 'Form created and ready to share' });
      onCreated();
      onClose();
    } catch {
      toast({ title: 'Failed to create form', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Application Form</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Form type</Label>
            <Select value={purpose} onValueChange={v => setPurpose(v as FormPurpose)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPANT_PURPOSES.map(({ purpose: p, icon }) => (
                  <SelectItem key={p} value={p}>
                    {icon} {FORM_PURPOSE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pre-filled with standard questions. Approved applicants are automatically added as participants.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-title">Form title</Label>
            <Input
              id="form-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Speaker Application"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>Cancel</Button>
          <Button onClick={() => void handleCreate()} disabled={creating || !title.trim()}>
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create &amp; Get Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── People list ──────────────────────────────────────────────────────────────

interface PeopleListProps { eventId: string }

function PeopleList({ eventId }: PeopleListProps) {
  const [typeFilter, setTypeFilter] = useState<ParticipantType | 'ALL'>('ALL');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listParticipants(eventId, {
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        limit: 100,
      });
      setParticipants(res.participants);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [eventId, typeFilter]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Type filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            typeFilter === 'ALL'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          All ({total})
        </button>
        {PARTICIPANT_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === type
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No participants yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Approve form responses in the Forms tab to add participants automatically.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {participants.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    {p.company && <p className="text-xs text-muted-foreground truncate">{p.company}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge variant="outline" className="text-xs capitalize">
                    {p.type.toLowerCase()}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${statusColor(p.status)}`}>
                    {p.status.toLowerCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EventParticipantsTabProps { eventId: string }

export function EventParticipantsTab({ eventId }: EventParticipantsTabProps) {
  const [subTab, setSubTab] = useState<'forms' | 'people'>('forms');
  const [forms, setForms] = useState<EventForm[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadForms = useCallback(async () => {
    setLoadingForms(true);
    try {
      const res = await listForms({ eventId, limit: 50 });
      setForms(res.forms);
    } catch {
      // ignore
    } finally {
      setLoadingForms(false);
    }
  }, [eventId]);

  useEffect(() => { void loadForms(); }, [loadForms]);

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setSubTab('forms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === 'forms'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Forms
            {forms.length > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-none">
                {forms.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('people')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === 'people'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            People
          </button>
        </div>

        <div className="flex gap-2">
          {subTab === 'forms' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => void loadForms()} className="h-8 w-8 p-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Form
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Forms sub-tab */}
      {subTab === 'forms' && (
        <div className="space-y-3">
          {loadingForms ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No application forms yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Create a form to collect speaker, sponsor, or exhibitor applications.
              </p>
              <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create your first form
              </Button>
            </div>
          ) : (
            forms.map(form => (
              <FormCard
                key={form.id}
                form={form}
                onDeleted={() => void loadForms()}
                onStatusChanged={() => void loadForms()}
              />
            ))
          )}

          {/* Info callout */}
          {forms.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Approving a response automatically adds that person to the <strong>People</strong> tab
                under the appropriate participant type.
              </span>
            </div>
          )}
        </div>
      )}

      {/* People sub-tab */}
      {subTab === 'people' && <PeopleList eventId={eventId} />}

      {/* Create form dialog */}
      <CreateFormDialog
        eventId={eventId}
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={() => void loadForms()}
      />
    </div>
  );
}
