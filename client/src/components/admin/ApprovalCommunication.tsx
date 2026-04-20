import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { MessageCircle, Clock, AlertCircle, CheckCircle2, Send } from 'lucide-react';

export interface ApprovalMessage {
  id: string;
  type: 'REQUEST_INFO' | 'APPROVED' | 'REJECTED' | 'ORGANIZER_RESPONSE';
  title: string;
  message: string;
  senderRole: 'ADMIN' | 'ORGANIZER';
  senderName: string;
  senderEmail?: string;
  attachedDocuments?: string[];
  status: 'PENDING' | 'VIEWED' | 'RESPONDED';
  createdAt: string;
  respondedAt?: string;
  responseMessage?: string;
}

interface ApprovalCommunicationProps {
  organizerId: string;
  eventId?: string;
  messages?: ApprovalMessage[];
  onSendMessage?: (type: string, message: string) => Promise<void>;
  isLoading?: boolean;
}

const getMessageIcon = (type: string) => {
  switch (type) {
    case 'REQUEST_INFO':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case 'APPROVED':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'REJECTED':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'ORGANIZER_RESPONSE':
      return <MessageCircle className="h-5 w-5 text-blue-600" />;
    default:
      return <MessageCircle className="h-5 w-5" />;
  }
};

const getMessageBadge = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (type) {
    case 'REQUEST_INFO':
      return 'secondary';
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    case 'ORGANIZER_RESPONSE':
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-50 border-yellow-200';
    case 'VIEWED':
      return 'bg-blue-50 border-blue-200';
    case 'RESPONDED':
      return 'bg-green-50 border-green-200';
    default:
      return 'bg-gray-50';
  }
};

export const ApprovalCommunication = ({
  messages = [],
  onSendMessage,
}: ApprovalCommunicationProps) => {
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  const handleSendReply = async () => {
    if (!selectedMessageId || !replyMessage.trim() || !onSendMessage) return;

    try {
      setIsSending(true);
      await onSendMessage('ORGANIZER_RESPONSE', replyMessage);
      setReplyMessage('');
      setReplyDialogOpen(false);
      setSelectedMessageId(null);
    } finally {
      setIsSending(false);
    }
  };

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Approval Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Admin messages regarding event approval will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Approval Communication
        </CardTitle>
        <CardDescription>
          {messages.length} message{messages.length !== 1 ? 's' : ''} in conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`border rounded-lg p-4 space-y-3 ${getStatusColor(msg.status)}`}
            >
              {/* Message Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getMessageIcon(msg.type)}
                  <div>
                    <p className="font-semibold text-sm">{msg.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {msg.senderName}
                      {msg.senderRole === 'ADMIN' && <span className="ml-2">— Admin</span>}
                      {msg.senderRole === 'ORGANIZER' && <span className="ml-2">— Organizer</span>}
                    </p>
                  </div>
                </div>
                <Badge variant={getMessageBadge(msg.type)}>{msg.status}</Badge>
              </div>

              {/* Message Content */}
              <div className="bg-white dark:bg-slate-950 rounded p-3 text-sm">
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>

              {/* Attached Documents */}
              {msg.attachedDocuments && msg.attachedDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Referenced Documents:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.attachedDocuments.map((doc) => (
                      <Badge key={doc} variant="outline" className="text-xs">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Meta */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                {msg.respondedAt && (
                  <span className="text-green-600">
                    Responded {new Date(msg.respondedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Response Preview */}
              {msg.responseMessage && (
                <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                  <p className="text-xs font-semibold text-green-900 mb-2">Organizer Response:</p>
                  <p className="text-sm text-green-800 whitespace-pre-wrap">
                    {msg.responseMessage}
                  </p>
                </div>
              )}

              {/* Reply Button */}
              {msg.senderRole === 'ADMIN' &&
                msg.type === 'REQUEST_INFO' &&
                !msg.responseMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedMessageId(msg.id);
                      setReplyDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Reply
                  </Button>
                )}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Admin</DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <span>
                  Re: <strong>{selectedMessage.title}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMessage && (
              <div className="bg-secondary rounded p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Original Message:
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Type your response here..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReplyDialogOpen(false);
                setReplyMessage('');
                setSelectedMessageId(null);
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyMessage.trim() || isSending}
            >
              {isSending ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ApprovalCommunication;
