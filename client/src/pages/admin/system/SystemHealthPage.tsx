import { useState } from "react";
import { Activity, Server, Database, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import AdminLayout from "../AdminLayout";

interface SystemMetric {
  id: string;
  name: string;
  value: string;
  status: "healthy" | "warning" | "critical";
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  lastUpdated: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: "running" | "stopped" | "error";
  uptime: string;
  responseTime: number;
  lastCheck: string;
}

const mockSystemMetrics: SystemMetric[] = [
  {
    id: "1",
    name: "CPU Usage",
    value: "45%",
    status: "healthy",
    icon: Cpu,
    description: "Average CPU utilization across all servers",
    lastUpdated: "2 minutes ago"
  },
  {
    id: "2",
    name: "Memory Usage",
    value: "68%",
    status: "warning",
    icon: HardDrive,
    description: "Total memory consumption",
    lastUpdated: "1 minute ago"
  },
  {
    id: "3",
    name: "Disk Space",
    value: "82%",
    status: "warning",
    icon: Database,
    description: "Storage utilization on primary server",
    lastUpdated: "3 minutes ago"
  },
  {
    id: "4",
    name: "Network Latency",
    value: "12ms",
    status: "healthy",
    icon: Wifi,
    description: "Average response time to external services",
    lastUpdated: "30 seconds ago"
  },
  {
    id: "5",
    name: "Active Connections",
    value: "1,247",
    status: "healthy",
    icon: Activity,
    description: "Current active user sessions",
    lastUpdated: "1 minute ago"
  },
  {
    id: "6",
    name: "Database Connections",
    value: "23/100",
    status: "healthy",
    icon: Server,
    description: "Active database connections",
    lastUpdated: "2 minutes ago"
  }
];

const mockServices: ServiceStatus[] = [
  {
    id: "1",
    name: "Web Server",
    status: "running",
    uptime: "99.9%",
    responseTime: 45,
    lastCheck: "30 seconds ago"
  },
  {
    id: "2",
    name: "Database",
    status: "running",
    uptime: "99.8%",
    responseTime: 12,
    lastCheck: "1 minute ago"
  },
  {
    id: "3",
    name: "Redis Cache",
    status: "running",
    uptime: "99.9%",
    responseTime: 2,
    lastCheck: "45 seconds ago"
  },
  {
    id: "4",
    name: "Email Service",
    status: "running",
    uptime: "98.5%",
    responseTime: 120,
    lastCheck: "2 minutes ago"
  },
  {
    id: "5",
    name: "File Storage",
    status: "running",
    uptime: "99.7%",
    responseTime: 89,
    lastCheck: "1 minute ago"
  },
  {
    id: "6",
    name: "Analytics Service",
    status: "error",
    uptime: "95.2%",
    responseTime: 0,
    lastCheck: "5 minutes ago"
  }
];

const SystemHealthPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: "bg-green-100 text-green-800 border-green-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      critical: "bg-red-100 text-red-800 border-red-200",
      running: "bg-green-100 text-green-800 border-green-200",
      stopped: "bg-gray-100 text-gray-800 border-gray-200",
      error: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    if (status === "healthy" || status === "running") {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (status === "warning") {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">System Health</h1>
            <p className="text-gray-600">Monitor system performance and service status</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSystemMetrics.map((metric) => (
              <Card key={metric.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <metric.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge className={`text-xs ${getStatusBadge(metric.status)}`}>
                      {getStatusIcon(metric.status)}
                      <span className="ml-1 capitalize">{metric.status}</span>
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{metric.name}</h3>
                    <p className="font-semibold text-primary">{metric.value}</p>
                    <p className="text-sm text-gray-600">{metric.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Updated {metric.lastUpdated}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Status */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockServices.map((service) => (
              <Card key={service.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Server className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{service.name}</h3>
                    </div>
                    <Badge className={`text-xs ${getStatusBadge(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <span className="ml-1 capitalize">{service.status}</span>
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Uptime</p>
                      <p className="font-semibold text-gray-900">{service.uptime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Response Time</p>
                      <p className="font-semibold text-gray-900">
                        {service.responseTime > 0 ? `${service.responseTime}ms` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last check: {service.lastCheck}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">High Memory Usage</p>
                    <p className="text-sm text-yellow-700">Memory usage has exceeded 80% for the past 10 minutes</p>
                    <p className="text-xs text-yellow-600 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Analytics Service Down</p>
                    <p className="text-sm text-red-700">Analytics service is not responding to health checks</p>
                    <p className="text-xs text-red-600 mt-1">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">System Recovery</p>
                    <p className="text-sm text-green-700">All services are now running normally</p>
                    <p className="text-xs text-green-600 mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemHealthPage;
