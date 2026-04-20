import { AdvancedTeamService } from '../src/services/advanced-team.service.js';
import { NotFoundError } from '../src/utils/errors.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PermissionService } from '../src/services/permission.service.js';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('AdvancedTeamService', () => {
  let dbConnected = false;
  let organizerId: string;
  const permissionIds: Record<string, string> = {};

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (_error) {
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

    await cleanupTestData();

    // Seed permissions
    await PermissionService.seedPermissions();
    const permissions = await prisma.permission.findMany();
    permissions.forEach(p => {
      permissionIds[p.key] = p.id;
    });

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@team.test',
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
  });

  describe('createRoleTemplate', () => {
    it('should create role template with permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const template = await AdvancedTeamService.createRoleTemplate(organizerId, {
        name: 'Editor',
        description: 'Can edit events',
        permissionKeys: ['events.view', 'events.edit'],
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('Editor');
      expect(template.description).toBe('Can edit events');
      expect(template.organizerId).toBe(organizerId);

      // Verify permissions were assigned
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: template.id },
        include: { permission: true },
      });
      expect(rolePermissions.length).toBe(2);
      const permissionKeys = rolePermissions.map(rp => rp.permission.key);
      expect(permissionKeys).toContain('events.view');
      expect(permissionKeys).toContain('events.edit');
    });

    it('should create role template without permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const template = await AdvancedTeamService.createRoleTemplate(organizerId, {
        name: 'Basic Role',
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('Basic Role');

      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: template.id },
      });
      expect(rolePermissions.length).toBe(0);
    });
  });

  describe('getRoleTemplates', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      await prisma.teamRoleTemplate.createMany({
        data: [
          {
            organizerId,
            name: 'Active Role',
            isActive: true,
          },
          {
            organizerId,
            name: 'Inactive Role',
            isActive: false,
          },
        ],
      });
    });

    it('should get all role templates for organizer', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const templates = await AdvancedTeamService.getRoleTemplates(organizerId, {});

      expect(templates.length).toBeGreaterThanOrEqual(2);
      expect(templates.some(t => t.name === 'Active Role')).toBe(true);
      expect(templates.some(t => t.name === 'Inactive Role')).toBe(true);
    });

    it('should filter by active status', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const activeTemplates = await AdvancedTeamService.getRoleTemplates(organizerId, { isActive: true });
      expect(activeTemplates.every(t => t.isActive === true)).toBe(true);

      const inactiveTemplates = await AdvancedTeamService.getRoleTemplates(organizerId, { isActive: false });
      expect(inactiveTemplates.every(t => t.isActive === false)).toBe(true);
    });

    it('should include permissions in response', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Role with Permissions',
          permissions: {
            create: {
              permissionId: permission.id,
            },
          },
        },
      });

      const templates = await AdvancedTeamService.getRoleTemplates(organizerId, {});
      const template = templates.find(t => t.id === roleTemplate.id);

      expect(template).toBeDefined();
      expect(template?.permissions).toBeDefined();
      expect(template?.permissions?.length).toBe(1);
    });
  });

  describe('getRoleTemplateById', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Test Role',
          description: 'Test description',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should get role template by id', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const template = await AdvancedTeamService.getRoleTemplateById(roleTemplateId, organizerId);

      expect(template.id).toBe(roleTemplateId);
      expect(template.name).toBe('Test Role');
      expect(template.description).toBe('Test description');
    });

    it('should throw NotFoundError for non-existent role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        AdvancedTeamService.getRoleTemplateById('non-existent-id', organizerId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw NotFoundError for role belonging to another organizer', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer and their role
      const otherOrgPassword = await hashPassword('Other123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'other@team.test',
          password: otherOrgPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Org',
        },
      });

      const otherRole = await prisma.teamRoleTemplate.create({
        data: {
          organizerId: otherOrg.id,
          name: 'Other Role',
        },
      });

      await expect(
        AdvancedTeamService.getRoleTemplateById(otherRole.id, organizerId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateRoleTemplate', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Original Role',
          description: 'Original description',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should update role template', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const updated = await AdvancedTeamService.updateRoleTemplate(
        roleTemplateId,
        organizerId,
        {
          name: 'Updated Role',
          description: 'Updated description',
        },
      );

      expect(updated.name).toBe('Updated Role');
      expect(updated.description).toBe('Updated description');
    });

    it('should update permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const _updated = await AdvancedTeamService.updateRoleTemplate(
        roleTemplateId,
        organizerId,
        {
          permissionKeys: ['events.view', 'events.create'],
        },
      );

      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: roleTemplateId },
        include: { permission: true },
      });
      const permissionKeys = rolePermissions.map(rp => rp.permission.key);
      expect(permissionKeys).toContain('events.view');
      expect(permissionKeys).toContain('events.create');
    });
  });

  describe('deleteRoleTemplate', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Role to Delete',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should delete role template', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await AdvancedTeamService.deleteRoleTemplate(roleTemplateId, organizerId);

      const deleted = await prisma.teamRoleTemplate.findUnique({
        where: { id: roleTemplateId },
      });
      expect(deleted).toBeNull();
    });

    it('should delete associated permissions (cascade)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Add permission to role
      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permission.id,
        },
      });

      // Delete role
      await AdvancedTeamService.deleteRoleTemplate(roleTemplateId, organizerId);

      // Verify permissions are also deleted
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: roleTemplateId },
      });
      expect(rolePermissions.length).toBe(0);
    });
  });

  describe('duplicateRoleTemplate', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Original Role',
          description: 'Original description',
          permissions: {
            create: {
              permissionId: permission.id,
            },
          },
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should duplicate role template with permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const duplicated = await AdvancedTeamService.duplicateRoleTemplate(
        roleTemplateId,
        organizerId,
        'Duplicated Role',
      );

      expect(duplicated.id).not.toBe(roleTemplateId);
      expect(duplicated.name).toBe('Duplicated Role');
      expect(duplicated.description).toBe('Original description');

      // Verify permissions were duplicated
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: duplicated.id },
        include: { permission: true },
      });
      expect(rolePermissions.length).toBe(1);
      expect(rolePermissions[0].permission.key).toBe('events.view');
    });
  });
  describe('getRoleTemplates', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      await prisma.teamRoleTemplate.createMany({
        data: [
          {
            organizerId,
            name: 'Active Role',
            isActive: true,
          },
          {
            organizerId,
            name: 'Inactive Role',
            isActive: false,
          },
        ],
      });
    });

    it('should get all role templates for organizer', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const templates = await AdvancedTeamService.getRoleTemplates(organizerId, {});

      expect(templates.length).toBeGreaterThanOrEqual(2);
      expect(templates.some(t => t.name === 'Active Role')).toBe(true);
      expect(templates.some(t => t.name === 'Inactive Role')).toBe(true);
    });

    it('should filter by active status', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const activeTemplates = await AdvancedTeamService.getRoleTemplates(organizerId, { isActive: true });
      expect(activeTemplates.every(t => t.isActive === true)).toBe(true);

      const inactiveTemplates = await AdvancedTeamService.getRoleTemplates(organizerId, { isActive: false });
      expect(inactiveTemplates.every(t => t.isActive === false)).toBe(true);
    });

    it('should include permissions in response', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Role with Permissions',
          permissions: {
            create: {
              permissionId: permission.id,
            },
          },
        },
      });

      const templates = await AdvancedTeamService.getRoleTemplates(organizerId, {});
      const template = templates.find(t => t.id === roleTemplate.id);

      expect(template).toBeDefined();
      expect(template?.permissions).toBeDefined();
      expect(template?.permissions?.length).toBe(1);
    });
  });

  describe('getRoleTemplateById', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Test Role',
          description: 'Test description',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should get role template by id', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const template = await AdvancedTeamService.getRoleTemplateById(roleTemplateId, organizerId);

      expect(template.id).toBe(roleTemplateId);
      expect(template.name).toBe('Test Role');
      expect(template.description).toBe('Test description');
    });

    it('should throw NotFoundError for non-existent role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        AdvancedTeamService.getRoleTemplateById('non-existent-id', organizerId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw NotFoundError for role belonging to another organizer', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer and their role
      const otherOrgPassword = await hashPassword('Other123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'other@team.test',
          password: otherOrgPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Org',
        },
      });

      const otherRole = await prisma.teamRoleTemplate.create({
        data: {
          organizerId: otherOrg.id,
          name: 'Other Role',
        },
      });

      await expect(
        AdvancedTeamService.getRoleTemplateById(otherRole.id, organizerId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateRoleTemplate', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Original Role',
          description: 'Original description',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should update role template', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const updated = await AdvancedTeamService.updateRoleTemplate(
        roleTemplateId,
        organizerId,
        {
          name: 'Updated Role',
          description: 'Updated description',
        },
      );

      expect(updated.name).toBe('Updated Role');
      expect(updated.description).toBe('Updated description');
    });

    it('should update permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const _updated = await AdvancedTeamService.updateRoleTemplate(
        roleTemplateId,
        organizerId,
        {
          permissionKeys: ['events.view', 'events.create'],
        },
      );

      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: roleTemplateId },
        include: { permission: true },
      });
      const permissionKeys = rolePermissions.map(rp => rp.permission.key);
      expect(permissionKeys).toContain('events.view');
      expect(permissionKeys).toContain('events.create');
    });
  });

  describe('deleteRoleTemplate', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Role to Delete',
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should delete role template', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await AdvancedTeamService.deleteRoleTemplate(roleTemplateId, organizerId);

      const deleted = await prisma.teamRoleTemplate.findUnique({
        where: { id: roleTemplateId },
      });
      expect(deleted).toBeNull();
    });

    it('should delete associated permissions (cascade)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Add permission to role
      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permission.id,
        },
      });

      // Delete role
      await AdvancedTeamService.deleteRoleTemplate(roleTemplateId, organizerId);

      // Verify permissions are also deleted
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: roleTemplateId },
      });
      expect(rolePermissions.length).toBe(0);
    });
  });

  describe('duplicateRoleTemplate', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Original Role',
          description: 'Original description',
          permissions: {
            create: {
              permissionId: permission.id,
            },
          },
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should duplicate role template with permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const duplicated = await AdvancedTeamService.duplicateRoleTemplate(
        roleTemplateId,
        organizerId,
        'Duplicated Role',
      );

      expect(duplicated.id).not.toBe(roleTemplateId);
      expect(duplicated.name).toBe('Duplicated Role');
      expect(duplicated.description).toBe('Original description');

      // Verify permissions were duplicated
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: duplicated.id },
        include: { permission: true },
      });
      expect(rolePermissions.length).toBe(1);
      expect(rolePermissions[0].permission.key).toBe('events.view');
    });
  });

  describe('applyRoleTemplate', () => {
    let roleTemplateId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const permission = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission) throw new Error('Permission not found');

      const roleTemplate = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: 'Template Role',
          permissions: {
            create: {
              permissionId: permission.id,
            },
          },
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should return permission keys when template found', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const result = await AdvancedTeamService.applyRoleTemplate(roleTemplateId, organizerId);

      expect(result).toHaveProperty('permissions');
      expect(result.permissions).toHaveProperty('permissionKeys');
      expect(result.permissions.permissionKeys).toContain('events.view');
    });

    it('should throw when template not found', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        AdvancedTeamService.applyRoleTemplate('non-existent-id', organizerId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
