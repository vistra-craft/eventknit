/**
 * Attendee Detail Modal
 * Shows full attendee details including registration data when clicked
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Ticket,
  QrCode,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Briefcase,
  Calendar,
  Copy,
  Check,
} from 'lucide-react';
import type { EventAttendee, TicketStatus } from '@/lib/workstation-api';
import type { RegistrationField } from '@/types/event';

interface AttendeeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendee: EventAttendee | null;
  registrationFields?: RegistrationField[] | null;
  onPrintBadge?: (attendee: EventAttendee) => void;
  onCheckIn?: (attendee: EventAttendee) => void;
  onCheckOut?: (attendee: EventAttendee) => void;
}

export function AttendeeDetailModal({
  open,
  onOpenChange,
  attendee,
  registrationFields,
  onPrintBadge,
  onCheckIn,
  onCheckOut,
}: AttendeeDetailModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!attendee) return null;

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success/10 text-success';
      case 'DEACTIVATED':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-warning/10 text-warning';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCopyBackupCode = async () => {
    if (attendee.backupCode) {
      await navigator.clipboard.writeText(attendee.backupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Get field label from registration fields definition
  const getFieldLabel = (fieldId: string): string => {
    if (!registrationFields) return fieldId;
    const field = registrationFields.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  // Filter out internal fields from registrationData
  const displayableFields = attendee.registrationData
    ? Object.entries(attendee.registrationData).filter(
        ([key]) => !['registeredBy', 'walkIn', 'registeredAt', 'importedAt', 'tags', 'importBatchId'].includes(key)
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {attendee.attendeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div>
              <div className="text-lg">{attendee.attendeeName}</div>
              <div className="text-sm font-normal text-muted-foreground">{attendee.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Attendee details for {attendee.attendeeName}
          </DialogDescription>
        </DialogHeader>

        {/* Status Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getStatusColor(attendee.ticketStatus)}>
            {attendee.ticketStatus}
          </Badge>
          {attendee.ticketType && (
            <Badge variant="outline">
              <Ticket className="w-3 h-3 mr-1" />
              {attendee.ticketType}
            </Badge>
          )}
          {attendee.isCurrentlyInside && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Inside Venue
            </Badge>
          )}
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{attendee.email}</span>
            </div>
            {attendee.phoneNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{attendee.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Check-in Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Check-in Status</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Registered</span>
              </div>
              <p className="text-sm font-medium">
                {new Date(attendee.registeredAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {attendee.checkedInAt ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">Checked In</span>
              </div>
              <p className="text-sm font-medium">
                {attendee.checkedInAt
                  ? new Date(attendee.checkedInAt).toLocaleTimeString()
                  : 'Not yet'}
              </p>
            </div>
          </div>
          {attendee.reEntryCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Re-entries: {attendee.reEntryCount}
            </p>
          )}
        </div>

        {/* Backup Code & QR */}
        {attendee.backupCode && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Ticket Code</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                {attendee.backupCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBackupCode}
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Registration Data */}
        {displayableFields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Registration Details</h4>
              <div className="grid grid-cols-1 gap-2">
                {displayableFields.map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-sm">
                    {key === 'company' ? (
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                    ) : key === 'jobTitle' ? (
                      <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    )}
                    <div>
                      <span className="text-muted-foreground">{getFieldLabel(key)}:</span>{' '}
                      <span className="font-medium">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* QR Code Preview */}
        {attendee.qrCodeDataUrl && (
          <div className="flex justify-center pt-2">
            <img
              src={attendee.qrCodeDataUrl}
              alt="QR Code"
              className="w-32 h-32 border rounded-lg"
            />
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {onPrintBadge && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrintBadge(attendee)}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Badge
            </Button>
          )}
          {onCheckIn && !attendee.checkedInAt && (
            <Button
              size="sm"
              onClick={() => onCheckIn(attendee)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Check In
            </Button>
          )}
          {onCheckOut && attendee.isCurrentlyInside && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCheckOut(attendee)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Check Out
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
