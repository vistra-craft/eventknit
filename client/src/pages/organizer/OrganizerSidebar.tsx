import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  Home,
  Menu,
  UserPlus,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import OrganizerStaffSidebar from "./OrganizerStaffSidebar";
import Logo from "@/components/Logo";

interface OrganizerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const { user, logout } = useAuth();
  const userRole = user?.role;
  const location = useLocation();
  
  // Check if user is organizer staff (not full organizer)
  const isOrganizerStaff = userRole === UserRole.ORGANIZER_STAFF || 
                           userRole === UserRole.ORGANIZER_TELLER;

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    // Auto-expand events section if on events pages
    events: location.pathname.startsWith('/organizer/events'),
    // Auto-expand settings section if on settings pages
    settings: location.pathname.startsWith('/organizer/settings') || location.pathname.startsWith('/organizer/profile')
  });

  const navigationItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      href: "/organizer/dashboard", 
      icon: Home,
      group: "main"
    },
    { 
      id: "events", 
      label: "Events", 
      icon: Calendar,
      group: "main",
      children: [
        { name: "All Events", href: "/organizer/events" },
        { name: "Upcoming", href: "/organizer/events/upcoming" },
        { name: "Past Events", href: "/organizer/events/past" },
        { name: "Create New", href: "/organizer/events/create" },
        { name: "Event Templates", href: "/organizer/events/templates-management" },
        { name: "Event Drafts", href: "/organizer/events/drafts" },
      ]
    },
    { 
      id: "attendees", 
      label: "Attendees", 
      icon: Users,
      group: "main",
      children: [
        { name: "Segmentation", href: "/organizer/attendees/segmentation" },
        { name: "Tags", href: "/organizer/attendees/tags" },
        { name: "Communication", href: "/organizer/attendees/communication" },
      ]
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: TrendingUp,
      group: "main",
      children: [
        { name: "Overview", href: "/organizer/analytics" },
        { name: "Event Performance", href: "/organizer/analytics/events" },
        { name: "Attendee Insights", href: "/organizer/analytics/attendees" },
        { name: "Revenue Reports", href: "/organizer/analytics/revenue" },
        { name: "Marketing Analytics", href: "/organizer/analytics/marketing" },
      ]
    },
    { 
      id: "team", 
      label: "Team", 
      icon: UserPlus,
      group: "management",
      children: [
        { name: "Staff Management", href: "/organizer/team/staff" },
        { name: "Roles & Permissions", href: "/organizer/team/roles" },
        { name: "Team Calendar", href: "/organizer/team/calendar" },
        { name: "Performance", href: "/organizer/team/performance" },
      ]
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: Settings,
      group: "management",
      children: [
        { name: "Profile", href: "/organizer/settings/profile" },
        { name: "Notifications", href: "/organizer/settings/notifications" },
        { name: "Security", href: "/organizer/settings/security" },
        { name: "Appearance", href: "/organizer/settings/appearance" },
      ]
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Update expanded state when location changes
  useEffect(() => {
    if (!isOrganizerStaff) {
      setExpandedItems(prev => ({
        ...prev,
        events: location.pathname.startsWith('/organizer/events'),
        settings: location.pathname.startsWith('/organizer/settings') || location.pathname.startsWith('/organizer/profile')
      }));
    }
  }, [location.pathname, isOrganizerStaff]);

  // Handle navigation clicks - only close sidebar on mobile
  const handleNavigationClick = () => {
    if (isMobile) {
      onToggle();
    }
  };

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const isChildActive = (href: string) => {
    // For child items, use exact matching to prevent parent highlighting
    return location.pathname === href;
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  const groupLabels = {
    main: "Main",
    management: "Management", 
    account: "Account"
  };

  // If organizer staff, render role-specific sidebar (after all hooks)
  if (isOrganizerStaff) {
    return <OrganizerStaffSidebar isOpen={isOpen} onToggle={onToggle} isMobile={isMobile} />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`bg-card border-r border-border ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col flex-shrink-0 lg:sticky lg:top-0 lg:h-screen`}>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4">
          <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} mb-6`}>
          {isOpen ? (
            <Logo to="/" />
          ) : (
            <Logo to="/" textOnly={true} className="text-lg" />
          )}
          {isMobile && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
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
                  // For parent items with children, only highlight if we're on the exact parent route
                  const isItemActive = item.href ? isActive(item.href, true) : false;

                  if (hasChildren) {
                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className={`w-full flex items-center ${isOpen ? 'space-x-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                            isItemActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          title={!isOpen ? item.label : undefined}
                        >
                          <item.icon className={`${isOpen ? 'h-5 w-5' : 'h-6 w-6'}`} />
                          {isOpen && (
                            <>
                              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
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
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                      to={item.href!}
                      onClick={handleNavigationClick}
                      className={`flex items-center ${isOpen ? 'space-x-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                        isItemActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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

export default OrganizerSidebar;
