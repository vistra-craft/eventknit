import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStaffAssignment, type EventStaffRole } from '@/lib/admin-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

interface UpdateStaffAssignmentData {
  role: EventStaffRole;
  notes?: string;
  isActive: boolean;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  facility?: string | null;
}

/**
 * Mutation hook to update a staff member's assignment to an event
 *
 * Features:
 * - Automatically invalidates event-staff query on success
 * - Shows success/error toast notifications
 * - Returns loading state and mutate function
 *
 * @returns Mutation result with mutate function and loading state
 */
export function useUpdateStaffAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      staffId,
      data,
    }: {
      eventId: string;
      staffId: string;
      data: UpdateStaffAssignmentData;
    }) => {
      return await updateStaffAssignment(eventId, staffId, data);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the event staff query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['event-staff', variables.eventId],
      });

      toast({
        title: 'Success',
        description: 'Assignment updated successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to update assignment');
    },
  });
}
