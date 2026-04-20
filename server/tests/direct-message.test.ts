import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/** Helper: send a message and return the message object */
const sendMsg = async (token: string, recipientId: string, content: string, subject?: string) => {
  const res = await request(app)
    .post('/api/v1/user-dashboard/messages')
    .set('Authorization', `Bearer ${token}`)
    .send({ recipientId, content, ...(subject ? { subject } : {}) });
  if (!res.body?.data?.message) {
    throw new Error(`Send failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.message;
};

describe('Direct Messaging & Conversations', () => {
  let dbConnected = false;
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let userCToken: string;
  let userCId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (_error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;
    await cleanupTestData();

    const hashedPassword = await hashPassword('Test123!@$');

    // Create 3 users for conversation testing
    const userA = await prisma.user.create({
      data: {
        email: 'usera@test.com',
        password: hashedPassword,
        firstName: 'Alice',
        lastName: 'Smith',
        avatar: 'https://example.com/alice.jpg',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    userAId = userA.id;
    userAToken = generateAccessToken({
      userId: userA.id,
      email: userA.email,
      role: userA.role,
    });

    const userB = await prisma.user.create({
      data: {
        email: 'userb@test.com',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Jones',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Bob Events',
      },
    });
    userBId = userB.id;
    userBToken = generateAccessToken({
      userId: userB.id,
      email: userB.email,
      role: userB.role,
    });

    const userC = await prisma.user.create({
      data: {
        email: 'userc@test.com',
        password: hashedPassword,
        firstName: 'Charlie',
        lastName: 'Brown',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    userCId = userC.id;
    userCToken = generateAccessToken({
      userId: userC.id,
      email: userC.email,
      role: userC.role,
    });
  });

  // ── Send Message ──────────────────────────────────────────────

  describe('POST /api/v1/user-dashboard/messages', () => {
    it('should send a message and return sender/recipient with avatar', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          recipientId: userBId,
          content: 'Hello Bob, great event!',
          subject: 'Event feedback',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();
      expect(res.body.data.message.content).toBe('Hello Bob, great event!');
      expect(res.body.data.message.subject).toBe('Event feedback');
      expect(res.body.data.message.sender.id).toBe(userAId);
      expect(res.body.data.message.sender.firstName).toBe('Alice');
      // Avatar should be included
      expect(res.body.data.message.sender.avatar).toBe('https://example.com/alice.jpg');
      expect(res.body.data.message.recipient.id).toBe(userBId);
    });

    it('should reject message to non-existent recipient', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          recipientId: '00000000-0000-0000-0000-000000000000',
          content: 'Hello?',
        });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .post('/api/v1/user-dashboard/messages')
        .send({
          recipientId: userBId,
          content: 'Unauthorized message',
        });

      expect(res.status).toBe(401);
    });
  });

  // ── Conversations List ────────────────────────────────────────

  describe('GET /api/v1/user-dashboard/messages/conversations', () => {
    it('should return empty conversations for new user', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/user-dashboard/messages/conversations')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversations).toEqual([]);
      expect(res.body.data.totalUnread).toBe(0);
    });

    it('should group messages by conversation partner', async () => {
      if (!dbConnected) return;

      // Alice sends to Bob
      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userBId, content: 'Hi Bob' });

      // Bob replies to Alice
      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ recipientId: userAId, content: 'Hi Alice!' });

      // Alice sends to Charlie
      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userCId, content: 'Hi Charlie' });

      // Get Alice's conversations
      const res = await request(app)
        .get('/api/v1/user-dashboard/messages/conversations')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toHaveLength(2);

      // Should be sorted by latest message (Charlie last sent, then Bob)
      // But Bob replied after Alice sent to Charlie, so Bob's conversation is newer
      const partnerIds = res.body.data.conversations.map((c: { partnerId: string }) => c.partnerId);
      expect(partnerIds).toContain(userBId);
      expect(partnerIds).toContain(userCId);
    });

    it('should count unread messages per conversation', async () => {
      if (!dbConnected) return;

      // Bob sends 3 messages to Alice (Alice hasn't read any)
      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ recipientId: userAId, content: 'Message 1' });

      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ recipientId: userAId, content: 'Message 2' });

      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ recipientId: userAId, content: 'Message 3' });

      // Get Alice's conversations
      const res = await request(app)
        .get('/api/v1/user-dashboard/messages/conversations')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toHaveLength(1);
      expect(res.body.data.conversations[0].unreadCount).toBe(3);
      expect(res.body.data.totalUnread).toBe(3);
    });

    it('should include partner avatar in conversation list', async () => {
      if (!dbConnected) return;

      // Bob sends to Alice (Alice has avatar set)
      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ recipientId: userAId, content: 'Hey Alice' });

      // Get Bob's conversations — Alice should have avatar
      const res = await request(app)
        .get('/api/v1/user-dashboard/messages/conversations')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations[0].partner.avatar).toBe('https://example.com/alice.jpg');
      expect(res.body.data.conversations[0].partner.firstName).toBe('Alice');
    });

    it('should show last message preview', async () => {
      if (!dbConnected) return;

      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userBId, content: 'First message' });

      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userBId, content: 'Second message' });

      const res = await request(app)
        .get('/api/v1/user-dashboard/messages/conversations')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.data.conversations[0].lastMessage.content).toBe('Second message');
    });
  });

  // ── Conversation With User ────────────────────────────────────

  describe('GET /api/v1/user-dashboard/messages/conversations/:partnerId', () => {
    it('should return all messages between two users in chronological order', async () => {
      if (!dbConnected) return;

      // Exchange messages
      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userBId, content: 'Hey Bob' });

      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ recipientId: userAId, content: 'Hey Alice' });

      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userBId, content: 'How are you?' });

      // Get conversation from Alice's perspective
      const res = await request(app)
        .get(`/api/v1/user-dashboard/messages/conversations/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(3);
      // Chronological order (asc)
      expect(res.body.data.messages[0].content).toBe('Hey Bob');
      expect(res.body.data.messages[1].content).toBe('Hey Alice');
      expect(res.body.data.messages[2].content).toBe('How are you?');
      // Partner info
      expect(res.body.data.partner.id).toBe(userBId);
      expect(res.body.data.partner.firstName).toBe('Bob');
    });

    it('should auto-mark unread messages as read when opening conversation', async () => {
      if (!dbConnected) return;

      // Bob sends to Alice
      const sentMsg = await sendMsg(userBToken, userAId, 'Read me!');
      const messageId = sentMsg.id;

      // Verify it's unread
      const inboxBefore = await request(app)
        .get('/api/v1/user-dashboard/messages/inbox')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(inboxBefore.body.data.unreadCount).toBe(1);

      // Alice opens conversation with Bob — should auto-mark as read
      await request(app)
        .get(`/api/v1/user-dashboard/messages/conversations/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      // Verify message is now read
      const msg = await prisma.directMessage.findUnique({ where: { id: messageId } });
      expect(msg?.isRead).toBe(true);
      expect(msg?.readAt).not.toBeNull();
    });

    it('should include avatar in message sender/recipient', async () => {
      if (!dbConnected) return;

      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userBId, content: 'Test avatar' });

      const res = await request(app)
        .get(`/api/v1/user-dashboard/messages/conversations/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.data.messages[0].sender.avatar).toBe('https://example.com/alice.jpg');
    });
  });

  // ── Inbox (legacy, still supported) ───────────────────────────

  describe('GET /api/v1/user-dashboard/messages/inbox', () => {
    it('should include avatar in sender info', async () => {
      if (!dbConnected) return;

      // Alice sends to Bob
      await request(app)
        .post('/api/v1/user-dashboard/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ recipientId: userBId, content: 'Inbox test' });

      // Bob's inbox should show Alice with avatar
      const res = await request(app)
        .get('/api/v1/user-dashboard/messages/inbox')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages[0].sender.avatar).toBe('https://example.com/alice.jpg');
    });
  });

  // ── Mark as Read ──────────────────────────────────────────────

  describe('POST /api/v1/user-dashboard/messages/:messageId/read', () => {
    it('should mark message as read', async () => {
      if (!dbConnected) return;

      const sentMsg = await sendMsg(userAToken, userBId, 'Mark me read');
      const messageId = sentMsg.id;

      const res = await request(app)
        .post(`/api/v1/user-dashboard/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);

      // Verify in DB
      const dbMsg = await prisma.directMessage.findUnique({ where: { id: messageId } });
      expect(dbMsg?.isRead).toBe(true);
      expect(dbMsg?.readAt).not.toBeNull();
    });

    it('should reject marking someone else message as read', async () => {
      if (!dbConnected) return;

      const sentMsg = await sendMsg(userAToken, userBId, 'Not your message');
      const messageId = sentMsg.id;

      // Charlie tries to mark it as read
      const res = await request(app)
        .post(`/api/v1/user-dashboard/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${userCToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Delete Message ────────────────────────────────────────────

  describe('DELETE /api/v1/user-dashboard/messages/:messageId', () => {
    it('should soft-delete a message', async () => {
      if (!dbConnected) return;

      const sentMsg = await sendMsg(userAToken, userBId, 'Delete me');
      const messageId = sentMsg.id;

      const res = await request(app)
        .delete(`/api/v1/user-dashboard/messages/${messageId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);

      // Verify soft-deleted
      const dbMsg = await prisma.directMessage.findUnique({ where: { id: messageId } });
      expect(dbMsg?.isDeleted).toBe(true);
      expect(dbMsg?.deletedAt).not.toBeNull();
    });

    it('should not appear in conversations after deletion', async () => {
      if (!dbConnected) return;

      const sentMsg = await sendMsg(userAToken, userBId, 'Only message');
      const messageId = sentMsg.id;

      // Delete it
      await request(app)
        .delete(`/api/v1/user-dashboard/messages/${messageId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      // Should not appear in conversations
      const res = await request(app)
        .get('/api/v1/user-dashboard/messages/conversations')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.data.conversations).toHaveLength(0);
    });
  });
});
