import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  Bell,
  MessageCircle,
  FileText,
  QrCode,
  DollarSign,
  TrendingUp,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Star,
  Award,
  Globe,
  MapPin,
  Home,
  User,
  HelpCircle,
  LogOut,
  Menu,
  Building2,
  ChevronRight,
} from "lucide-react";

interface OrganizerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  
  // Mock user data - replace with actual user data
  const user = {
    name: "John Doe",
    organization: "Tech Events Co.",
    avatar: null,
    eventsCount: 24,
    revenue: "$127,450"
  };

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
      href: "/organizer/events", 
      icon: Calendar,
      group: "main",
      badge: user.eventsCount
    },
    { 
      id: "attendees", 
      label: "Attendees", 
      href: "/organizer/attendees", 
      icon: Users,
      group: "main"
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      href: "/organizer/analytics", 
      icon: BarChart3,
      group: "main"
    },
    { 
      id: "tickets", 
      label: "Tickets", 
      href: "/organizer/tickets", 
      icon: QrCode,
      group: "management"
    },
    { 
      id: "communications", 
      label: "Communications", 
      href: "/organizer/communications", 
      icon: MessageCircle,
      group: "management"
    },
    { 
      id: "settings", 
      label: "Settings", 
      href: "/organizer/settings", 
      icon: Settings,
      group: "account"
    },
  ];

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
    <div className={`bg-card border-r border-border h-full ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">EventKnit</h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* User Profile Summary */}
        {isOpen && (
          <div className="mb-6 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  {user.organization}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-background rounded">
                <p className="font-medium text-foreground">{user.eventsCount}</p>
                <p className="text-muted-foreground">Events</p>
              </div>
              <div className="text-center p-2 bg-background rounded">
                <p className="font-medium text-foreground">{user.revenue}</p>
                <p className="text-muted-foreground">Revenue</p>
              </div>
            </div>
          </div>
        )}
        
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
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {isOpen && (
                        <>
                          <span className="text-sm font-medium flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="bg-accent-neon text-primary text-xs px-2 py-1 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      
      {/* Quick Actions */}
      {isOpen && (
        <div className="mt-auto p-4 border-t border-border">
          <Link
            to="/events/create"
            className="flex items-center space-x-3 px-3 py-2 bg-accent-neon text-primary rounded-lg font-medium hover:bg-accent-neon/80 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Create Event</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrganizerSidebar;
