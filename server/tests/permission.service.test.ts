import { PermissionService } from '../src/services/permission.service.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import { cleanupTestData } from './test-helpers.js';
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('PermissionService', () => {
  let dbConnected = false;
  let organizerId: string;
  let staffUserId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (error) {
      console.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@permission.test',
        password: organizerPassword,
        firstName: 'Test',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Org',
      },
    });
    organizerId = organizer.id;

    // Create staff member
    const staffPassword = await hashPassword('Staff123!@$');
    const staff = await prisma.user.create({
      data: {
        email: 'staff@permission.test',
        password: staffPassword,
        firstName: 'Test',
        lastName: 'Staff',
        role: UserRole.ORGANIZER_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Org',
      },
    });
    staffUserId = staff.id;
  });

  describe('seedPermissions', () => {
    it('should seed system permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.seedPermissions();

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions[0]).toHaveProperty('key');
      expect(permissions[0]).toHaveProperty('name');
      expect(permissions[0]).toHaveProperty('category');
      expect(permissions[0].isSystem).toBe(true);

      // Verify permissions were created in database
      const dbPermissions = await prisma.permission.findMany();
      expect(dbPermissions.length).toBeGreaterThanOrEqual(permissions.length);
    });

    it('should be idempotent (can run multiple times)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const firstRun = await PermissionService.seedPermissions();
      const secondRun = await PermissionService.seedPermissions();

      expect(secondRun.length).toBe(firstRun.length);

      // Verify no duplicates
      const dbPermissions = await prisma.permission.findMany();
      const uniqueKeys = new Set(dbPermissions.map(p => p.key));
      expect(uniqueKeys.size).toBe(dbPermissions.length);
    });
  });

  describe('getAllPermissions', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();
    });

    it('should get all permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getAllPermissions();

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions[0]).toHaveProperty('id');
      expect(permissions[0]).toHaveProperty('key');
      expect(permissions[0]).toHaveProperty('name');
      expect(permissions[0]).toHaveProperty('category');
    });

    it('should filter by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const eventsPermissions = await PermissionService.getAllPermissions('events');
      const allPermissions = await PermissionService.getAllPermissions();

      expect(eventsPermissions.length).toBeLessThan(allPermissions.length);
      expect(eventsPermissions.every(p => p.category === 'events')).toBe(true);
    });
  });

  describe('getPermissionsByCategory', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();
    });

    it('should group permissions by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const grouped = await PermissionService.getPermissionsByCategory();

      expect(grouped).toHaveProperty('events');
      expect(grouped).toHaveProperty('attendees');
      expect(grouped).toHaveProperty('tickets');
      expect(Array.isArray(grouped.events)).toBe(true);
      expect(grouped.events!.length).toBeGreaterThan(0);
    });
  });

  describe('getRolePermissions', () => {
    let roleTemplateId: string;
    let permissionId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();

      // Get a permission
      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');
      permissionId = permission.id;

      // Create a role template
      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Test Role',
          description: 'Test role description',
        },
      });
      roleTemplateId = roleTemplate.id;

      // Assign permission to role
      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permissionId,
        },
      });
    });

    it('should get permissions for a role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getRolePermissions(roleTemplateId);

      expect(permissions.length).toBe(1);
      expect(permissions[0].key).toBe('events.view');
      expect(permissions[0].name).toBe('View Events');
    });

    it('should return empty array for role without permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create role without permissions
      const emptyRole = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Empty Role',
        },
      });

      const permissions = await PermissionService.getRolePermissions(emptyRole.id);
      expect(permissions.length).toBe(0);
    });
  });

  describe('roleHasPermission', () => {
    let roleTemplateId: string;
    let permissionId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.create' },
      });
      if (!permission) throw new Error('Permission not found');
      permissionId = permission.id;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Test Role',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should return true when role has permission', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permissionId,
        },
      });

      const hasPermission = await PermissionService.roleHasPermission(roleTemplateId, 'events.create');
      expect(hasPermission).toBe(true);
    });

    it('should return false when role does not have permission', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const hasPermission = await PermissionService.roleHasPermission(roleTemplateId, 'events.delete');
      expect(hasPermission).toBe(false);
    });
  });

  describe('getUserEffectivePermissions', () => {
    let roleTemplateId: string;
    let permissionId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.edit' },
      });
      if (!permission) throw new Error('Permission not found');
      permissionId = permission.id;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Editor Role',
        },
      });
      roleTemplateId = roleTemplate.id;

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permissionId,
        },
      });
    });

    it('should return permissions from custom role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Assign custom role to staff
      await prisma.user.update({
        where: { id: staffUserId },
        data: { customRoleId: roleTemplateId },
      });

      const permissions = await PermissionService.getUserEffectivePermissions(staffUserId);

      expect(permissions).toContain('events.edit');
    });

    it('should return empty array when user has no custom role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getUserEffectivePermissions(staffUserId);
      expect(permissions.length).toBe(0);
    });

    it('should return empty array for non-existent user', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getUserEffectivePermissions('non-existent-id');
      expect(permissions.length).toBe(0);
    });
  });
});


import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import { cleanupTestData } from './test-helpers.js';
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('PermissionService', () => {
  let dbConnected = false;
  let organizerId: string;
  let staffUserId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (error) {
      console.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@permission.test',
        password: organizerPassword,
        firstName: 'Test',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Org',
      },
    });
    organizerId = organizer.id;

    // Create staff member
    const staffPassword = await hashPassword('Staff123!@$');
    const staff = await prisma.user.create({
      data: {
        email: 'staff@permission.test',
        password: staffPassword,
        firstName: 'Test',
        lastName: 'Staff',
        role: UserRole.ORGANIZER_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Org',
      },
    });
    staffUserId = staff.id;
  });

  describe('seedPermissions', () => {
    it('should seed system permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.seedPermissions();

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions[0]).toHaveProperty('key');
      expect(permissions[0]).toHaveProperty('name');
      expect(permissions[0]).toHaveProperty('category');
      expect(permissions[0].isSystem).toBe(true);

      // Verify permissions were created in database
      const dbPermissions = await prisma.permission.findMany();
      expect(dbPermissions.length).toBeGreaterThanOrEqual(permissions.length);
    });

    it('should be idempotent (can run multiple times)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const firstRun = await PermissionService.seedPermissions();
      const secondRun = await PermissionService.seedPermissions();

      expect(secondRun.length).toBe(firstRun.length);

      // Verify no duplicates
      const dbPermissions = await prisma.permission.findMany();
      const uniqueKeys = new Set(dbPermissions.map(p => p.key));
      expect(uniqueKeys.size).toBe(dbPermissions.length);
    });
  });

  describe('getAllPermissions', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();
    });

    it('should get all permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getAllPermissions();

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions[0]).toHaveProperty('id');
      expect(permissions[0]).toHaveProperty('key');
      expect(permissions[0]).toHaveProperty('name');
      expect(permissions[0]).toHaveProperty('category');
    });

    it('should filter by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const eventsPermissions = await PermissionService.getAllPermissions('events');
      const allPermissions = await PermissionService.getAllPermissions();

      expect(eventsPermissions.length).toBeLessThan(allPermissions.length);
      expect(eventsPermissions.every(p => p.category === 'events')).toBe(true);
    });
  });

  describe('getPermissionsByCategory', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();
    });

    it('should group permissions by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const grouped = await PermissionService.getPermissionsByCategory();

      expect(grouped).toHaveProperty('events');
      expect(grouped).toHaveProperty('attendees');
      expect(grouped).toHaveProperty('tickets');
      expect(Array.isArray(grouped.events)).toBe(true);
      expect(grouped.events!.length).toBeGreaterThan(0);
    });
  });

  describe('getRolePermissions', () => {
    let roleTemplateId: string;
    let permissionId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();

      // Get a permission
      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');
      permissionId = permission.id;

      // Create a role template
      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Test Role',
          description: 'Test role description',
        },
      });
      roleTemplateId = roleTemplate.id;

      // Assign permission to role
      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permissionId,
        },
      });
    });

    it('should get permissions for a role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getRolePermissions(roleTemplateId);

      expect(permissions.length).toBe(1);
      expect(permissions[0].key).toBe('events.view');
      expect(permissions[0].name).toBe('View Events');
    });

    it('should return empty array for role without permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create role without permissions
      const emptyRole = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Empty Role',
        },
      });

      const permissions = await PermissionService.getRolePermissions(emptyRole.id);
      expect(permissions.length).toBe(0);
    });
  });

  describe('roleHasPermission', () => {
    let roleTemplateId: string;
    let permissionId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.create' },
      });
      if (!permission) throw new Error('Permission not found');
      permissionId = permission.id;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Test Role',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should return true when role has permission', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permissionId,
        },
      });

      const hasPermission = await PermissionService.roleHasPermission(roleTemplateId, 'events.create');
      expect(hasPermission).toBe(true);
    });

    it('should return false when role does not have permission', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const hasPermission = await PermissionService.roleHasPermission(roleTemplateId, 'events.delete');
      expect(hasPermission).toBe(false);
    });
  });

  describe('getUserEffectivePermissions', () => {
    let roleTemplateId: string;
    let permissionId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      await PermissionService.seedPermissions();

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.edit' },
      });
      if (!permission) throw new Error('Permission not found');
      permissionId = permission.id;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Editor Role',
        },
      });
      roleTemplateId = roleTemplate.id;

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permissionId,
        },
      });
    });

    it('should return permissions from custom role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Assign custom role to staff
      await prisma.user.update({
        where: { id: staffUserId },
        data: { customRoleId: roleTemplateId },
      });

      const permissions = await PermissionService.getUserEffectivePermissions(staffUserId);

      expect(permissions).toContain('events.edit');
    });

    it('should return empty array when user has no custom role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getUserEffectivePermissions(staffUserId);
      expect(permissions.length).toBe(0);
    });

    it('should return empty array for non-existent user', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permissions = await PermissionService.getUserEffectivePermissions('non-existent-id');
      expect(permissions.length).toBe(0);
    });
  });
});


