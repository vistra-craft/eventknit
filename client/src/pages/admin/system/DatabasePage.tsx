import { useState } from "react";
import { Database, Table, Users, HardDrive, Activity, RefreshCw, Download, Upload, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import AdminLayout from "../AdminLayout";

interface DatabaseTable {
  id: string;
  name: string;
  rows: number;
  size: string;
  lastModified: string;
  status: "active" | "archived" | "maintenance";
}

interface DatabaseMetric {
  id: string;
  name: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend: "up" | "down" | "stable";
}

const mockTables: DatabaseTable[] = [
  {
    id: "1",
    name: "users",
    rows: 15420,
    size: "2.3 GB",
    lastModified: "2 hours ago",
    status: "active"
  },
  {
    id: "2",
    name: "events",
    rows: 8920,
    size: "1.8 GB",
    lastModified: "1 hour ago",
    status: "active"
  },
  {
    id: "3",
    name: "registrations",
    rows: 45670,
    size: "3.1 GB",
    lastModified: "30 minutes ago",
    status: "active"
  },
  {
    id: "4",
    name: "payments",
    rows: 12340,
    size: "890 MB",
    lastModified: "15 minutes ago",
    status: "active"
  },
  {
    id: "5",
    name: "analytics_logs",
    rows: 234560,
    size: "5.2 GB",
    lastModified: "5 minutes ago",
    status: "active"
  },
  {
    id: "6",
    name: "old_events_archive",
    rows: 15600,
    size: "2.1 GB",
    lastModified: "1 week ago",
    status: "archived"
  }
];

const mockMetrics: DatabaseMetric[] = [
  {
    id: "1",
    name: "Total Size",
    value: "15.4 GB",
    icon: HardDrive,
    description: "Total database storage used",
    trend: "up"
  },
  {
    id: "2",
    name: "Active Connections",
    value: "23/100",
    icon: Users,
    description: "Current database connections",
    trend: "stable"
  },
  {
    id: "3",
    name: "Query Performance",
    value: "45ms",
    icon: Activity,
    description: "Average query execution time",
    trend: "down"
  },
  {
    id: "4",
    name: "Tables Count",
    value: "24",
    icon: Table,
    description: "Total number of tables",
    trend: "stable"
  }
];

const DatabasePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredTables = mockTables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      archived: "bg-gray-100 text-gray-800 border-gray-200",
      maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-red-600";
    if (trend === "down") return "text-green-600";
    return "text-gray-600";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Database Management</h1>
            <p className="text-gray-600">Monitor and manage database performance and storage</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Table
            </Button>
          </div>
        </div>

        {/* Database Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Database Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockMetrics.map((metric) => (
              <Card key={metric.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <metric.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className={`text-lg ${getTrendColor(metric.trend)}`}>
                      {getTrendIcon(metric.trend)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">{metric.name}</h3>
                    <p className="font-semibold text-primary">{metric.value}</p>
                    <p className="text-sm text-gray-600">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Database Tables */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Database Tables</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTables.map((table) => (
              <Card key={table.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Table className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{table.name}</h3>
                    </div>
                    <Badge className={`text-xs ${getStatusBadge(table.status)}`}>
                      {table.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Rows</p>
                      <p className="font-semibold text-foreground">{table.rows.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Size</p>
                      <p className="font-semibold text-foreground">{table.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Modified {table.lastModified}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Database Operations */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Database Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create a full backup of the database
                </p>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Start Backup
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Restore Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Restore database from backup file
                </p>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Optimize Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Optimize database performance and clean up
                </p>
                <Button variant="outline" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Optimize Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DatabasePage;
