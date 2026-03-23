/**
 * Quick Register Dialog
 * Allows staff to register walk-in attendees using the event's registration form
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { quickRegisterAttendee, type QuickRegisterResult } from '@/lib/attendee-import-api';
import type { RegistrationField, EventData } from '@/types/event';

interface QuickRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  event: EventData | null;
  onSuccess?: (result: QuickRegisterResult) => void;
}

type Step = 'form' | 'success';

export function QuickRegisterDialog({
  open,
  onOpenChange,
  eventId,
  event,
  onSuccess,
}: QuickRegisterDialogProps) {
  const [step, setStep] = useState<Step>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuickRegisterResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string | boolean>>({});

  const ticketTypes = (event?.ticketTypes as Array<{ name: string }>) || [];
  const registrationFields = event?.registrationFields || [];

  const resetForm = useCallback(() => {
    setStep('form');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setTicketType('');
    setCustomFields({});
    setError(null);
    setResult(null);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetForm]);

  const handleCustomFieldChange = (fieldId: string, value: string | boolean) => {
    setCustomFields(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Build registration data from custom fields
      const registrationData: Record<string, unknown> = {};
      Object.entries(customFields).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          registrationData[key] = value;
        }
      });

      const registerResult = await quickRegisterAttendee(eventId, {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || undefined,
        ticketType: ticketType || undefined,
        registrationData: Object.keys(registrationData).length > 0 ? registrationData : undefined,
      });

      setResult(registerResult);
      setStep('success');
      onSuccess?.(registerResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCode = async () => {
    if (result?.backupCode) {
      await navigator.clipboard.writeText(result.backupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handlePrintBadge = () => {
    // This would integrate with the print system
    // For now, just open the QR code in a new window for printing
    if (result?.qrCodeDataUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Badge - ${result.attendeeName}</title></head>
            <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
              <h1 style="margin-bottom: 10px;">${result.attendeeName}</h1>
              <p style="margin: 5px 0; color: #666;">${result.email}</p>
              ${result.ticketType ? `<p style="margin: 5px 0; color: #666;">${result.ticketType}</p>` : ''}
              <img src="${result.qrCodeDataUrl}" style="width: 200px; height: 200px; margin: 20px 0;" />
              <p style="font-family: monospace; font-size: 14px;">${result.backupCode}</p>
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const renderFormField = (field: RegistrationField) => {
    const fieldId = field.id;
    const value = customFields[fieldId] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
       // removed 'tel', use 'phone' only
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type === 'phone' ? 'tel' : field.type}
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleCustomFieldChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldId} className="space-y-2 col-span-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleCustomFieldChange(fieldId, e.target.value)}
              required={field.required}
              rows={3}
            />
          </div>
        );

      case 'select':
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={String(value)}
              onValueChange={(v) => handleCustomFieldChange(fieldId, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={String(value)}
              onValueChange={(v) => handleCustomFieldChange(fieldId, v)}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                  <Label htmlFor={`${fieldId}-${option}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        return (
          <div key={fieldId} className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleCustomFieldChange(fieldId, checked === true)}
            />
            <Label htmlFor={fieldId} className="font-normal">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFormStep = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Core Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              placeholder="John"
              className="pl-10"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+254 700 000 000"
            className="pl-10"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
      </div>

      {/* Ticket Type Selection */}
      {ticketTypes.length > 0 && (
        <div className="space-y-2">
          <Label>Ticket Type</Label>
          <Select value={ticketType} onValueChange={setTicketType}>
            <SelectTrigger>
              <SelectValue placeholder="Select ticket type..." />
            </SelectTrigger>
            <SelectContent>
              {ticketTypes.map((type) => (
                <SelectItem key={type.name} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom Registration Fields */}
      {registrationFields.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="text-sm font-medium text-muted-foreground">Additional Information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {registrationFields.map((field) => renderFormField(field))}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader size="sm" className="mr-2" />
              Registering...
            </>
          ) : (
            'Register Attendee'
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold">Registration Successful!</h3>
        <p className="text-muted-foreground mt-1">{result?.attendeeName} has been registered.</p>
      </div>

      {/* QR Code */}
      {result?.qrCodeDataUrl && (
        <div className="flex justify-center">
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <img
              src={result.qrCodeDataUrl}
              alt="QR Code"
              className="w-40 h-40"
            />
          </div>
        </div>
      )}

      {/* Backup Code */}
      {result?.backupCode && (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Backup Code</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-muted rounded-md font-mono text-lg text-center">
              {result.backupCode}
            </code>
            <Button
              variant="outline"
              size="icon"
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

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={handlePrintBadge} className="w-full sm:w-auto">
          <Printer className="h-4 w-4 mr-2" />
          Print Badge
        </Button>
        <Button onClick={resetForm} className="w-full sm:w-auto">
          Register Another
        </Button>
        <Button variant="secondary" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
          Done
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? 'Quick Register Attendee' : 'Registration Complete'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? 'Register a walk-in attendee for this event.'
              : 'The attendee has been successfully registered.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? renderFormStep() : renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
}
