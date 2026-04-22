import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Link2, Upload, Search, Trash2, ExternalLink,
  Plus, FolderOpen, FileSpreadsheet, Presentation, File,
  ChevronLeft, ChevronRight, AlertCircle, Download,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/useToast';
import {
  type CompanyDocument,
  type CompanyDocCategory,
  type CompanyDocType,
  CATEGORY_LABELS,
  DOC_TYPE_LABELS,
  getCompanyDocuments,
  createDocumentLink,
  uploadDocumentFile,
  deleteCompanyDocument,
} from '@/lib/company-documents-api';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [CompanyDocCategory, string][];

const LINK_TYPES: [Exclude<CompanyDocType, 'FILE'>, string][] = [
  ['GOOGLE_DOC', 'Google Doc'],
  ['GOOGLE_SHEET', 'Google Sheet'],
  ['GOOGLE_SLIDES', 'Google Slides'],
  ['EXTERNAL_LINK', 'External Link'],
];

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp';
const MAX_FILE_MB = 25;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocTypeIcon({ type, className = 'h-5 w-5' }: { type: CompanyDocType; className?: string }) {
  switch (type) {
    case 'GOOGLE_DOC': return <FileText className={className} />;
    case 'GOOGLE_SHEET': return <FileSpreadsheet className={className} />;
    case 'GOOGLE_SLIDES': return <Presentation className={className} />;
    case 'EXTERNAL_LINK': return <Link2 className={className} />;
    default: return <File className={className} />;
  }
}

function categoryBadgeClass(cat: CompanyDocCategory): string {
  const map: Record<CompanyDocCategory, string> = {
    LEGAL: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
    FINANCIAL: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
    HR: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    OPERATIONS: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
    MARKETING: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
    COMPLIANCE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
    CONTRACTS: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
    POLICIES: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
    OTHER: 'bg-muted text-muted-foreground border-border',
  };
  return map[cat] ?? map.OTHER;
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (doc: CompanyDocument) => void;
}

function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CompanyDocCategory | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName(''); setDescription(''); setCategory(''); setFile(null); setDragOver(false);
  }

  function handleClose() { reset(); onClose(); }

  function handleFileChange(f: File | null) {
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Maximum size is ${MAX_FILE_MB} MB`, variant: 'destructive' });
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
  }

  async function handleSubmit() {
    if (!name.trim()) return toast({ title: 'Name is required', variant: 'destructive' });
    if (!category) return toast({ title: 'Category is required', variant: 'destructive' });
    if (!file) return toast({ title: 'Please select a file', variant: 'destructive' });

    try {
      setSaving(true);
      const result = await uploadDocumentFile({ name: name.trim(), description: description.trim() || undefined, category, file });
      toast({ title: 'Document uploaded' });
      onSuccess(result.document);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload a file to the company document library.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="upload-name">Document name <span className="text-destructive">*</span></Label>
            <Input id="upload-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Employee Handbook 2025" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upload-category">Category <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CompanyDocCategory)}>
              <SelectTrigger id="upload-category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upload-description">Description</Label>
            <Textarea id="upload-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={2} />
          </div>

          {/* Drop zone */}
          <div
            className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0] ?? null); }}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept={ALLOWED_EXTENSIONS}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="space-y-1">
                <File className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Click or drag a file here</p>
                <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, images — up to {MAX_FILE_MB} MB</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader size="sm" className="h-4 w-4 mr-2" />Uploading...</> : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Link Modal ───────────────────────────────────────────────────────────────

interface LinkModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (doc: CompanyDocument) => void;
}

function LinkModal({ open, onClose, onSuccess }: LinkModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CompanyDocCategory | ''>('');
  const [type, setType] = useState<Exclude<CompanyDocType, 'FILE'> | ''>('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() { setName(''); setDescription(''); setCategory(''); setType(''); setUrl(''); }
  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!name.trim()) return toast({ title: 'Name is required', variant: 'destructive' });
    if (!category) return toast({ title: 'Category is required', variant: 'destructive' });
    if (!type) return toast({ title: 'Document type is required', variant: 'destructive' });
    if (!url.trim()) return toast({ title: 'URL is required', variant: 'destructive' });

    try {
      setSaving(true);
      const result = await createDocumentLink({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        type,
        externalUrl: url.trim(),
      });
      toast({ title: 'Link saved' });
      onSuccess(result.document);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save link';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Document Link</DialogTitle>
          <DialogDescription>Save a Google Doc, Sheet, Slides, or any external URL.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="link-type">Document type <span className="text-destructive">*</span></Label>
            <Select value={type} onValueChange={(v) => setType(v as Exclude<CompanyDocType, 'FILE'>)}>
              <SelectTrigger id="link-type"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-name">Document name <span className="text-destructive">*</span></Label>
            <Input id="link-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 Budget 2025" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-category">Category <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CompanyDocCategory)}>
              <SelectTrigger id="link-category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-url">URL <span className="text-destructive">*</span></Label>
            <Input id="link-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/..." type="url" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-description">Description</Label>
            <Textarea id="link-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader size="sm" className="h-4 w-4 mr-2" />Saving...</> : 'Save Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocCardProps {
  doc: CompanyDocument;
  onDelete: (doc: CompanyDocument) => void;
}

function DocCard({ doc, onDelete }: DocCardProps) {
  const href = doc.fileUrl ?? doc.externalUrl ?? '#';
  const isLink = doc.type !== 'FILE';

  return (
    <Card className="group border-border/40 bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DocTypeIcon type={doc.type} className="h-5 w-5 text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
            {doc.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={`text-xs border ${categoryBadgeClass(doc.category)}`}>
                {CATEGORY_LABELS[doc.category]}
              </Badge>
              <span className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.type]}</span>
              {doc.fileSize && (
                <span className="text-xs text-muted-foreground">{formatBytes(doc.fileSize)}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Added by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName} &middot;{' '}
              {new Date(doc.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              {isLink ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
              {isLink ? 'Open' : 'Download'}
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminCompanyDocumentsPage = () => {
  const { toast } = useToast();

  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CompanyDocCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CompanyDocType | 'all'>('all');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 12;

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCompanyDocuments({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        limit,
      });
      setDocuments(result.documents);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load documents';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, typeFilter, page]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, categoryFilter, typeFilter]);

  function handleDocAdded(doc: CompanyDocument) {
    setDocuments((prev) => [doc, ...prev]);
    setTotal((t) => t + 1);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteCompanyDocument(deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      toast({ title: 'Document deleted' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  // Stats
  const byCategory = documents.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Total Documents', value: total, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Uploaded Files', value: documents.filter((d) => d.type === 'FILE').length, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Google Docs', value: documents.filter((d) => d.type === 'GOOGLE_DOC').length, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Categories Used', value: Object.keys(byCategory).length, gradient: 'from-indigo-500 to-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Company Documents</h1>
          <p className="text-sm text-muted-foreground">Central library for all internal company documents and links</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLinkOpen(true)} className="gap-2">
            <Link2 className="h-4 w-4" />
            Add Link
          </Button>
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="sticky top-0 z-10 bg-background pb-2 pt-2">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow`}>
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <Card className="border-border/40 bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CompanyDocCategory | 'all')}>
              <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CompanyDocType | 'all')}>
              <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="FILE">Uploaded File</SelectItem>
                {LINK_TYPES.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size="lg" className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">Loading documents...</span>
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchDocuments} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="p-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-base font-medium text-foreground mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Upload a file or add a link to get started.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setLinkOpen(true)} className="gap-2">
                <Link2 className="h-4 w-4" />Add Link
              </Button>
              <Button onClick={() => setUploadOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />Upload File
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {documents.length} of {total} documents</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <DocCard key={doc.id} doc={doc} onDelete={setDeleteTarget} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleDocAdded} />
      <LinkModal open={linkOpen} onClose={() => setLinkOpen(false)} onSuccess={handleDocAdded} />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently removed.
              {deleteTarget?.type === 'FILE' && ' The file will also be deleted from storage.'}
              {' '}This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCompanyDocumentsPage;
