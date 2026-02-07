import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import AdminSidebar from "../pages/admin/AdminSidebar";
import AdminHeader from "../pages/admin/AdminHeader";
import { adminRoutes } from '../routes/adminRoutes';
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

const AdminLayout: React.FC = () => {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main layout area (sidebar + header + page content) */}
      <div className="w-full flex flex-1">
        {/* Sidebar - fixed within the max-w container */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <div className="lg:fixed lg:w-64 lg:h-screen lg:overflow-hidden">
            <AdminSidebar isOpen={true} onToggle={handleSidebarToggle} isMobile={isMobile} />
          </div>
        </div>

        {/* Main Content - scrollable area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 flex-shrink-0">
            <AdminHeader
              onMenuToggle={isMobile ? handleMobileMenuClick : undefined}
            />
          </div>

          {/* Page Content */}
          <main className="flex-1 px-4 sm:px-6 pt-6 pb-6">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {adminRoutes.map((route, index) => (
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
            <AdminSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} isMobile={isMobile} />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLayout;
