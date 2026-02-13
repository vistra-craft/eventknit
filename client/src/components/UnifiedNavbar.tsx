/**
 * Unified Navbar Component
 * Enhanced navigation bar with mode awareness
 * Supports both Attending and Organizing modes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, User, Ticket, Heart, Plus, BarChart3, type LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import Logo from './Logo';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { ModeToggle } from './ModeToggle';
import { useDashboardMode } from '../contexts/DashboardModeContext';
import { NAV_LABELS, CTA_LABELS } from '../constants/navigationLabels';

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
    const baseItems: MenuItem[] = [
      { label: NAV_LABELS.MY_EVENTS, icon: Home, onClick: () => navigate('/user/dashboard') },
      { label: NAV_LABELS.MY_TICKETS, icon: Ticket, onClick: () => navigate('/user/tickets') },
      { label: NAV_LABELS.SAVED, icon: Heart, onClick: () => navigate('/user/saved') },
    ];

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

          {/* Center - Mode Toggle (Desktop only, if can organize) */}
          {canOrganize && (
            <div className="hidden md:flex">
              <ModeToggle />
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Create Event Button - visible to all users */}
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/user/create-event')}
              className="hidden sm:flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform duration-200"
              aria-label={CTA_LABELS.CREATE_EVENT}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">{CTA_LABELS.CREATE_EVENT}</span>
              <span className="lg:hidden">Create</span>
            </Button>

            {/* Home */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
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

                    {/* Mode Toggle (Mobile only, if can organize) */}
                    {canOrganize && (
                      <div className="md:hidden px-3 py-2 border-b border-border">
                        <ModeToggle showLabels={true} />
                      </div>
                    )}

                    <div className="py-1">
                      {/* Create Event (Mobile) */}
                      <button
                        onClick={() => { navigate('/user/create-event'); setIsOpen(false); }}
                        className="sm:hidden w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors duration-150 focus:outline-none focus:bg-muted"
                        aria-label={CTA_LABELS.CREATE_EVENT}
                      >
                        <Plus className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">{CTA_LABELS.CREATE_EVENT}</span>
                      </button>

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
