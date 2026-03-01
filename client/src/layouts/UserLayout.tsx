/**
 * User Layout - Enhanced for Unified Dashboard
 * Wraps all /user/* routes
 * Provides consistent layout for user dashboard pages
 * Includes unified navigation bar with mode support and main content area
 */

import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOrganizerApproval } from '../hooks/useOrganizerApproval';
import { userRoutes } from '../routes/userRoutes';
import UnifiedNavbar from '../components/UnifiedNavbar';
import { DashboardModeProvider } from '../contexts/DashboardModeContext';
import { Skeleton, SkeletonGroup } from '../components/ui/Skeleton';
import OrganizerOnboardingModal from '../components/OrganizerOnboardingModal';
import { Clock } from 'lucide-react';
import { UserRole, UserStatus } from '../types/auth';

/**
 * Loading component for suspense fallback
 * Mimics the actual user dashboard: header, tabs, and event card list
 */
const LoadingFallback = () => (
  <SkeletonGroup className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
    {/* Header */}
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div style={{ animation: 'skeleton-fade-in 0.4s ease-out both', animationDelay: '0ms' }}>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton
          className="h-10 w-full sm:w-36 rounded-md"
          style={{ animation: 'skeleton-fade-in 0.4s ease-out both', animationDelay: '60ms' }}
        />
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-full sm:w-auto border border-border"
        style={{ animation: 'skeleton-fade-in 0.4s ease-out both', animationDelay: '120ms' }}
      >
        {['Attending', 'Saved', 'Settings'].map((tab) => (
          <Skeleton key={tab} className="h-9 w-24 rounded-md" />
        ))}
      </div>
    </div>

    {/* Event card list */}
    <div className="space-y-3 max-w-3xl">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex gap-4 p-4 bg-background border border-border rounded-lg"
          style={{ animation: 'skeleton-fade-in 0.4s ease-out both', animationDelay: `${160 + (i - 1) * 80}ms` }}
        >
          <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1 mb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </SkeletonGroup>
);

/**
 * UserLayout Component
 * Renders all user routes with lazy loading
 * Requires authentication
 */
const UserLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { showApprovalModal, handleApprovalAcknowledged, isPendingOrganizer } = useOrganizerApproval();

  // Get user data from auth context
  const user = authUser ? {
    name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || 'User',
    email: authUser.email || '',
    initials: authUser.firstName && authUser.lastName
      ? `${authUser.firstName[0]}${authUser.lastName[0]}`.toUpperCase()
      : (authUser.email ? authUser.email[0].toUpperCase() : 'U'),
  } : {
    name: 'User',
    email: '',
    initials: 'U',
  };

  // Get event data from navigation state (for specific event views)
  const eventData = location.state?.eventData;
  const successMessage = location.state?.message;

  // Determine active section from current path
  const pathParts = location.pathname.split('/');
  const activeSection = pathParts[2] || 'dashboard';

  useEffect(() => {
    const isActiveOrganizer =
      authUser?.role === UserRole.ORGANIZER && authUser?.status === UserStatus.ACTIVE;

    if (isActiveOrganizer && location.pathname.startsWith('/user') && !showApprovalModal) {
      navigate('/organizer/dashboard', { replace: true });
    }
  }, [authUser?.role, authUser?.status, location.pathname, navigate, showApprovalModal]);

  return (
    <DashboardModeProvider>
      <OrganizerOnboardingModal open={showApprovalModal} onComplete={handleApprovalAcknowledged} />

      <div className="min-h-screen bg-background flex flex-col">
        <UnifiedNavbar
          user={user}
          activeSection={activeSection}
          eventTitle={eventData?.title}
        />
        <main className="pt-16 flex-1">
          {/* Success Message */}
          {successMessage && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <div className="bg-success-light border border-success/20 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="text-success">{successMessage}</div>
                </div>
              </div>
            </div>
          )}
          {/* Pending Organizer Approval Banner */}
          {isPendingOrganizer && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Organizer Account Pending Approval</p>
                  <p className="text-xs text-muted-foreground">Your application is under review. You&apos;ll be notified once an admin approves your account.</p>
                </div>
              </div>
            </div>
          )}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {userRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
              ))}
            </Routes>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </DashboardModeProvider>
  );
};

export default UserLayout;
