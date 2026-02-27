import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/config/database.js';
import { UserRole, UserStatus, OrganizerEntityType, EventStatus } from '@prisma/client';
import { EventApprovalMessageService as MessageService } from '../../src/services/event-approval-message.service.js';

describe('EventApprovalMessageService', () => {
  let adminId: string;
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    // Create organizer
    const organizer = await prisma.user.create({
      data: {
        email: `organizer-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Org',
        lastName: 'Anizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.PENDING_APPROVAL,
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
      },
    });
    organizerId = organizer.id;

    // Create event for organizer
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test event description',
        location: 'Test Location',
        startDate: new Date(Date.now() + 86400000),
        isFree: false,
        price: 100,
        organizerId,
        status: EventStatus.PENDING,
      },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.eventApprovalMessage.deleteMany({
      where: { eventId },
    });
    await prisma.event.deleteMany({
      where: { id: eventId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, organizerId] } },
    });
    await prisma.$disconnect();
  });

  describe('createMessage', () => {
    it('should create a REQUEST_INFO message', async () => {
      const message = await MessageService.createMessage({
        eventId,
        organizerId,
        type: 'REQUEST_INFO',
        title: 'Additional Information Required',
        message: 'Please provide missing documents',
        senderRole: 'ADMIN',
        senderName: 'Admin User',
        senderEmail: 'admin@test.com',
        attachedDocuments: ['NATIONAL_ID', 'KRA_PIN'],
      });

      expect(message.id).toBeDefined();
      expect(message.type).toBe('REQUEST_INFO');
      expect(message.status).toBe('PENDING');
      expect(message.attachedDocuments).toContain('NATIONAL_ID');
    });

    it('should create an APPROVED message', async () => {
      const message = await MessageService.createApprovedMessage(
        eventId,
        organizerId,
        'Admin User',
        'admin@test.com',
      );

      expect(message.type).toBe('APPROVED');
      expect(message.title).toContain('Approved');
      expect(message.senderRole).toBe('ADMIN');
    });

    it('should create a REJECTED message', async () => {
      const message = await MessageService.createRejectedMessage(
        eventId,
        organizerId,
        'Event does not meet our guidelines',
        'Admin User',
        'admin@test.com',
      );

      expect(message.type).toBe('REJECTED');
      expect(message.title).toContain('Status Update');
      expect(message.message).toContain('does not meet');
    });

    it('should throw error if event does not exist', async () => {
      const invalidEventId = 'invalid-event-id';

      await expect(
        MessageService.createMessage({
          eventId: invalidEventId,
          organizerId,
          type: 'REQUEST_INFO',
          title: 'Test',
          message: 'Test message',
          senderRole: 'ADMIN',
          senderName: 'Admin',
        }),
      ).rejects.toThrow('not found');
    });
  });

  describe('getEventMessages', () => {
    let messageId1: string;
    let messageId2: string;

    beforeEach(async () => {
      // Create test messages
      const msg1 = await MessageService.createRequestInfoMessage(
        eventId,
        organizerId,
        'First request',
        ['NATIONAL_ID'],
        'Admin',
        'admin@test.com',
      );
      messageId1 = msg1.id;

      const msg2 = await MessageService.createApprovedMessage(
        eventId,
        organizerId,
        'Admin',
        'admin@test.com',
      );
      messageId2 = msg2.id;
    });

    it('should retrieve all messages for an event', async () => {
      const result = await MessageService.getEventMessages({
        eventId,
        limit: 50,
        offset: 0,
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.messages[0]).toHaveProperty('type');
    });

    it('should support pagination', async () => {
      const result = await MessageService.getEventMessages({
        eventId,
        limit: 1,
        offset: 0,
      });

      expect(result.messages.length).toBeLessThanOrEqual(1);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    afterEach(async () => {
      // Cleanup messages
      await prisma.eventApprovalMessage.deleteMany({
        where: { id: { in: [messageId1, messageId2] } },
      });
    });
  });

  describe('updateMessageStatus', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await MessageService.createRequestInfoMessage(
        eventId,
        organizerId,
        'Test request',
        ['NATIONAL_ID'],
        'Admin',
        'admin@test.com',
      );
      messageId = message.id;
    });

    it('should update message status to VIEWED', async () => {
      const updated = await MessageService.updateMessageStatus({
        messageId,
        status: 'VIEWED',
      });

      expect(updated.status).toBe('VIEWED');
    });

    it('should throw error if message does not exist', async () => {
      await expect(
        MessageService.updateMessageStatus({
          messageId: 'invalid-id',
          status: 'VIEWED',
        }),
      ).rejects.toThrow('not found');
    });

    afterEach(async () => {
      await prisma.eventApprovalMessage.delete({ where: { id: messageId } });
    });
  });

  describe('respondToMessage', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await MessageService.createRequestInfoMessage(
        eventId,
        organizerId,
        'Please provide documents',
        ['NATIONAL_ID', 'KRA_PIN'],
        'Admin',
        'admin@test.com',
      );
      messageId = message.id;
    });

    it('should allow organizer to respond to REQUEST_INFO message', async () => {
      const updated = await MessageService.respondToMessage({
        messageId,
        responseMessage: 'I have uploaded the requested documents',
      });

      expect(updated.status).toBe('RESPONDED');
      expect(updated.responseMessage).toContain('uploaded');
      expect(updated.respondedAt).toBeDefined();
    });

    it('should throw error if message type is not REQUEST_INFO', async () => {
      // Create a different type of message
      const approvedMsg = await MessageService.createApprovedMessage(
        eventId,
        organizerId,
        'Admin',
        'admin@test.com',
      );

      await expect(
        MessageService.respondToMessage({
          messageId: approvedMsg.id,
          responseMessage: 'Cannot respond to approval',
        }),
      ).rejects.toThrow('REQUEST_INFO');
    });

    afterEach(async () => {
      await prisma.eventApprovalMessage.deleteMany({
        where: { eventId },
      });
    });
  });

  describe('markAsViewed', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await MessageService.createRequestInfoMessage(
        eventId,
        organizerId,
        'Test request',
        ['NATIONAL_ID'],
        'Admin',
        'admin@test.com',
      );
      messageId = message.id;
    });

    it('should change PENDING status to VIEWED', async () => {
      const updated = await MessageService.markAsViewed(messageId);

      expect(updated.status).toBe('VIEWED');
    });

    it('should not change status if already VIEWED or RESPONDED', async () => {
      await MessageService.markAsViewed(messageId);
      const updated = await MessageService.markAsViewed(messageId);

      expect(updated.status).toBe('VIEWED');
    });

    afterEach(async () => {
      await prisma.eventApprovalMessage.delete({ where: { id: messageId } });
    });
  });

  describe('getPendingMessagesForOrganizer', () => {
    it('should retrieve pending REQUEST_INFO messages for organizer', async () => {
      // Create a pending message
      await MessageService.createRequestInfoMessage(
        eventId,
        organizerId,
        'Please provide documents',
        ['NATIONAL_ID'],
        'Admin',
        'admin@test.com',
      );

      const messages = await MessageService.getPendingMessagesForOrganizer(organizerId);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.some(m => m.type === 'REQUEST_INFO')).toBe(true);
    });
  });

  describe('getApprovalHistory', () => {
    it('should retrieve all approval history for event in reverse order', async () => {
      // Create messages of different types
      await MessageService.createRequestInfoMessage(
        eventId,
        organizerId,
        'Initial request',
        ['NATIONAL_ID'],
        'Admin',
        'admin@test.com',
      );

      await new Promise(resolve => setTimeout(resolve, 100)); // Slight delay

      await MessageService.createApprovedMessage(
        eventId,
        organizerId,
        'Admin',
        'admin@test.com',
      );

      const history = await MessageService.getApprovalHistory(eventId);

      expect(history.length).toBeGreaterThanOrEqual(2);
      // Most recent should be first (reverse order)
      expect(history[0].type).toBe('APPROVED');
    });
  });
});

describe('Event Approval Workflow Integration', () => {
  let adminId: string;
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    // Create test users and event
    const admin = await prisma.user.create({
      data: {
        email: `admin-workflow-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Admin',
        lastName: 'Workflow',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    const organizer = await prisma.user.create({
      data: {
        email: `org-workflow-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Organizer',
        lastName: 'Workflow',
        role: UserRole.ORGANIZER,
        status: UserStatus.PENDING_APPROVAL,
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
      },
    });
    organizerId = organizer.id;

    const event = await prisma.event.create({
      data: {
        title: 'Workflow Test Event',
        description: 'For testing approval workflow',
        location: 'Test City',
        startDate: new Date(Date.now() + 172800000),
        isFree: false,
        price: 50,
        organizerId,
        status: EventStatus.PENDING,
      },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    await prisma.eventApprovalMessage.deleteMany({
      where: { eventId },
    });
    await prisma.event.delete({ where: { id: eventId } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, organizerId] } },
    });
  });

  it('should execute complete approval workflow: request → respond → approve', async () => {
    // Step 1: Admin requests more information
    const requestMsg = await MessageService.createRequestInfoMessage(
      eventId,
      organizerId,
      'Please provide KYC documents',
      ['NATIONAL_ID', 'KRA_PIN'],
      'Admin Workflow',
      'admin@test.com',
    );

    expect(requestMsg.type).toBe('REQUEST_INFO');
    expect(requestMsg.status).toBe('PENDING');

    // Step 2: Organizer views and responds
    const viewedMsg = await MessageService.markAsViewed(requestMsg.id);
    expect(viewedMsg.status).toBe('VIEWED');

    const respondedMsg = await MessageService.respondToMessage({
      messageId: requestMsg.id,
      responseMessage: 'Documents uploaded and verified',
    });

    expect(respondedMsg.status).toBe('RESPONDED');
    expect(respondedMsg.respondedAt).toBeDefined();

    // Step 3: Admin approves event
    const approvalMsg = await MessageService.createApprovedMessage(
      eventId,
      organizerId,
      'Admin Workflow',
      'admin@test.com',
    );

    expect(approvalMsg.type).toBe('APPROVED');

    // Step 4: Verify all messages are in history
    const history = await MessageService.getApprovalHistory(eventId);

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.some(m => m.type === 'REQUEST_INFO')).toBe(true);
    expect(history.some(m => m.type === 'APPROVED')).toBe(true);
  });

  it('should execute rejection workflow: request → reject', async () => {
    // Create another event for rejection test
    const event2 = await prisma.event.create({
      data: {
        title: 'Rejection Test Event',
        description: 'For testing rejection',
        location: 'Test City',
        startDate: new Date(Date.now() + 172800000),
        isFree: true,
        organizerId,
        status: EventStatus.PENDING,
      },
    });

    // Admin requests info
    await MessageService.createRequestInfoMessage(
      event2.id,
      organizerId,
      'Issues with event details',
      [],
      'Admin Workflow',
      'admin@test.com',
    );

    // Admin decides to reject
    const rejectionMsg = await MessageService.createRejectedMessage(
      event2.id,
      organizerId,
      'Event violates terms of service',
      'Admin Workflow',
      'admin@test.com',
    );

    expect(rejectionMsg.type).toBe('REJECTED');

    const history = await MessageService.getApprovalHistory(event2.id);
    expect(history.some(m => m.type === 'REJECTED')).toBe(true);

    // Cleanup
    await prisma.eventApprovalMessage.deleteMany({ where: { eventId: event2.id } });
    await prisma.event.delete({ where: { id: event2.id } });
  });
});
