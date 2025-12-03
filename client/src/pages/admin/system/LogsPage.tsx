import { useState } from "react";
import { FileText, Search, Download, RefreshCw, AlertTriangle, Info, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import AdminLayout from "../AdminLayout";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  service: string;
  message: string;
  details?: string;
  userId?: string;
  ipAddress?: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2024-01-28 14:30:25",
    level: "error",
    service: "Authentication",
    message: "Failed login attempt for user admin@example.com",
    details: "Invalid password provided",
    userId: "user_123",
    ipAddress: "192.168.1.100"
  },
  {
    id: "2",
    timestamp: "2024-01-28 14:28:15",
    level: "info",
    service: "Database",
    message: "Database backup completed successfully",
    details: "Backup size: 2.3 GB, Duration: 15 minutes"
  },
  {
    id: "3",
    timestamp: "2024-01-28 14:25:42",
    level: "warning",
    service: "System",
    message: "High memory usage detected",
    details: "Memory usage: 85%, Threshold: 80%"
  },
  {
    id: "4",
    timestamp: "2024-01-28 14:20:18",
    level: "success",
    service: "Payment",
    message: "Payment processed successfully",
    details: "Amount: $150.00, Transaction ID: txn_456789",
    userId: "user_456",
    ipAddress: "192.168.1.101"
  },
  {
    id: "5",
    timestamp: "2024-01-28 14:15:33",
    level: "info",
    service: "API",
    message: "API rate limit exceeded",
    details: "User exceeded 100 requests per minute",
    userId: "user_789",
    ipAddress: "192.168.1.102"
  },
  {
    id: "6",
    timestamp: "2024-01-28 14:10:07",
    level: "error",
    service: "Email",
    message: "Failed to send email notification",
    details: "SMTP server connection timeout",
    userId: "user_321"
  },
  {
    id: "7",
    timestamp: "2024-01-28 14:05:22",
    level: "info",
    service: "Event",
    message: "New event created",
    details: "Event ID: event_987654, Title: Tech Conference 2024",
    userId: "user_654",
    ipAddress: "192.168.1.103"
  },
  {
    id: "8",
    timestamp: "2024-01-28 14:00:15",
    level: "warning",
    service: "Storage",
    message: "Disk space running low",
    details: "Available space: 15%, Threshold: 20%"
  }
];

const LogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesService = serviceFilter === "all" || log.service === serviceFilter;
    
    return matchesSearch && matchesLevel && matchesService;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      info: "bg-blue-100 text-blue-800 border-blue-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      error: "bg-red-100 text-red-800 border-red-200",
      success: "bg-green-100 text-green-800 border-green-200"
    };
    return variants[level as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">System Logs</h1>
            <p className="text-gray-600">Monitor system events and troubleshoot issues</p>
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
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Log Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="Authentication">Authentication</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Storage">Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getLevelBadge(log.level)}`}>
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`text-xs ${getLevelBadge(log.level)}`}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.service}
                      </Badge>
                      <span className="text-sm text-gray-500">{log.timestamp}</span>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{log.message}</p>
                    {log.details && (
                      <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {log.userId && (
                        <span>User: {log.userId}</span>
                      )}
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No logs found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-blue-600 mb-2">
                {mockLogs.filter(log => log.level === "info").length}
              </div>
              <p className="text-sm text-gray-600">Info Logs</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-yellow-600 mb-2">
                {mockLogs.filter(log => log.level === "warning").length}
              </div>
              <p className="text-sm text-gray-600">Warnings</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-red-600 mb-2">
                {mockLogs.filter(log => log.level === "error").length}
              </div>
              <p className="text-sm text-gray-600">Errors</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-green-600 mb-2">
                {mockLogs.filter(log => log.level === "success").length}
              </div>
              <p className="text-sm text-gray-600">Success</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LogsPage;
