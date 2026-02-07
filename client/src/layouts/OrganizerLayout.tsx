import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import OrganizerSidebar from "../pages/organizer/OrganizerSidebar";
import OrganizerHeader from "../pages/organizer/OrganizerHeader";
import { organizerRoutes } from '../routes/organizerRoutes';
import { ProtectedRoute } from '../components/ProtectedRoute';

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
      <div className="max-w-7xl w-full mx-auto flex flex-1 lg:h-full lg:overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-hidden">
          <OrganizerSidebar isOpen={true} onToggle={handleSidebarToggle} isMobile={isMobile} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col lg:overflow-y-auto scrollbar-hide lg:h-full">
          {/* Header */}
          <div className="px-4 sm:px-6">
            <OrganizerHeader
              onMenuToggle={isMobile ? handleMobileMenuClick : undefined}
            />
          </div>

          {/* Page Content */}
          <main className="flex-1 px-4 sm:px-6 pt-6 pb-6">
            <Suspense fallback={<LoadingSpinner />}>
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
          <div className="fixed left-0 top-0 h-full w-64 z-50">
            <OrganizerSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} isMobile={isMobile} />
          </div>
        </div>
      )}
      
    </div>
  );
};

export default OrganizerLayout;



