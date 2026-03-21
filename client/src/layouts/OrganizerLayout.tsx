import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import OrganizerSidebar from "../pages/organizer/OrganizerSidebar";
import OrganizerHeader from "../pages/organizer/OrganizerHeader";
import { organizerRoutes } from '../routes/organizerRoutes';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SkeletonPageHeader, SkeletonMetricCard, SkeletonGroup } from '../components/ui/Skeleton';
import { Loader } from '../components/ui/loader';

/**
 * Dashboard skeleton — page header + 4 metric cards
 */
const DashboardFallback = () => (
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
 * Simple centered spinner for form/create pages
 */
const SpinnerFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <Loader size="lg" />
  </div>
);

/**
 * Route-aware loading fallback
 */
const LoadingFallback = () => {
  const path = window.location.pathname;

  if (path.includes('/create') || path.includes('/edit') || path.includes('/settings')) {
    return <SpinnerFallback />;
  }

  return <DashboardFallback />;
};

const OrganizerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed, will be set by useEffect
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile on mount and resize, auto-manage sidebar
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobileSize = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileSize);
      
      // Auto-manage sidebar based on screen size
      if (isMobileSize) {
        // On mobile, always close sidebar
        setSidebarOpen(false);
      } else {
        // On desktop, always open sidebar
        setSidebarOpen(true);
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Handle sidebar toggle for mobile overlay
  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle mobile menu button click
  const handleMobileMenuClick = () => {
    if (isMobile) {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden lg:h-screen lg:overflow-hidden">
      {/* Main layout area (sidebar + header + page content) */}
      <div className="w-full flex flex-1 lg:h-full lg:overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-hidden">
          <OrganizerSidebar isOpen={true} onToggle={handleSidebarToggle} isMobile={isMobile} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col lg:overflow-y-auto scrollbar-hide lg:h-full">
          {/* Header */}
          <OrganizerHeader
            onMenuToggle={isMobile ? handleMobileMenuClick : undefined}
          />

          {/* Page Content */}
          <main className="flex-1 px-4 sm:px-6 pt-6 pb-6">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {organizerRoutes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      route.allowedRoles ? (
                        <ProtectedRoute allowedRoles={route.allowedRoles}>
                          {route.element}
                        </ProtectedRoute>
                      ) : (
                        route.element
                      )
                    }
                  />
                ))}
              </Routes>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={handleSidebarToggle}></div>
          <div className="fixed left-0 top-0 h-full w-[80vw] max-w-64 z-50">
            <OrganizerSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} isMobile={isMobile} />
          </div>
        </div>
      )}

    </div>
  );
};

export default OrganizerLayout;



