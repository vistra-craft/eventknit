import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Gift,
  Utensils,
  Car,
  Star,
  Shield,
  History,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  Target,
  Activity,
  Eye,
  Scan
} from "lucide-react";
import AdminLayout from "../AdminLayout";

interface ScanResult {
  id: string;
  attendeeId: string;
  attendeeName: string;
  ticketType: string;
  qrCode: string;
  scannedAt: string;
  facility: string;
  status: 'approved' | 'rejected';
  reason?: string;
  scannedBy: string;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ticketType: string;
  status: 'registered' | 'checked_in' | 'scanned';
  registeredDate: string;
  qrCode: string;
  avatar?: string;
  facilities?: string[];
}

interface Facility {
  id: string;
  name: string;
  type: 'entrance' | 'lunch' | 'gifts' | 'parking' | 'vip' | 'registration' | 'materials';
  capacity?: number;
  currentCount: number;
  icon: React.ReactNode;
}

const WorkstationScanner: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>("entrance");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentEvent, setCurrentEvent] = useState({
    id: eventId || "1",
    title: "Seamless East Africa 2025",
    date: "July 2-3, 2025",
    location: "Nairobi, Kenya",
    venue: "Kenyatta International Convention Centre"
  });

  // Mock events data for selection
  const events = [
    {
      id: "1",
      title: "Seamless East Africa 2025",
      date: "July 2-3, 2025",
      location: "Nairobi, Kenya",
      venue: "Kenyatta International Convention Centre"
    },
    {
      id: "2",
      title: "Tech Innovation Summit 2024",
      date: "March 15-17, 2024",
      location: "San Francisco, CA",
      venue: "Moscone Center"
    }
  ];

  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock facilities data
  const facilities: Facility[] = [
    { id: "entrance", name: "Main Entrance", type: "entrance", capacity: 500, currentCount: 0, icon: <Shield className="w-4 h-4" /> },
    { id: "lunch", name: "Lunch Area", type: "lunch", capacity: 300, currentCount: 0, icon: <Utensils className="w-4 h-4" /> },
    { id: "gifts", name: "Gifts Desk", type: "gifts", capacity: 200, currentCount: 0, icon: <Gift className="w-4 h-4" /> },
    { id: "vip", name: "VIP Lounge", type: "vip", capacity: 50, currentCount: 0, icon: <Star className="w-4 h-4" /> },
    { id: "parking", name: "Parking", type: "parking", capacity: 100, currentCount: 0, icon: <Car className="w-4 h-4" /> }
  ];

  // Mock attendees data
  const attendees: Attendee[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+254 700 123 456",
      ticketType: "VIP",
      status: "registered",
      registeredDate: "2024-01-15",
      qrCode: "QR123456789",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael@example.com",
      phone: "+254 700 234 567",
      ticketType: "Standard",
      status: "checked_in",
      registeredDate: "2024-01-20",
      qrCode: "QR234567890",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "3",
      name: "Emma Wilson",
      email: "emma@example.com",
      phone: "+254 700 345 678",
      ticketType: "Student",
      status: "scanned",
      registeredDate: "2024-02-01",
      qrCode: "QR345678901",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const processQRCode = (qrData: string) => {
    // Find attendee by QR code
    const attendee = attendees.find(a => a.qrCode === qrData);
    
    if (attendee) {
      const facility = facilities.find(f => f.id === selectedFacility);
      const scanResult: ScanResult = {
        id: Date.now().toString(),
        attendeeId: attendee.id,
        attendeeName: attendee.name,
        ticketType: attendee.ticketType,
        qrCode: qrData,
        scannedAt: new Date().toISOString(),
        facility: facility?.name || 'Unknown',
        status: 'approved',
        scannedBy: 'Scanner User'
      };

      setScanResults(prev => [scanResult, ...prev]);
      
      // Play success sound if enabled
      if (soundEnabled) {
        // In a real app, you would play a success sound
        console.log('Success sound played');
      }

      // Update facility count
      if (facility) {
        facility.currentCount += 1;
      }

      return true;
    } else {
      // Invalid QR code
      const scanResult: ScanResult = {
        id: Date.now().toString(),
        attendeeId: '',
        attendeeName: 'Unknown',
        ticketType: '',
        qrCode: qrData,
        scannedAt: new Date().toISOString(),
        facility: facilities.find(f => f.id === selectedFacility)?.name || 'Unknown',
        status: 'rejected',
        reason: 'Invalid QR code',
        scannedBy: 'Scanner User'
      };

      setScanResults(prev => [scanResult, ...prev]);
      
      if (soundEnabled) {
        console.log('Error sound played');
      }

      return false;
    }
  };

  const handleManualScan = () => {
    if (manualInput.trim()) {
      processQRCode(manualInput.trim());
      setManualInput("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'rejected':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/workstation')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workstation
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
            <p className="text-gray-600 mt-2">{currentEvent.title} • {currentEvent.date}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={currentEvent.id}
              onChange={(e) => {
                const selectedEvent = events.find(ev => ev.id === e.target.value);
                if (selectedEvent) {
                  setCurrentEvent(selectedEvent);
                  navigate(`/admin/workstation/scanner?event=${selectedEvent.id}`);
                }
              }}
              className="px-3 py-2 border border-border rounded-md text-sm"
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Facility Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Select Facility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {facilities.map((facility) => (
                    <Button
                      key={facility.id}
                      variant={selectedFacility === facility.id ? "default" : "outline"}
                      className="h-16 flex flex-col items-center justify-center space-y-1"
                      onClick={() => setSelectedFacility(facility.id)}
                    >
                      {facility.icon}
                      <span className="text-xs">{facility.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {facility.currentCount}/{facility.capacity || '∞'}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scanner Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    QR Code Scanner
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScanResults([])}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Camera View */}
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                    {isScanning ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Camera not active</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Scanning Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scanner Controls */}
                  <div className="flex gap-3">
                    {!isScanning ? (
                      <Button 
                        onClick={startScanning}
                        className="flex-1"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Scanning
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopScanning}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Stop Scanning
                      </Button>
                    )}
                  </div>

                  {/* Manual Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Manual QR Code Input</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter QR code or ticket number..."
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                      />
                      <Button 
                        onClick={handleManualScan}
                        disabled={!manualInput.trim()}
                      >
                        <Scan className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scan Results */}
          <div className="space-y-6">
            {/* Current Facility Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Current Facility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {facilities.find(f => f.id === selectedFacility)?.icon}
                  </div>
                  <h3 className="font-semibold text-lg">
                    {facilities.find(f => f.id === selectedFacility)?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {facilities.find(f => f.id === selectedFacility)?.currentCount} / {facilities.find(f => f.id === selectedFacility)?.capacity || '∞'} scanned
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Scans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Recent Scans
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/workstation/history')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Scan className="w-8 h-8 mx-auto mb-2" />
                      <p>No scans yet</p>
                    </div>
                  ) : (
                    scanResults.slice(0, 10).map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            result.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {result.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{result.attendeeName}</p>
                            <p className="text-xs text-gray-600">{result.facility}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                            {result.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(result.scannedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Scans</span>
                    <span className="font-semibold">{scanResults.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="font-semibold text-green-600">
                      {scanResults.filter(r => r.status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <span className="font-semibold text-red-600">
                      {scanResults.filter(r => r.status === 'rejected').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default WorkstationScanner;
