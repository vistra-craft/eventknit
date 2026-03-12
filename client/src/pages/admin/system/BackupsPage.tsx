import { useState } from "react";
import { Download, Upload, Calendar, HardDrive, Clock, CheckCircle, AlertTriangle, Trash2, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";

interface Backup {
  id: string;
  name: string;
  type: "full" | "incremental" | "differential";
  size: string;
  status: "completed" | "in_progress" | "failed" | "scheduled";
  createdAt: string;
  completedAt?: string;
  duration?: string;
  location: string;
  description?: string;
}

const mockBackups: Backup[] = [
  {
    id: "1",
    name: "Full Backup - 2024-01-28",
    type: "full",
    size: "15.4 GB",
    status: "completed",
    createdAt: "2024-01-28 02:00:00",
    completedAt: "2024-01-28 02:45:00",
    duration: "45 minutes",
    location: "AWS S3",
    description: "Daily full database backup"
  },
  {
    id: "2",
    name: "Incremental Backup - 2024-01-27",
    type: "incremental",
    size: "2.1 GB",
    status: "completed",
    createdAt: "2024-01-27 14:00:00",
    completedAt: "2024-01-27 14:15:00",
    duration: "15 minutes",
    location: "Local Storage",
    description: "Incremental backup of changed data"
  },
  {
    id: "3",
    name: "Full Backup - 2024-01-26",
    type: "full",
    size: "14.8 GB",
    status: "completed",
    createdAt: "2024-01-26 02:00:00",
    completedAt: "2024-01-26 02:42:00",
    duration: "42 minutes",
    location: "AWS S3",
    description: "Daily full database backup"
  },
  {
    id: "4",
    name: "Differential Backup - 2024-01-25",
    type: "differential",
    size: "5.2 GB",
    status: "completed",
    createdAt: "2024-01-25 18:00:00",
    completedAt: "2024-01-25 18:25:00",
    duration: "25 minutes",
    location: "Local Storage",
    description: "Differential backup since last full backup"
  },
  {
    id: "5",
    name: "Full Backup - 2024-01-24",
    type: "full",
    size: "14.2 GB",
    status: "failed",
    createdAt: "2024-01-24 02:00:00",
    location: "AWS S3",
    description: "Daily full database backup - Failed due to network timeout"
  },
  {
    id: "6",
    name: "Scheduled Backup - 2024-01-29",
    type: "full",
    size: "0 GB",
    status: "scheduled",
    createdAt: "2024-01-29 02:00:00",
    location: "AWS S3",
    description: "Scheduled daily backup"
  }
];

const BackupsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredBackups = mockBackups.filter(backup => {
    const matchesSearch = backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (backup.description && backup.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || backup.type === typeFilter;
    const matchesStatus = statusFilter === "all" || backup.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-success/10 text-success border-success/20",
      in_progress: "bg-primary/10 text-primary border-primary/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      scheduled: "bg-warning/10 text-warning border-warning/20"
    };
    return variants[status as keyof typeof variants] || "bg-muted text-muted-foreground border-border";
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      full: "bg-purple-100 text-purple-800 border-purple-200",
      incremental: "bg-primary/10 text-primary border-primary/20",
      differential: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return variants[type as keyof typeof variants] || "bg-muted text-muted-foreground border-border";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-primary" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "scheduled":
        return <Calendar className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Backup Management</h1>
            <p className="text-sm text-muted-foreground">Manage database backups and restore operations</p>
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
              Create Backup
            </Button>
          </div>
        </div>

        {/* Backup Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-success mb-2">
                {mockBackups.filter(b => b.status === "completed").length}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-primary mb-2">
                {mockBackups.filter(b => b.status === "in_progress").length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-destructive mb-2">
                {mockBackups.filter(b => b.status === "failed").length}
              </div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-warning mb-2">
                {mockBackups.filter(b => b.status === "scheduled").length}
              </div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Input
                    placeholder="Search backups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Backup Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="differential">Differential</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Backups List */}
        <div className="space-y-3">
          {filteredBackups.map((backup) => (
            <Card key={backup.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{backup.name}</h3>
                      <Badge className={`text-xs ${getStatusBadge(backup.status)}`}>
                        {getStatusIcon(backup.status)}
                        <span className="ml-1 capitalize">{backup.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge className={`text-xs ${getTypeBadge(backup.type)}`}>
                        {backup.type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        <span>{backup.size}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(backup.createdAt)}</span>
                      </div>
                      {backup.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{backup.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>Location: {backup.location}</span>
                      </div>
                    </div>
                    {backup.description && (
                      <p className="text-sm text-muted-foreground mb-2">{backup.description}</p>
                    )}
                    {backup.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Completed: {formatDate(backup.completedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {backup.status === "completed" && (
                      <>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </>
                    )}
                    {backup.status === "scheduled" && (
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Edit Schedule
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBackups.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <HardDrive className="h-12 w-12 mx-auto mb-4 text-muted" />
                <h3 className="text-lg font-medium mb-2">No backups found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Operations */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Backup Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Create Full Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a complete backup of the entire database
                </p>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Start Full Backup
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Restore from Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Restore database from a previous backup
                </p>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Backup
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up automated backup schedules
                </p>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Configure Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default BackupsPage;
