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
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';

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
      <Dialog open={showApprovalModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-lg border-0 bg-transparent shadow-none p-0 [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Account Approved</DialogTitle>
          <DialogDescription className="sr-only">Your organizer account has been approved.</DialogDescription>
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-2xl">
            {/* Decorative top gradient */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

            {/* Animated glow ring */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-pulse" />

            <div className="relative px-8 pt-10 pb-8 text-center">
              {/* Icon */}
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center ring-4 ring-primary/10">
                <Sparkles className="w-9 h-9 text-primary" />
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                You're Approved!
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Your event has been reviewed and approved. Your organizer dashboard is now fully unlocked.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5 mb-8">
                {['Manage Events', 'Track Sales', 'View Analytics'].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {label}
                  </span>
                ))}
              </div>

              {/* Proceed button */}
              <Button
                size="lg"
                className="w-full gap-2 text-base font-semibold h-12 rounded-xl"
                onClick={() => {
                  handleApprovalAcknowledged();
                  navigate('/organizer/dashboard');
                }}
              >
                Proceed to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
