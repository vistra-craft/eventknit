import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/lib/auth-api';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/lib/utils/error';

/**
 * Hook for uploading user avatar
 * Handles file upload with optimistic updates and cache invalidation
 * Follows TanStack Query patterns from technical documentation
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!file) {
        throw new Error('No file selected');
      }
      return authApi.uploadAvatar(file);
    },
    onSuccess: () => {
      // Invalidate profile cache to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Profile photo uploaded successfully',
        variant: 'default',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Upload failed',
        description: extractErrorMessage(error, 'Failed to upload avatar'),
        variant: 'destructive',
      });
    },
  });
}
