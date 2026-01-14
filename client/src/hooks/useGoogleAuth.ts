import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuth } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { extractErrorMessage } from '@/lib/utils/error';
import type { UserRole } from '@/types/auth';

interface UseGoogleAuthOptions {
  role: UserRole;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseGoogleAuthReturn {
  signUpWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Google OAuth authentication
 *
 * @example
 * const { signUpWithGoogle, isLoading, error } = useGoogleAuth({
 *   role: 'ATTENDEE',
 *   onSuccess: () => console.log('Success!'),
 * });
 */
export function useGoogleAuth(options: UseGoogleAuthOptions): UseGoogleAuthReturn {
  const { role, onSuccess, onError } = options;
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUpWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load Google Sign-In script if not already loaded
      if (!window.google?.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        const errorMsg = 'Google Sign-In not configured';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        return;
      }

      // Initialize Google Sign-In
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const result = await googleAuth(response.credential, 'id_token', role);

            if (result.success && result.data) {
              setAccessToken(result.data.accessToken);
              dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });

              // Handle successful authentication
              onSuccess?.();

              // Navigate based on role
              const userRole = result.data.user.role;
              if (userRole === 'ORGANIZER' || userRole === 'ORGANIZER_STAFF' || userRole === 'ORGANIZER_TELLER') {
                const needsOnboarding = result.data.user &&
                  typeof (result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === "boolean"
                    ? !(result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
                    : true;
                navigate(needsOnboarding ? '/organizer/onboarding' : '/organizer/dashboard');
              } else if (userRole === 'SUPERADMIN' || userRole === 'ADMIN_STAFF' || userRole === 'MARKETER' || userRole === 'SUPPORT' || userRole === 'TELLER') {
                navigate('/admin/dashboard');
              } else {
                navigate('/user/dashboard');
              }
            }
          } catch (err) {
            const errorMsg = extractErrorMessage(err, 'Google sign up failed. Please try again.');
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
          }
        },
      });

      // Trigger Google Sign-In prompt
      window.google?.accounts.id.prompt();
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Google sign up failed. Please try again.');
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    }
  };

  return {
    signUpWithGoogle,
    isLoading,
    error,
  };
}
