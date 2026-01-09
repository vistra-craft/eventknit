import React, { useState } from "react";
import { Menu, User, ChevronDown, LogOut, Shield, AlertTriangle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../../components/NotificationBell";
import { ThemeToggle } from "../../components/ThemeToggle";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMenuToggle
}) => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Format user data from auth context
  const userName = authUser ? `${authUser.firstName} ${authUser.lastName}` : "Admin User";
  const userEmail = authUser?.email || "";
  const userRole = authUser?.role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || "Administrator";

  const handleLogout = () => {
    // Use proper logout function from useAuth
    logout();
  };

  return (
    <header className="bg-card border-b border-border py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Welcome back, {userName}
              </p>
            </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* System Alerts */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-muted-foreground hover:bg-muted transition-colors"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </Button>
          
          {/* Notifications */}
          <NotificationBell />
          
          {/* Profile Dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{userName}</p>
                      <p className="text-sm text-muted-foreground">{userEmail}</p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        {userRole}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/admin/profile');
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>View Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/admin/settings');
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Settings</span>
                  </button>
                  
                  <div className="border-t border-border my-2"></div>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

