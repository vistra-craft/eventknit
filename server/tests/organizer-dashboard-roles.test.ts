import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PermissionService } from '../src/services/permission.service.js';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Organizer Dashboard - Roles & Permissions API', () => {
  let dbConnected = false;
  let organizerToken: string;
  let organizerId: string;
  let attendeeToken: string;
  let permissionIds: Record<string, string> = {};

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
        email: 'organizer@roles.test',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendee
    const attendeePassword = await hashPassword('Attendee123!@$');
    await prisma.user.create({
      data: {
        email: 'attendee@roles.test',
        password: attendeePassword,
        firstName: 'Event',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Login as organizer
    const organizerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'organizer@roles.test',
        password: 'Organizer123!@$',
      });
    organizerToken = organizerLogin.body.data.accessToken;

    // Login as attendee
    const attendeeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'attendee@roles.test',
        password: 'Attendee123!@$',
      });
    attendeeToken = attendeeLogin.body.data.accessToken;
  });

  describe('GET /api/v1/organizer-dashboard/team/permissions', () => {
    it('should get all permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions).toBeInstanceOf(Array);
      expect(response.body.data.permissions.length).toBeGreaterThan(0);
      expect(response.body.data.permissions[0]).toHaveProperty('key');
      expect(response.body.data.permissions[0]).toHaveProperty('name');
      expect(response.body.data.permissions[0]).toHaveProperty('category');
    });

    it('should filter permissions by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions?category=events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions.every((p: any) => p.category === 'events')).toBe(true);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions')
        .expect(401);
    });
  });

  describe('GET /api/v1/organizer-dashboard/team/permissions/by-category', () => {
    it('should get permissions grouped by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions/by-category')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions).toHaveProperty('events');
      expect(response.body.data.permissions).toHaveProperty('attendees');
      expect(Array.isArray(response.body.data.permissions.events)).toBe(true);
    });
  });

  describe('POST /api/v1/organizer-dashboard/team/role-templates', () => {
    it('should create a custom role with permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Event Manager',
          description: 'Can manage events',
          permissionKeys: ['events.view', 'events.create', 'events.edit'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Event Manager');
      expect(response.body.data.template.description).toBe('Can manage events');
      expect(response.body.data.template.permissions).toBeInstanceOf(Array);
      expect(response.body.data.template.permissions.length).toBe(3);
    });

    it('should create role without permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Basic Role',
          description: 'Basic role with no permissions',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Basic Role');
    });

    it('should fail if name is missing', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          description: 'Role without name',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .send({
          name: 'Test Role',
        })
        .expect(401);
    });

    it('should fail for non-organizer users', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          name: 'Test Role',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/organizer-dashboard/team/role-templates', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create some test roles
      await prisma.teamRoleTemplate.createMany({
        data: [
          {
            organizerId,
            name: 'Active Role',
            description: 'Active role',
            isActive: true,
          },
          {
            organizerId,
            name: 'Inactive Role',
            description: 'Inactive role',
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

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toBeInstanceOf(Array);
      expect(response.body.data.templates.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by active status', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/role-templates?isActive=true')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates.every((t: any) => t.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/v1/organizer-dashboard/team/role-templates/:id', () => {
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
          name: 'Test Role',
          description: 'Test description',
          permissions: {
            create: {
              permissionId: permission.id,
            },
          },
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should get role template by id', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.id).toBe(roleTemplateId);
      expect(response.body.data.template.name).toBe('Test Role');
      expect(response.body.data.template.permissions).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/team/role-templates/non-existent-id')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);
    });

    it('should not allow access to other organizer\'s roles', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer and their role
      const otherOrgPassword = await hashPassword('Other123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'other@roles.test',
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

      await request(app)
        .get(`/api/v1/organizer-dashboard/team/role-templates/${otherRole.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404); // Should not find role belonging to another organizer
    });
  });

  describe('PUT /api/v1/organizer-dashboard/team/role-templates/:id', () => {
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

      const response = await request(app)
        .put(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Updated Role',
          description: 'Updated description',
          permissionKeys: ['events.view', 'events.edit'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Updated Role');
      expect(response.body.data.template.description).toBe('Updated description');
    });

    it('should update permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // First add a permission
      const permission1 = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission1) throw new Error('Permission not found');

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permission1.id,
        },
      });

      // Now update to different permissions
      const response = await request(app)
        .put(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          permissionKeys: ['events.create', 'events.edit'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const permissionKeys = response.body.data.template.permissions.map((rp: any) => rp.permission.key);
      expect(permissionKeys).toContain('events.create');
      expect(permissionKeys).toContain('events.edit');
      expect(permissionKeys).not.toContain('events.view');
    });
  });

  describe('DELETE /api/v1/organizer-dashboard/team/role-templates/:id', () => {
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

      const response = await request(app)
        .delete(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify role is deleted
      const deleted = await prisma.teamRoleTemplate.findUnique({
        where: { id: roleTemplateId },
      });
      expect(deleted).toBeNull();
    });

    it('should delete associated permissions', async () => {
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
      await request(app)
        .delete(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      // Verify permissions are also deleted (cascade)
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: roleTemplateId },
      });
      expect(rolePermissions.length).toBe(0);
    });
  });

  describe('POST /api/v1/organizer-dashboard/team/role-templates/:id/duplicate', () => {
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

    it('should duplicate role template', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Duplicated Role',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Duplicated Role');
      expect(response.body.data.template.id).not.toBe(roleTemplateId);
      expect(response.body.data.template.permissions).toBeInstanceOf(Array);
      expect(response.body.data.template.permissions.length).toBe(1);
    });

    it('should use default name if not provided', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toContain('Original Role');
    });
  });
});


import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PermissionService } from '../src/services/permission.service.js';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Organizer Dashboard - Roles & Permissions API', () => {
  let dbConnected = false;
  let organizerToken: string;
  let organizerId: string;
  let attendeeToken: string;
  let permissionIds: Record<string, string> = {};

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
        email: 'organizer@roles.test',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendee
    const attendeePassword = await hashPassword('Attendee123!@$');
    await prisma.user.create({
      data: {
        email: 'attendee@roles.test',
        password: attendeePassword,
        firstName: 'Event',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Login as organizer
    const organizerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'organizer@roles.test',
        password: 'Organizer123!@$',
      });
    organizerToken = organizerLogin.body.data.accessToken;

    // Login as attendee
    const attendeeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'attendee@roles.test',
        password: 'Attendee123!@$',
      });
    attendeeToken = attendeeLogin.body.data.accessToken;
  });

  describe('GET /api/v1/organizer-dashboard/team/permissions', () => {
    it('should get all permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions).toBeInstanceOf(Array);
      expect(response.body.data.permissions.length).toBeGreaterThan(0);
      expect(response.body.data.permissions[0]).toHaveProperty('key');
      expect(response.body.data.permissions[0]).toHaveProperty('name');
      expect(response.body.data.permissions[0]).toHaveProperty('category');
    });

    it('should filter permissions by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions?category=events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions.every((p: any) => p.category === 'events')).toBe(true);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions')
        .expect(401);
    });
  });

  describe('GET /api/v1/organizer-dashboard/team/permissions/by-category', () => {
    it('should get permissions grouped by category', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/permissions/by-category')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions).toHaveProperty('events');
      expect(response.body.data.permissions).toHaveProperty('attendees');
      expect(Array.isArray(response.body.data.permissions.events)).toBe(true);
    });
  });

  describe('POST /api/v1/organizer-dashboard/team/role-templates', () => {
    it('should create a custom role with permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Event Manager',
          description: 'Can manage events',
          permissionKeys: ['events.view', 'events.create', 'events.edit'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Event Manager');
      expect(response.body.data.template.description).toBe('Can manage events');
      expect(response.body.data.template.permissions).toBeInstanceOf(Array);
      expect(response.body.data.template.permissions.length).toBe(3);
    });

    it('should create role without permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Basic Role',
          description: 'Basic role with no permissions',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Basic Role');
    });

    it('should fail if name is missing', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          description: 'Role without name',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .send({
          name: 'Test Role',
        })
        .expect(401);
    });

    it('should fail for non-organizer users', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          name: 'Test Role',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/organizer-dashboard/team/role-templates', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create some test roles
      await prisma.teamRoleTemplate.createMany({
        data: [
          {
            organizerId,
            name: 'Active Role',
            description: 'Active role',
            isActive: true,
          },
          {
            organizerId,
            name: 'Inactive Role',
            description: 'Inactive role',
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

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/role-templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toBeInstanceOf(Array);
      expect(response.body.data.templates.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by active status', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/team/role-templates?isActive=true')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates.every((t: any) => t.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/v1/organizer-dashboard/team/role-templates/:id', () => {
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
          name: 'Test Role',
          description: 'Test description',
          permissions: {
            create: {
              permissionId: permission.id,
            },
          },
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      roleTemplateId = roleTemplate.id;
    });

    it('should get role template by id', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.id).toBe(roleTemplateId);
      expect(response.body.data.template.name).toBe('Test Role');
      expect(response.body.data.template.permissions).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/team/role-templates/non-existent-id')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);
    });

    it('should not allow access to other organizer\'s roles', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer and their role
      const otherOrgPassword = await hashPassword('Other123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'other@roles.test',
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

      await request(app)
        .get(`/api/v1/organizer-dashboard/team/role-templates/${otherRole.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404); // Should not find role belonging to another organizer
    });
  });

  describe('PUT /api/v1/organizer-dashboard/team/role-templates/:id', () => {
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

      const response = await request(app)
        .put(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Updated Role',
          description: 'Updated description',
          permissionKeys: ['events.view', 'events.edit'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Updated Role');
      expect(response.body.data.template.description).toBe('Updated description');
    });

    it('should update permissions', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // First add a permission
      const permission1 = await prisma.permission.findFirst({
        where: { key: 'events.view' },
      });
      if (!permission1) throw new Error('Permission not found');

      await prisma.teamRolePermission.create({
        data: {
          roleId: roleTemplateId,
          permissionId: permission1.id,
        },
      });

      // Now update to different permissions
      const response = await request(app)
        .put(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          permissionKeys: ['events.create', 'events.edit'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const permissionKeys = response.body.data.template.permissions.map((rp: any) => rp.permission.key);
      expect(permissionKeys).toContain('events.create');
      expect(permissionKeys).toContain('events.edit');
      expect(permissionKeys).not.toContain('events.view');
    });
  });

  describe('DELETE /api/v1/organizer-dashboard/team/role-templates/:id', () => {
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

      const response = await request(app)
        .delete(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify role is deleted
      const deleted = await prisma.teamRoleTemplate.findUnique({
        where: { id: roleTemplateId },
      });
      expect(deleted).toBeNull();
    });

    it('should delete associated permissions', async () => {
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
      await request(app)
        .delete(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      // Verify permissions are also deleted (cascade)
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId: roleTemplateId },
      });
      expect(rolePermissions.length).toBe(0);
    });
  });

  describe('POST /api/v1/organizer-dashboard/team/role-templates/:id/duplicate', () => {
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

    it('should duplicate role template', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Duplicated Role',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('Duplicated Role');
      expect(response.body.data.template.id).not.toBe(roleTemplateId);
      expect(response.body.data.template.permissions).toBeInstanceOf(Array);
      expect(response.body.data.template.permissions.length).toBe(1);
    });

    it('should use default name if not provided', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/organizer-dashboard/team/role-templates/${roleTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toContain('Original Role');
    });
  });
});


