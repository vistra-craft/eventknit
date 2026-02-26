/**
 * Protected Route Component
 * Redirects unauthenticated users to sign in page
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, UserStatus } from '@/types/auth';
import { SkeletonPageHeader, SkeletonMetricCard, SkeletonGroup } from '@/components/ui/Skeleton';

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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SkeletonGroup className="p-6 space-y-6">
          <SkeletonPageHeader showActions={false} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonMetricCard key={i} />
            ))}
          </div>
        </SkeletonGroup>
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

  // Gate: PENDING_APPROVAL organizers cannot access organizer routes
  // Exception: Allow access to settings and profile-setup so they can manage their own profile
  const isPendingAllowedPath =
    location.pathname.startsWith('/organizer/settings') ||
    location.pathname.startsWith('/organizer/profile');
  if (
    user.role === UserRole.ORGANIZER &&
    user.status === UserStatus.PENDING_APPROVAL &&
    location.pathname.startsWith('/organizer') &&
    !isPendingAllowedPath
  ) {
    return <Navigate to="/user/dashboard" replace />;
  }

  // Gate: PENDING_APPROVAL organizers cannot create additional events
  if (
    user.role === UserRole.ORGANIZER &&
    user.status === UserStatus.PENDING_APPROVAL &&
    location.pathname.includes('create-event')
  ) {
    return (
      <Navigate
        to="/user/dashboard"
        state={{ message: 'Your organizer account is pending approval. You cannot create additional events until approved.' }}
        replace
      />
    );
  }

  // Gate: ACTIVE organizers belong on the organizer dashboard, not /user/*
  // Exception: allow them to stay on /user/* while the approval modal is pending
  // (so UserLayout can display the "You're Approved!" modal before redirecting)
  const hasPendingApprovalModal = sessionStorage.getItem('organizer_approval_pending') === '1';
  if (
    user.role === UserRole.ORGANIZER &&
    user.status === UserStatus.ACTIVE &&
    location.pathname.startsWith('/user') &&
    !hasPendingApprovalModal
  ) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  // Check onboarding status for organizers (except on onboarding page itself)
  // Skip for PENDING_APPROVAL organizers — they stay on /user/dashboard until approved
  const isOrganizer = [
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
  ].includes(user.role);

  const isOnboardingPage = location.pathname === '/organizer/onboarding';
  const isPendingApproval = user.status === UserStatus.PENDING_APPROVAL;

  if (isOrganizer && !isOnboardingPage && !isPendingApproval && user.role === UserRole.ORGANIZER && !user.onboardingCompleted) {
    // Redirect to onboarding if organizer hasn't completed onboarding
    return <Navigate to="/organizer/onboarding" replace />;
  }

  return <>{children}</>;
};


