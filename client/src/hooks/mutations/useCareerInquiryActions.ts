import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCareerInquiry, type CareerInquiryStatus } from '@/lib/careers-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

export function useUpdateCareerInquiry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: CareerInquiryStatus; notes?: string }) => {
      return await updateCareerInquiry(id, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-inquiries'] });
      toast({
        title: 'Success',
        description: 'Inquiry updated successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to update inquiry');
    },
  });
}
