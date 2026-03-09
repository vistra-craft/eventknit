import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Loader } from '../ui/loader';
import { Alert, AlertDescription } from '../ui/alert';
import { FileText, AlertCircle, MessageCircle, Eye, Calendar, MapPin, Users } from 'lucide-react';
import { KYCViewer } from './KYCViewer';
import { ApprovalCommunication } from './ApprovalCommunication';
import type { ApprovalMessage } from './ApprovalCommunication';
import {
  getOrganizerKYCDetails,
  approveEvent,
  rejectEvent,
} from '../../lib/admin-api';
import type { KYCOrganizerDetails } from '../../lib/admin-api';
import { extractErrorMessage } from '../../lib/utils/error';

export interface EventWithOrganizer {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    organizationName?: string;
  };
  [key: string]: unknown;
}

interface EventApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventWithOrganizer | null;
  onApprovalComplete?: (action: 'approved' | 'rejected' | 'requested_info') => void;
}

export const EventApprovalDialog = ({
  open,
  onOpenChange,
  event,
  onApprovalComplete,
}: EventApprovalDialogProps) => {
  const [loadingKYC, setLoadingKYC] = useState(false);
  const [_loadingMessages] = useState(false);
  const [kycDetails, setKycDetails] = useState<KYCOrganizerDetails | null>(null);
  const [_messages] = useState<ApprovalMessage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  // Load KYC and messages when dialog opens
  useEffect(() => {
    if (!open || !event) return;

    const loadData = async () => {
      try {
        setError(null);
        
        // Load KYC details
        setLoadingKYC(true);
        const kycRes = await getOrganizerKYCDetails(event.organizerId);
        setKycDetails(kycRes.data);
        
        // Load approval messages
        // TODO: Implement getEventApprovalMessages in admin-api
        // setLoadingMessages(true);
        // const messagesRes = await getEventApprovalMessages(event.id);
        // setMessages(messagesRes.data.messages as ApprovalMessage[]);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load approval data'));
        console.error('Error loading approval data:', err);
      } finally {
        setLoadingKYC(false);
      }
    };

    loadData();
  }, [open, event]);

  const handleApprove = async () => {
    if (!event) return;
    
    try {
      setProcessing(true);
      await approveEvent(event.id);
      onApprovalComplete?.('approved');
      onOpenChange(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to approve event'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!event) return;

    try {
      setProcessing(true);
      await rejectEvent(event.id, reason);
      onApprovalComplete?.('rejected');
      onOpenChange(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to reject event'));
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!event) return;

    try {
      setProcessing(true);
      // TODO: Implement requestEventApprovalInfo in admin-api
      // await requestEventApprovalInfo(event.id, _message, _missingDocuments);
      // // Reload messages
      // const messagesRes = await getEventApprovalMessages(event.id);
      // setMessages(messagesRes.data.messages as ApprovalMessage[]);
      onApprovalComplete?.('requested_info');
      setActiveTab('communication'); // Switch to communication tab to show the message
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send request'));
    } finally {
      setProcessing(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{event.title} — Approval Review</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Event</span>
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">KYC</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
              {_messages.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                  {_messages.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="max-h-[60vh] overflow-y-auto">
              {event && (
                <div className="space-y-4">
                  <div className="bg-card rounded-lg border p-4">
                    <h2 className="text-2xl font-bold mb-3">{event.title}</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Event details and specifications would appear here</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Location and venue information</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Organizer: {event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-4 mt-4">
            {loadingKYC ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="lg" className="h-8 w-8" />
                <span className="ml-2 text-muted-foreground">Loading KYC details...</span>
              </div>
            ) : kycDetails ? (
              <div className="max-h-[60vh] overflow-y-auto">
                <KYCViewer
                  organizer={kycDetails}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRequestMoreInfo={handleRequestInfo}
                  isLoading={processing}
                />
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load KYC details</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-4 mt-4">
            {_loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="lg" className="h-8 w-8" />
                <span className="ml-2 text-muted-foreground">Loading messages...</span>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                <ApprovalCommunication
                  organizerId={event.organizerId}
                  eventId={event.id}
                  messages={_messages}
                  isLoading={processing}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        {activeTab === 'kyc' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            {/* Note: Approve/Reject buttons are in the KYCViewer component */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventApprovalDialog;
