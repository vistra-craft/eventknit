import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appleAuth } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { extractErrorMessage } from '@/lib/utils/error';

// OAuth only supports ORGANIZER and ATTENDEE registration
type OAuthRole = 'ORGANIZER' | 'ATTENDEE';

interface UseAppleAuthOptions {
  role: OAuthRole;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseAppleAuthReturn {
  signUpWithApple: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Apple OAuth authentication
 *
 * @example
 * const { signUpWithApple, isLoading, error } = useAppleAuth({
 *   role: 'ATTENDEE',
 *   onSuccess: () => console.log('Success!'),
 * });
 */
export function useAppleAuth(options: UseAppleAuthOptions): UseAppleAuthReturn {
  const { role, onSuccess, onError } = options;
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUpWithApple = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load Apple JS SDK if not already loaded
      if (!window.AppleID) {
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        // Wait for Apple SDK to load
        await new Promise((resolve) => {
          const checkApple = setInterval(() => {
            if (window.AppleID) {
              clearInterval(checkApple);
              resolve(true);
            }
          }, 100);
        });
      }

      // Initialize Apple Sign In
      if (window.AppleID) {
        window.AppleID.auth.init({
          clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
          scope: 'name email',
          redirectURI: window.location.origin,
          state: role,
          usePopup: true,
        });

        // Trigger Apple Sign In
        const response = await window.AppleID.auth.signIn();

        if (response.authorization) {
          try {
            const result = await appleAuth(
              response.authorization.code,
              response.authorization.id_token,
              role,
              response.user // Optional: includes name on first sign in
            );

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
            const errorMsg = extractErrorMessage(err, 'Apple sign in failed. Please try again.');
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
          }
        } else {
          // User cancelled login
          setIsLoading(false);
        }
      }
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Apple sign in failed. Please try again.');
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    }
  };

  return {
    signUpWithApple,
    isLoading,
    error,
  };
}
