import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  suspendUser,
  deactivateUser,
  activateUser,
  approveOrganizer,
} from '@/lib/admin-api';
import { useToast } from '@/hooks/useToast';

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
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve organizer',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend organizer',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate organizer',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate organizer',
        variant: 'destructive',
      });
    },
  });
}
