import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  suspendUser,
  deactivateUser,
  activateUser,
  approveOrganizer,
} from '@/lib/admin-api';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

export function useApproveOrganizer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await approveOrganizer(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
      toast({
        title: 'Success',
        description: 'Organizer approved successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to approve organizer');
    },
  });
}

export function useSuspendOrganizer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return await suspendUser(userId, reason);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      queryClient.invalidateQueries({ queryKey: ['organizer-details', variables.userId] });
      toast({
        title: 'Success',
        description: 'Organizer suspended successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to suspend organizer');
    },
  });
}

export function useDeactivateOrganizer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return await deactivateUser(userId, reason);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      queryClient.invalidateQueries({ queryKey: ['organizer-details', variables.userId] });
      toast({
        title: 'Success',
        description: 'Organizer deactivated successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to deactivate organizer');
    },
  });
}

export function useActivateOrganizer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await activateUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
      toast({
        title: 'Success',
        description: 'Organizer activated successfully',
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error, 'Failed to activate organizer');
    },
  });
}
