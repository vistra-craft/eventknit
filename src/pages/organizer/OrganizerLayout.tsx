import React, { useState, useEffect } from "react";
import OrganizerSidebar from "./OrganizerSidebar";
import OrganizerHeader from "./OrganizerHeader";
import Footer from "../../components/Footer";

interface OrganizerLayoutProps {
  children: React.ReactNode;
}

const OrganizerLayout: React.FC<OrganizerLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if screen is mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Auto-close sidebar on mobile when navigating
  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <OrganizerSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <OrganizerHeader
            onMenuToggle={toggleSidebar}
          />

          {/* Page Content */}
          <main className="w-full">
            <div className="p-6">{children}</div>
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default OrganizerLayout;



