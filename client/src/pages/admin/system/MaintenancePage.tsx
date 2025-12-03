import { useState } from "react";
import { Settings, Clock, AlertTriangle, CheckCircle, Play, Pause, RotateCcw, Shield, Database, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import AdminLayout from "../AdminLayout";

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: "database" | "system" | "security" | "performance";
  status: "idle" | "running" | "completed" | "failed";
  duration: string;
  lastRun?: string;
  nextRun?: string;
  impact: "low" | "medium" | "high";
}

interface MaintenanceMode {
  enabled: boolean;
  message: string;
  estimatedDuration: string;
  startTime?: string;
  endTime?: string;
}

const mockTasks: MaintenanceTask[] = [
  {
    id: "1",
    name: "Database Optimization",
    description: "Optimize database indexes and clean up unused data",
    type: "database",
    status: "idle",
    duration: "15-30 minutes",
    lastRun: "2024-01-25 02:00:00",
    nextRun: "2024-02-01 02:00:00",
    impact: "medium"
  },
  {
    id: "2",
    name: "Cache Clear",
    description: "Clear application and system caches",
    type: "system",
    status: "idle",
    duration: "5-10 minutes",
    lastRun: "2024-01-28 14:00:00",
    nextRun: "2024-01-29 14:00:00",
    impact: "low"
  },
  {
    id: "3",
    name: "Security Scan",
    description: "Run comprehensive security vulnerability scan",
    type: "security",
    status: "running",
    duration: "30-45 minutes",
    lastRun: "2024-01-28 15:30:00",
    impact: "low"
  },
  {
    id: "4",
    name: "Log Cleanup",
    description: "Archive old logs and clean up disk space",
    type: "system",
    status: "completed",
    duration: "10-15 minutes",
    lastRun: "2024-01-28 16:00:00",
    nextRun: "2024-02-04 16:00:00",
    impact: "low"
  },
  {
    id: "5",
    name: "Performance Tuning",
    description: "Optimize system performance and resource allocation",
    type: "performance",
    status: "idle",
    duration: "20-40 minutes",
    lastRun: "2024-01-20 03:00:00",
    nextRun: "2024-02-05 03:00:00",
    impact: "high"
  },
  {
    id: "6",
    name: "Backup Verification",
    description: "Verify integrity of recent backups",
    type: "database",
    status: "failed",
    duration: "25-35 minutes",
    lastRun: "2024-01-28 17:00:00",
    nextRun: "2024-01-29 17:00:00",
    impact: "medium"
  }
];

const MaintenancePage = () => {
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>({
    enabled: false,
    message: "System is currently under maintenance. We'll be back shortly.",
    estimatedDuration: "30 minutes"
  });
  const [selectedTask, setSelectedTask] = useState<string>("");

  const getStatusBadge = (status: string) => {
    const variants = {
      idle: "bg-gray-100 text-gray-800 border-gray-200",
      running: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      database: "bg-purple-100 text-purple-800 border-purple-200",
      system: "bg-blue-100 text-blue-800 border-blue-200",
      security: "bg-red-100 text-red-800 border-red-200",
      performance: "bg-green-100 text-green-800 border-green-200"
    };
    return variants[type as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[impact as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "database":
        return <Database className="h-5 w-5" />;
      case "system":
        return <Server className="h-5 w-5" />;
      case "security":
        return <Shield className="h-5 w-5" />;
      case "performance":
        return <Settings className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const handleToggleMaintenanceMode = () => {
    setMaintenanceMode(prev => ({
      ...prev,
      enabled: !prev.enabled,
      startTime: !prev.enabled ? new Date().toISOString() : undefined,
      endTime: !prev.enabled ? undefined : new Date().toISOString()
    }));
  };

  const handleRunTask = (taskId: string) => {
    console.log("Running task:", taskId);
    // TODO: Implement task execution
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">System Maintenance</h1>
            <p className="text-gray-600">Manage system maintenance tasks and maintenance mode</p>
          </div>
        </div>

        {/* Maintenance Mode */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Maintenance Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {maintenanceMode.enabled 
                    ? "System is currently in maintenance mode" 
                    : "System is running normally"}
                </p>
                {maintenanceMode.enabled && (
                  <div className="text-sm text-gray-500">
                    <p>Started: {maintenanceMode.startTime ? formatDate(maintenanceMode.startTime) : 'N/A'}</p>
                    <p>Estimated Duration: {maintenanceMode.estimatedDuration}</p>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleToggleMaintenanceMode}
                variant={maintenanceMode.enabled ? "destructive" : "default"}
              >
                {maintenanceMode.enabled ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Disable Maintenance Mode
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Enable Maintenance Mode
                  </>
                )}
              </Button>
            </div>
            {maintenanceMode.enabled && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Maintenance Mode Active</p>
                    <p className="text-sm text-yellow-700">{maintenanceMode.message}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Maintenance Tasks</h2>
            <div className="flex items-center gap-3">
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockTasks
              .filter(task => selectedTask === "all" || task.type === selectedTask)
              .map((task) => (
              <Card key={task.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getTypeIcon(task.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{task.name}</h3>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={`text-xs ${getTypeBadge(task.type)}`}>
                      {task.type}
                    </Badge>
                    <Badge className={`text-xs ${getImpactBadge(task.impact)}`}>
                      {task.impact} impact
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Duration: {task.duration}</span>
                    </div>
                    {task.lastRun && (
                      <div className="flex items-center gap-2">
                        <span>Last run: {formatDate(task.lastRun)}</span>
                      </div>
                    )}
                    {task.nextRun && (
                      <div className="flex items-center gap-2">
                        <span>Next run: {formatDate(task.nextRun)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === "idle" && (
                      <Button 
                        size="sm"
                        onClick={() => handleRunTask(task.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run Now
                      </Button>
                    )}
                    {task.status === "running" && (
                      <Button size="sm" variant="outline" disabled>
                        <Clock className="h-4 w-4 mr-1" />
                        Running...
                      </Button>
                    )}
                    {task.status === "completed" && (
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Button>
                    )}
                    {task.status === "failed" && (
                      <Button size="sm" variant="outline">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-lg bg-blue-100 mx-auto mb-4 w-fit">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Database Cleanup</h3>
                <p className="text-sm text-gray-600 mb-4">Clean up old data and optimize tables</p>
                <Button size="sm" className="w-full">
                  Run Cleanup
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-lg bg-green-100 mx-auto mb-4 w-fit">
                  <Server className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Cache Clear</h3>
                <p className="text-sm text-gray-600 mb-4">Clear all application caches</p>
                <Button size="sm" variant="outline" className="w-full">
                  Clear Cache
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-lg bg-purple-100 mx-auto mb-4 w-fit">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Security Scan</h3>
                <p className="text-sm text-gray-600 mb-4">Run security vulnerability scan</p>
                <Button size="sm" variant="outline" className="w-full">
                  Start Scan
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-lg bg-orange-100 mx-auto mb-4 w-fit">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">System Restart</h3>
                <p className="text-sm text-gray-600 mb-4">Restart system services</p>
                <Button size="sm" variant="destructive" className="w-full">
                  Restart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MaintenancePage;
