import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { EventService } from '../../src/services/event.service.js';
import { prisma } from '../../src/config/database.js';
import { UserRole, UserStatus, OrganizerEntityType } from '@prisma/client';
import { AuthorizationError as _AuthorizationError } from '../../src/utils/errors.js';

describe('Event Creation & Organizer Status Restrictions', () => {
  let pendingOrgId: string;
  let activeOrgId: string;
  let suspendedOrgId: string;
  let deactivatedOrgId: string;

  beforeAll(async () => {
    // Create organizers with different statuses
    const pendingOrg = await prisma.user.create({
      data: {
        email: `pending-org-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Pending',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.PENDING_APPROVAL,
        organizerEntityType: OrganizerEntityType.SOLE_PROPRIETOR,
      },
    });
    pendingOrgId = pendingOrg.id;

    const activeOrg = await prisma.user.create({
      data: {
        email: `active-org-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Active',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
      },
    });
    activeOrgId = activeOrg.id;

    const suspendedOrg = await prisma.user.create({
      data: {
        email: `suspended-org-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Suspended',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.SUSPENDED,
        organizerEntityType: OrganizerEntityType.PARTNERSHIP,
      },
    });
    suspendedOrgId = suspendedOrg.id;

    const deactivatedOrg = await prisma.user.create({
      data: {
        email: `deactivated-org-${Date.now()}@test.com`,
        password: 'hashed_password',
        firstName: 'Deactivated',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.DEACTIVATED,
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
      },
    });
    deactivatedOrgId = deactivatedOrg.id;
  });

  afterAll(async () => {
    // Cleanup all created events and users
    const orgIds = [pendingOrgId, activeOrgId, suspendedOrgId, deactivatedOrgId];
    
    await prisma.event.deleteMany({
      where: { organizerId: { in: orgIds } },
    });

    await prisma.user.deleteMany({
      where: { id: { in: orgIds } },
    });

    await prisma.$disconnect();
  });

  describe('Pending Approval Status', () => {
    it('should allow PENDING_APPROVAL organizer to create their first event', async () => {
      const eventData = {
        title: 'Pending Org First Event',
        description: 'First event by pending organizer',
        location: 'Test City',
        startDate: new Date(Date.now() + 86400000),
        isFree: false,
        price: 100,
      };

      const event = await EventService.createEvent(
        eventData,
        pendingOrgId,
        UserRole.ORGANIZER,
      );

      expect(event.id).toBeDefined();
      expect(event.status).toBe('PENDING'); // Event awaits admin approval
      expect(event.organizerId).toBe(pendingOrgId);

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } });
    });

    it('PENDING_APPROVAL organizer event should require admin approval before going live', async () => {
      const eventData = {
        title: 'Pending Org Second Event',
        description: 'Event requiring admin approval',
        location: 'Test City',
        startDate: new Date(Date.now() + 86400000),
        isFree: true,
      };

      const event = await EventService.createEvent(
        eventData,
        pendingOrgId,
        UserRole.ORGANIZER,
      );

      expect(event.status).toBe('PENDING'); // Not automatically approved
      expect(event.approvedAt).toBeNull();

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } });
    });
  });

  describe('Active Organizer Status', () => {
    it('should allow ACTIVE organizer to create events', async () => {
      const eventData = {
        title: 'Active Org Event',
        description: 'Event by active organizer',
        location: 'Test City',
        startDate: new Date(Date.now() + 86400000),
        isFree: false,
        price: 75,
      };

      const event = await EventService.createEvent(
        eventData,
        activeOrgId,
        UserRole.ORGANIZER,
      );

      expect(event.id).toBeDefined();
      expect(event.organizerId).toBe(activeOrgId);

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } });
    });

    it('should allow ACTIVE organizer to create multiple events', async () => {
      const event1 = await EventService.createEvent(
        {
          title: 'Active Org Event 1',
          description: 'First event',
          location: 'City 1',
          startDate: new Date(Date.now() + 86400000),
          isFree: true,
        },
        activeOrgId,
        UserRole.ORGANIZER,
      );

      const event2 = await EventService.createEvent(
        {
          title: 'Active Org Event 2',
          description: 'Second event',
          location: 'City 2',
          startDate: new Date(Date.now() + 172800000),
          isFree: false,
          price: 50,
        },
        activeOrgId,
        UserRole.ORGANIZER,
      );

      expect(event1.id).toBeDefined();
      expect(event2.id).toBeDefined();
      expect(event1.id).not.toBe(event2.id);

      // Cleanup
      await prisma.event.deleteMany({
        where: { id: { in: [event1.id, event2.id] } },
      });
    });
  });

  describe('Suspended Status', () => {
    it('should block SUSPENDED organizer from creating events', async () => {
      const eventData = {
        title: 'Suspended Org Event',
        description: 'Should fail',
        location: 'Test City',
        startDate: new Date(Date.now() + 86400000),
        isFree: true,
      };

      await expect(
        EventService.createEvent(
          eventData,
          suspendedOrgId,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow('suspended');
    });
  });

  describe('Deactivated Status', () => {
    it('should block DEACTIVATED organizer from creating events', async () => {
      const eventData = {
        title: 'Deactivated Org Event',
        description: 'Should fail',
        location: 'Test City',
        startDate: new Date(Date.now() + 86400000),
        isFree: true,
      };

      await expect(
        EventService.createEvent(
          eventData,
          deactivatedOrgId,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow('deactivated');
    });
  });

  describe('Authorization', () => {
    it('should block non-organizer from creating events', async () => {
      // Create an attendee
      const attendee = await prisma.user.create({
        data: {
          email: `attendee-${Date.now()}@test.com`,
          password: 'hashed_password',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
        },
      });

      const eventData = {
        title: 'Attendee Event',
        description: 'Should fail - not an organizer',
        location: 'Test City',
        startDate: new Date(Date.now() + 86400000),
        isFree: true,
      };

      await expect(
        EventService.createEvent(
          eventData,
          attendee.id,
          UserRole.ATTENDEE,
        ),
      ).rejects.toThrow('organizers and admins');

      // Cleanup
      await prisma.user.delete({ where: { id: attendee.id } });
    });
  });

  describe('Entity Type Specific Event Creation', () => {
    it('INDIVIDUAL organizer should be able to create events', async () => {
      const individual = await prisma.user.create({
        data: {
          email: `individual-${Date.now()}@test.com`,
          password: 'hashed_password',
          firstName: 'Individual',
          lastName: 'Creator',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        },
      });

      const event = await EventService.createEvent(
        {
          title: 'Individual Event',
          description: 'Event by individual',
          location: 'City',
          startDate: new Date(Date.now() + 86400000),
          isFree: true,
        },
        individual.id,
        UserRole.ORGANIZER,
      );

      expect(event.organizerId).toBe(individual.id);

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } });
      await prisma.user.delete({ where: { id: individual.id } });
    });

    it('COMPANY organizer should be able to create events', async () => {
      const company = await prisma.user.create({
        data: {
          email: `company-${Date.now()}@test.com`,
          password: 'hashed_password',
          firstName: 'Company',
          lastName: 'Name',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          organizerEntityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
          organizationName: 'Test Company Ltd',
        },
      });

      const event = await EventService.createEvent(
        {
          title: 'Company Event',
          description: 'Event by company',
          location: 'City',
          startDate: new Date(Date.now() + 86400000),
          isFree: false,
          price: 150,
        },
        company.id,
        UserRole.ORGANIZER,
      );

      expect(event.organizerId).toBe(company.id);

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } });
      await prisma.user.delete({ where: { id: company.id } });
    });
  });
});
