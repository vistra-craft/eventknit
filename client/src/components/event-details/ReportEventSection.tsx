import { useState } from 'react';
import { Flag, CheckCircle, AlertCircle, ShieldCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useEventReportStatus } from '@/hooks/queries/useEventReports';
import { useSubmitEventReport } from '@/hooks/mutations/useEventReportActions';
import type { ReportCategory } from '@/lib/event-report-api';

const REPORT_CATEGORIES: { value: ReportCategory; label: string; description: string }[] = [
  { 
    value: 'FRAUD_SCAM', 
    label: 'Fraud / Scam',
    description: 'Fake event, ticket scalping, or fraudulent payment collection'
  },
  { 
    value: 'INAPPROPRIATE', 
    label: 'Inappropriate Content',
    description: 'Offensive, discriminatory, or adult content'
  },
  { 
    value: 'SPAM', 
    label: 'Spam / Advertising',
    description: 'Misleading promotion or unauthorized commercial activity'
  },
  { 
    value: 'SAFETY', 
    label: 'Safety Concern',
    description: 'Unsafe venue conditions or security risks'
  },
  { 
    value: 'WRONG_DETAILS', 
    label: 'Event Details Wrong',
    description: 'Incorrect date, time, location, or pricing information'
  },
  { 
    value: 'DUPLICATE', 
    label: 'Duplicate Event',
    description: 'Event is listed multiple times'
  },
  { 
    value: 'OTHER', 
    label: 'Other',
    description: 'Other policy violation or concern'
  },
];

interface ReportEventSectionProps {
  eventId: string;
}

export function ReportEventSection({ eventId }: ReportEventSectionProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [description, setDescription] = useState('');

  const { data: reportStatus } = useEventReportStatus(eventId, user?.id);
  const submitMutation = useSubmitEventReport();

  // Only show for authenticated users
  if (!user) return null;

  const hasReported = reportStatus?.hasReported || false;

  const handleSubmit = () => {
    if (!category) return;
    submitMutation.mutate(
      { eventId, category, description: description.trim() || undefined },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setCategory('');
          setDescription('');
        },
      },
    );
  };

  return (
    <>
      <section className="mt-6 pt-4 border-t border-border/30">
        {hasReported ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>You reported this event</span>
          </div>
        ) : (
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Report this event</span>
          </button>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Report Event
            </DialogTitle>
            <DialogDescription>
              Help us maintain a safe and trustworthy platform for all users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Policy Notice Banner */}
            <Alert className="border-blue-500/20 bg-blue-500/5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-muted-foreground ml-1">
                <strong className="text-foreground">What happens after reporting:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Your report will be reviewed by our moderation team</li>
                  <li>Investigation is conducted according to our Terms of Service</li>
                  <li>Appropriate actions will be taken if policy violations are found</li>
                  <li>Your identity remains confidential and won't be shared with the organizer</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Terms Notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                False reports may result in account suspension. Please report only genuine policy violations.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Report Category <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the reason for reporting" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{cat.label}</span>
                        <span className="text-xs text-muted-foreground">{cat.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Additional Details <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                placeholder="Provide specific details about the issue to help us investigate..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                className="min-h-[100px] resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  More details help us investigate faster
                </p>
                <p className="text-xs text-muted-foreground">
                  {description.length}/500
                </p>
              </div>
            </div>

            {/* Terms Acknowledgment */}
            <div className="flex items-start gap-2 p-2 rounded bg-muted/30">
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                By submitting, you agree to our{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/community-guidelines" target="_blank" className="text-primary hover:underline">Community Guidelines</a>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!category || submitMutation.isPending}
              variant="destructive"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
