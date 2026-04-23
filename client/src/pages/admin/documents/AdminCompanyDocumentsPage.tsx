import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Link2, Upload, Search, Trash2, ExternalLink,
  FileSpreadsheet, Presentation, File, Download,
  Scale, DollarSign, Settings, ShieldCheck, Megaphone,
  Users, FileSignature, BookOpen, NotebookPen, MoreHorizontal,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<CompanyDocCategory, {
  icon: React.ElementType;
  color: string;       // sidebar active bg
  badge: string;       // badge classes
}> = {
  LEGAL:         { icon: Scale,         color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',  badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300' },
  FINANCIAL:     { icon: DollarSign,    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' },
  OPERATIONS:    { icon: Settings,      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',  badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300' },
  COMPLIANCE:    { icon: ShieldCheck,   color: 'bg-red-500/10 text-red-600 dark:text-red-400',           badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300' },
  MARKETING:     { icon: Megaphone,     color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',        badge: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300' },
  HR:            { icon: Users,         color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',        badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' },
  CONTRACTS:     { icon: FileSignature, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',     badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300' },
  POLICIES:      { icon: BookOpen,      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',  badge: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300' },
  MEETING_NOTES: { icon: NotebookPen,   color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',        badge: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300' },
  OTHER:         { icon: MoreHorizontal, color: 'bg-muted text-muted-foreground',                        badge: 'bg-muted text-muted-foreground border-border' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DocTypeIcon({ type, className = 'h-4 w-4' }: { type: CompanyDocType; className?: string }) {
  switch (type) {
    case 'GOOGLE_DOC':    return <FileText className={className} />;
    case 'GOOGLE_SHEET':  return <FileSpreadsheet className={className} />;
    case 'GOOGLE_SLIDES': return <Presentation className={className} />;
    case 'EXTERNAL_LINK': return <Link2 className={className} />;
    default:              return <File className={className} />;
  }
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  defaultCategory?: CompanyDocCategory;
  onClose: () => void;
  onSuccess: (doc: CompanyDocument) => void;
}

function UploadModal({ open, defaultCategory, onClose, onSuccess }: UploadModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CompanyDocCategory | ''>(defaultCategory ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | undefined>(undefined);

  useEffect(() => {
    if (open) setCategory(defaultCategory ?? '');
  }, [open, defaultCategory]);

  function reset() { setName(''); setDescription(''); setCategory(''); setFile(null); setDragOver(false); }
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
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Upload failed', variant: 'destructive' });
    } finally { setSaving(false); }
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
                {CATEGORIES.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="upload-description">Description</Label>
            <Textarea id="upload-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={2} />
          </div>
          <div
            className={cn(
              'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            )}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0] ?? null); }}
          >
            <input ref={(el) => { fileRef.current = el ?? undefined; }} type="file" className="hidden" accept={ALLOWED_EXTENSIONS} onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
            {file ? (
              <div className="space-y-1">
                <File className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Click or drag a file here</p>
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
  defaultCategory?: CompanyDocCategory;
  onClose: () => void;
  onSuccess: (doc: CompanyDocument) => void;
}

function LinkModal({ open, defaultCategory, onClose, onSuccess }: LinkModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CompanyDocCategory | ''>(defaultCategory ?? '');
  const [type, setType] = useState<Exclude<CompanyDocType, 'FILE'> | ''>('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setCategory(defaultCategory ?? '');
  }, [open, defaultCategory]);

  function reset() { setName(''); setDescription(''); setCategory(''); setType(''); setUrl(''); }
  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!name.trim()) return toast({ title: 'Name is required', variant: 'destructive' });
    if (!category) return toast({ title: 'Category is required', variant: 'destructive' });
    if (!type) return toast({ title: 'Document type is required', variant: 'destructive' });
    if (!url.trim()) return toast({ title: 'URL is required', variant: 'destructive' });
    try {
      setSaving(true);
      const result = await createDocumentLink({ name: name.trim(), description: description.trim() || undefined, category, type, externalUrl: url.trim() });
      toast({ title: 'Link saved' });
      onSuccess(result.document);
      handleClose();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save link', variant: 'destructive' });
    } finally { setSaving(false); }
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
            <Label>Document type <span className="text-destructive">*</span></Label>
            <Select value={type} onValueChange={(v) => setType(v as Exclude<CompanyDocType, 'FILE'>)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Document name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 Budget 2025" />
          </div>
          <div className="space-y-1.5">
            <Label>Category <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CompanyDocCategory)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>URL <span className="text-destructive">*</span></Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/..." type="url" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={2} />
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

// ─── Category Sidebar ─────────────────────────────────────────────────────────

interface CategorySidebarProps {
  active: CompanyDocCategory | 'ALL';
  counts: Partial<Record<CompanyDocCategory, number>>;
  total: number;
  onSelect: (cat: CompanyDocCategory | 'ALL') => void;
}

function CategorySidebar({ active, counts, total, onSelect }: CategorySidebarProps) {
  return (
    <nav className="w-52 shrink-0 space-y-0.5">
      <button
        onClick={() => onSelect('ALL')}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
          active === 'ALL'
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <span>All Documents</span>
        <span className="text-xs tabular-nums">{total}</span>
      </button>

      <div className="pt-2 pb-1 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Categories</p>
      </div>

      {CATEGORIES.map(([cat, label]) => {
        const cfg = CATEGORY_CONFIG[cat];
        const Icon = cfg.icon;
        const count = counts[cat] ?? 0;
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? `${cfg.color} font-medium`
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left truncate">{label}</span>
            {count > 0 && (
              <span className="text-xs tabular-nums opacity-70">{count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Document Row ─────────────────────────────────────────────────────────────

interface DocRowProps {
  doc: CompanyDocument;
  showCategory: boolean;
  onDelete: (doc: CompanyDocument) => void;
}

function DocRow({ doc, showCategory, onDelete }: DocRowProps) {
  const href = doc.fileUrl ?? doc.externalUrl ?? '#';
  const isLink = doc.type !== 'FILE';
  const cfg = CATEGORY_CONFIG[doc.category];

  return (
    <tr className="group border-b border-border/40 hover:bg-muted/40 transition-colors">
      {/* Name + icon */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
            <DocTypeIcon type={doc.type} className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate max-w-[260px]">{doc.name}</p>
            {doc.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[260px]">{doc.description}</p>
            )}
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
        {DOC_TYPE_LABELS[doc.type]}
        {doc.fileSize && <span className="ml-1.5 opacity-60">· {formatBytes(doc.fileSize)}</span>}
      </td>

      {/* Category badge — only in "All" view */}
      {showCategory && (
        <td className="py-3 px-3">
          <Badge className={cn('text-[10px] px-1.5 py-0 border', cfg.badge)}>
            {CATEGORY_LABELS[doc.category]}
          </Badge>
        </td>
      )}

      {/* Added by */}
      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
        {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
      </td>

      {/* Date */}
      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(doc.createdAt)}
      </td>

      {/* Actions */}
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center gap-1 justify-end">
          <a href={href} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-7 w-7" title={isLink ? 'Open' : 'Download'}>
              {isLink ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive/50 hover:text-destructive"
            onClick={() => onDelete(doc)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCompanyDocumentsPage() {
  const { toast } = useToast();

  const [documents, setDocuments]     = useState<CompanyDocument[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);

  const [search, setSearch]           = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CompanyDocCategory | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter]   = useState<CompanyDocType | 'all'>('all');

  const [uploadOpen, setUploadOpen]   = useState(false);
  const [linkOpen, setLinkOpen]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyDocument | null>(null);
  const [deleting, setDeleting]       = useState(false);

  // Per-category counts from server (fetched once, not re-fetched on every filter change)
  const [categoryCounts, setCategoryCounts] = useState<Partial<Record<CompanyDocCategory, number>>>({});

  const LIMIT = 20;

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCompanyDocuments({
        search: search || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        limit: LIMIT,
      });
      setDocuments(result.documents);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      toast({ title: 'Failed to load documents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, typeFilter, page, toast]);

  // Fetch per-category counts once on mount (no filters, limit=1 per category trick:
  // fetch all with no filters to compute counts from the full set)
  const fetchCounts = useCallback(async () => {
    try {
      // Fetch up to 500 docs to compute counts — adequate for an internal document library
      const result = await getCompanyDocuments({ limit: 500 });
      const counts: Partial<Record<CompanyDocCategory, number>> = {};
      for (const doc of result.documents) {
        counts[doc.category] = (counts[doc.category] ?? 0) + 1;
      }
      setCategoryCounts(counts);
    } catch {
      // Non-critical — sidebar counts just won't show
    }
  }, []);

  useEffect(() => { void fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1); }, [search, categoryFilter, typeFilter]);

  function handleDocAdded(doc: CompanyDocument) {
    setDocuments((prev) => [doc, ...prev]);
    setTotal((t) => t + 1);
    setCategoryCounts((prev) => ({
      ...prev,
      [doc.category]: (prev[doc.category] ?? 0) + 1,
    }));
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteCompanyDocument(deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      setCategoryCounts((prev) => ({
        ...prev,
        [deleteTarget.category]: Math.max(0, (prev[deleteTarget.category] ?? 1) - 1),
      }));
      toast({ title: 'Document deleted' });
    } catch (err: unknown) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const activeCategory = categoryFilter !== 'ALL' ? categoryFilter : undefined;
  const showCategoryColumn = categoryFilter === 'ALL';

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Company Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Central library for internal documents and links</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)} className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Add Link
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Body: sidebar + table */}
      <div className="flex gap-6 items-start">

        {/* Sidebar */}
        <CategorySidebar
          active={categoryFilter}
          counts={categoryCounts}
          total={total}
          onSelect={(cat) => { setCategoryFilter(cat); setSearch(''); }}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CompanyDocType | 'all')}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="FILE">Uploaded File</SelectItem>
                {LINK_TYPES.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            {activeCategory && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload to {CATEGORY_LABELS[activeCategory]}
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader size="sm" className="h-4 w-4" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <File className="h-8 w-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">
                  {search ? `No documents matching "${search}"` : 'No documents in this category yet.'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)} className="gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />Add Link
                  </Button>
                  <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" />Upload File
                  </Button>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="py-2.5 pl-4 pr-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                    {showCategoryColumn && (
                      <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Category</th>
                    )}
                    <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Added by</th>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold text-muted-foreground">
                      <span className="text-xs text-muted-foreground/60 font-normal">{total} doc{total !== 1 ? 's' : ''}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      showCategory={showCategoryColumn}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground self-center">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        defaultCategory={activeCategory}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleDocAdded}
      />
      <LinkModal
        open={linkOpen}
        defaultCategory={activeCategory}
        onClose={() => setLinkOpen(false)}
        onSuccess={handleDocAdded}
      />

      {/* Delete confirm */}
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
}
