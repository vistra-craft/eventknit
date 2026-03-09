import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkAssignStaff, type EventStaffRole } from '@/lib/admin-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

/**
 * Mutation hook to assign multiple staff members to an event
 *
 * Features:
 * - Automatically invalidates event-staff query on success
 * - Shows success/error toast notifications
 * - Returns loading state and mutate function
 *
 * @returns Mutation result with mutate function and loading state
 */
export function useBulkAssignStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      staffIds,
      role,
      notes,
    }: {
      eventId: string;
      staffIds: string[];
      role: EventStaffRole;
      notes?: string;
    }) => {
      return await bulkAssignStaff(eventId, staffIds, role, notes);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the event staff query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['event-staff', variables.eventId],
      });

      toast({
        title: 'Success',
        description: `${variables.staffIds.length} staff members assigned successfully`,
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to assign staff');
    },
  });
}
