import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrganizerStaffAssignment, type EventStaffRole } from '@/lib/organizer-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

interface UpdateOrganizerStaffAssignmentData {
  role: EventStaffRole;
  notes?: string;
  isActive: boolean;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  facility?: string | null;
}

/**
 * Mutation hook to update an organizer staff member's assignment to an event
 *
 * Features:
 * - Automatically invalidates organizer-event-staff query on success
 * - Shows success/error toast notifications
 * - Returns loading state and mutate function
 *
 * @returns Mutation result with mutate function and loading state
 */
export function useUpdateOrganizerStaffAssignment() {
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
      data: UpdateOrganizerStaffAssignmentData;
    }) => {
      return await updateOrganizerStaffAssignment(eventId, staffId, data);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the organizer event staff query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['organizer-event-staff', variables.eventId],
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
