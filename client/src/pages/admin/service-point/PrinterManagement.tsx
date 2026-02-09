import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer as PrinterIcon,
  Plus,
  Search,
  Settings,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Play,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/useToast";
import {
  getPrinters,
  discoverPrinters,
  registerPrinter,
  deletePrinter,
  checkPrinterStatus,
  testPrinter,
  getPrintJobs,
  cancelPrintJob,
  getPrinterStatusColor,
  getPrintJobStatusColor,
  getDriverDisplayName,
  type Printer,
  type PrintJob,
  type DiscoveredPrinter,
} from "@/lib/printer-api";

const PrinterManagement: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const { toast } = useToast();

  // State
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Dialog states
  const [discoveryDialogOpen, setDiscoveryDialogOpen] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [printerName, setPrinterName] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<'cups' | 'windows' | 'printnode'>('cups');
  const [deviceId, setDeviceId] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Load data functions wrapped in useCallback
  const loadPrinters = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getPrinters(eventId ? { eventId } : undefined);
      if (response.success && response.data?.printers) {
        setPrinters(response.data.printers);
        // Select first printer by default
        if (response.data.printers.length > 0) {
          setSelectedPrinter((prev) => prev ?? response.data!.printers[0]);
        }
      }
    } catch (error) {
      console.error("Error loading printers:", error);
      toast({
        title: "Error",
        description: "Failed to load printers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast]);

  const loadPrintJobs = useCallback(async () => {
    if (!selectedPrinter) return;
    try {
      const response = await getPrintJobs({
        printerId: selectedPrinter.id,
        limit: 50,
      });
      if (response.success && response.data?.jobs) {
        setPrintJobs(response.data.jobs);
      }
    } catch (error) {
      console.error("Error loading print jobs:", error);
    }
  }, [selectedPrinter]);

  // Load data
  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  useEffect(() => {
    if (selectedPrinter) {
      loadPrintJobs();
    }
  }, [selectedPrinter, loadPrintJobs]);

  const handleDiscoverPrinters = async (driver: 'cups' | 'windows') => {
    try {
      setIsDiscovering(true);
      const response = await discoverPrinters(driver);
      if (response.success && response.data?.printers) {
        setDiscoveredPrinters(response.data.printers);
        if (response.data.printers.length === 0) {
          toast({
            title: "No Printers Found",
            description: `No ${driver.toUpperCase()} printers were discovered on this system`,
          });
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to discover printers",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRegisterPrinter = async () => {
    if (!printerName || !deviceId) {
      toast({
        title: "Validation Error",
        description: "Printer name and device ID are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await registerPrinter({
        name: printerName,
        driver: selectedDriver,
        deviceId,
        host: host || undefined,
        port: port ? parseInt(port) : undefined,
        apiKey: apiKey || undefined,
        eventId: eventId || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Printer registered successfully",
        });
        setSetupDialogOpen(false);
        resetForm();
        loadPrinters();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register printer",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrinter = async () => {
    if (!selectedPrinter) return;

    try {
      const response = await deletePrinter(selectedPrinter.id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Printer deleted successfully",
        });
        setDeleteDialogOpen(false);
        setSelectedPrinter(null);
        loadPrinters();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete printer",
        variant: "destructive",
      });
    }
  };

  const handleCheckStatus = async (printerId: string) => {
    try {
      const response = await checkPrinterStatus(printerId);
      if (response.success) {
        toast({
          title: "Status Updated",
          description: `Printer is ${response.data?.status.isOnline ? 'online' : 'offline'}`,
        });
        loadPrinters();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check printer status",
        variant: "destructive",
      });
    }
  };

  const handleTestPrinter = async (printerId: string) => {
    try {
      const response = await testPrinter(printerId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Test page sent to printer",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test page",
        variant: "destructive",
      });
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await cancelPrintJob(jobId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Print job cancelled",
        });
        loadPrintJobs();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel print job",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setPrinterName("");
    setDeviceId("");
    setHost("");
    setPort("");
    setApiKey("");
    setDiscoveredPrinters([]);
  };

  const selectDiscoveredPrinter = (printer: DiscoveredPrinter) => {
    setPrinterName(printer.name);
    setDeviceId(printer.deviceId);
    setSelectedDriver(printer.driver as 'cups' | 'windows' | 'printnode');
    setDiscoveryDialogOpen(false);
    setSetupDialogOpen(true);
  };

  return (
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <PrinterIcon className="h-8 w-8 text-blue-600" />
                Printer Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage printers and print jobs for badge printing
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={discoveryDialogOpen} onOpenChange={setDiscoveryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Search className="h-4 w-4" />
                    Discover Printers
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Discover Printers</DialogTitle>
                    <DialogDescription>
                      Scan your system for available printers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDiscoverPrinters('cups')}
                        disabled={isDiscovering}
                        className="flex-1"
                      >
                        {isDiscovering ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Scan CUPS (Mac/Linux)
                      </Button>
                      <Button
                        onClick={() => handleDiscoverPrinters('windows')}
                        disabled={isDiscovering}
                        className="flex-1"
                      >
                        {isDiscovering ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Scan Windows
                      </Button>
                    </div>
                    {discoveredPrinters.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Found {discoveredPrinters.length} printer(s):</p>
                        {discoveredPrinters.map((printer, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => selectDiscoveredPrinter(printer)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{printer.name}</p>
                                <p className="text-xs text-gray-500">{printer.deviceId}</p>
                              </div>
                              <Badge variant={printer.isAvailable ? "default" : "secondary"}>
                                {printer.isAvailable ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Printer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Printer</DialogTitle>
                    <DialogDescription>
                      Configure a new printer for badge printing
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="printerName">Printer Name</Label>
                      <Input
                        id="printerName"
                        placeholder="Main Badge Printer"
                        value={printerName}
                        onChange={(e) => setPrinterName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver">Driver</Label>
                      <Select value={selectedDriver} onValueChange={(v: string) => setSelectedDriver(v as 'cups' | 'windows' | 'printnode')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cups">CUPS (Mac/Linux)</SelectItem>
                          <SelectItem value="windows">Windows Print Server</SelectItem>
                          <SelectItem value="printnode">PrintNode Cloud</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="deviceId">Device ID</Label>
                      <Input
                        id="deviceId"
                        placeholder="Printer name or ID"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                      />
                    </div>
                    {selectedDriver === 'printnode' && (
                      <div>
                        <Label htmlFor="apiKey">PrintNode API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Your PrintNode API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="host">Host (Optional)</Label>
                        <Input
                          id="host"
                          placeholder="192.168.1.100"
                          value={host}
                          onChange={(e) => setHost(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="port">Port (Optional)</Label>
                        <Input
                          id="port"
                          type="number"
                          placeholder="9100"
                          value={port}
                          onChange={(e) => setPort(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRegisterPrinter}>Add Printer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <p className="mt-4 text-sm text-gray-600">Loading printers...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Printer List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Printers ({printers.length})</CardTitle>
                  <CardDescription>Available printers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {printers.length === 0 ? (
                    <div className="text-center py-8">
                      <PrinterIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No printers configured</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setSetupDialogOpen(true)}
                      >
                        Add First Printer
                      </Button>
                    </div>
                  ) : (
                    printers.map((printer) => (
                      <div
                        key={printer.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPrinter?.id === printer.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedPrinter(printer)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{printer.name}</h3>
                              <div className={`w-2 h-2 rounded-full ${getPrinterStatusColor(printer.isOnline)}`} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{getDriverDisplayName(printer.driver)}</p>
                            <p className="text-xs text-gray-400">{printer.deviceId}</p>
                            {printer._count && (
                              <div className="mt-2 text-xs text-gray-600">
                                {printer._count.printJobs} total jobs
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Printer Details & Print Queue */}
            <div className="lg:col-span-2">
              {selectedPrinter ? (
                <Tabs defaultValue="queue" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="queue" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Print Queue
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* Print Queue Tab */}
                  <TabsContent value="queue">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Print Queue</CardTitle>
                            <CardDescription>
                              Active and recent print jobs for {selectedPrinter.name}
                            </CardDescription>
                          </div>
                          <Button size="sm" onClick={() => loadPrintJobs()}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {printJobs.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">No print jobs in queue</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Attendee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Copies</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {printJobs.map((job) => (
                                <TableRow key={job.id}>
                                  <TableCell className="font-medium">
                                    {job.registration
                                      ? `${job.registration.attendee.firstName} ${job.registration.attendee.lastName}`
                                      : "Unknown"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getPrintJobStatusColor(job.status)}>
                                      {job.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{job.copies}</TableCell>
                                  <TableCell>
                                    {new Date(job.createdAt).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    {job.status === 'queued' || job.status === 'printing' ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600"
                                        onClick={() => handleCancelJob(job.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings">
                    <Card>
                      <CardHeader>
                        <CardTitle>Printer Settings</CardTitle>
                        <CardDescription>Manage printer configuration and status</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-600">Driver</Label>
                            <p className="font-medium">{getDriverDisplayName(selectedPrinter.driver)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Status</Label>
                            <div className="flex items-center gap-2">
                              {selectedPrinter.isOnline ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <p className="font-medium">
                                {selectedPrinter.isOnline ? "Online" : "Offline"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-gray-600">Device ID</Label>
                            <p className="font-medium">{selectedPrinter.deviceId}</p>
                          </div>
                          {selectedPrinter.lastChecked && (
                            <div>
                              <Label className="text-gray-600">Last Checked</Label>
                              <p className="font-medium">
                                {new Date(selectedPrinter.lastChecked).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => handleCheckStatus(selectedPrinter.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Check Status
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleTestPrinter(selectedPrinter.id)}
                            disabled={!selectedPrinter.isOnline}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Test Print
                          </Button>
                          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Printer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Printer</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this printer? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDeletePrinter}>
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center">
                      <PrinterIcon className="mx-auto h-16 w-16 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No Printer Selected</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Select a printer from the list to view details and manage print jobs
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default PrinterManagement;
