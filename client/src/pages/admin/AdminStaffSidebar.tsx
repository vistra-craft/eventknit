import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Settings,
  Home,
  Menu,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Monitor,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import Logo from '@/components/Logo';

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
  const { user } = useAuth();
  const userRole = user?.role;

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    events: location.pathname.startsWith('/admin/events'),
    workstation: location.pathname.startsWith('/admin/service-point'),
  });

  // Base navigation items - all admin staff can see these
  const baseNavigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: Home,
      group: 'main',
    },
    {
      id: 'events',
      label: 'My Events',
      icon: Calendar,
      group: 'main',
      children: [
        { name: 'Upcoming Events', href: '/admin/events/upcoming' },
      ],
    },
  ];

  // Role-specific navigation items
  const getRoleSpecificItems = () => {
    if (!userRole) return [];

    switch (userRole) {
      case UserRole.TELLER:
        return [
          {
            id: 'workstation',
            label: 'Service Point',
            icon: Monitor,
            group: 'main',
            children: [
              { name: 'Events Overview', href: '/admin/service-point' },
              { name: 'QR Scanner', href: '/admin/service-point/scanner' },
              { name: 'Scan History', href: '/admin/service-point/history' },
            ],
          },
        ];

      case UserRole.MARKETER:
        return [
          {
            id: 'analytics',
            label: 'Analytics',
            icon: TrendingUp,
            group: 'main',
            children: [
              { name: 'Event Performance', href: '/admin/analytics/events' },
            ],
          },
        ];

      case UserRole.SUPPORT:
        return [
          {
            id: 'support',
            label: 'Support',
            icon: Settings,
            group: 'main',
            children: [
              { name: 'Support Inbox', href: '/admin/support' },
            ],
          },
        ];

      case UserRole.ADMIN_STAFF:
      case UserRole.SUPERADMIN:
        // Full admin sidebar - handled by AdminSidebar
        return [];

      default:
        return [];
    }
  };

  const navigationItems = [...baseNavigationItems, ...getRoleSpecificItems()];

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
      workstation: location.pathname.startsWith('/admin/service-point'),
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

  return (
    <div
      className={`bg-background border-r border-border ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col flex-shrink-0 lg:sticky lg:top-0 lg:h-screen`}
    >
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
                      to={'href' in item ? item.href : '#'}
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
  );
};

export default AdminStaffSidebar;



