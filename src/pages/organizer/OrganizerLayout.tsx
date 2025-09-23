import React, { useState } from "react";
import OrganizerSidebar from "./OrganizerSidebar";
import OrganizerHeader from "./OrganizerHeader";
import Footer from "@/components/Footer";

interface OrganizerLayoutProps {
  children: React.ReactNode;
}

const OrganizerLayout: React.FC<OrganizerLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <OrganizerSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
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
      <div className="lg:hidden">
        <OrganizerSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default OrganizerLayout;


