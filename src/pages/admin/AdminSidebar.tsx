import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  MessageCircle,
  Home,
  Menu,
  Users,
  Megaphone,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Shield,
  Database,
  DollarSign,
  HeadphonesIcon,
  Monitor,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    // Auto-expand events section if on events pages
    events: location.pathname.startsWith('/admin/events'),
    // Auto-expand marketing section if on marketing pages
    marketing: location.pathname.startsWith('/admin/marketing'),
    // Auto-expand finance section if on finance pages
    finance: location.pathname.startsWith('/admin/finance'),
    // Auto-expand users section if on users pages
    users: location.pathname.startsWith('/admin/users')
  });

  const navigationItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      href: "/admin/dashboard", 
      icon: Home,
      group: "main"
    },
    { 
      id: "events", 
      label: "Events", 
      icon: Calendar,
      group: "main",
      children: [
        { name: "All Events", href: "/admin/events" },
        { name: "Pending Approval", href: "/admin/events/pending" },
        { name: "Featured Events", href: "/admin/events/featured" },
        { name: "Past Events", href: "/admin/events/past" },
        { name: "Upcoming Events", href: "/admin/events/upcoming" },
        { name: "Declined Events", href: "/admin/events/declined" },
      ]
    },
    { 
      id: "users", 
      label: "Users", 
      icon: Users,
      group: "main",
      children: [
        { name: "Staff", href: "/admin/users/staff" },
        { name: "Organizers", href: "/admin/users/organizers" },
        { name: "User Roles", href: "/admin/users/roles" },
      ]
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: TrendingUp,
      group: "main",
      children: [
        { name: "Platform Overview", href: "/admin/analytics" },
        { name: "Event Analytics", href: "/admin/analytics/events" },
        { name: "User Analytics", href: "/admin/analytics/users" },
        { name: "Revenue Analytics", href: "/admin/analytics/revenue" },
        { name: "System Metrics", href: "/admin/analytics/system" },
      ]
    },
    { 
      id: "marketing", 
      label: "Marketing", 
      icon: Megaphone,
      group: "main",
      children: [
        { name: "Overview", href: "/admin/marketing" },
        { name: "Campaigns", href: "/admin/marketing/campaigns" },
        { name: "Social Media", href: "/admin/marketing/social" },
        { name: "Email Marketing", href: "/admin/marketing/email" },
        { name: "Promotions", href: "/admin/marketing/promotions" },
        { name: "Partnerships", href: "/admin/marketing/partnerships" },
      ]
    },
    { 
      id: "workstation", 
      label: "Workstation", 
      icon: Monitor,
      group: "management",
      children: [
        { name: "Events Overview", href: "/admin/workstation" },
        { name: "Event Management", href: "/admin/workstation/events" },
        { name: "QR Scanner", href: "/admin/workstation/scanner" },
        { name: "Print Center", href: "/admin/workstation/print" },
        { name: "Template Editor", href: "/admin/workstation/templates" },
        { name: "Scan History", href: "/admin/workstation/history" },
      ]
    },
    { 
      id: "moderation", 
      label: "Moderation", 
      href: "/admin/moderation", 
      icon: Shield,
      group: "management"
    },
    { 
      id: "communications", 
      label: "Communications", 
      href: "/admin/communications", 
      icon: MessageCircle,
      group: "management"
    },
    { 
      id: "support", 
      label: "Support", 
      href: "/admin/support", 
      icon: HeadphonesIcon,
      group: "management"
    },
    { 
      id: "finance", 
      label: "Finance", 
      icon: DollarSign,
      group: "management",
      children: [
        { name: "Dashboard", href: "/admin/finance" },
        { name: "Expenses", href: "/admin/finance/expenses" },
        { name: "Income", href: "/admin/finance/income" },
        { name: "Wages", href: "/admin/finance/wages" },
        { name: "Transactions", href: "/admin/finance/transactions" },
      ]
    },
    { 
      id: "system", 
      label: "System", 
      icon: Database,
      group: "management",
      children: [
        { name: "System Health", href: "/admin/system/health" },
        { name: "Database", href: "/admin/system/database" },
        { name: "Logs", href: "/admin/system/logs" },
        { name: "Backups", href: "/admin/system/backups" },
        { name: "Maintenance", href: "/admin/system/maintenance" },
      ]
    },
    { 
      id: "settings", 
      label: "Settings", 
      href: "/admin/settings", 
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
      events: location.pathname.startsWith('/admin/events'),
      marketing: location.pathname.startsWith('/admin/marketing'),
      finance: location.pathname.startsWith('/admin/finance'),
      users: location.pathname.startsWith('/admin/users')
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
          {isOpen && <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>}
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
                          ? 'bg-primary/10 text-primary font-medium' 
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

export default AdminSidebar;

