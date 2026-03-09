import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeStaffFromEvent } from '@/lib/admin-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

/**
 * Mutation hook to remove a staff member from an event
 *
 * Features:
 * - Automatically invalidates event-staff query on success
 * - Shows success/error toast notifications
 * - Returns loading state and mutate function
 *
 * @returns Mutation result with mutate function and loading state
 */
export function useRemoveStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      staffId,
    }: {
      eventId: string;
      staffId: string;
    }) => {
      return await removeStaffFromEvent(eventId, staffId);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the event staff query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['event-staff', variables.eventId],
      });

      toast({
        title: 'Success',
        description: 'Staff removed from event successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to remove staff');
    },
  });
}
