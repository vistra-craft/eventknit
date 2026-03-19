/**
 * ChatPanel — Copilot-style sliding chat interface
 *
 * Slides in from the right using Sheet. Three views:
 * - list: Inbox/Sent message list
 * - thread: Single conversation view with replies
 * - compose: New message form
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Send,
  Plus,
  Mail,
  MailOpen,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import {
  getInbox,
  getSentMessages,
  sendMessage,
  getMessageThread,
  markMessageAsRead,
  deleteMessage,
} from '@/lib/user-dashboard-api';
import type { DirectMessage } from '@/types/user-dashboard';

type View = 'list' | 'thread' | 'compose';
type Tab = 'inbox' | 'sent';

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatPanel = ({ open, onOpenChange }: ChatPanelProps) => {
  const [view, setView] = useState<View>('list');
  const [tab, setTab] = useState<Tab>('inbox');
  const [inbox, setInbox] = useState<DirectMessage[]>([]);
  const [sent, setSent] = useState<DirectMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeMessage, setActiveMessage] = useState<DirectMessage | null>(null);
  const [sending, setSending] = useState(false);

  // Compose form
  const [composeData, setComposeData] = useState({
    recipientEmail: '',
    subject: '',
    content: '',
  });

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        getInbox({ page: 1, limit: 50 }),
        getSentMessages({ page: 1, limit: 50 }),
      ]);
      if (inboxRes.success && inboxRes.data) {
        setInbox(inboxRes.data.messages);
        setUnreadCount(inboxRes.data.unreadCount);
      }
      if (sentRes.success && sentRes.data) {
        setSent(sentRes.data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open, fetchMessages]);

  const handleOpenThread = async (message: DirectMessage) => {
    try {
      const res = await getMessageThread(message.id);
      if (res.success && res.data) {
        setActiveMessage(res.data.message);
        if (!message.isRead) {
          await markMessageAsRead(message.id);
          setUnreadCount((c) => Math.max(0, c - 1));
          setInbox((prev) =>
            prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
          );
        }
      }
    } catch {
      setActiveMessage(message);
    }
    setView('thread');
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setInbox((prev) => prev.filter((m) => m.id !== messageId));
      setSent((prev) => prev.filter((m) => m.id !== messageId));
      if (activeMessage?.id === messageId) {
        setView('list');
        setActiveMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSend = async () => {
    if (!composeData.content.trim() || !composeData.recipientEmail.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        recipientId: composeData.recipientEmail.trim(),
        subject: composeData.subject.trim() || undefined,
        content: composeData.content.trim(),
      });
      setComposeData({ recipientEmail: '', subject: '', content: '' });
      setView('list');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (content: string) => {
    if (!activeMessage || !content.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        recipientId: activeMessage.senderId,
        content: content.trim(),
        parentMessageId: activeMessage.id,
        eventId: activeMessage.eventId || undefined,
      });
      // Refresh thread
      const res = await getMessageThread(activeMessage.id);
      if (res.success && res.data) {
        setActiveMessage(res.data.message);
      }
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const messages = tab === 'inbox' ? inbox : sent;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            {view !== 'list' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2"
                onClick={() => {
                  setView('list');
                  setActiveMessage(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle className="text-base font-semibold flex-1">
              {view === 'list' && 'Messages'}
              {view === 'thread' && (activeMessage?.subject || 'Conversation')}
              {view === 'compose' && 'New Message'}
            </SheetTitle>
            {view === 'list' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setView('compose')}
              >
                <Plus className="h-3 w-3" />
                New
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* List view */}
          {view === 'list' && (
            <>
              {/* Inbox/Sent tabs */}
              <div className="flex items-center gap-1 p-2 border-b border-border">
                <button
                  onClick={() => setTab('inbox')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                    tab === 'inbox'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-4 min-w-4 rounded-full px-1 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setTab('sent')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    tab === 'sent'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  Sent
                </button>
              </div>

              {/* Message list */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size="default" />
                </div>
              ) : messages.length > 0 ? (
                <div className="divide-y divide-border">
                  {messages.map((msg) => {
                    const other = tab === 'inbox' ? msg.sender : msg.recipient;
                    const name = other
                      ? `${other.firstName} ${other.lastName}`
                      : 'Unknown';
                    return (
                      <button
                        key={msg.id}
                        onClick={() => handleOpenThread(msg)}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center flex-shrink-0">
                          {other ? `${other.firstName[0]}${other.lastName[0]}` : '?'}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!msg.isRead && tab === 'inbox' ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                              {name}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          {msg.subject && (
                            <p className="text-xs text-foreground/80 truncate">{msg.subject}</p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                        </div>
                        {/* Unread dot */}
                        {!msg.isRead && tab === 'inbox' && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  {tab === 'inbox' ? (
                    <Mail className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  ) : (
                    <MailOpen className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {tab === 'inbox' ? 'No messages yet' : 'No sent messages'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Thread view */}
          {view === 'thread' && activeMessage && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Main message */}
                <MessageBubble message={activeMessage} formatTime={formatTime} onDelete={handleDelete} />
                {/* Replies */}
                {activeMessage.replies?.map((reply) => (
                  <MessageBubble key={reply.id} message={reply} formatTime={formatTime} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Compose view */}
          {view === 'compose' && (
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                <Input
                  placeholder="Recipient email or ID"
                  value={composeData.recipientEmail}
                  onChange={(e) => setComposeData((p) => ({ ...p, recipientEmail: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject (optional)</label>
                <Input
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData((p) => ({ ...p, subject: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  value={composeData.content}
                  onChange={(e) => setComposeData((p) => ({ ...p, content: e.target.value }))}
                  rows={6}
                  className="text-sm resize-none"
                />
              </div>
              <Button
                className="w-full gap-2"
                disabled={sending || !composeData.content.trim() || !composeData.recipientEmail.trim()}
                onClick={handleSend}
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          )}
        </div>

        {/* ── Reply input (thread view only) ──────────────────────── */}
        {view === 'thread' && activeMessage && (
          <ReplyInput onSend={handleReply} sending={sending} />
        )}
      </SheetContent>
    </Sheet>
  );
};

// ── Sub-components ──────────────────────────────────────────────

function MessageBubble({
  message,
  formatTime,
  onDelete,
}: {
  message: DirectMessage;
  formatTime: (d: string) => string;
  onDelete: (id: string) => void;
}) {
  const sender = message.sender;
  const name = sender
    ? `${sender.firstName} ${sender.lastName}`
    : 'Unknown';

  return (
    <div className="group">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center flex-shrink-0">
          {sender ? `${sender.firstName[0]}${sender.lastName[0]}` : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground">{name}</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          {message.subject && (
            <p className="text-xs font-medium text-foreground/80 mb-1">{message.subject}</p>
          )}
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{message.content}</p>
          {message.event && (
            <Badge variant="secondary" className="mt-2 text-[10px]">
              {message.event.title}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyInput({ onSend, sending }: { onSend: (content: string) => void; sending: boolean }) {
  const [reply, setReply] = useState('');

  const handleSubmit = () => {
    if (!reply.trim()) return;
    onSend(reply);
    setReply('');
  };

  return (
    <div className="border-t border-border p-3 flex gap-2 flex-shrink-0">
      <Input
        placeholder="Type a reply..."
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        className="text-sm"
        disabled={sending}
      />
      <Button
        size="icon"
        className="h-9 w-9 flex-shrink-0"
        disabled={sending || !reply.trim()}
        onClick={handleSubmit}
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── Floating trigger button ─────────────────────────────────────

interface ChatPanelTriggerProps {
  unreadCount: number;
  onClick: () => void;
}

export const ChatPanelTrigger = ({ unreadCount, onClick }: ChatPanelTriggerProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
      aria-label="Open messages"
    >
      <MessageCircle className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
