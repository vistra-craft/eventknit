import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeOrganizerStaffFromEvent } from '@/lib/organizer-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

/**
 * Mutation hook to remove an organizer staff member from an event
 *
 * Features:
 * - Automatically invalidates organizer-event-staff query on success
 * - Shows success/error toast notifications
 * - Returns loading state and mutate function
 *
 * @returns Mutation result with mutate function and loading state
 */
export function useRemoveOrganizerStaff() {
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
      return await removeOrganizerStaffFromEvent(eventId, staffId);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the organizer event staff query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['organizer-event-staff', variables.eventId],
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
