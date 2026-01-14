import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignAdminStaffToEvent, type AssignStaffToEventData } from '@/lib/admin-api';
import { useToast } from '@/hooks/useToast';

/**
 * Mutation hook to assign a staff member to an event
 *
 * Features:
 * - Automatically invalidates event-staff query on success
 * - Shows success/error toast notifications
 * - Returns loading state and mutate function
 *
 * @returns Mutation result with mutate function and loading state
 */
export function useAssignStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: AssignStaffToEventData;
    }) => {
      return await assignAdminStaffToEvent(eventId, data);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the event staff query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['event-staff', variables.eventId],
      });

      toast({
        title: 'Success',
        description: 'Staff assigned to event successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign staff',
        variant: 'destructive',
      });
    },
  });
}
