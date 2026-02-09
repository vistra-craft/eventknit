/**
 * User Layout
 * Wraps all /user/* routes
 * Provides consistent layout for user dashboard pages
 * Includes navigation bar and main content area
 */

import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userRoutes } from '../routes/userRoutes';
import DashboardNavbar from '../pages/user/DashboardNavbar';
import { SkeletonPageHeader, SkeletonMetricCard, SkeletonGroup } from '../components/ui/Skeleton';

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
  const { user: authUser } = useAuth();

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
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNavbar
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
  );
};

export default UserLayout;
