import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormBuilder } from '@/components/forms/FormBuilder';
import {
  getForm,
  updateForm,
  listResponses,
  reviewResponse,
  type EventForm,
  type FormResponse,
  type FormStatus,
  type FormResponseStatus,
  type FormQuestion,
} from '@/lib/form-api';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<FormResponseStatus, string> = {
  SUBMITTED: 'bg-blue-500/15 text-blue-600',
  UNDER_REVIEW: 'bg-yellow-500/15 text-yellow-600',
  APPROVED: 'bg-emerald-500/15 text-emerald-600',
  REJECTED: 'bg-destructive/15 text-destructive',
  WAITLISTED: 'bg-orange-500/15 text-orange-600',
};

function getPublicFormUrl(shareToken: string) {
  return `${window.location.origin}/f/${shareToken}`;
}

export default function AdminFormDetailPage() {
  const { formId } = useParams<{ formId: string }>();
  const { toast } = useToast();

  const [form, setForm] = useState<EventForm | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);

  // Edit state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FormStatus>('DRAFT');
  const [isPublic, setIsPublic] = useState(false);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  // Responses
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [responsePage, setResponsePage] = useState(1);
  const [responseStatus, setResponseStatus] = useState<FormResponseStatus | 'ALL'>('ALL');
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    if (!formId) return;
    setLoadingForm(true);
    try {
      const res = await getForm(formId);
      const f = res.form;
      setForm(f);
      setTitle(f.title);
      setDescription(f.description ?? '');
      setStatus(f.status);
      setIsPublic(f.isPublic);
      setQuestions(f.questions as FormQuestion[]);
    } catch {
      toast({ title: 'Failed to load form', variant: 'destructive' });
    } finally {
      setLoadingForm(false);
    }
  }, [formId, toast]);

  const loadResponses = useCallback(async () => {
    if (!formId) return;
    setLoadingResponses(true);
    try {
      const res = await listResponses(formId, {
        page: responsePage,
        limit: 20,
        status: responseStatus !== 'ALL' ? responseStatus : undefined,
      });
      setResponses(res.responses as FormResponse[]);
      setTotalResponses(res.total);
    } catch {
      toast({ title: 'Failed to load responses', variant: 'destructive' });
    } finally {
      setLoadingResponses(false);
    }
  }, [formId, responsePage, responseStatus, toast]);

  useEffect(() => { void loadForm(); }, [loadForm]);
  useEffect(() => { void loadResponses(); }, [loadResponses]);

  const handleSave = async () => {
    if (!formId) return;
    setSaving(true);
    try {
      await updateForm(formId, { title, description: description || undefined, status, isPublic, questions });
      toast({ title: 'Form saved' });
      void loadForm();
    } catch {
      toast({ title: 'Failed to save form', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (responseId: string, newStatus: FormResponseStatus, createParticipant = false) => {
    if (!formId) return;
    setReviewingId(responseId);
    try {
      await reviewResponse(formId, responseId, { status: newStatus, createParticipant });
      toast({ title: `Response ${newStatus.toLowerCase()}` });
      void loadResponses();
    } catch {
      toast({ title: 'Failed to update response', variant: 'destructive' });
    } finally {
      setReviewingId(null);
    }
  };

  const copyLink = () => {
    if (!form) return;
    void navigator.clipboard.writeText(getPublicFormUrl(form.shareToken));
    toast({ title: 'Link copied' });
  };

  if (loadingForm) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Form not found.{' '}
        <Link to="/admin/forms" className="text-primary underline">
          Back to forms
        </Link>
      </div>
    );
  }

  const totalResponsePages = Math.ceil(totalResponses / 20);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/admin/forms">
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{form.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{form.status}</Badge>
              {form.isPublic && (
                <Badge variant="outline" className="text-xs">Public</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {form._count.responses} response{form._count.responses !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {form.isPublic && (
            <>
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Link
              </Button>
              <a href={getPublicFormUrl(form.shareToken)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </Button>
              </a>
            </>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit Form</TabsTrigger>
          <TabsTrigger value="responses">
            Responses ({totalResponses})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Edit tab */}
        <TabsContent value="edit" className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional form description shown to respondents..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="border-t border-border/40 pt-4">
            <p className="text-sm font-semibold mb-3">Questions</p>
            <FormBuilder questions={questions} onChange={setQuestions} />
          </div>
        </TabsContent>

        {/* Responses tab */}
        <TabsContent value="responses" className="pt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={responseStatus} onValueChange={v => { setResponseStatus(v as FormResponseStatus | 'ALL'); setResponsePage(1); }}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAITLISTED'] as FormResponseStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void loadResponses()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {loadingResponses ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No responses found</div>
          ) : (
            <div className="space-y-3">
              {responses.map(resp => (
                <div key={resp.id} className="bg-card border border-border/40 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{resp.respondentName ?? resp.respondentEmail}</p>
                      <p className="text-xs text-muted-foreground">{resp.respondentEmail}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(resp.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(STATUS_COLORS[resp.status])} variant="secondary">
                        {resp.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Answers preview */}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {(form.questions as FormQuestion[]).slice(0, 3).map(q => {
                      if (q.type === 'section_break') return null;
                      const answer = resp.answers[q.id];
                      if (!answer) return null;
                      return (
                        <p key={q.id}>
                          <span className="font-medium text-foreground">{q.label}:</span>{' '}
                          {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                        </p>
                      );
                    })}
                    {(form.questions as FormQuestion[]).length > 3 && (
                      <p className="text-muted-foreground">+{(form.questions as FormQuestion[]).length - 3} more fields</p>
                    )}
                  </div>

                  {/* Review actions */}
                  {resp.status === 'SUBMITTED' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={reviewingId === resp.id}
                        onClick={() => void handleReview(resp.id, 'UNDER_REVIEW')}
                      >
                        Mark Under Review
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        disabled={reviewingId === resp.id}
                        onClick={() => void handleReview(resp.id, 'APPROVED', !!form.targetParticipantType)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={reviewingId === resp.id}
                        onClick={() => void handleReview(resp.id, 'REJECTED')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {resp.status === 'UNDER_REVIEW' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        disabled={reviewingId === resp.id}
                        onClick={() => void handleReview(resp.id, 'APPROVED', !!form.targetParticipantType)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={reviewingId === resp.id}
                        onClick={() => void handleReview(resp.id, 'WAITLISTED')}
                      >
                        Waitlist
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={reviewingId === resp.id}
                        onClick={() => void handleReview(resp.id, 'REJECTED')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalResponsePages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={responsePage <= 1} onClick={() => setResponsePage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground self-center">{responsePage} / {totalResponsePages}</span>
              <Button variant="outline" size="sm" disabled={responsePage >= totalResponsePages} onClick={() => setResponsePage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings" className="pt-4">
          <div className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as FormStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as FormStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
              <div>
                <Label htmlFor="is-public" className="cursor-pointer">Public form</Label>
                <p className="text-xs text-muted-foreground">Anyone with the link can submit</p>
              </div>
            </div>

            {form.isPublic && (
              <div className="space-y-1.5">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={getPublicFormUrl(form.shareToken)}
                    className="text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
