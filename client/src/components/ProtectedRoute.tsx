/**
 * Protected Route Component
 * Redirects unauthenticated users to sign in page
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eventknit mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
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

  return <>{children}</>;
};


