import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import OrganizerSidebar from "../pages/organizer/OrganizerSidebar";
import OrganizerHeader from "../pages/organizer/OrganizerHeader";
import { organizerRoutes } from '../routes/organizerRoutes';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { SkeletonPageHeader, SkeletonMetricCard, SkeletonGroup } from '../components/ui/Skeleton';
import { useOrganizerApproval } from '../hooks/useOrganizerApproval';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

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

const OrganizerLayout: React.FC = () => {
  const navigate = useNavigate();
  const { showApprovalModal, handleApprovalAcknowledged } = useOrganizerApproval();
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
    <>
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
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-pulse" />
            <div className="relative px-8 pt-10 pb-8 text-center">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center ring-4 ring-primary/10">
                <Sparkles className="w-9 h-9 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                You&apos;re Approved!
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Your event has been reviewed and approved. Your organizer dashboard is now fully unlocked.
              </p>
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
          <div className="fixed left-0 top-0 h-full w-64 z-50">
            <OrganizerSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} isMobile={isMobile} />
          </div>
        </div>
      )}

    </div>
    </>
  );
};

export default OrganizerLayout;



