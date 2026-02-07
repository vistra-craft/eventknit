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

/**
 * Loading spinner component for suspense fallback
 */
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
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
        <Suspense fallback={<LoadingSpinner />}>
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
