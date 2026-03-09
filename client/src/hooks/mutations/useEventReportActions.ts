import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitEventReport, updateEventReport, type ReportCategory, type ReportStatus } from '@/lib/event-report-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

export function useSubmitEventReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, category, description }: { eventId: string; category: ReportCategory; description?: string }) => {
      return await submitEventReport(eventId, { category, description });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-report-status', variables.eventId] });
      toast({
        title: 'Report submitted',
        description: 'Thank you for reporting. Our team will review it.',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to submit report');
    },
  });
}

export function useUpdateEventReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: ReportStatus; reviewNotes?: string }) => {
      return await updateEventReport(id, { status, reviewNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-reports'] });
      queryClient.invalidateQueries({ queryKey: ['event-report-stats'] });
      toast({
        title: 'Success',
        description: 'Report updated successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to update report');
    },
  });
}
