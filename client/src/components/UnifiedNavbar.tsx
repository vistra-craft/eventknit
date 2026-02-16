/**
 * Unified Navbar Component
 * Enhanced navigation bar with mode awareness
 * Supports both Attending and Organizing modes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, BarChart3, type LucideIcon } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { useDashboardMode } from '../hooks/useDashboardMode';
import { NAV_LABELS } from '../constants/navigationLabels';

interface MenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface UnifiedNavbarProps {
  user: User;
  activeSection: string;
  eventTitle?: string;
}

const UnifiedNavbar = ({ user }: UnifiedNavbarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, canOrganize } = useDashboardMode();
  const [isOpen, setIsOpen] = useState(false);

  // Menu items - context aware based on mode
  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [];

    // Add organizing-specific items if in organizing mode
    if (mode === 'organizing' && canOrganize) {
      baseItems.push(
        { label: NAV_LABELS.ANALYTICS, icon: BarChart3, onClick: () => navigate('/user/analytics') }
      );
    }

    baseItems.push(
      { label: NAV_LABELS.PROFILE, icon: User, onClick: () => navigate('/user/profile') }
    );

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
      <div className="container mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Logo />

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center hover:bg-primary/20 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
                aria-label="User menu"
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                {user.initials}
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => { item.onClick(); setIsOpen(false); }}
                          className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors duration-150 focus:outline-none focus:bg-muted"
                          aria-label={item.label}
                        >
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-border py-1">
                      <button
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors duration-150 focus:outline-none focus:bg-destructive/10"
                        aria-label="Log out"
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

export default UnifiedNavbar;
