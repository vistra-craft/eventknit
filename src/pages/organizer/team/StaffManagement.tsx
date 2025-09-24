import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  QrCode, 
  Smartphone, 
  Shield, 
  User,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ticket_scanner' | 'event_manager' | 'check_in_staff' | 'supervisor';
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  eventsAssigned: number;
  ticketsScanned: number;
  mobileAccess: boolean;
  avatar?: string;
}

const StaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock staff data
  const staffMembers: StaffMember[] = [
    {
      id: "1",
      name: "Alex Rodriguez",
      email: "alex@example.com",
      phone: "+1 (555) 123-4567",
      role: "ticket_scanner",
      status: "active",
      lastActive: "2 hours ago",
      eventsAssigned: 3,
      ticketsScanned: 247,
      mobileAccess: true
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+1 (555) 234-5678",
      role: "event_manager",
      status: "active",
      lastActive: "1 day ago",
      eventsAssigned: 5,
      ticketsScanned: 0,
      mobileAccess: true
    },
    {
      id: "3",
      name: "David Kim",
      email: "david@example.com",
      role: "check_in_staff",
      status: "pending",
      lastActive: "Never",
      eventsAssigned: 0,
      ticketsScanned: 0,
      mobileAccess: false
    },
    {
      id: "4",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+1 (555) 345-6789",
      role: "supervisor",
      status: "active",
      lastActive: "30 minutes ago",
      eventsAssigned: 8,
      ticketsScanned: 89,
      mobileAccess: true
    }
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ticket_scanner': return <QrCode className="h-4 w-4" />;
      case 'event_manager': return <Shield className="h-4 w-4" />;
      case 'check_in_staff': return <User className="h-4 w-4" />;
      case 'supervisor': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ticket_scanner': return "bg-blue-100 text-blue-800";
      case 'event_manager': return "bg-purple-100 text-purple-800";
      case 'check_in_staff': return "bg-green-100 text-green-800";
      case 'supervisor': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ticket_scanner': return 'Ticket Scanner';
      case 'event_manager': return 'Event Manager';
      case 'check_in_staff': return 'Check-in Staff';
      case 'supervisor': return 'Supervisor';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'inactive': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMembers = staffMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeStaff = staffMembers.filter(m => m.status === 'active').length;
  const mobileEnabled = staffMembers.filter(m => m.mobileAccess).length;
  const totalTicketsScanned = staffMembers.reduce((sum, m) => sum + m.ticketsScanned, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage your event staff and mobile access permissions
          </p>
        </div>
        <Button 
          className="bg-accent-neon hover:bg-accent-neon/80 text-primary w-full sm:w-auto"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold text-foreground">{activeStaff}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mobile Access</p>
                <p className="text-2xl font-bold text-foreground">{mobileEnabled}</p>
              </div>
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Scanned</p>
                <p className="text-2xl font-bold text-foreground">{totalTicketsScanned}</p>
              </div>
              <QrCode className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold text-foreground">
                  {staffMembers.filter(m => m.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-auto"
              >
                <option value="all">All Roles</option>
                <option value="ticket_scanner">Ticket Scanner</option>
                <option value="event_manager">Event Manager</option>
                <option value="check_in_staff">Check-in Staff</option>
                <option value="supervisor">Supervisor</option>
              </select>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-foreground">{member.name}</h3>
                      {member.mobileAccess && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <Smartphone className="h-3 w-3 mr-1" />
                          Mobile
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {member.email}
                      </span>
                      {member.phone && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{getRoleLabel(member.role)}</span>
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(member.status)}`}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">
                      Events: <span className="font-medium text-foreground">{member.eventsAssigned}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Scanned: <span className="font-medium text-foreground">{member.ticketsScanned}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Last active: {member.lastActive}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Access Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Mobile App Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Ticket Scanning</h4>
                <p className="text-sm text-muted-foreground">
                  Staff with mobile access can scan QR codes to verify ticket authenticity
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Event Check-in</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time attendee check-in and capacity management
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Limited Access</h4>
                <p className="text-sm text-muted-foreground">
                  Staff can only access assigned events and scanning functions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;
