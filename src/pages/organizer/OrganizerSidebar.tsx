import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  MessageCircle,
  Home,
  Menu,
  UserPlus,
  Megaphone,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface OrganizerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    // Auto-expand events section if on events pages
    events: location.pathname.startsWith('/organizer/events')
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
        { name: "Templates", href: "/organizer/events/templates" },
        { name: "Drafts", href: "/organizer/events/drafts" },
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
      ]
    },
    { 
      id: "communications", 
      label: "Communications", 
      href: "/organizer/communications", 
      icon: MessageCircle,
      group: "management"
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
      id: "marketing", 
      label: "Marketing", 
      icon: Megaphone,
      group: "management",
      children: [
        { name: "Campaigns", href: "/organizer/marketing/campaigns" },
        { name: "Social Media", href: "/organizer/marketing/social" },
        { name: "Email Marketing", href: "/organizer/marketing/email" },
        { name: "Promotions", href: "/organizer/marketing/promotions" },
        { name: "Partnerships", href: "/organizer/marketing/partnerships" },
      ]
    },
    { 
      id: "settings", 
      label: "Settings", 
      href: "/organizer/settings", 
      icon: Settings,
      group: "account"
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Handle navigation clicks - only close sidebar on mobile
  const handleNavigationClick = () => {
    if (isMobile) {
      onToggle();
    }
  };

  // Update expanded state when location changes
  useEffect(() => {
    setExpandedItems(prev => ({
      ...prev,
      events: location.pathname.startsWith('/organizer/events')
    }));
  }, [location.pathname]);

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

  return (
    <div className={`bg-card border-r border-border ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col`}>
      <div className="p-4">
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} mb-6`}>
          {isOpen && <h2 className="text-lg font-semibold text-foreground">EventKnit</h2>}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
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
  );
};

export default OrganizerSidebar;
