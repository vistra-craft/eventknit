import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuth } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { extractErrorMessage } from '@/lib/utils/error';

// OAuth only supports ORGANIZER and ATTENDEE registration
type OAuthRole = 'ORGANIZER' | 'ATTENDEE';

interface TokenResponse {
  access_token: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
  }) => TokenClient;
}

function getGoogleOAuth2(): GoogleOAuth2 | undefined {
  return (window as unknown as { google?: { accounts: { oauth2: GoogleOAuth2 } } }).google?.accounts?.oauth2;
}

function isGoogleLoaded(): boolean {
  return !!(window as unknown as { google?: { accounts?: unknown } }).google?.accounts;
}

interface UseGoogleAuthOptions {
  role?: OAuthRole; // Optional - defaults to ATTENDEE on backend
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseGoogleAuthReturn {
  signUpWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Google OAuth authentication using popup flow.
 * Uses google.accounts.oauth2.initTokenClient for reliable popup-based auth
 * instead of google.accounts.id.prompt() which relies on FedCM and can fail silently.
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
      if (!isGoogleLoaded()) {
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

      const oauth2 = getGoogleOAuth2();
      if (!oauth2) {
        const errorMsg = 'Google Sign-In failed to load';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        return;
      }

      // Use popup OAuth flow (more reliable than FedCM/One Tap prompt)
      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response: TokenResponse) => {
          if (response.error || !response.access_token) {
            const errorMsg = 'Google sign in was cancelled or failed.';
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
            return;
          }

          try {
            const result = await googleAuth(response.access_token, 'access_token', role);

            if (result.success && result.data) {
              setAccessToken(result.data.accessToken);
              dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });

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
        error_callback: (err: { type: string; message: string }) => {
          // Fires when the popup is closed or blocked
          const errorMsg = err.type === 'popup_closed'
            ? 'Google sign in was cancelled.'
            : 'Google sign in failed. Please try again.';
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        },
      });

      // Open the OAuth consent popup
      tokenClient.requestAccessToken();
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
