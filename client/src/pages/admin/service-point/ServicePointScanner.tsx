import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode/esm/html5-qrcode-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import {
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
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
  Scan,
  Search,
  LogIn,
  LogOut,
  AlertTriangle,
  User,
  WifiOff,
  Cloud,
  RefreshCw,
  Upload,
  Zap,
  ZapOff
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { useToast } from "../../../hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { useIsMobile } from "../../../hooks/useMobile";
import {
  scanTicket,
  scanOut,
  manualCheckIn,
  manualCheckOut,
  searchAttendees,
  getEvent,
  detectCodeType,
  formatBackupCode,
  isValidBackupCode,
  type ScanResponse,
  type CodeType,
  ScanType,
  type ScanType as ScanTypeType,
  type AttendeeSearchResult,
  type ScanRequest,
} from "../../../lib/workstation-api";
import { getEvents, type EventData } from "../../../lib/event-api";
import {
  addToOfflineQueue,
  syncOfflineQueue,
  getSyncStatus,
  isOnline,
  type SyncStatus,
} from "../../../lib/offline-sync";
import {
  ensureDefaultSession,
  type EventSession,
} from "../../../lib/session-api";

// Scan result interface
interface ScanResult {
  id: string;
  registrationId: string;
  attendeeName: string;
  ticketType: string | null;
  scannedAt: string;
  session: string | null;
  status: 'success' | 'error';
  errorCode?: string;
  errorMessage?: string;
  signatureValid: boolean;
  codeType: CodeType;
  scanType: ScanTypeType;
  isReEntry: boolean;
}

// Session icon mapping
const getSessionIcon = (iconId: string | null): React.ReactNode => {
  switch (iconId) {
    case 'shield': return <Shield className="w-4 h-4" />;
    case 'door-open': return <Target className="w-4 h-4" />;
    case 'utensils': return <Utensils className="w-4 h-4" />;
    case 'coffee': return <Utensils className="w-4 h-4" />;
    case 'gift': return <Gift className="w-4 h-4" />;
    case 'star': return <Star className="w-4 h-4" />;
    case 'car': return <Car className="w-4 h-4" />;
    case 'clipboard': return <Activity className="w-4 h-4" />;
    case 'award': return <Star className="w-4 h-4" />;
    case 'users': return <User className="w-4 h-4" />;
    case 'presentation': return <Eye className="w-4 h-4" />;
    case 'camera': return <Camera className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
};

// Device ID generation and storage
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('service_point_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('service_point_device_id', deviceId);
  }
  return deviceId;
};

// Session persistence
const SESSION_STORAGE_KEY = 'service_point_selected_session';
const getStoredSession = (): string | null => {
  return localStorage.getItem(SESSION_STORAGE_KEY);
};
const setStoredSession = (session: string): void => {
  localStorage.setItem(SESSION_STORAGE_KEY, session);
};

// Sound effects
const playSuccessSound = (): void => {
  // Create a simple beep sound
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
};

const playErrorSound = (): void => {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 400;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

// Haptic feedback (vibration API)
const vibrateSuccess = (): void => {
  if ('vibrate' in navigator) {
    // Short vibration pattern for success
    navigator.vibrate([50]);
  }
};

const vibrateError = (): void => {
  if ('vibrate' in navigator) {
    // Longer vibration pattern for error
    navigator.vibrate([100, 50, 100]);
  }
};

const ServicePointScanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event');
  const { toast } = useToast();
  // Detect whether we're under /admin or /organizer so back/history links work for both
  const basePrefix = location.pathname.startsWith('/organizer') ? '/organizer' : '/admin';
  
  // State
  const [eventId, setEventId] = useState<string | null>(eventIdParam);
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>(
    getStoredSession() || ""
  );
  const [scanMode, setScanMode] = useState<'check-in' | 'check-out'>('check-in');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashStatus, setFlashStatus] = useState<'none' | 'success' | 'error'>('none');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AttendeeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchCode, setSearchCode] = useState(""); // Optional QR code for signature verification in search
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const isMobile = useIsMobile();
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, total: 0 });
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Refs
  const html5QrCodeRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);
  const deviceId = getDeviceId();
  // Debounce: ignore the same code within 3 seconds to prevent double-scans while camera runs continuously
  const SCAN_DEBOUNCE_MS = 3000;

  // Check camera permissions
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(permission.state);
          
          permission.onchange = () => {
            setCameraPermission(permission.state);
          };
        } else {
          // Fallback: try to access camera
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setCameraPermission('granted');
        }
      } catch {
        setCameraPermission('denied');
      }
    };

    checkCameraPermission();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = isOnline();
      setIsOnlineState(online);
      setSyncStatus(getSyncStatus());
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Handle sync
  const handleSync = useCallback(async () => {
    if (!isOnlineState) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline. Please check your connection.",
        variant: "destructive",
      });
      return;
    }

    if (syncStatus.queueLength === 0) {
      toast({
        title: "Nothing to Sync",
        description: "No pending scans in queue.",
      });
      return;
    }

    try {
      setSyncing(true);
      setSyncProgress({ synced: 0, total: syncStatus.queueLength });

      const result = await syncOfflineQueue(
        (synced, total) => {
          setSyncProgress({ synced, total });
        },
        (item, success) => {
          if (success) {
            // Remove from scan results if it was a pending item
            setScanResults(prev =>
              prev.filter(r => r.id !== item.id)
            );
          }
        },
      );

      setSyncStatus(getSyncStatus());

      if (result.synced > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.synced} scan(s). ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
        });
      }

      if (result.failed > 0 && result.synced === 0) {
        toast({
          title: "Sync Failed",
          description: `Failed to sync ${result.failed} scan(s). Please try again later.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing:', error);
      showErrorToast(toast, error, "Sync error", "Failed to sync scans");
    } finally {
      setSyncing(false);
      setSyncProgress({ synced: 0, total: 0 });
    }
  }, [isOnlineState, syncStatus.queueLength, toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnlineState && syncStatus.queueLength > 0 && !syncing) {
      // Delay sync slightly to ensure connection is stable
      const timeoutId = setTimeout(() => {
        if (isOnline() && getSyncStatus().queueLength > 0) {
          handleSync();
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isOnlineState, syncStatus.queueLength, syncing, handleSync]);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Load sessions when eventId changes
  useEffect(() => {
    const loadSessions = async () => {
      if (!eventId) {
        setSessions([]);
        return;
      }

      try {
        setSessionsLoading(true);
        // This will create the default "Main Entrance" session if none exist
        const response = await ensureDefaultSession(eventId);
        if (response.success && response.data) {
          setSessions(response.data);
          // If no session is selected or selected session doesn't exist, select the first one
          const storedSession = getStoredSession();
          const sessionExists = response.data.some(f => f.id === storedSession);
          if (!sessionExists && response.data.length > 0) {
            setSelectedSession(response.data[0].id);
            setStoredSession(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        showErrorToast(toast, error, "Load failed", "Failed to load sessions");
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [eventId, toast]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await getEvents({ limit: 100 });
        if (response.success && response.data) {
          setEvents(response.data.events);
          
          // If eventId is provided, load that event
          if (eventId) {
            const event = response.data.events.find(e => e.id === eventId);
            if (event) {
              setCurrentEvent(event);
            } else {
              // Try to fetch event details
              try {
                const eventResponse = await getEvent(eventId);
                if (eventResponse.success && eventResponse.data) {
                  // getEvent returns eventId and eventTitle, not a full event object
                  // Find the event from the events list or create a minimal event object
                  const foundEvent = response.data.events.find(e => e.id === eventId);
                  if (foundEvent) {
                    setCurrentEvent(foundEvent);
                  }
                }
              } catch (error) {
                console.error('Error fetching event:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading events:', error);
        showErrorToast(toast, error, "Load failed", "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [eventId, toast]);

  // Load event details when eventId changes
  useEffect(() => {
    if (eventId && !currentEvent) {
      const loadEventDetails = async () => {
        try {
          const response = await getEvent(eventId);
          if (response.success && response.data) {
            // getEvent returns eventId and eventTitle, need to find full event from events list
            const foundEvent = events.find(e => e.id === eventId);
            if (foundEvent) {
              setCurrentEvent(foundEvent);
            }
          }
        } catch (error) {
          console.error('Error loading event details:', error);
        }
      };
      loadEventDetails();
    }
  }, [eventId, currentEvent, events]);

  // Save session selection
  useEffect(() => {
    setStoredSession(selectedSession);
  }, [selectedSession]);

  // Process scanned code
  const processCode = useCallback(async (code: string) => {
    if (!eventId) {
      showErrorToast(toast, new Error("Please select an event first"), "Please select an event first");
      return;
    }

    // Format backup code if needed
    const formattedCode = formatBackupCode(code);
    const codeType = detectCodeType(formattedCode);

    // Validate backup code format
    if (codeType === 'BACKUP_CODE' && !isValidBackupCode(formattedCode)) {
      toast({
        title: "Invalid Code",
        description: "Backup code must be exactly 10 alphanumeric characters",
        variant: "destructive",
      });
      return;
    }

    // Prepare scan request
    const scanRequest: ScanRequest = {
      code: formattedCode,
      eventId,
      session: selectedSession,
      deviceId,
      deviceType: isMobile ? 'MOBILE' : 'DESKTOP',
    };

    // Check if offline - store in queue instead
    if (!isOnlineState) {
      const offlineItem = addToOfflineQueue(
        scanRequest,
        scanMode,
        undefined, // signatureValid will be set when synced
        codeType,
      );

      // Create a pending scan result
      const scanResult: ScanResult = {
        id: offlineItem.id,
        registrationId: 'pending',
        attendeeName: 'Pending sync...',
        ticketType: null,
        scannedAt: offlineItem.timestamp.toISOString(),
        session: selectedSession,
        status: 'success', // Show as success but indicate it's pending
        signatureValid: false,
        codeType,
        scanType: scanMode === 'check-in' ? 'CHECK_IN' : 'CHECK_OUT',
        isReEntry: false,
      };

      setScanResults(prev => [scanResult, ...prev]);
      setSyncStatus(getSyncStatus());

      toast({
        title: "Scan Queued",
        description: "Device is offline. Scan will be synced when connection is restored.",
      });

      // Visual feedback
      setFlashStatus('success');
      setTimeout(() => setFlashStatus('none'), 500);

      // Audio feedback
      if (soundEnabled) {
        playSuccessSound();
      }

      // Haptic feedback
      vibrateSuccess();

      return;
    }

    try {
      let response: ScanResponse;

      if (scanMode === 'check-in') {
        response = await scanTicket(scanRequest);
      } else {
        response = await scanOut(scanRequest);
      }

      if (response.success) {
        const scanResult: ScanResult = {
          id: response.data.scanId,
          registrationId: response.data.registrationId,
          attendeeName: response.data.attendeeName,
          ticketType: response.data.ticketType,
          scannedAt: response.data.scannedAt instanceof Date ? response.data.scannedAt.toISOString() : response.data.scannedAt,
          session: response.data.session,
          status: 'success',
          signatureValid: response.data.signatureValid,
          codeType: response.data.codeType,
          scanType: response.data.scanType,
          isReEntry: response.data.isReEntry,
        };

        setScanResults(prev => [scanResult, ...prev]);
        
        // Visual feedback
        setFlashStatus('success');
        setTimeout(() => setFlashStatus('none'), 500);
        
        // Audio feedback
        if (soundEnabled) {
          playSuccessSound();
        }

        // Haptic feedback
        vibrateSuccess();

        toast({
          title: "Scan Successful",
          description: `${scanMode === 'check-in' ? 'Checked in' : 'Checked out'}: ${response.data.attendeeName}`,
        });

        // Show signature warning if invalid
        if (!response.data.signatureValid) {
          toast({
            title: "Security Warning",
            description: "Ticket signature verification failed. This may be a duplicate or invalid ticket.",
            variant: "destructive",
          });
        }
      } else {
        // Handle error response
        const error = response.error || { code: 'UNKNOWN', message: 'Scan failed' };
        const scanResult: ScanResult = {
          id: Date.now().toString(),
          registrationId: error.details?.registrationId || '',
          attendeeName: 'Error',
          ticketType: null,
          scannedAt: new Date().toISOString(),
          session: selectedSession,
          status: 'error',
          errorCode: error.code,
          errorMessage: error.message,
          signatureValid: false,
          codeType: codeType,
          scanType: scanMode === 'check-in' ? ScanType.CHECK_IN : ScanType.CHECK_OUT,
          isReEntry: false,
        };

        setScanResults(prev => [scanResult, ...prev]);
        
        // Visual feedback
        setFlashStatus('error');
        setTimeout(() => setFlashStatus('none'), 1000);
        
        // Audio feedback
        if (soundEnabled) {
          playErrorSound();
        }

        // Haptic feedback
        vibrateError();

        // Show specific error messages
        let errorTitle = "Scan Failed";
        let errorDescription = error.message || "Unknown error";
        
        if (error.code === 'INVALID_SIGNATURE') {
          errorTitle = "Security Warning";
          errorDescription = "Invalid ticket signature. This ticket may be fraudulent or duplicated.";
        } else if (error.code === 'INVALID_TICKET') {
          errorTitle = "Ticket Not Found";
          errorDescription = "This ticket is not valid for this event.";
        } else if (error.code === 'ALREADY_SCANNED') {
          // Amber/warning — not a hard failure, staff may need to verify and wave through
          toast({
            title: "Already Checked In",
            description: "This ticket was already scanned. Verify the attendee visually.",
          });
          setFlashStatus('error');
          setTimeout(() => setFlashStatus('none'), 1000);
          if (soundEnabled) playErrorSound();
          vibrateError();
          return;
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing code:', error);
      showErrorToast(toast, error, "Scan failed", "Failed to process scan. Please try again.");
    }
  }, [eventId, selectedSession, scanMode, soundEnabled, toast, deviceId, isOnlineState, isMobile]);

  // Stop QR scanning
  const stopScanning = useCallback(() => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.clear().catch((error) => {
        console.error('Error stopping scanner:', error);
      });
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Start QR scanning
  const startScanning = useCallback(async () => {
    if (!scannerContainerRef.current) return;

    // Check camera permission first
    if (cameraPermission === 'denied') {
      toast({
        title: "Camera Permission Denied",
        description: "Please enable camera access in your browser settings to use the scanner.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request camera permission if not granted
      if (cameraPermission !== 'granted') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setCameraPermission('granted');
        } catch (permError) {
          console.error('Camera permission error:', permError);
          toast({
            title: "Camera Access Required",
            description: "Please allow camera access to use the scanner. You can use manual entry instead.",
            variant: "destructive",
          });
          return;
        }
      }

      // Mobile-optimized scanner configuration
      const scannerConfig = isMobile
        ? {
            fps: 5, // Lower FPS for mobile performance
            qrbox: { width: Math.min(300, window.innerWidth - 40), height: Math.min(300, window.innerWidth - 40) },
            aspectRatio: 1.0,
            supportedScanTypes: [0, 1], // QR_CODE and BARCODE (Code128, Code39)
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          }
        : {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            supportedScanTypes: [0, 1], // QR_CODE and BARCODE
          };

      const html5QrCode = new Html5QrcodeScanner(
        scannerContainerRef.current.id,
        scannerConfig,
        false // verbose
      );

      html5QrCodeRef.current = html5QrCode;

      html5QrCode.render(
        (decodedText) => {
          // Debounce: skip if this exact code was scanned within SCAN_DEBOUNCE_MS
          const now = Date.now();
          const last = lastScannedRef.current;
          if (last && last.code === decodedText && now - last.time < SCAN_DEBOUNCE_MS) {
            return;
          }
          lastScannedRef.current = { code: decodedText, time: now };
          // Keep camera running — only processCode, do NOT stop scanning
          processCode(decodedText);
        },
        () => {
          // Ignore scanning errors (they're expected during scanning)
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error('Error starting scanner:', error);
      showErrorToast(toast, error, "Camera failed", "Failed to start camera. Please check permissions or use manual entry.");
    }
  }, [processCode, toast, cameraPermission, isMobile]);

  // Handle manual scan
  const handleManualScan = () => {
    if (manualInput.trim()) {
      processCode(manualInput.trim());
      setManualInput("");
    }
  };

  // Handle manual search
  const handleSearch = async () => {
    if (!eventId || !searchTerm.trim()) return;

    try {
      setSearching(true);
      const response = await searchAttendees({
        searchTerm: searchTerm.trim(),
        eventId,
        code: searchCode.trim() || undefined,
        limit: 10,
      });

      if (response.success && response.data) {
        setSearchResults(response.data.attendees);
      }
    } catch (error) {
      console.error('Error searching attendees:', error);
      showErrorToast(toast, error, "Failed to search attendees");
    } finally {
      setSearching(false);
    }
  };

  // Handle manual check-in/out from search
  const handleManualOperation = async (attendee: AttendeeSearchResult) => {
    if (!eventId) return;

    try {
      const manualRequest = {
        searchTerm: attendee.registrationId,
        eventId,
        facility: selectedSession || null,
        code: searchCode.trim() || null,
      };

      const response = scanMode === 'check-in'
        ? await manualCheckIn(manualRequest)
        : await manualCheckOut(manualRequest);

      if (response.success) {
        const scanResult: ScanResult = {
          id: response.data.scanId,
          registrationId: response.data.registrationId,
          attendeeName: response.data.attendeeName,
          ticketType: response.data.ticketType,
          scannedAt: response.data.scannedAt instanceof Date ? response.data.scannedAt.toISOString() : response.data.scannedAt,
          session: selectedSession,
          status: 'success',
          signatureValid: response.data.signatureValid ?? true,
          codeType: response.data.codeType ?? 'QR_CODE',
          scanType: response.data.scanType,
          isReEntry: response.data.isReEntry,
        };

        setScanResults(prev => [scanResult, ...prev]);
        setShowSearchModal(false);
        setSearchTerm("");
        setSearchResults([]);
        setSearchCode("");

        toast({
          title: "Success",
          description: `${scanMode === 'check-in' ? 'Checked in' : 'Checked out'}: ${response.data.attendeeName}`,
        });
      } else {
        const error = response.error || { code: 'UNKNOWN', message: 'Operation failed' };
        toast({
          title: scanMode === 'check-in' ? "Check-in failed" : "Check-out failed",
          description: error.message || "Operation failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in manual operation:', error);
      showErrorToast(toast, error, "Failed to process operation");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return "bg-success/10 text-success border-success";
      case 'error':
        return "bg-destructive/10 text-destructive border-destructive";
      default:
        return "bg-muted text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to={`${basePrefix}/service-point`} label="Back" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Ticket Scanner</h1>
            <p className="text-muted-foreground mt-2">
              {currentEvent ? `${currentEvent.title} • ${formatDate(currentEvent.startDate)}` : 'Select an event'}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={eventId || ""}
              onChange={(e) => {
                const newEventId = e.target.value;
                setEventId(newEventId);
                navigate(`${basePrefix}/service-point/scanner?event=${newEventId}`);
              }}
              className="px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="">Select Event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} ({formatDate(event.startDate)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {!eventId && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Please select an event to start scanning</p>
            </CardContent>
          </Card>
        )}

        {eventId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scanner Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Offline Indicator & Sync Status */}
              {(!isOnlineState || syncStatus.queueLength > 0) && (
                <Card className={!isOnlineState ? 'border-amber-500 bg-amber-50' : 'border-blue-500 bg-primary/5'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {!isOnlineState ? (
                          <>
                            <WifiOff className="w-5 h-5 text-amber-600" />
                            <div>
                              <p className="text-sm font-medium text-amber-900">Offline Mode</p>
                              <p className="text-xs text-amber-700">
                                Scans will be queued and synced when connection is restored
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                {syncStatus.queueLength} scan(s) pending sync
                              </p>
                              {syncStatus.failedItems > 0 && (
                                <p className="text-xs text-destructive">
                                  {syncStatus.failedItems} failed - check sync details
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {isOnlineState && syncStatus.queueLength > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSync}
                          disabled={syncing}
                        >
                          {syncing ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Syncing... ({syncProgress.synced}/{syncProgress.total})
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Sync Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {syncing && syncProgress.total > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(syncProgress.synced / syncProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Syncing {syncProgress.synced} of {syncProgress.total} scans...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Scan Mode Toggle */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scan Mode</span>
                    <div className="flex gap-2">
                      <Button
                        variant={scanMode === 'check-in' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScanMode('check-in')}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Check In
                      </Button>
                      <Button
                        variant={scanMode === 'check-out' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScanMode('check-out')}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Check Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Select Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sessionsLoading ? (
                      <div className="col-span-full text-center text-muted-foreground py-4">
                        Loading sessions...
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="col-span-full text-center text-muted-foreground py-4">
                        No sessions configured for this event
                      </div>
                    ) : (
                      sessions.map((sess) => (
                        <Button
                          key={sess.id}
                          variant={selectedSession === sess.id ? "default" : "outline"}
                          className="h-16 flex flex-col items-center justify-center space-y-1"
                          onClick={() => {
                            setSelectedSession(sess.id);
                            setStoredSession(sess.id);
                          }}
                          style={sess.color && selectedSession === sess.id ? {
                            backgroundColor: sess.color,
                            borderColor: sess.color
                          } : undefined}
                        >
                          {getSessionIcon(sess.icon)}
                          <span className="text-xs">{sess.name}</span>
                        </Button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scanner Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Camera className="w-5 h-5 mr-2" />
                      Ticket Scanner
                    </div>
                    <div className="flex gap-2">
                      {isMobile && isScanning && (
                        <Button
                          variant={flashlightEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFlashlightEnabled(!flashlightEnabled);
                            // Note: html5-qrcode handles torch internally via showTorchButtonIfSupported
                            // This button is for visual feedback and future programmatic control
                            toast({
                              title: flashlightEnabled ? "Flashlight Off" : "Flashlight On",
                              description: "Use the torch button in the camera view to control flashlight",
                            });
                          }}
                        >
                          {flashlightEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? "Disable sound" : "Enable sound"}
                      >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScanResults([])}
                        title="Clear scan history"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSearchModal(true)}
                        title="Search attendees"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Camera View - Mobile Optimized */}
                    <div 
                      className={`relative bg-muted rounded-lg overflow-hidden ${
                        isMobile ? 'aspect-square' : 'aspect-video'
                      } ${
                        flashStatus === 'success' ? 'bg-success-light' : 
                        flashStatus === 'error' ? 'bg-destructive/20' : ''
                      } transition-colors duration-500`}
                    >
                      <div id="qr-reader" ref={scannerContainerRef} className="w-full h-full" />
                      {!isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <div className="text-center p-4">
                            <QrCode className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-muted-foreground mx-auto mb-4`} />
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mb-2`}>
                              Camera not active
                            </p>
                            {cameraPermission === 'denied' && (
                              <p className="text-xs text-destructive mt-2">
                                Camera access denied. Please enable in browser settings.
                              </p>
                            )}
                            {cameraPermission === 'prompt' && (
                              <p className="text-xs text-amber-600 mt-2">
                                Click "Start Scanning" to request camera access.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scanner Controls - Touch-friendly for mobile */}
                    <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-3'}`}>
                      {!isScanning ? (
                        <Button 
                          onClick={startScanning}
                          className={`${isMobile ? 'w-full h-14 text-base font-semibold' : 'flex-1'}`}
                          disabled={!eventId || cameraPermission === 'denied'}
                          size={isMobile ? 'lg' : 'default'}
                        >
                          <Camera className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
                          Start Scanning
                        </Button>
                      ) : (
                        <>
                          <Button 
                            onClick={stopScanning}
                            variant="destructive"
                            className={`${isMobile ? 'w-full h-14 text-base font-semibold' : 'flex-1'}`}
                            size={isMobile ? 'lg' : 'default'}
                          >
                            <XCircle className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
                            Stop Scanning
                          </Button>
                          {isMobile && (
                            <p className="text-xs text-center text-muted-foreground mt-1">
                              Point camera at QR code or enter code manually below
                            </p>
                          )}
                        </>
                      )}
                      {cameraPermission === 'denied' && (
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          Camera access denied. Use manual entry below.
                        </p>
                      )}
                    </div>

                    {/* Manual Input - Mobile Optimized */}
                    <div className="space-y-2">
                      <label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium`}>
                        Manual Input (QR Code or Backup Code)
                      </label>
                      <div className={`flex ${isMobile ? 'flex-col' : 'gap-2'}`}>
                        <Input
                          placeholder="Enter QR code or 10-character backup code..."
                          value={manualInput}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/\s+/g, '');
                            setManualInput(value);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                          maxLength={100}
                          className={isMobile ? 'text-base h-12' : ''}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                        />
                        <Button 
                          onClick={handleManualScan}
                          disabled={!manualInput.trim() || !eventId}
                          className={isMobile ? 'w-full h-12 text-base mt-2' : ''}
                          size={isMobile ? 'lg' : 'default'}
                        >
                          <Scan className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
                          {isMobile ? 'Scan Code' : ''}
                        </Button>
                      </div>
                      {manualInput && detectCodeType(manualInput) === 'UNKNOWN' && (
                        <p className="text-xs text-destructive">Invalid code format</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scan Results */}
            <div className="space-y-6">
              {/* Current Session Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Current Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{
                        backgroundColor: sessions.find(f => f.id === selectedSession)?.color
                          ? `${sessions.find(f => f.id === selectedSession)?.color}20`
                          : 'hsl(var(--primary) / 0.1)',
                        color: sessions.find(f => f.id === selectedSession)?.color || undefined
                      }}
                    >
                      {getSessionIcon(sessions.find(f => f.id === selectedSession)?.icon || null)}
                    </div>
                    <h3 className="font-semibold text-lg">
                      {sessions.find(f => f.id === selectedSession)?.name || 'No Session Selected'}
                    </h3>
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
                      onClick={() => navigate(`${basePrefix}/service-point/history`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scanResults.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Scan className="w-8 h-8 mx-auto mb-2" />
                        <p>No scans yet</p>
                      </div>
                    ) : (
                      scanResults.slice(0, 10).map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              result.status === 'success' ? 'bg-success/10' : 'bg-destructive/10'
                            }`}>
                              {result.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : (
                                <XCircle className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{result.attendeeName}</p>
                              <p className="text-xs text-muted-foreground">{result.session || 'Unknown'}</p>
                              {result.isReEntry && (
                                <Badge variant="secondary" className="text-xs mt-1">Re-entry</Badge>
                              )}
                              {!result.signatureValid && result.status === 'success' && (
                                <Badge variant="destructive" className="text-xs mt-1">Invalid Signature</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                              {result.status === 'success' ? 'Success' : 'Error'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(result.scannedAt)}
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
                      <span className="text-sm text-muted-foreground">Total Scans</span>
                      <span className="font-semibold">{scanResults.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Successful</span>
                      <span className="font-semibold text-success">
                        {scanResults.filter(r => r.status === 'success').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Errors</span>
                      <span className="font-semibold text-destructive">
                        {scanResults.filter(r => r.status === 'error').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Re-entries</span>
                      <span className="font-semibold text-primary">
                        {scanResults.filter(r => r.isReEntry).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Manual Search Modal */}
        <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manual Search & Check {scanMode === 'check-in' ? 'In' : 'Out'}</DialogTitle>
              <DialogDescription>
                Search for attendees by name, email, phone, backup code, or registration ID
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Term</label>
                <Input
                  placeholder="Enter name, email, phone, backup code, or registration ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Optional QR Code (for signature verification)
                </label>
                <Input
                  placeholder="Enter QR code for signature verification..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchTerm.trim() || searching}>
                <Search className="w-4 h-4 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </Button>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm font-medium">Search Results ({searchResults.length})</p>
                  {searchResults.map((attendee) => (
                    <div
                      key={attendee.registrationId}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{attendee.attendeeName}</p>
                          <p className="text-xs text-muted-foreground">{attendee.email}</p>
                          {attendee.phoneNumber && (
                            <p className="text-xs text-muted-foreground">{attendee.phoneNumber}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {attendee.isCurrentlyInside && (
                              <Badge variant="default" className="text-xs">Inside</Badge>
                            )}
                            {attendee.checkedInAt && (
                              <Badge variant="secondary" className="text-xs">
                                Checked In: {formatTime(attendee.checkedInAt instanceof Date ? attendee.checkedInAt.toISOString() : attendee.checkedInAt)}
                              </Badge>
                            )}
                            {attendee.signatureValid === false && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Invalid Signature
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleManualOperation(attendee)}
                        variant={scanMode === 'check-in' ? 'default' : 'secondary'}
                      >
                        {scanMode === 'check-in' ? (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Check In
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4 mr-2" />
                            Check Out
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm && searchResults.length === 0 && !searching && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2" />
                  <p>No attendees found</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowSearchModal(false);
                setSearchTerm("");
                setSearchResults([]);
                setSearchCode("");
              }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default ServicePointScanner;
