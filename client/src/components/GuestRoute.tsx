/**
 * Guest Route Component
 * Redirects authenticated users to their appropriate dashboard.
 * Use this to wrap routes that should only be accessible to unauthenticated users
 * (e.g., login, register, forgot password).
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAccessToken } from '@/lib/api';
import { UserRole } from '@/types/auth';

interface GuestRouteProps {
  children: React.ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Only show blank during initial auth verification (when a stored token exists).
  // During a login attempt there's no token yet, so we keep children mounted
  // to preserve form state and display errors properly.
  if (isLoading && getAccessToken()) {
    return <div className="min-h-screen bg-background" />;
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(user.role);

    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(user.role);

    const dashboardRoute = isAdminRole
      ? '/admin/dashboard'
      : isOrganizerRole
        ? '/organizer/dashboard'
        : '/user/dashboard';

    return <Navigate to={dashboardRoute} replace />;
  }

  // Not authenticated — render auth page
  return <>{children}</>;
};
