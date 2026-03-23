/**
 * ChatPanel — Conversation-based messaging interface
 *
 * Slides in from the right using Sheet. Three views:
 * - conversations: List of conversations grouped by partner (WhatsApp-style)
 * - chat: Full conversation thread with a partner
 * - compose: New message form
 *
 * Features:
 * - Real-time message delivery via WebSocket
 * - Profile photos with initials fallback
 * - Read receipts (sent / read indicators)
 * - Unread count per conversation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  ArrowLeft,
  Send,
  Plus,
  MessageCircle,
  Check,
  CheckCheck,
  Trash2,
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
  getConversations,
  getConversationWithUser,
  sendMessage,
  deleteMessage,
} from '@/lib/user-dashboard-api';
import type { DirectMessage, Conversation } from '@/types/user-dashboard';
import { useAuth } from '@/hooks/useAuth';

type View = 'conversations' | 'chat' | 'compose';

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Avatar ──────────────────────────────────────────────────────────────────

function UserAvatar({
  user,
  size = 'md',
}: {
  user?: { firstName?: string; lastName?: string; avatar?: string | null; profileImage?: string } | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  };

  const avatarUrl = user?.avatar || user?.profileImage;
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
    : '?';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export const ChatPanel = ({ open, onOpenChange }: ChatPanelProps) => {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id;

  const [view, setView] = useState<View>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [, setTotalUnread] = useState(0);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [activePartner, setActivePartner] = useState<Conversation['partner'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Compose form
  const [composeData, setComposeData] = useState({
    recipientEmail: '',
    subject: '',
    content: '',
  });

  // ── Format time ───────────────────────────────────────────────

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

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // ── Fetch conversations ───────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConversations();
      if (res.success && res.data) {
        setConversations(res.data.conversations);
        setTotalUnread(res.data.totalUnread);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Open a conversation ───────────────────────────────────────

  const openConversation = useCallback(async (partner: Conversation['partner']) => {
    setActivePartner(partner);
    setView('chat');
    setLoading(true);
    try {
      const res = await getConversationWithUser(partner.id, { limit: 100 });
      if (res.success && res.data) {
        setChatMessages(res.data.messages);
        // Decrement unread for this conversation
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === partner.id ? { ...c, unreadCount: 0 } : c
          )
        );
        setTotalUnread((prev) => {
          const conv = conversations.find((c) => c.partnerId === partner.id);
          return Math.max(0, prev - (conv?.unreadCount || 0));
        });
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [conversations]);

  // ── Send message ──────────────────────────────────────────────

  const handleSendInChat = async (content: string) => {
    if (!activePartner || !content.trim()) return;
    setSending(true);
    try {
      const res = await sendMessage({
        recipientId: activePartner.id,
        content: content.trim(),
      });
      if (res.success && res.data) {
        setChatMessages((prev) => [...prev, res.data!.message]);
      }
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  };

  const handleComposeSend = async () => {
    if (!composeData.content.trim() || !composeData.recipientEmail.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        recipientId: composeData.recipientEmail.trim(),
        subject: composeData.subject.trim() || undefined,
        content: composeData.content.trim(),
      });
      setComposeData({ recipientEmail: '', subject: '', content: '' });
      setView('conversations');
      fetchConversations();
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  };

  // ── Delete message ────────────────────────────────────────────

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // ── WebSocket for real-time ───────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:notifications');
    });

    // New message received
    socket.on('message:new', (data: { message: DirectMessage }) => {
      const msg = data.message;

      // If currently chatting with this sender, append the message
      if (activePartner && msg.senderId === activePartner.id) {
        setChatMessages((prev) => [...prev, msg]);
      } else {
        // Update conversation list unread count
        setTotalUnread((prev) => prev + 1);
        setConversations((prev) => {
          const existing = prev.find((c) => c.partnerId === msg.senderId);
          if (existing) {
            return prev.map((c) =>
              c.partnerId === msg.senderId
                ? { ...c, lastMessage: msg, unreadCount: c.unreadCount + 1 }
                : c
            );
          }
          // New conversation partner
          return [{
            partnerId: msg.senderId!,
            partner: msg.sender!,
            lastMessage: msg,
            unreadCount: 1,
            totalMessages: 1,
          }, ...prev] as Conversation[];
        });
      }
    });

    // Message read receipt
    socket.on('message:read', (data: { messageId: string; readAt: string }) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, isRead: true, readAt: data.readAt } : m
        )
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartner?.id]);

  // ── Fetch on open ─────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open, fetchConversations]);

  // ── Auto-scroll chat to bottom ────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Render ────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            {view !== 'conversations' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2"
                onClick={() => {
                  setView('conversations');
                  setActivePartner(null);
                  setChatMessages([]);
                  fetchConversations();
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            {view === 'conversations' && (
              <SheetTitle className="text-base font-semibold flex-1">Messages</SheetTitle>
            )}
            {view === 'chat' && activePartner && (
              <div className="flex items-center gap-2 flex-1">
                <UserAvatar user={activePartner} size="sm" />
                <SheetTitle className="text-base font-semibold">
                  {activePartner.firstName} {activePartner.lastName}
                </SheetTitle>
              </div>
            )}
            {view === 'compose' && (
              <SheetTitle className="text-base font-semibold flex-1">New Message</SheetTitle>
            )}

            {view === 'conversations' && (
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

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Conversations List ────────────────────────────── */}
          {view === 'conversations' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size="default" />
                </div>
              ) : conversations.length > 0 ? (
                <div className="divide-y divide-border">
                  {conversations.map((conv) => (
                    <button
                      key={conv.partnerId}
                      onClick={() => openConversation(conv.partner)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-center"
                    >
                      <UserAvatar user={conv.partner} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                            {conv.partner.firstName} {conv.partner.lastName}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {conv.lastMessage.senderId === currentUserId && (
                            <span className="text-muted-foreground">You: </span>
                          )}
                          {conv.lastMessage.content}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-[10px] flex-shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start a conversation with an organizer or attendee</p>
                  <Button size="sm" className="gap-1.5" onClick={() => setView('compose')}>
                    <Plus className="h-3 w-3" />
                    New Message
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── Chat View ─────────────────────────────────────── */}
          {view === 'chat' && (
            <div className="flex flex-col h-full">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size="default" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => {
                    const isMine = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}
                      >
                        {!isMine && (
                          <UserAvatar user={msg.sender} size="sm" />
                        )}
                        <div className={`max-w-[75%] ${!isMine ? 'ml-2' : ''}`}>
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm ${
                              isMine
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted text-foreground rounded-bl-sm'
                            }`}
                          >
                            {msg.subject && (
                              <p className={`text-xs font-semibold mb-1 ${isMine ? 'text-primary-foreground/80' : 'text-foreground/70'}`}>
                                {msg.subject}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : ''}`}>
                            <span className="text-[10px] text-muted-foreground">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {/* Read receipt for sent messages */}
                            {isMine && (
                              msg.isRead
                                ? <CheckCheck className="h-3 w-3 text-primary" />
                                : <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                            {/* Delete on hover */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDelete(msg.id)}
                            >
                              <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          )}

          {/* ── Compose View ──────────────────────────────────── */}
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
                onClick={handleComposeSend}
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          )}
        </div>

        {/* ── Chat Input (chat view only) ─────────────────────── */}
        {view === 'chat' && activePartner && (
          <ChatInput onSend={handleSendInChat} sending={sending} />
        )}
      </SheetContent>
    </Sheet>
  );
};

// ── Chat Input ──────────────────────────────────────────────────────────────

function ChatInput({ onSend, sending }: { onSend: (content: string) => void; sending: boolean }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="border-t border-border p-3 flex gap-2 flex-shrink-0">
      <Input
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="text-sm"
        disabled={sending}
      />
      <Button
        size="icon"
        className="h-9 w-9 flex-shrink-0"
        disabled={sending || !text.trim()}
        onClick={handleSubmit}
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── Floating trigger button ─────────────────────────────────────────────────

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
