/**
 * Admin Layout
 * Following industry standards (GridArc, Smart Purchase, Vercel, Linear)
 * - Brand accent line at top
 * - Clean fixed sidebar
 * - Backdrop blur header
 * - Scrollable main content
 * - Max-width constraint on content area
 */

import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import AdminSidebar from "../pages/admin/AdminSidebar";
import AdminHeader from "../pages/admin/AdminHeader";
import { adminRoutes } from '../routes/adminRoutes';
import { ProtectedRoute } from '../components/ProtectedRoute';
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
 * Shows dashboard skeleton for listing/dashboard pages, spinner for form pages
 */
const LoadingFallback = () => {
  const path = window.location.pathname;

  // Form/create/edit pages — simple spinner
  if (path.includes('/create') || path.includes('/edit') || path.includes('/settings')) {
    return <SpinnerFallback />;
  }

  // Dashboard and listing pages — stats cards skeleton
  return <DashboardFallback />;
};

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobileSize = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileSize);

      // Auto-manage sidebar based on screen size
      if (isMobileSize) {
        setSidebarOpen(false);
      } else {
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
    <div className="h-screen min-h-full flex flex-col bg-background">
      {/* Brand accent line - At very top for visual polish */}
      <div className="flex-shrink-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <AdminSidebar isOpen={true} onToggle={handleSidebarToggle} isMobile={false} />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top Navigation */}
          <AdminHeader onMenuToggle={isMobile ? handleMobileMenuClick : undefined} />

          {/* Scrollable main content */}
          <main className="flex-1 overflow-auto scrollbar-hide">
            <div className="p-6 max-w-[1600px] mx-auto">
              <Suspense fallback={<LoadingFallback />}>
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
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleSidebarToggle}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border shadow-xl animate-slide-in-left">
            <AdminSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} isMobile={isMobile} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
