import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  Home,
  Menu,
  Users,
  Megaphone,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  DollarSign,
  HeadphonesIcon,
  Monitor,
  LogOut,
  Ticket,
  ShieldCheck,
  CreditCard,
  Server,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import AdminStaffSidebar from "./AdminStaffSidebar";
import Logo from '@/components/layout/Logo';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const { user, logout } = useAuth();
  const userRole = user?.role;
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    events: location.pathname.startsWith('/admin/events'),
    marketing: location.pathname.startsWith('/admin/marketing'),
    finance: location.pathname.startsWith('/admin/finance'),
    tickets: location.pathname.startsWith('/admin/tickets'),
    subscriptions: location.pathname.startsWith('/admin/subscriptions'),
    users: location.pathname.startsWith('/admin/users') || location.pathname.startsWith('/admin/staff-performance'),
    kyc: location.pathname.startsWith('/admin/kyc'),
    communications: location.pathname.startsWith('/admin/communications') || location.pathname === '/admin/notifications',
    settings: location.pathname.startsWith('/admin/settings') || location.pathname === '/admin/notification-settings' || location.pathname === '/admin/white-label',
    support: location.pathname.startsWith('/admin/support') || location.pathname === '/admin/feedback' || location.pathname === '/admin/flagged-events' || location.pathname === '/admin/careers',
    workstation: location.pathname.startsWith('/admin/event-day'),
    system: location.pathname.startsWith('/admin/system'),
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
        { name: "Recalled Events", href: "/admin/events/recalled" },
      ]
    },
    { 
      id: "users", 
      label: "Users", 
      icon: Users,
      group: "main",
      children: [
        { name: "All Users", href: "/admin/users" },
        { name: "Staff", href: "/admin/users/staff" },
        { name: "Staff Performance", href: "/admin/staff-performance" },
        { name: "Organizers", href: "/admin/users/organizers" },
        { name: "Attendees", href: "/admin/users/attendees" },
        { name: "User Roles", href: "/admin/users/roles" },
      ]
    },
    {
      id: "kyc",
      label: "KYC Review",
      icon: ShieldCheck,
      group: "main",
      children: [
        { name: "Submissions", href: "/admin/kyc" },
        { name: "Entity Management", href: "/admin/kyc/entity-management" },
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
      id: "finance",
      label: "Finance",
      icon: DollarSign,
      group: "main",
      children: [
        { name: "Overview", href: "/admin/finance" },
        { name: "Event Finance", href: "/admin/finance/events" },
        { name: "Payment Transactions", href: "/admin/finance/payments" },
        { name: "Disbursements", href: "/admin/finance/disbursements" },
        { name: "Refunds", href: "/admin/finance/refunds" },
        { name: "Reconciliation", href: "/admin/finance/reconciliation" },
        { name: "Expenses", href: "/admin/finance/expenses" },
        { name: "Income", href: "/admin/finance/income" },
        { name: "Salaries", href: "/admin/finance/wages" },
        { name: "Income Statement", href: "/admin/finance/income-statement" },
        { name: "Platform Fees", href: "/admin/finance/platform-fees" },
        { name: "Resale & Transfers", href: "/admin/finance/resale-transfers" },
      ]
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: CreditCard,
      href: "/admin/subscriptions",
      group: "main",
    },
    {
      id: "tickets",
      label: "Tickets",
      icon: Ticket,
      group: "main",
      children: [
        { name: "Advanced Ticket Types", href: "/admin/tickets/advanced" },
        { name: "Dynamic Pricing", href: "/admin/tickets/pricing" },
        { name: "Ticket Issuances", href: "/admin/tickets/issuances" },
        { name: "Promo Codes", href: "/admin/tickets/promo-codes" },
      ]
    },
    // ── Marketing ──
    {
      id: "marketing",
      label: "Marketing",
      icon: Megaphone,
      group: "marketing",
      children: [
        // TODO: Re-enable when backend is ready
        // { name: "Overview", href: "/admin/marketing" },
        // { name: "Campaigns", href: "/admin/marketing/campaigns" },
        { name: "Social Media", href: "/admin/marketing/social" },
        // { name: "Email Marketing", href: "/admin/marketing/email" },
        // { name: "Promotions", href: "/admin/marketing/promotions" },
        // { name: "Affiliate Program", href: "/admin/marketing/affiliate" },
        // { name: "Partnerships", href: "/admin/marketing/partnerships" },
      ]
    },
    // ── Operations ──
    {
      id: "managed-events",
      label: "Managed Events",
      href: "/admin/managed-events",
      icon: Calendar,
      group: "operations",
    },
    {
      id: "workstation",
      label: "Event Day Hub",
      icon: Monitor,
      group: "operations",
      children: [
        { name: "Select Event", href: "/admin/event-day" },
        { name: "QR Scanner", href: "/admin/event-day/scanner" },
        { name: "Print Center", href: "/admin/event-day/print" },
        { name: "Template Editor", href: "/admin/event-day/templates" },
        { name: "Scan History", href: "/admin/event-day/history" },
      ]
    },
    {
      id: "communications",
      label: "Communications",
      icon: MessageSquare,
      group: "operations",
      children: [
        { name: "Notifications", href: "/admin/notifications" },
        { name: "Bulk Messaging", href: "/admin/communications" },
      ]
    },
    {
      id: "support",
      label: "Support",
      icon: HeadphonesIcon,
      group: "operations",
      children: [
        { name: "Support Services", href: "/admin/support" },
        { name: "Platform Feedback", href: "/admin/feedback" },
        { name: "Flagged Events", href: "/admin/flagged-events" },
        { name: "Career Interest", href: "/admin/careers" },
      ]
    },
    // ── System ──
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      group: "system",
      children: [
        { name: "Configuration", href: "/admin/settings" },
        { name: "Integrations", href: "/admin/settings/integrations" },
        { name: "Notification Settings", href: "/admin/notification-settings" },
        { name: "White Label", href: "/admin/white-label" },
      ]
    },
    {
      id: "system",
      label: "System",
      icon: Server,
      group: "system",
      superadminOnly: true,
      children: [
        { name: "Health", href: "/admin/system/health" },
        { name: "Database", href: "/admin/system/database" },
        { name: "Logs", href: "/admin/system/logs" },
        { name: "Backups", href: "/admin/system/backups" },
        { name: "Maintenance", href: "/admin/system/maintenance" },
      ]
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
      tickets: location.pathname.startsWith('/admin/tickets'),
      subscriptions: location.pathname.startsWith('/admin/subscriptions'),
      users: location.pathname.startsWith('/admin/users') || location.pathname.startsWith('/admin/staff-performance'),
      communications: location.pathname.startsWith('/admin/communications') || location.pathname === '/admin/notifications',
      settings: location.pathname.startsWith('/admin/settings') || location.pathname === '/admin/notification-settings' || location.pathname === '/admin/white-label',
      support: location.pathname.startsWith('/admin/support') || location.pathname === '/admin/feedback' || location.pathname === '/admin/flagged-events' || location.pathname === '/admin/careers',
      workstation: location.pathname.startsWith('/admin/event-day'),
      system: location.pathname.startsWith('/admin/system'),
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

  const isSuperAdmin = userRole === UserRole.SUPERADMIN;

  // Filter out superadmin-only items for non-superadmin users
  const visibleItems = navigationItems.filter(item => !('superadminOnly' in item && item.superadminOnly && !isSuperAdmin));

  const groupedItems = visibleItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  const groupLabels = {
    main: "Main",
    marketing: "Marketing",
    operations: "Operations",
    system: "System",
  };

  // Check if user is admin staff (not full admin)
  const isAdminStaff = userRole === UserRole.SUPPORT ||
                       userRole === UserRole.TELLER;

  const handleLogout = () => {
    logout();
  };

  // If admin staff, render role-specific sidebar
  if (isAdminStaff) {
    return <AdminStaffSidebar isOpen={isOpen} onToggle={onToggle} isMobile={isMobile} />;
  }

  return (
    <div
      className={`bg-card-surface border-r border-border ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col h-screen`}
    >
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
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
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
                                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
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
                                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
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
                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
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

export default AdminSidebar;

