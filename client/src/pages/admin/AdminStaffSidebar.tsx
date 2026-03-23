import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Home,
  Menu,
  ChevronDown,
  ChevronRight,
  Monitor,
  HeadphonesIcon,
  Megaphone,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import Logo from '@/components/layout/Logo';

interface AdminStaffSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const AdminStaffSidebar: React.FC<AdminStaffSidebarProps> = ({
  isOpen,
  onToggle,
  isMobile = false,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const userRole = user?.role;

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    events: location.pathname.startsWith('/admin/events'),
    workstation: location.pathname.startsWith('/admin/event-day'),
    support: location.pathname.startsWith('/admin/support') || location.pathname.startsWith('/admin/communications') || location.pathname === '/admin/feedback' || location.pathname === '/admin/flagged-events',
    marketing: location.pathname.startsWith('/admin/marketing') || location.pathname === '/admin/white-label',
  });

  // Build navigation based on role
  const getNavigationItems = () => {
    const items: Array<{
      id: string;
      label: string;
      href?: string;
      icon: React.ComponentType<{ className?: string }>;
      group: string;
      children?: Array<{ name: string; href: string }>;
    }> = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: Home,
        group: 'main',
      },
    ];

    if (userRole === UserRole.SUPPORT) {
      // SUPPORT: Dashboard, Events (read-only), Users (read-only), Support, Marketing
      items.push(
        {
          id: 'events',
          label: 'Events',
          icon: Calendar,
          group: 'main',
          children: [
            { name: 'All Events', href: '/admin/events' },
            { name: 'Upcoming Events', href: '/admin/events/upcoming' },
          ],
        },
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          group: 'main',
          children: [
            { name: 'All Users', href: '/admin/users' },
          ],
        },
        {
          id: 'support',
          label: 'Support',
          icon: HeadphonesIcon,
          group: 'operations',
          children: [
            { name: 'Support Services', href: '/admin/support' },
            { name: 'Communications', href: '/admin/communications' },
            { name: 'Platform Feedback', href: '/admin/feedback' },
            { name: 'Flagged Events', href: '/admin/flagged-events' },
            { name: 'Notification Settings', href: '/admin/notification-settings' },
          ],
        },
        {
          id: 'marketing',
          label: 'Marketing',
          icon: Megaphone,
          group: 'operations',
          children: [
            { name: 'Social Media', href: '/admin/marketing/social' },
            { name: 'White Label', href: '/admin/white-label' },
          ],
        },
      );
    } else if (userRole === UserRole.TELLER) {
      // TELLER: Dashboard, Event Day Hub only
      items.push({
        id: 'workstation',
        label: 'Event Day Hub',
        icon: Monitor,
        group: 'main',
        children: [
          { name: 'Select Event', href: '/admin/event-day' },
          { name: 'QR Scanner', href: '/admin/event-day/scanner' },
          { name: 'Print Center', href: '/admin/event-day/print' },
          { name: 'Scan History', href: '/admin/event-day/history' },
        ],
      });
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleNavigationClick = () => {
    if (isMobile) {
      onToggle();
    }
  };

  useEffect(() => {
    setExpandedItems((prev) => ({
      ...prev,
      events: location.pathname.startsWith('/admin/events'),
      workstation: location.pathname.startsWith('/admin/event-day'),
      support: location.pathname.startsWith('/admin/support') || location.pathname.startsWith('/admin/communications') || location.pathname === '/admin/feedback' || location.pathname === '/admin/flagged-events',
      marketing: location.pathname.startsWith('/admin/marketing') || location.pathname === '/admin/white-label',
    }));
  }, [location.pathname]);

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const isChildActive = (href: string) => {
    return location.pathname === href;
  };

  const groupedItems = navigationItems.reduce(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof navigationItems>,
  );

  const groupLabels = {
    main: 'Main',
    management: 'Management',
    account: 'Account',
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className={`bg-card-surface border-r border-border ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col h-screen`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="p-4">
        <div
          className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} mb-6`}
        >
          {isOpen ? (
            <Logo to="/" />
          ) : (
            <Logo to="/" textOnly={true} className="text-lg" />
          )}
          {isMobile && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground"
            >
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-4">
          {Object.entries(groupedItems).map(([groupKey, items]) => (
            <div key={groupKey}>
              {isOpen && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {groupLabels[groupKey as keyof typeof groupLabels]}
                </h3>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedItems[item.id];
                  const isItemActive = 'href' in item && item.href ? isActive(item.href, true) : false;

                  if (hasChildren) {
                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className={`w-full flex items-center ${isOpen ? 'space-x-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                            isItemActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                          }`}
                          title={!isOpen ? item.label : undefined}
                        >
                          <item.icon className={`${isOpen ? 'h-5 w-5' : 'h-6 w-6'}`} />
                          {isOpen && (
                            <>
                              <span className="text-sm font-medium flex-1 text-left">
                                {item.label}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </>
                          )}
                        </button>

                        {isExpanded && isOpen && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children!.map((child) => (
                              <Link
                                key={child.name}
                                to={child.href}
                                onClick={handleNavigationClick}
                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                  isChildActive(child.href)
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                                }`}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      to={item.href ?? '#'}
                      onClick={handleNavigationClick}
                      className={`flex items-center ${isOpen ? 'space-x-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                        isItemActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                      }`}
                      title={!isOpen ? item.label : undefined}
                    >
                      <item.icon className={`${isOpen ? 'h-5 w-5' : 'h-6 w-6'}`} />
                      {isOpen && (
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      </div>

      {/* Sign out button */}
      <div className="p-4 border-t mt-2">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center ${
            isOpen ? 'space-x-3 px-3 justify-start' : 'justify-center px-2'
          } py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors`}
          title={!isOpen ? 'Sign out' : undefined}
        >
          <LogOut className={`${isOpen ? 'h-5 w-5' : 'h-6 w-6'}`} />
          {isOpen && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminStaffSidebar;



