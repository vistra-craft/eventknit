import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appleAuth } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { extractErrorMessage } from '@/lib/utils/error';

type OAuthRole = 'ORGANIZER' | 'ATTENDEE';

interface AppleSignInResponse {
  authorization: {
    code: string;
    id_token: string;
  };
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface AppleIDAuth {
  init: (config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    usePopup: boolean;
  }) => void;
  signIn: () => Promise<AppleSignInResponse>;
}

function getAppleAuth(): AppleIDAuth | undefined {
  return (window as unknown as { AppleID?: { auth: AppleIDAuth } }).AppleID?.auth;
}

function isAppleLoaded(): boolean {
  return !!(window as unknown as { AppleID?: unknown }).AppleID;
}

interface UseAppleAuthOptions {
  role: OAuthRole;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseAppleAuthReturn {
  signInWithApple: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Apple OAuth authentication
 *
 * @example
 * const { signInWithApple, isLoading, error } = useAppleAuth({
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

  const signInWithApple = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load Apple Sign-In script if not already loaded
      if (!isAppleLoaded()) {
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const clientId = import.meta.env.VITE_APPLE_CLIENT_ID || '';
      if (!clientId) {
        const errorMsg = 'Apple Sign-In not configured';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        return;
      }

      const appleIDAuth = getAppleAuth();
      if (!appleIDAuth) {
        const errorMsg = 'Apple Sign-In failed to load';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        return;
      }

      // Initialize Apple Sign-In
      appleIDAuth.init({
        clientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });

      // Trigger Apple Sign-In popup
      const response = await appleIDAuth.signIn();

      const result = await appleAuth(
        response.authorization.code,
        response.authorization.id_token,
        role,
        response.user ? { name: response.user.name } : undefined
      );

      if (result.success && result.data) {
        setAccessToken(result.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });

        onSuccess?.();

        // Navigate based on role
        const userRole = result.data.user.role;
        if (userRole === 'ORGANIZER' || userRole === 'ORGANIZER_STAFF' || userRole === 'ORGANIZER_TELLER') {
          const needsOnboarding = result.data.user &&
            typeof (result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === 'boolean'
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
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithApple,
    isLoading,
    error,
  };
}
