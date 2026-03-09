 
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Clock, Chrome, Apple, Mail } from "lucide-react";
import {
  syncToCalendar,
  getUserCalendarSyncs,
  removeCalendarSync,
} from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";

interface CalendarSync {
  id: string;
  registrationId: string;
  calendarType: string;
  syncStatus: string;
  reminderEnabled: boolean;
  reminderMinutes?: number;
  syncedAt: string;
  registration: {
    event: {
      id: string;
      title: string;
      startDate: string;
      endDate?: string;
      location: string;
      description?: string;
    };
  };
}

const EventCalendarIntegration = () => {
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  const loadSyncs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserCalendarSyncs();
      if (response.success && response.data) {
        setSyncs((response.data.syncs || []) as unknown as CalendarSync[]);
      }
    } catch (error) {
      console.error("Error loading calendar syncs:", error);
      showErrorToast(toast, error, "Failed to load calendar syncs");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSyncs();
  }, [loadSyncs]);

  const handleSync = async (data: {
    registrationId: string;
    calendarType: "GOOGLE" | "APPLE" | "OUTLOOK" | "ICAL";
    reminderMinutes?: number;
  }) => {
    try {
      const response = await syncToCalendar(data);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Event synced to calendar successfully",
        });
        setIsSyncDialogOpen(false);
        loadSyncs();
        
        // Trigger download if iCal format
        if (data.calendarType === "ICAL" && response.data.calendarData) {
          const calendarData = response.data.calendarData as { data?: string; filename?: string } | string;
          const icsContent = typeof calendarData === 'string' ? calendarData : (calendarData.data || '');
          const filename = typeof calendarData === 'string' ? 'calendar.ics' : (calendarData.filename || 'calendar.ics');
          const blob = new Blob([icsContent], { type: 'text/calendar' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to sync to calendar");
    }
  };

  const handleRemove = async (syncId: string) => {
    try {
      const response = await removeCalendarSync(syncId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Calendar sync removed",
        });
        loadSyncs();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to remove sync");
    }
  };

  const getCalendarIcon = (type: string) => {
    switch (type) {
      case "GOOGLE":
        return <Chrome className="h-5 w-5" />;
      case "APPLE":
        return <Apple className="h-5 w-5" />;
      case "OUTLOOK":
        return <Mail className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getCalendarName = (type: string) => {
    switch (type) {
      case "GOOGLE":
        return "Google Calendar";
      case "APPLE":
        return "Apple Calendar";
      case "OUTLOOK":
        return "Outlook";
      case "ICAL":
        return "iCal File";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar Integration</h1>
          <p className="text-muted-foreground mt-1">
            Sync your events to your favorite calendar
          </p>
        </div>
        <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Sync Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sync Event to Calendar</DialogTitle>
              </DialogHeader>
              <SyncEventForm
                onSubmit={handleSync}
                onCancel={() => setIsSyncDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading calendar syncs...</div>
        ) : syncs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No calendar syncs yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {syncs.map((sync) => (
              <Card key={sync.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getCalendarIcon(sync.calendarType)}
                        <h3 className="font-semibold">{sync.registration.event.title}</h3>
                        <Badge variant={sync.syncStatus === "ACTIVE" ? "default" : "outline"}>
                          {sync.syncStatus}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Calendar: {getCalendarName(sync.calendarType)}</p>
                        <p>
                          Date: {new Date(sync.registration.event.startDate).toLocaleDateString()}
                        </p>
                        {sync.reminderEnabled && sync.reminderMinutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Reminder: {sync.reminderMinutes} minutes before</span>
                          </div>
                        )}
                        <p>Synced: {new Date(sync.syncedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemoveConfirm(sync.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove calendar sync?</AlertDialogTitle>
            <AlertDialogDescription>This will stop syncing event updates to your calendar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (removeConfirm) { handleRemove(removeConfirm); } setRemoveConfirm(null); }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SyncEventForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    registrationId: string;
    calendarType: "GOOGLE" | "APPLE" | "OUTLOOK" | "ICAL";
    reminderMinutes?: number;
  }) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    registrationId: "",
    calendarType: "GOOGLE" as "GOOGLE" | "APPLE" | "OUTLOOK" | "ICAL",
    reminderMinutes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      registrationId: formData.registrationId,
      calendarType: formData.calendarType,
      reminderMinutes: formData.reminderMinutes ? parseInt(formData.reminderMinutes) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="registrationId">Registration ID *</Label>
        <Input
          id="registrationId"
          value={formData.registrationId}
          onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
          required
          placeholder="Enter registration ID"
        />
      </div>
      <div>
        <Label htmlFor="calendarType">Calendar Type *</Label>
        <Select
          value={formData.calendarType}
          onValueChange={(value: "GOOGLE" | "APPLE" | "OUTLOOK" | "ICAL") =>
            setFormData({ ...formData, calendarType: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GOOGLE">Google Calendar</SelectItem>
            <SelectItem value="APPLE">Apple Calendar</SelectItem>
            <SelectItem value="OUTLOOK">Outlook</SelectItem>
            <SelectItem value="ICAL">iCal File (Download)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="reminderMinutes">Reminder (minutes before event)</Label>
        <Input
          id="reminderMinutes"
          type="number"
          min="0"
          max="10080"
          value={formData.reminderMinutes}
          onChange={(e) => setFormData({ ...formData, reminderMinutes: e.target.value })}
          placeholder="e.g., 15, 30, 60"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Sync to Calendar</Button>
      </div>
    </form>
  );
};

export default EventCalendarIntegration;
