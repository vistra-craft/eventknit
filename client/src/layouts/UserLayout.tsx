/**
 * User Layout - Enhanced for Unified Dashboard
 * Wraps all /user/* routes
 * Provides consistent layout for user dashboard pages
 * Includes unified navigation bar with mode support and main content area
 */

import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOrganizerApproval } from '../hooks/useOrganizerApproval';
import { userRoutes } from '../routes/userRoutes';
import UnifiedNavbar from '../components/UnifiedNavbar';
import { DashboardModeProvider } from '../contexts/DashboardModeContext';
import { SkeletonPageHeader, SkeletonMetricCard, SkeletonGroup } from '../components/ui/Skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Clock } from 'lucide-react';

/**
 * Loading component for suspense fallback
 * Professional skeleton loader with shimmer animations
 */
const LoadingFallback = () => (
  <SkeletonGroup className="p-6 space-y-6">
    <SkeletonPageHeader showActions={false} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonMetricCard key={i} />
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

  return (
    <DashboardModeProvider>
      {/* Organizer Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={(open) => { if (!open) handleApprovalAcknowledged(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Your Organizer Account is Approved!</DialogTitle>
            <DialogDescription className="text-center">
              Congratulations! An admin has approved your organizer account.
              You can now manage your events, track ticket sales, and access the full organizer dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            <Button
              onClick={() => {
                handleApprovalAcknowledged();
                navigate('/organizer/dashboard');
              }}
            >
              Go to Organizer Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => handleApprovalAcknowledged()}
            >
              Stay Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
