import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save, BookmarkPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { FormBuilder } from '@/components/forms/FormBuilder';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { useDirectUpload } from '@/hooks/useDirectUpload';
import Logo from '@/components/layout/Logo';
import {
  createForm,
  type FormPurpose,
  type FormQuestion,
} from '@/lib/form-api';
import {
  createTemplate,
  FORM_PURPOSE_LABELS,
  type FormTemplate,
} from '@/lib/form-template-api';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface LocationState {
  template?: FormTemplate | null;
}

export default function AdminFormCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const state = (location.state ?? {}) as LocationState;
  const { upload } = useDirectUpload({ folder: 'general' });

  // ── Form state ────────────────────────────────────────────────
  const [title, setTitle]         = useState(state.template?.name ?? '');
  const [description, setDescription] = useState(state.template?.description ?? '');
  const [purpose, setPurpose]     = useState<FormPurpose>(state.template?.purpose ?? 'CUSTOM');
  const [customPurpose, setCustomPurpose] = useState('');
  const [isPublic, setIsPublic]   = useState(false);
  const [questions, setQuestions] = useState<FormQuestion[]>(
    state.template?.questions ?? [],
  );

  // ── UI state ──────────────────────────────────────────────────
  const [previewVisible, setPreviewVisible] = useState(true);
  const [creating, setCreating]   = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState(title);
  const previewRef = useRef<HTMLDivElement>(null);

  // Keep template name in sync with title until user edits it
  const [templateNameEdited, setTemplateNameEdited] = useState(false);
  useEffect(() => {
    if (!templateNameEdited) setTemplateName(title);
  }, [title, templateNameEdited]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: 'Form title is required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await createForm({
        title: title.trim(),
        description: description.trim() || undefined,
        purpose,
        customPurpose: purpose === 'CUSTOM' ? customPurpose.trim() || undefined : undefined,
        isPublic,
        questions,
      });
      toast({ title: 'Form created' });
      navigate(`/admin/forms/${res.form.id}`);
    } catch {
      toast({ title: 'Failed to create form', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || questions.length === 0) return;
    setSavingTemplate(true);
    try {
      await createTemplate({ name: templateName.trim(), description: description.trim() || undefined, purpose, questions });
      toast({ title: 'Template saved', description: 'It will appear in the template gallery.' });
      setSaveTemplateOpen(false);
    } catch {
      toast({ title: 'Failed to save template', variant: 'destructive' });
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Top bar ────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate('/admin/forms')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Editable title in header */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Untitled Form"
          className={cn(
            'flex-1 bg-transparent text-sm font-semibold outline-none truncate',
            'placeholder:text-muted-foreground/50',
            'border-b border-transparent hover:border-border focus:border-primary transition-colors',
            'pb-0.5',
          )}
        />

        <div className="flex items-center gap-2 shrink-0">
          {state.template && (
            <Badge variant="secondary" className="text-xs hidden sm:flex">
              {state.template.name}
            </Badge>
          )}

          {/* Save as template */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs hidden sm:flex"
            onClick={() => { setTemplateNameEdited(false); setSaveTemplateOpen(true); }}
            disabled={questions.length === 0}
          >
            <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
            Save as Template
          </Button>

          {/* Toggle preview on smaller screens */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs lg:hidden"
            onClick={() => setPreviewVisible(v => !v)}
          >
            {previewVisible ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            {previewVisible ? 'Hide preview' : 'Preview'}
          </Button>

          <Button size="sm" className="h-8" onClick={handleCreate} disabled={creating || !title.trim()}>
            {creating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {creating ? 'Creating...' : 'Create Form'}
          </Button>
        </div>
      </header>

      {/* ── Split body ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Builder ─────────────────────────────────────── */}
        <div className={cn(
          'flex flex-col border-r border-border/50 overflow-y-auto',
          previewVisible ? 'w-full lg:w-[480px] xl:w-[520px]' : 'w-full',
          !previewVisible && 'lg:border-r-0',
        )}>
          <div className="p-5 space-y-5 flex-1">
            {/* Meta */}
            <section className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Form Details
                </Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Form title"
                  className="font-medium"
                />
              </div>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description shown at the top of the form (optional)"
                className="resize-none min-h-[72px] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Purpose</Label>
                  <Select value={purpose} onValueChange={v => setPurpose(v as FormPurpose)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FORM_PURPOSE_LABELS) as FormPurpose[]).map(p => (
                        <SelectItem key={p} value={p} className="text-xs">
                          {FORM_PURPOSE_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {purpose === 'CUSTOM' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom label</Label>
                    <Input
                      value={customPurpose}
                      onChange={e => setCustomPurpose(e.target.value)}
                      placeholder="e.g. Media Accreditation"
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5 bg-muted/40 rounded-lg px-3 py-2">
                <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                <div>
                  <Label htmlFor="is-public" className="text-xs cursor-pointer font-medium">
                    Make public
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Anyone with the share link can submit
                  </p>
                </div>
              </div>
            </section>

            {/* Questions */}
            <section className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Questions
                {questions.length > 0 && (
                  <span className="ml-2 normal-case font-normal">
                    {questions.length} added
                  </span>
                )}
              </Label>
              <FormBuilder questions={questions} onChange={setQuestions} />
            </section>
          </div>
        </div>

        {/* RIGHT: Live preview ────────────────────────────────── */}
        {previewVisible && (
          <div className="hidden lg:flex flex-1 flex-col bg-muted/30 overflow-y-auto">
            {/* Preview chrome bar */}
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-muted/80 backdrop-blur-sm border-b border-border/30 text-xs text-muted-foreground shrink-0">
              <Eye className="h-3.5 w-3.5" />
              Live preview
              <span className="ml-auto opacity-60">This is what respondents see</span>
            </div>

            <div ref={previewRef} className="flex-1 overflow-y-auto">
              <FormPreview
                title={title}
                description={description}
                questions={questions}
                isPublic={isPublic}
                onUpload={upload}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Save as Template dialog ─────────────────────────────── */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Template name</Label>
              <Input
                value={templateName}
                onChange={e => { setTemplateName(e.target.value); setTemplateNameEdited(true); }}
                placeholder="e.g. Our Speaker Application"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This template will appear in the gallery for all admins and (once available) organizers.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={savingTemplate || !templateName.trim()}
            >
              {savingTemplate ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Live preview component ─────────────────────────────────────────────────────

interface FormPreviewProps {
  title: string;
  description: string;
  questions: FormQuestion[];
  isPublic: boolean;
  onUpload: (file: File) => Promise<string | null>;
}

function FormPreview({ title, description, questions, onUpload }: FormPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | null>>({});

  // Reset answers when questions change structurally
  useEffect(() => {
    setAnswers({});
  }, [questions.length]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Thin accent bar placeholder */}
      <div className="h-1 w-full rounded-full bg-primary/20 mb-8" />

      {/* Form header */}
      <div className="mb-8">
        <Logo className="mb-6 opacity-60" />
        <h1 className="text-2xl font-bold text-foreground">
          {title || <span className="text-muted-foreground/40 italic font-normal">Untitled Form</span>}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/40 rounded-xl text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Add questions on the left to see the preview here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Respondent identity section */}
          <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Details
            </p>
            <div className="space-y-2">
              <Label className="text-sm">Full Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Your full name" disabled className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Email Address <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="you@example.com" disabled className="bg-muted/40" />
            </div>
          </div>

          {/* Form questions */}
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <FormRenderer
              questions={questions}
              answers={answers}
              onChange={setAnswers}
              disabled={false}
              onUpload={onUpload}
            />
          </div>

          <Button className="w-full" disabled>Submit</Button>

          <p className="text-center text-xs text-muted-foreground">
            Powered by <span className="text-foreground/60">EventKnit</span>
          </p>
        </div>
      )}
    </div>
  );
}
