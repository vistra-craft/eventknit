import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Home,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  Calendar,
  Badge,
  Heart,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import Logo from '@/components/Logo';
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../../components/NotificationBell";
import ThemeToggle from "../../components/ThemeToggle";

interface User {
  name: string;
  email: string;
  initials: string;
}

interface DashboardNavbarProps {
  user: User;
  activeSection: string;
  eventTitle?: string;
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ user, activeSection, eventTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Navigation items for mobile and secondary navigation
  const navigationItems = [
    { key: "home", label: "Dashboard", icon: Home },
    { key: "my-events", label: "My Events", icon: Calendar },
    { key: "tickets", label: "My Tickets", icon: Badge },
    { key: "saved", label: "Saved Events", icon: Heart },
  ];

  const handleNavigation = (section: string) => {
    const currentPath = location.pathname;
    const newUrl = `${currentPath}?section=${section}`;
    navigate(newUrl);
  };

  const handleLogout = () => {
    // Use proper logout function from useAuth
    logout();
  };

  // No longer need special navigation buttons - using simpler structure

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm h-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row - Main Navbar Content */}
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo and Event Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo />
              {eventTitle && (
                <>
                  <span className="text-muted-foreground mx-2">&gt;</span>
                  <span className="text-lg font-medium text-foreground">{eventTitle}</span>
                </>
              )}
            </Link>
          </div>

          {/* Right Side - Icons and Profile */}
          <div className="flex items-center space-x-4">
            {/* Mobile Navigation Menu */}
            <div className="lg:hidden">
              <Button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </div>

            {/* Home Icon */}
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
            </Button>

            {/* Message Icon */}
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative">
              <Button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="relative h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 p-0"
              >
                {user.initials}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card"></div>
              </Button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border border-border py-3 z-50">
                  <div className="flex items-center gap-3 px-4 pb-3 border-b border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{user.initials}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                    </div>
                  </div>

                  <div className="px-4 py-2">
                    <button className="w-full text-left text-sm text-foreground hover:bg-muted py-2 px-2 rounded-lg">
                      Edit profile &gt;
                    </button>
                  </div>

                  <div className="border-t border-border my-2"></div>

                  <div className="px-4 py-2 space-y-2">
                    <button className="w-full text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 py-2 px-2 rounded-lg">
                      <Calendar className="h-4 w-4" />
                      My schedule
                    </button>
                    <button className="w-full text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 py-2 px-2 rounded-lg">
                      <FileText className="h-4 w-4" />
                      My bookmarks
                    </button>
                  </div>

                  <div className="border-t border-border my-2"></div>

                  <div className="px-4 py-2 space-y-2">
                    <button className="w-full text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 py-2 px-2 rounded-lg">
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button className="w-full text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 py-2 px-2 rounded-lg">
                      <MessageCircle className="h-4 w-4" />
                      Contact app support
                    </button>
                    <button className="w-full text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 py-2 px-2 rounded-lg">
                      <HelpCircle className="h-4 w-4" />
                      Resource center
                    </button>
                    <button className="w-full text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 py-2 px-2 rounded-lg">
                      <FileText className="h-4 w-4" />
                      Legal &gt;
                    </button>
                  </div>

                  <div className="border-t border-border my-2"></div>

                  <div className="px-4 py-2">
                    <button
                      className="w-full text-left text-sm text-destructive hover:text-destructive/80 flex items-center gap-2 py-1"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileNavOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border border-border py-3 z-50 lg:hidden">
                <div className="px-4 pb-3 border-b border-border">
                  <h3 className="font-medium text-foreground">Navigation</h3>
                </div>
                <div className="px-4 py-2 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          handleNavigation(item.key);
                          setIsMobileNavOpen(false);
                        }}
                        className={`w-full text-left text-sm flex items-center gap-2 py-2 px-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
