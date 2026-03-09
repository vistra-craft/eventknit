import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignOrganizerStaffToEvent, type AssignOrganizerStaffToEventData } from '@/lib/organizer-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

/**
 * Mutation hook to assign an organizer staff member to an event
 *
 * Features:
 * - Automatically invalidates organizer-event-staff query on success
 * - Shows success/error toast notifications
 * - Returns loading state and mutate function
 *
 * @returns Mutation result with mutate function and loading state
 */
export function useAssignOrganizerStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: AssignOrganizerStaffToEventData;
    }) => {
      return await assignOrganizerStaffToEvent(eventId, data);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the organizer event staff query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['organizer-event-staff', variables.eventId],
      });

      toast({
        title: 'Success',
        description: 'Staff assigned to event successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to assign staff');
    },
  });
}
