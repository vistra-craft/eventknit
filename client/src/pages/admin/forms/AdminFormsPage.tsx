import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ClipboardList, Eye, Trash2, ExternalLink, Copy } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { TemplateGallery } from '@/components/forms/TemplateGallery';
import {
  listForms,
  deleteForm,
  type EventForm,
  type FormStatus,
  type FormPurpose,
  type FormQuestion,
} from '@/lib/form-api';
import { FORM_PURPOSE_LABELS, type FormTemplate } from '@/lib/form-template-api';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<FormStatus, string> = {
  DRAFT:    'bg-muted text-muted-foreground',
  ACTIVE:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  ARCHIVED: 'bg-destructive/15 text-destructive',
};

function getPublicFormUrl(shareToken: string) {
  return `${window.location.origin}/f/${shareToken}`;
}

export default function AdminFormsPage() {
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const [forms, setForms]     = useState<EventForm[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter]   = useState<FormStatus | 'ALL'>('ALL');
  const [purposeFilter, setPurposeFilter] = useState<FormPurpose | 'ALL'>('ALL');
  const [deleteTarget, setDeleteTarget]   = useState<EventForm | null>(null);
  const [deleting, setDeleting]           = useState(false);

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

  // Navigate to the full-page form creator, passing template data via router state
  const handleTemplateSelect = (template: FormTemplate | null) => {
    navigate('/admin/forms/new', { state: { template } });
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

  const filtered    = forms.filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages  = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-8 p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Forms</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Build forms for registration, feedback, speaker applications, and more.
        </p>
      </div>

      {/* Template gallery */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Start from a template</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick a template to get started quickly, or choose Blank to build from scratch.
          </p>
        </div>
        <TemplateGallery inline onSelect={handleTemplateSelect} />
      </section>

      <Separator />

      {/* My Forms */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold">
            My Forms
            {total > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {total} form{total !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-8 w-44 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as FormStatus | 'ALL'); setPage(1); }}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {(['DRAFT', 'ACTIVE', 'ARCHIVED'] as FormStatus[]).map(s => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={purposeFilter} onValueChange={v => { setPurposeFilter(v as FormPurpose | 'ALL'); setPage(1); }}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All purposes</SelectItem>
                {(Object.keys(FORM_PURPOSE_LABELS) as FormPurpose[]).map(p => (
                  <SelectItem key={p} value={p} className="text-xs">{FORM_PURPOSE_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm">No forms yet. Pick a template above to create your first one.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filtered.map(form => (
              <div
                key={form.id}
                className="bg-card border border-border/40 rounded-lg px-4 py-3 flex items-center gap-4 hover:border-border transition-colors"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  form.status === 'ACTIVE'   ? 'bg-emerald-500' :
                  form.status === 'ARCHIVED' ? 'bg-destructive/60' : 'bg-muted-foreground/40',
                )} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/admin/forms/${form.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors truncate"
                    >
                      {form.title}
                    </Link>
                    <Badge className={`${STATUS_COLORS[form.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                      {form.status}
                    </Badge>
                    {form.isPublic && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Public</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {FORM_PURPOSE_LABELS[form.purpose]}
                    {form.customPurpose ? ` — ${form.customPurpose}` : ''}
                    {' · '}
                    {form._count.responses} response{form._count.responses !== 1 ? 's' : ''}
                    {' · '}
                    {(form.questions as FormQuestion[]).length} question{(form.questions as FormQuestion[]).length !== 1 ? 's' : ''}
                    {form.event ? ` · ${form.event.title}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {form.isPublic && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyShareLink(form)} title="Copy share link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <a href={getPublicFormUrl(form.shareToken)} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Open form">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </>
                  )}
                  <Link to={`/admin/forms/${form.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View / edit">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/60 hover:text-destructive"
                    onClick={() => setDeleteTarget(form)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground self-center">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.title}</strong>? This removes all{' '}
              {deleteTarget?._count.responses} response{deleteTarget?._count.responses !== 1 ? 's' : ''} too.
              This cannot be undone.
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
