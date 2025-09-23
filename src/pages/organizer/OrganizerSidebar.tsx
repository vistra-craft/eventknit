import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  MessageCircle,
  QrCode,
  Home,
  Menu,
} from "lucide-react";

interface OrganizerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

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
      group: "main"
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
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={`flex items-center ${isOpen ? 'space-x-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                        isActive 
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
