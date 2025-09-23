import React from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";

interface OrganizerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({ isOpen, onToggle }) => {
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", href: "/organizer/dashboard", icon: Home },
    { id: "events", label: "Events", href: "/organizer/events", icon: Calendar },
    { id: "attendees", label: "Attendees", href: "/organizer/attendees", icon: Users },
    { id: "analytics", label: "Analytics", href: "/organizer/analytics", icon: BarChart3 },
    { id: "tickets", label: "Tickets", href: "/organizer/tickets", icon: QrCode },
    { id: "communications", label: "Communications", href: "/organizer/communications", icon: MessageCircle },
    { id: "settings", label: "Settings", href: "/organizer/settings", icon: Settings },
  ];

  return (
    <div className={`bg-card border-r border-border h-full ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
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
        
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default OrganizerSidebar;
