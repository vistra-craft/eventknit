import React, { useState } from "react";
import { Menu, User, ChevronDown, LogOut, Shield, AlertTriangle, Moon, Sun } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import NotificationBell from "../../components/NotificationBell";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  onMenuToggle
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Mock admin user data - replace with actual user data
  const user = {
    name: "Admin User",
    email: "admin@eventknit.com",
    role: "System Administrator",
    avatar: null
  };

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
                Welcome back, {user.name}
              </p>
            </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:bg-accent-coral hover:text-white transition-colors"
            title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
          >
            {resolvedTheme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* System Alerts */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-muted-foreground hover:bg-accent-coral hover:text-white transition-colors"
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
              className="flex items-center space-x-2 hover:bg-accent-coral hover:text-white transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
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
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
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
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-primary hover:bg-accent-coral hover:text-white rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>View Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/admin/settings');
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-primary hover:bg-accent-coral hover:text-white rounded-lg transition-colors"
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

