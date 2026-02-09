/**
 * Protected Route Component
 * Redirects unauthenticated users to sign in page
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
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

  // Check onboarding status for organizers (except on onboarding page itself)
  const isOrganizer = [
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
  ].includes(user.role);

  const isOnboardingPage = location.pathname === '/organizer/onboarding';

  if (isOrganizer && !isOnboardingPage && user.role === UserRole.ORGANIZER && !user.onboardingCompleted) {
    // Redirect to onboarding if organizer hasn't completed onboarding
    return <Navigate to="/organizer/onboarding" replace />;
  }

  return <>{children}</>;
};


