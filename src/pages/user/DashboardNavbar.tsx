import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  MessageCircle,
  Home,
  User,
  Settings,
  Users,
  HelpCircle,
  FileText,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "../../components/ui/button";

interface User {
  name: string;
  email: string;
  initials: string;
}

interface DashboardNavbarProps {
  user: User;
  activeSection: string;
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ user, activeSection }) => {
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navigationItems = [
    { id: "home", label: "Home", href: "/user/dashboard?section=home" },
    {
      id: "speakers",
      label: "Speakers",
      href: "/user/dashboard?section=speakers",
    },
    {
      id: "exhibitors",
      label: "Exhibitors",
      href: "/user/dashboard?section=exhibitors",
    },
    { id: "agenda", label: "Agenda", href: "/user/dashboard?section=agenda" },
    {
      id: "abstracts",
      label: "Submit Abstract",
      href: "/user/dashboard?section=abstracts",
    },
    {
      id: "networking",
      label: "Networking",
      href: "/user/dashboard?section=networking",
    },
    {
      id: "notifications",
      label: "Notifications",
      href: "/user/dashboard?section=notifications",
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/user/dashboard?section=analytics",
    },
    {
      id: "my-event",
      label: "My Event",
      href: "/user/dashboard?section=my-event",
    },
    {
      id: "my-badge",
      label: "My Badge",
      href: "/user/dashboard?section=my-badge",
    },
  ];

  const handleLogout = () => {
    // Handle logout logic here
    console.log("Logging out...");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-foreground">
                EventKnit
              </span>
            </Link>
          </div>

          {/* Right Side - Icons and Profile */}
          <div className="flex items-center space-x-4">
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
            <div className="relative">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent-electric text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <Button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="relative h-10 w-10 rounded-full bg-accent-neon text-primary hover:bg-accent-neon/80 p-0"
              >
                {user.initials}
              </Button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-card border border-border py-2 z-50">
                  <div className="flex items-center justify-start gap-2 p-2 border-b border-border">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    My Contacts
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Resource Center
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact App Support
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Legal
                  </button>

                  <div className="border-t border-border my-1"></div>

                  <button
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted flex items-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="border-t border-border">
          <div className="flex space-x-8 overflow-x-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === item.id
                    ? "border-accent-neon text-accent-neon"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
