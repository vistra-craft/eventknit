/**
 * Protected Route Component
 * Redirects unauthenticated users to sign in page
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, UserStatus } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/auth/signin',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show branded breath loader while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-6">
          {/* Glow ring */}
          <div
            className="absolute w-24 h-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary-glow) / 0.25) 0%, transparent 70%)',
              animation: 'auth-glow 2s ease-in-out infinite',
            }}
          />
          {/* Brand mark */}
          <div
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] flex items-center justify-center shadow-lg"
            style={{ animation: 'auth-breathe 2s ease-in-out infinite' }}
          >
            <span className="text-lg font-bold text-primary-foreground tracking-tight select-none">
              EK
            </span>
          </div>
          {/* Progress shimmer bar */}
          <div className="w-32 h-0.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent"
              style={{ animation: 'auth-progress 1.5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(user.role);

    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_ADMIN,
      UserRole.ORGANIZER_TELLER,
    ].includes(user.role);
    
    const dashboardRoute = isAdminRole
      ? '/admin/dashboard'
      : isOrganizerRole
      ? '/organizer/dashboard'
      : '/user/dashboard';

    return <Navigate to={dashboardRoute} replace />;
  }

  // Gate: PENDING_APPROVAL organizers cannot access any organizer routes.
  // Profile setup is handled at /user/organizer-profile inside the user layout.
  if (
    user.role === UserRole.ORGANIZER &&
    user.status === UserStatus.PENDING_APPROVAL &&
    location.pathname.startsWith('/organizer')
  ) {
    // If they try to reach settings or profile, send them to the user-layout equivalent
    if (
      location.pathname.startsWith('/organizer/settings') ||
      location.pathname.startsWith('/organizer/profile')
    ) {
      return <Navigate to="/user/organizer-profile" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  // Gate: ACTIVE organizers belong on the organizer dashboard, not /user/*.
  // Exception: allow them to stay on /user/* while the approval modal is still showing
  // (so UserLayout can display the "You're Approved!" modal before redirecting).
  const hasPendingApprovalModal = sessionStorage.getItem('organizer_approval_pending') === '1';
  if (
    user.role === UserRole.ORGANIZER &&
    user.status === UserStatus.ACTIVE &&
    location.pathname.startsWith('/user') &&
    !hasPendingApprovalModal
  ) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  return <>{children}</>;
};


