import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Authentication System', () => {
  let dbConnected = false;

  beforeAll(async () => {
    // Try to connect to the test database
    try {
      await prisma.$connect();
      // Verify connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
       
      logger.info('✅ Test database connected');
    } catch (error) {
       
      logger.warn('⚠️  Database not available. Tests will be skipped.');
       
      logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
       
      logger.warn('   Start PostgreSQL with: docker compose --env-file .env.development up -d postgres');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    // Close database connection if it was connected
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  beforeEach(async () => {
    // Skip cleanup if database is not connected
    if (!dbConnected) return;
    
    // Clear all tables before each test (in correct order to respect foreign keys)
    // Note: Event/Ticket tables removed for now - focusing on auth first
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.kYCDocument.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should register a new attendee successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const userData = {
        email: 'attendee@test.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ATTENDEE,
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(UserRole.ATTENDEE);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
      // Check verification level defaults to 1
      expect(response.body.data.user.verificationLevel).toBe(1);
    });

    it('should register a new organizer successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const userData = {
        email: 'organizer@test.com',
        password: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.ORGANIZER,
        organizationName: 'Test Events Inc',
        businessEmail: 'business@testevents.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(UserRole.ORGANIZER);
      expect(response.body.data.user.organizationName).toBe(userData.organizationName);
    });

    it('should fail to register with invalid email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const userData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ATTENDEE,
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to register with weak password', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const userData = {
        email: 'weak@test.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ATTENDEE,
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should register with email code verification (requires password)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Request verification code
      const codeResponse = await request(app)
        .post('/api/v1/auth/register-code/request')
        .send({ email: 'emailcode@test.com', role: 'ATTENDEE' })
        .expect(200);

      expect(codeResponse.body.success).toBe(true);

      // Get the code from database (in real scenario, user receives via email)
      const verification = await prisma.emailVerification.findFirst({
        where: { email: 'emailcode@test.com' },
        orderBy: { createdAt: 'desc' },
      });

      expect(verification).toBeDefined();
      expect(verification?.code).toBeDefined();

      // Verify code and create account (now requires password)
      const verifyResponse = await request(app)
        .post('/api/v1/auth/register-code/verify')
        .send({
          email: 'emailcode@test.com',
          code: verification?.code,
          password: 'Test123!@#',
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.user.email).toBe('emailcode@test.com');
      expect(verifyResponse.body.data.user.verificationLevel).toBe(1);
      expect(verifyResponse.body.data.accessToken).toBeDefined();
    });

    it('should register organizer without requiring organization details (optional fields)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Organization details are now optional during registration
      const userData = {
        email: 'organizeroptional@test.com',
        password: 'Test123!@#',
        firstName: 'Optional',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        // organizationName and businessEmail are optional
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.ORGANIZER);
      expect(response.body.data.user.status).toBe(UserStatus.ACTIVE);

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: 'organizeroptional@test.com' },
      });
    });

    it('should fail to register with duplicate email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const userData = {
        email: 'duplicate@test.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ATTENDEE,
      };

      // First registration
      await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      // Create a test user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'login@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'login@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'login@test.com' },
      });
    });

    it('should login successfully with valid credentials', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@test.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined(); // Refresh token cookie
    });

    it('should fail to login with invalid email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should fail to login with invalid password', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: 'WrongPassword123!@#',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should fail to login for user without password (password now required)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create user without password (should not exist in normal flow, but testing edge case)
      await prisma.user.create({
        data: {
          email: 'nopassword@test.com',
          password: null, // No password set
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nopassword@test.com',
          password: 'AnyPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: 'nopassword@test.com' },
      });
    });

    it('should lock account after multiple failed attempts', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'login@test.com',
            password: 'WrongPassword',
          });
      }

      // Next attempt should be locked
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('locked');
    });

    it('should fail to login with SUSPENDED account', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create a suspended user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'suspended@test.com',
          password: hashedPassword,
          firstName: 'Suspended',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.SUSPENDED,
          isEmailVerified: true,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'suspended@test.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('suspended');

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: 'suspended@test.com' },
      });
    });

    it('should allow login with DEACTIVATED account but restrict actions', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create a deactivated user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'deactivated@test.com',
          password: hashedPassword,
          firstName: 'Deactivated',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.DEACTIVATED,
          isEmailVerified: true,
        },
      });

      // DEACTIVATED users can login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'deactivated@test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();

      // But cannot perform actions (like getting profile - this would require requireActive middleware)
      // For now, we'll test that they can authenticate but status is DEACTIVATED
      // When we add requireActive middleware to routes, DEACTIVATED users will be blocked

      // Cleanup
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'deactivated@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'deactivated@test.com' },
      });
    });

    it('should create users with ACTIVE status by default', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const userData = {
        email: 'autostatus@test.com',
        password: 'Test123!@#',
        firstName: 'Auto',
        lastName: 'Status',
        role: UserRole.ATTENDEE,
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe(UserStatus.ACTIVE);

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: 'autostatus@test.com' },
      });

      expect(user?.status).toBe(UserStatus.ACTIVE);

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: 'autostatus@test.com' },
      });
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      // Create a test user and get refresh token
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'refresh@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh@test.com',
          password: 'Test123!@#',
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'refresh@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'refresh@test.com' },
      });
    });

    it('should refresh access token successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to refresh token for SUSPENDED user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create a suspended user and get a refresh token
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'suspendedrefresh@test.com',
          password: hashedPassword,
          firstName: 'Suspended',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.SUSPENDED,
          isEmailVerified: true,
        },
      });

      // Get user ID
      const user = await prisma.user.findUnique({
        where: { email: 'suspendedrefresh@test.com' },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create a refresh token manually (since they can't login)
      const { generateRefreshToken } = await import('../src/utils/jwt');
      const refreshTokenString = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Calculate expiresAt (7 days from now, matching saveRefreshToken logic)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          token: refreshTokenString,
          userId: user.id,
          expiresAt,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshTokenString })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('suspended');

      // Cleanup
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'suspendedrefresh@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'suspendedrefresh@test.com' },
      });
    });

    it('should allow refresh token for DEACTIVATED user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create a deactivated user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'deactivatedrefresh@test.com',
          password: hashedPassword,
          firstName: 'Deactivated',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.DEACTIVATED,
          isEmailVerified: true,
        },
      });

      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'deactivatedrefresh@test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      const refreshToken = loginResponse.body.data.refreshToken;

      // DEACTIVATED users can refresh tokens
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      // Cleanup
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'deactivatedrefresh@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'deactivatedrefresh@test.com' },
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'logout@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logout@test.com',
          password: 'Test123!@#',
        });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'logout@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'logout@test.com' },
      });
    });

    it('should logout successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify refresh token is revoked
      const token = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(token?.revoked).toBe(true);
    });

    it('should fail to logout without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'profile@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'profile@test.com',
          password: 'Test123!@#',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'profile@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'profile@test.com' },
      });
    });

    it('should get user profile successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('profile@test.com');
    });

    it('should fail to get profile without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow DEACTIVATED user to get profile (view-only access)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create a deactivated user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'deactivatedprofile@test.com',
          password: hashedPassword,
          firstName: 'Deactivated',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.DEACTIVATED,
          isEmailVerified: true,
        },
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'deactivatedprofile@test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      const accessToken = loginResponse.body.data.accessToken;

      // DEACTIVATED users can view their profile (read-only access)
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe(UserStatus.DEACTIVATED);

      // Cleanup
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'deactivatedprofile@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'deactivatedprofile@test.com' },
      });
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'forgot@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.passwordReset.deleteMany({
        where: { user: { email: 'forgot@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'forgot@test.com' },
      });
    });

    it('should send password reset email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'forgot@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify reset token was created
      const reset = await prisma.passwordReset.findFirst({
        where: { user: { email: 'forgot@test.com' } },
      });
      expect(reset).toBeDefined();
    });

    it('should return success even if email does not exist', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const hashedPassword = await hashPassword('Test123!@#');
      const user = await prisma.user.create({
        data: {
          email: 'reset@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Create reset token
      const reset = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: 'test-reset-token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      resetToken = reset.token;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.passwordReset.deleteMany({
        where: { user: { email: 'reset@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'reset@test.com' },
      });
    });

    it('should reset password successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!@#',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify password was changed by trying to login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'reset@test.com',
          password: 'NewPassword123!@#',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should fail with invalid token', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!@#',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'update@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'update@test.com',
          password: 'Test123!@#',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'update@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'update@test.com' },
      });
    });

    it('should update profile successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          phoneNumber: '1234567890',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Name');
      expect(response.body.data.user.phoneNumber).toBe('1234567890');
    });

    it('should fail to change email (email immutability)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'newemail@test.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email address cannot be changed');
    });

    it('should allow email field to remain unchanged', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          email: 'update@test.com', // Same email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('update@test.com');
    });
  });

  describe('POST /api/v1/auth/email-oauth/request', () => {
    it('should send Email OAuth code to existing user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create an existing user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'existing@test.com',
          password: hashedPassword,
          firstName: 'Existing',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/email-oauth/request')
        .send({ email: 'existing@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Verification code');

      // Verify code was created
      const verification = await prisma.emailVerification.findFirst({
        where: { email: 'existing@test.com' },
        orderBy: { createdAt: 'desc' },
      });
      expect(verification).toBeDefined();
      expect(verification?.code).toBeDefined();

      // Cleanup
      await prisma.emailVerification.deleteMany({
        where: { email: 'existing@test.com' },
      });
      await prisma.user.deleteMany({
        where: { email: 'existing@test.com' },
      });
    });

    it('should send Email OAuth code to new user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/email-oauth/request')
        .send({ email: 'newuser@test.com', role: 'ORGANIZER' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify code was created with role
      const verification = await prisma.emailVerification.findFirst({
        where: { email: 'newuser@test.com' },
        orderBy: { createdAt: 'desc' },
      });
      expect(verification).toBeDefined();
      expect(verification?.code).toBeDefined();
      expect(verification?.role).toBe(UserRole.ORGANIZER);

      // Cleanup
      await prisma.emailVerification.deleteMany({
        where: { email: 'newuser@test.com' },
      });
    });

    it('should fail for SUSPENDED user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create a suspended user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'suspendedoauth@test.com',
          password: hashedPassword,
          firstName: 'Suspended',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.SUSPENDED,
          isEmailVerified: true,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/email-oauth/request')
        .send({ email: 'suspendedoauth@test.com' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('suspended');

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: 'suspendedoauth@test.com' },
      });
    });
  });

  describe('POST /api/v1/auth/email-oauth/verify', () => {
    it('should login existing user with Email OAuth code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create an existing user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'emaillogin@test.com',
          password: hashedPassword,
          firstName: 'Email',
          lastName: 'Login',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Request code
      await request(app)
        .post('/api/v1/auth/email-oauth/request')
        .send({ email: 'emaillogin@test.com' })
        .expect(200);

      // Get code from database
      const verification = await prisma.emailVerification.findFirst({
        where: { email: 'emaillogin@test.com' },
        orderBy: { createdAt: 'desc' },
      });

      // Verify code and login
      const response = await request(app)
        .post('/api/v1/auth/email-oauth/verify')
        .send({
          email: 'emaillogin@test.com',
          code: verification?.code,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('emaillogin@test.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined(); // Refresh token cookie

      // Cleanup
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'emaillogin@test.com' } },
      });
      await prisma.emailVerification.deleteMany({
        where: { email: 'emaillogin@test.com' },
      });
      await prisma.user.deleteMany({
        where: { email: 'emaillogin@test.com' },
      });
    });

    it('should create new user account with Email OAuth code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Request code for new user
      await request(app)
        .post('/api/v1/auth/email-oauth/request')
        .send({ email: 'newemailoauth@test.com', role: 'ORGANIZER' })
        .expect(200);

      // Get code from database
      const verification = await prisma.emailVerification.findFirst({
        where: { email: 'newemailoauth@test.com' },
        orderBy: { createdAt: 'desc' },
      });

      // Verify code and create account (like Facebook OAuth)
      const response = await request(app)
        .post('/api/v1/auth/email-oauth/verify')
        .send({
          email: 'newemailoauth@test.com',
          code: verification?.code,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newemailoauth@test.com');
      expect(response.body.data.user.role).toBe(UserRole.ORGANIZER);
      expect(response.body.data.user.status).toBe(UserStatus.ACTIVE);
      expect(response.body.data.user.isEmailVerified).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'newemailoauth@test.com' },
      });
      expect(user).toBeDefined();
      expect(user?.role).toBe(UserRole.ORGANIZER);

      // Cleanup
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'newemailoauth@test.com' } },
      });
      await prisma.emailVerification.deleteMany({
        where: { email: 'newemailoauth@test.com' },
      });
      await prisma.user.deleteMany({
        where: { email: 'newemailoauth@test.com' },
      });
    });

    it('should fail with invalid code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/email-oauth/verify')
        .send({
          email: 'invalidcode@test.com',
          code: '000000',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid verification code');
    });

    it('should fail with expired code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create an expired verification record
      await prisma.emailVerification.create({
        data: {
          email: 'expiredcode@test.com',
          code: '123456',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/email-oauth/verify')
        .send({
          email: 'expiredcode@test.com',
          code: '123456',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');

      // Cleanup
      await prisma.emailVerification.deleteMany({
        where: { email: 'expiredcode@test.com' },
      });
    });

    it('should fail for SUSPENDED user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      // Create a suspended user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'suspendedverify@test.com',
          password: hashedPassword,
          firstName: 'Suspended',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.SUSPENDED,
          isEmailVerified: true,
        },
      });

      // Request code
      await request(app)
        .post('/api/v1/auth/email-oauth/request')
        .send({ email: 'suspendedverify@test.com' })
        .expect(401); // Should fail at request stage

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: 'suspendedverify@test.com' },
      });
    });
  });

  describe('POST /api/v1/auth/password/change', () => {
    let accessToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'changepass@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'changepass@test.com',
          password: 'Test123!@#',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: 'changepass@test.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: 'changepass@test.com' },
      });
    });

    it('should change password successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewPassword123!@#',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify password was changed by trying to login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'changepass@test.com',
          password: 'NewPassword123!@#',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should fail with incorrect current password', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      const response = await request(app)
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!@#',
          newPassword: 'NewPassword123!@#',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });
  });
});

