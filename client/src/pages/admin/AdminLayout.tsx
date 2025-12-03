import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import Footer from "../../components/Footer";

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="container mx-auto flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 h-full">
          <AdminSidebar isOpen={true} onToggle={handleSidebarToggle} isMobile={isMobile} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Header */}
          <div className="px-4 sm:px-6 flex-shrink-0">
            <AdminHeader
              onMenuToggle={isMobile ? handleMobileMenuClick : undefined}
            />
          </div>

          {/* Page Content - Scrollable */}
          <main className="flex-1 px-4 sm:px-6 pt-6 pb-6 overflow-y-auto min-h-0">
            {children}
            {/* Footer inside scrollable content */}
            <div className="mt-8">
              <Footer />
            </div>
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

