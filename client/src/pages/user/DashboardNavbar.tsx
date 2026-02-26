import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "../../components/ui/button";
import Logo from '@/components/Logo';
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "../../components/ThemeToggle";
import { UserRole } from "@/types/auth";

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

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ user }) => {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getDashboardRoute = async () => {
    if (!authUser) return '/user/dashboard';
    
    const roleToUse = authUser.role;
    
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(roleToUse);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(roleToUse);
    
    if (isAdminRole) return '/admin/dashboard';
    if (isOrganizerRole) return '/user/dashboard';
    return '/user/dashboard';
  };

  const menuItems = [
    {
      label: "Settings",
      icon: Settings,
      onClick: () => navigate("/user/dashboard?view=settings"),
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
      <div className="container mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Logo />

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Home */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                {user.initials}
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => { item.onClick(); setIsOpen(false); }}
                          className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                        >
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-border py-1">
                      <button
                        onClick={async () => { 
                          const route = await getDashboardRoute();
                          navigate(route);
                          setIsOpen(false); 
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                        Dashboard
                      </button>
                    </div>

                    <div className="border-t border-border py-1">
                      <button
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
