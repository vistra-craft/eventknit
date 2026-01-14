import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { facebookAuth } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { extractErrorMessage } from '@/lib/utils/error';
import type { UserRole } from '@/types/auth';

interface UseFacebookAuthOptions {
  role: UserRole;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseFacebookAuthReturn {
  signUpWithFacebook: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Facebook OAuth authentication
 *
 * @example
 * const { signUpWithFacebook, isLoading, error } = useFacebookAuth({
 *   role: 'ATTENDEE',
 *   onSuccess: () => console.log('Success!'),
 * });
 */
export function useFacebookAuth(options: UseFacebookAuthOptions): UseFacebookAuthReturn {
  const { role, onSuccess, onError } = options;
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUpWithFacebook = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load Facebook SDK if not already loaded
      if (!window.FB) {
        window.fbAsyncInit = function() {
          window.FB?.init({
            appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
            cookie: true,
            xfbml: true,
            version: 'v18.0',
          });
        };

        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        // Wait for Facebook SDK to load
        await new Promise((resolve) => {
          const checkFB = setInterval(() => {
            if (window.FB) {
              clearInterval(checkFB);
              resolve(true);
            }
          }, 100);
        });
      }

      // Trigger Facebook login
      window.FB?.login(async (response) => {
        if (response.authResponse) {
          try {
            const result = await facebookAuth(response.authResponse.accessToken, role);

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
            const errorMsg = extractErrorMessage(err, 'Facebook sign up failed. Please try again.');
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
          }
        } else {
          // User cancelled login or did not fully authorize
          setIsLoading(false);
        }
      }, { scope: 'email' });
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Facebook sign up failed. Please try again.');
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    }
  };

  return {
    signUpWithFacebook,
    isLoading,
    error,
  };
}
