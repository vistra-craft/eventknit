import { useState } from 'react';
import { Flag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useEventReportStatus } from '@/hooks/queries/useEventReports';
import { useSubmitEventReport } from '@/hooks/mutations/useEventReportActions';
import type { ReportCategory } from '@/lib/event-report-api';

const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'FRAUD_SCAM', label: 'Fraud / Scam' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'SPAM', label: 'Spam / Advertising' },
  { value: 'SAFETY', label: 'Safety Concern' },
  { value: 'WRONG_DETAILS', label: 'Event Details Wrong' },
  { value: 'DUPLICATE', label: 'Duplicate Event' },
  { value: 'OTHER', label: 'Other' },
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Event</DialogTitle>
            <DialogDescription>
              Help us keep EventKnit safe. Your identity will not be shared with the event organizer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                placeholder="Provide additional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
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
