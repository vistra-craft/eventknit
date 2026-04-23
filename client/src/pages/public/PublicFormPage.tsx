import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { validateFormAnswers } from '@/components/forms/form-validation';
import { getPublicForm, submitPublicForm, type FormQuestion, type FormTheme } from '@/lib/form-api';
import { useDirectUpload } from '@/hooks/useDirectUpload';
import Logo from '@/components/layout/Logo';

type AnswerValue = string | string[] | number | null;

interface FormData {
  id: string;
  title: string;
  description: string | null;
  questions: FormQuestion[];
  theme: FormTheme | null;
  event: { title: string; image: string | null } | null;
}

export default function PublicFormPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { upload } = useDirectUpload({ folder: 'general' });

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;
    void (async () => {
      try {
        const res = await getPublicForm(shareToken);
        setForm({
          id: res.form.id,
          title: res.form.title,
          description: res.form.description,
          questions: res.form.questions as FormQuestion[],
          theme: res.form.theme ?? null,
          event: res.form.event ? { title: res.form.event.title, image: null } : null,
        });
      } catch (e: unknown) {
        setError((e as Error).message ?? 'This form is not available');
      } finally {
        setLoading(false);
      }
    })();
  }, [shareToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !shareToken) return;

    const errors: Record<string, string> = {};
    if (!respondentName.trim()) errors['__name'] = 'Your name is required';
    if (!respondentEmail.trim()) errors['__email'] = 'Your email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail)) errors['__email'] = 'Invalid email address';

    const qErrors = validateFormAnswers(form.questions, answers);
    const allErrors = { ...errors, ...qErrors };
    setFieldErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitPublicForm(shareToken, {
        respondentName: respondentName.trim(),
        respondentEmail: respondentEmail.trim(),
        answers,
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setSubmitError((e as Error).message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">Form Unavailable</h1>
        <p className="text-muted-foreground max-w-md">{error ?? 'This form does not exist or is no longer accepting responses.'}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div
          className="rounded-full p-4 mb-4"
          style={{ backgroundColor: form.theme?.accentColor ? `${form.theme.accentColor}1a` : undefined }}
        >
          <CheckCircle2
            className="h-12 w-12"
            style={{ color: form.theme?.accentColor ?? 'var(--color-emerald-500, #10b981)' }}
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">Response Submitted!</h1>
        <p className="text-muted-foreground max-w-md">
          Thank you for your submission. We'll review it and get back to you.
        </p>
        <Logo className="mt-10 opacity-50" />
      </div>
    );
  }

  const accentColor = form.theme?.accentColor;

  return (
    <div
      className="min-h-screen bg-background"
      style={accentColor ? { '--form-accent': accentColor } as React.CSSProperties : undefined}
    >
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Accent bar at the top */}
        {accentColor && (
          <div
            className="h-1 rounded-full mb-8"
            style={{ backgroundColor: accentColor }}
          />
        )}

        {/* Header */}
        <div className="mb-8">
          <Logo className="mb-8" />
          {form.event && (
            <p className="text-sm text-muted-foreground mb-2">{form.event.title}</p>
          )}
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Respondent identity */}
          <div className="bg-card border border-border/40 rounded-lg p-5 space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Details</p>
            <div className="space-y-2">
              <Label>
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={respondentName}
                onChange={e => setRespondentName(e.target.value)}
                placeholder="Your full name"
                className={fieldErrors['__name'] ? 'border-destructive' : ''}
              />
              {fieldErrors['__name'] && (
                <p className="text-xs text-destructive">{fieldErrors['__name']}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={respondentEmail}
                onChange={e => setRespondentEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldErrors['__email'] ? 'border-destructive' : ''}
              />
              {fieldErrors['__email'] && (
                <p className="text-xs text-destructive">{fieldErrors['__email']}</p>
              )}
            </div>
          </div>

          {/* Form questions */}
          <div className="bg-card border border-border/40 rounded-lg p-5">
            <FormRenderer
              questions={form.questions}
              answers={answers}
              onChange={setAnswers}
              errors={fieldErrors}
              disabled={submitting}
              onUpload={upload}
            />
          </div>

          {submitError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
            style={accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Powered by{' '}
            <a href="/" className="hover:text-foreground transition-colors">EventKnit</a>
          </p>
        </form>
      </div>
    </div>
  );
}
