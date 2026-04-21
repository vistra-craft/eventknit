import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ClipboardList, Eye, Pencil, Trash2, ExternalLink, Copy } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FormBuilder } from '@/components/forms/FormBuilder';
import {
  listForms,
  createForm,
  deleteForm,
  type EventForm,
  type FormStatus,
  type FormPurpose,
  type FormQuestion,
} from '@/lib/form-api';
import { useToast } from '@/hooks/useToast';

const PURPOSE_LABELS: Record<FormPurpose, string> = {
  SPEAKER_APPLICATION: 'Speaker Application',
  SPONSOR_APPLICATION: 'Sponsor Application',
  EXHIBITOR_APPLICATION: 'Exhibitor Application',
  PERFORMER_APPLICATION: 'Performer Application',
  VOLUNTEER_APPLICATION: 'Volunteer Application',
  GENERAL_INQUIRY: 'General Inquiry',
  CUSTOM: 'Custom',
};

const STATUS_COLORS: Record<FormStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  ACTIVE: 'bg-emerald-500/15 text-emerald-600',
  CLOSED: 'bg-orange-500/15 text-orange-600',
  ARCHIVED: 'bg-destructive/15 text-destructive',
};

function getPublicFormUrl(shareToken: string) {
  return `${window.location.origin}/f/${shareToken}`;
}

export default function AdminFormsPage() {
  const { toast } = useToast();
  const [forms, setForms] = useState<EventForm[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'ALL'>('ALL');
  const [purposeFilter, setPurposeFilter] = useState<FormPurpose | 'ALL'>('ALL');

  // Create form dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPurpose, setNewPurpose] = useState<FormPurpose>('CUSTOM');
  const [newCustomPurpose, setNewCustomPurpose] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newQuestions, setNewQuestions] = useState<FormQuestion[]>([]);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<EventForm | null>(null);
  const [deleting, setDeleting] = useState(false);

  const LIMIT = 20;

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listForms({
        page,
        limit: LIMIT,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined,
      });
      setForms(result.forms as EventForm[]);
      setTotal(result.total);
    } catch {
      toast({ title: 'Failed to load forms', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, purposeFilter, toast]);

  useEffect(() => { void fetchForms(); }, [fetchForms]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createForm({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        purpose: newPurpose,
        customPurpose: newPurpose === 'CUSTOM' ? newCustomPurpose.trim() || undefined : undefined,
        isPublic: newIsPublic,
        questions: newQuestions,
      });
      toast({ title: 'Form created' });
      setShowCreate(false);
      setNewTitle('');
      setNewDescription('');
      setNewPurpose('CUSTOM');
      setNewCustomPurpose('');
      setNewIsPublic(false);
      setNewQuestions([]);
      void fetchForms();
    } catch {
      toast({ title: 'Failed to create form', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteForm(deleteTarget.id);
      toast({ title: 'Form deleted' });
      setDeleteTarget(null);
      void fetchForms();
    } catch {
      toast({ title: 'Failed to delete form', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const copyShareLink = (form: EventForm) => {
    void navigator.clipboard.writeText(getPublicFormUrl(form.shareToken));
    toast({ title: 'Link copied to clipboard' });
  };

  const filtered = forms.filter(f =>
    !search || f.title.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Forms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage forms for speakers, sponsors, and more
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as FormStatus[]).map(s => {
          const count = forms.filter(f => f.status === s).length;
          return (
            <div key={s} className="bg-card border border-border/40 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">{s.charAt(0) + s.slice(1).toLowerCase()}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search forms..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as FormStatus | 'ALL'); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as FormStatus[]).map(s => (
              <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={purposeFilter} onValueChange={v => { setPurposeFilter(v as FormPurpose | 'ALL'); setPage(1); }}>
          <SelectTrigger className="h-9 w-48 text-sm">
            <SelectValue placeholder="Purpose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All purposes</SelectItem>
            {(Object.keys(PURPOSE_LABELS) as FormPurpose[]).map(p => (
              <SelectItem key={p} value={p}>{PURPOSE_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Forms list */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No forms found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(form => (
            <div
              key={form.id}
              className="bg-card border border-border/40 rounded-lg p-4 flex items-start gap-4 hover:border-border transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/admin/forms/${form.id}`}
                    className="font-medium hover:text-primary transition-colors truncate"
                  >
                    {form.title}
                  </Link>
                  <Badge className={STATUS_COLORS[form.status]} variant="secondary">
                    {form.status}
                  </Badge>
                  {form.isPublic && (
                    <Badge variant="outline" className="text-xs">Public</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {PURPOSE_LABELS[form.purpose]}
                  {form.customPurpose ? ` — ${form.customPurpose}` : ''}
                  {form.event ? ` · ${form.event.title}` : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {form._count.responses} response{form._count.responses !== 1 ? 's' : ''}
                  {' · '}
                  {(form.questions as FormQuestion[]).length} question{(form.questions as FormQuestion[]).length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {form.isPublic && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyShareLink(form)} title="Copy share link">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
                {form.isPublic && (
                  <a href={getPublicFormUrl(form.shareToken)} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview form">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
                <Link to={`/admin/forms/${form.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="View responses">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link to={`/admin/forms/${form.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit form">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(form)}
                  title="Delete form"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Form Title *</Label>
                <Input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Speaker Application Form"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Describe what this form is for..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Purpose</Label>
                <Select value={newPurpose} onValueChange={v => setNewPurpose(v as FormPurpose)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PURPOSE_LABELS) as FormPurpose[]).map(p => (
                      <SelectItem key={p} value={p}>{PURPOSE_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newPurpose === 'CUSTOM' && (
                <div className="space-y-1.5">
                  <Label>Custom Purpose</Label>
                  <Input
                    value={newCustomPurpose}
                    onChange={e => setNewCustomPurpose(e.target.value)}
                    placeholder="Describe the purpose..."
                  />
                </div>
              )}
              <div className="flex items-center gap-2 col-span-2">
                <Switch
                  id="new-is-public"
                  checked={newIsPublic}
                  onCheckedChange={setNewIsPublic}
                />
                <Label htmlFor="new-is-public" className="cursor-pointer">
                  Make public (accessible via share link)
                </Label>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4">
              <Label className="text-sm font-semibold mb-3 block">Questions</Label>
              <FormBuilder questions={newQuestions} onChange={setNewQuestions} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating...' : 'Create Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This will also
              delete all {deleteTarget?._count.responses} response{deleteTarget?._count.responses !== 1 ? 's' : ''}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
