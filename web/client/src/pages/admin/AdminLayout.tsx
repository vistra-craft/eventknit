import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
    <div className="min-h-screen lg:min-h-0 lg:h-screen bg-background flex flex-col lg:overflow-hidden">
      {/* Main layout area (sidebar + header + page content) */}
      <div className="max-w-7xl w-full mx-auto flex flex-1 lg:h-full min-h-0 overflow-hidden">
        {/* Sidebar - fixed height, no scroll propagation */}
        <div className="hidden lg:flex w-64 flex-shrink-0 h-full overflow-hidden">
          <AdminSidebar isOpen={true} onToggle={handleSidebarToggle} isMobile={isMobile} />
        </div>

        {/* Main Content - scrollable area */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {/* Header - fixed */}
          <div className="px-4 sm:px-6 flex-shrink-0">
            <AdminHeader
              onMenuToggle={isMobile ? handleMobileMenuClick : undefined}
            />
          </div>

          {/* Page Content - scrollable */}
          <main className="flex-1 min-h-0 px-4 sm:px-6 pt-6 pb-6 overflow-y-auto scrollbar-hide">
            {children}
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

