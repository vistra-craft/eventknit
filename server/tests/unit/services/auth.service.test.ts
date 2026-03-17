import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { AuthService } from '../../../src/services/auth.service.js';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../../../src/utils/errors.js';
import * as passwordUtils from '../../../src/utils/password.js';
import { hashToken } from '../../../src/utils/password.js';
import * as jwtUtils from '../../../src/utils/jwt.js';
import { emailService } from '../../../src/services/email.service.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock('../../../src/utils/password.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/password.js')>();
  return {
    ...actual,
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
    checkPasswordBreach: vi.fn(),
    // hashToken uses real implementation (pure SHA-256, no side effects)
  };
});
vi.mock('../../../src/utils/jwt.js');

vi.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendVerificationCode: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
    sendAccountInvitation: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/config/index.js', () => ({
  config: {
    jwt: {
      expiresIn: '1h',
    },
    security: {
      maxLoginAttempts: 5,
      lockoutDuration: 15, // minutes
    },
  },
}));

vi.mock('../../../src/utils/audit.js', () => ({
  createAuditLog: vi.fn(),
  AuditActions: {
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  },
}));

describe('AuthService - Registration Flow', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    vi.clearAllMocks();
  });

  describe('requestRegistrationCode', () => {
    const mockEmail = 'newuser@test.com';

    it('should send verification code for new user with ATTENDEE role', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailVerification.deleteMany.mockResolvedValue({ count: 0 });
      prisma.emailVerification.create.mockResolvedValue({
        id: 'verification-123',
        email: mockEmail,
        code: '123456',
        token: null,
        role: UserRole.ATTENDEE,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
        verifiedAt: null,
        userId: null,
        createdAt: new Date(),
      });
      (emailService.sendVerificationCode as vi.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.requestRegistrationCode(mockEmail);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(prisma.emailVerification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockEmail,
          code: expect.stringMatching(/^\d{6}$/), // 6-digit code
          role: UserRole.ATTENDEE,
          expiresAt: expect.any(Date),
        }),
      });
      expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
        mockEmail,
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('should default all new users to ATTENDEE role (ignoring role parameter)', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailVerification.deleteMany.mockResolvedValue({ count: 0 });
      prisma.emailVerification.create.mockResolvedValue({
        id: 'verification-123',
        email: mockEmail,
        code: '123456',
        token: null,
        role: UserRole.ATTENDEE, // Always ATTENDEE now
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
        verifiedAt: null,
        userId: null,
        createdAt: new Date(),
      });
      (emailService.sendVerificationCode as vi.Mock).mockResolvedValue(undefined);

      // Act - Even if ORGANIZER role is passed, it should be ignored
      await AuthService.requestRegistrationCode(mockEmail, UserRole.ORGANIZER);

      // Assert - Should always create with ATTENDEE role
      expect(prisma.emailVerification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ATTENDEE, // Changed from ORGANIZER
        }),
      });
    });

    it('should ignore role parameter and always use ATTENDEE', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailVerification.deleteMany.mockResolvedValue({ count: 0 });
      prisma.emailVerification.create.mockResolvedValue({
        id: 'verification-123',
        email: mockEmail,
        code: '123456',
        token: null,
        role: UserRole.ATTENDEE,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
        verifiedAt: null,
        userId: null,
        createdAt: new Date(),
      });
      (emailService.sendVerificationCode as vi.Mock).mockResolvedValue(undefined);

      // Act - Pass ADMIN role (which previously would have failed)
      await AuthService.requestRegistrationCode(mockEmail, 'ADMIN' as UserRole);

      // Assert - Should still create with ATTENDEE role
      expect(prisma.emailVerification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ATTENDEE, // Ignores ADMIN, uses ATTENDEE
        }),
      });
    });

    it('should throw error if user already exists with ACTIVE status', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: mockEmail,
        status: UserStatus.ACTIVE,
      } as any);

      // Act & Assert
      await expect(
        AuthService.requestRegistrationCode(mockEmail),
      ).rejects.toThrow(ConflictError);

      await expect(
        AuthService.requestRegistrationCode(mockEmail),
      ).rejects.toThrow('User with this email already exists');
    });

    it('should throw error if user is SUSPENDED', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        id: 'suspended-user',
        email: mockEmail,
        status: UserStatus.SUSPENDED,
      } as any);

      // Act & Assert
      await expect(
        AuthService.requestRegistrationCode(mockEmail),
      ).rejects.toThrow(ConflictError);

      await expect(
        AuthService.requestRegistrationCode(mockEmail),
      ).rejects.toThrow(
        'This account has been permanently suspended. Please contact support for assistance.',
      );
    });

    it('should throw error if user is DEACTIVATED', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        id: 'deactivated-user',
        email: mockEmail,
        status: UserStatus.DEACTIVATED,
      } as any);

      // Act & Assert
      await expect(
        AuthService.requestRegistrationCode(mockEmail),
      ).rejects.toThrow(ConflictError);

      await expect(
        AuthService.requestRegistrationCode(mockEmail),
      ).rejects.toThrow(
        'This account has been deactivated. Please contact support to appeal or wait for the deactivation period to end.',
      );
    });

    it('should delete existing unverified codes before creating new one', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailVerification.deleteMany.mockResolvedValue({ count: 2 });
      prisma.emailVerification.create.mockResolvedValue({
        id: 'verification-123',
        email: mockEmail,
        code: '123456',
        token: null,
        role: UserRole.ATTENDEE,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
        verifiedAt: null,
        userId: null,
        createdAt: new Date(),
      });
      (emailService.sendVerificationCode as vi.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.requestRegistrationCode(mockEmail);

      // Assert — single deleteMany call removes all unverified codes for this email
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: {
          email: mockEmail,
          verified: false,
        },
      });
    });
  });

  describe('verifyRegistrationCode', () => {
    const mockEmail = 'newuser@test.com';
    const mockCode = '123456';
    const mockPassword = 'SecurePass123!';
    const mockFirstName = 'Test';
    const mockLastName = 'User';

    const mockVerification = {
      id: 'verification-123',
      email: mockEmail,
      code: mockCode,
      token: null,
      role: UserRole.ATTENDEE,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      verified: false,
      verifiedAt: null,
      userId: null,
      createdAt: new Date(),
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    beforeEach(() => {
      (passwordUtils.hashPassword as vi.Mock).mockResolvedValue('hashed-password');
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(0);
      (jwtUtils.generateAccessToken as vi.Mock).mockReturnValue(mockTokens.accessToken);
      (jwtUtils.generateRefreshToken as vi.Mock).mockReturnValue(mockTokens.refreshToken);
      (jwtUtils.parseExpiresIn as vi.Mock).mockReturnValue(mockTokens.expiresIn);
    });

    it('should reject breached password during registration', async () => {
      // Arrange
      prisma.emailVerification.findFirst.mockResolvedValue(mockVerification);
      prisma.user.findUnique.mockResolvedValue(null);
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(5000);

      // Act & Assert
      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          mockCode,
          'breached-password',
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          mockCode,
          'breached-password',
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow(/data breaches/);

      // Should not create user
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should verify code and create new user with ATTENDEE role', async () => {
      // Arrange
      prisma.emailVerification.findFirst.mockResolvedValue(mockVerification);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: mockEmail,
        password: 'hashed-password',
        firstName: mockFirstName,
        lastName: mockLastName,
        otherName: null,
        companyAffiliation: null,
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        organizationName: null,
        verificationLevel: 0,
        onboardingCompleted: false,
        avatar: null,
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prisma.emailVerification.update.mockResolvedValue(mockVerification as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      // Act
      const result = await AuthService.verifyRegistrationCode(
        mockEmail,
        mockCode,
        mockPassword,
        mockFirstName,
        mockLastName,
      );

      // Assert
      expect(prisma.emailVerification.findFirst).toHaveBeenCalledWith({
        where: {
          email: mockEmail,
          code: mockCode,
          verified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(mockPassword);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockEmail,
          password: 'hashed-password',
          firstName: mockFirstName,
          lastName: mockLastName,
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: expect.any(Date),
          onboardingCompleted: false,
        }),
      });
      expect(prisma.emailVerification.update).toHaveBeenCalledWith({
        where: { id: mockVerification.id },
        data: {
          verified: true,
          verifiedAt: expect.any(Date),
          userId: 'user-123',
        },
      });
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'user-123',
          email: mockEmail,
          role: UserRole.ATTENDEE,
          isEmailVerified: true,
        }),
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        expiresIn: mockTokens.expiresIn,
      });
    });

    it('should create ATTENDEE user with onboardingCompleted false (all users need onboarding)', async () => {
      // Arrange - Even if verification had ORGANIZER role, user created as ATTENDEE
      const verification = {
        ...mockVerification,
        role: UserRole.ATTENDEE, // Changed: always ATTENDEE now
      };

      prisma.emailVerification.findFirst.mockResolvedValue(verification);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: mockEmail,
        password: 'hashed-password',
        firstName: mockFirstName,
        lastName: mockLastName,
        otherName: null,
        companyAffiliation: null,
        role: UserRole.ATTENDEE, // Changed: all new users are ATTENDEE
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        organizationName: null,
        verificationLevel: 0,
        onboardingCompleted: false, // false for ALL users now (not just organizers)
        avatar: null,
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prisma.emailVerification.update.mockResolvedValue(verification as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      // Act
      const result = await AuthService.verifyRegistrationCode(
        mockEmail,
        mockCode,
        mockPassword,
        mockFirstName,
        mockLastName,
      );

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ATTENDEE, // Changed from ORGANIZER
          onboardingCompleted: false,
        }),
      });
      expect(result.user.role).toBe(UserRole.ATTENDEE); // Changed from ORGANIZER
    });

    it('should throw error for invalid verification code', async () => {
      // Arrange
      prisma.emailVerification.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          'wrong-code',
          mockPassword,
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          'wrong-code',
          mockPassword,
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow('verification code you entered is incorrect');
    });

    it('should throw error for expired verification code', async () => {
      // Arrange
      const expiredVerification = {
        ...mockVerification,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };

      prisma.emailVerification.findFirst.mockResolvedValue(expiredVerification);

      // Act & Assert
      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          mockCode,
          mockPassword,
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          mockCode,
          mockPassword,
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow('verification code has expired');
    });

    it('should throw error if user already exists (race condition)', async () => {
      // Arrange
      prisma.emailVerification.findFirst.mockResolvedValue(mockVerification);
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: mockEmail,
        status: UserStatus.ACTIVE,
      } as any);

      // Act & Assert
      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          mockCode,
          mockPassword,
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow(ConflictError);

      await expect(
        AuthService.verifyRegistrationCode(
          mockEmail,
          mockCode,
          mockPassword,
          mockFirstName,
          mockLastName,
        ),
      ).rejects.toThrow('User with this email already exists');
    });

    it('should generate and save refresh token', async () => {
      // Arrange
      prisma.emailVerification.findFirst.mockResolvedValue(mockVerification);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: mockEmail,
        password: 'hashed-password',
        firstName: mockFirstName,
        lastName: mockLastName,
        otherName: null,
        companyAffiliation: null,
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        organizationName: null,
        verificationLevel: 0,
        onboardingCompleted: false,
        avatar: null,
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prisma.emailVerification.update.mockResolvedValue(mockVerification as any);
      prisma.refreshToken.upsert.mockResolvedValue({
        id: 'refresh-token-123',
        userId: 'user-123',
        token: mockTokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: null,
        userAgent: null,
        revoked: false,
        revokedAt: null,
        revokedReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      await AuthService.verifyRegistrationCode(
        mockEmail,
        mockCode,
        mockPassword,
        mockFirstName,
        mockLastName,
      );

      // Assert
      expect(jwtUtils.generateAccessToken).toHaveBeenCalled();
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalled();
      expect(prisma.refreshToken.upsert).toHaveBeenCalledWith({
        where: { token: hashToken(mockTokens.refreshToken) },
        create: expect.objectContaining({
          userId: 'user-123',
          token: hashToken(mockTokens.refreshToken),
          expiresAt: expect.any(Date),
        }),
        update: expect.any(Object),
      });
    });
  });

  describe('login', () => {
    const mockEmail = 'user@test.com';
    const mockPassword = 'Password123!';
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      password: 'hashed-password',
      firstName: 'Test',
      lastName: 'User',
      otherName: null,
      companyAffiliation: null,
      role: UserRole.ATTENDEE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      organizationName: null,
      verificationLevel: 0,
      onboardingCompleted: true,
      avatar: null,
      phoneNumber: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    beforeEach(() => {
      (passwordUtils.comparePassword as vi.Mock).mockResolvedValue(true);
      (jwtUtils.generateAccessToken as vi.Mock).mockReturnValue(mockTokens.accessToken);
      (jwtUtils.generateRefreshToken as vi.Mock).mockReturnValue(mockTokens.refreshToken);
      (jwtUtils.parseExpiresIn as vi.Mock).mockReturnValue(mockTokens.expiresIn);
    });

    it('should login user with valid credentials', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      // Login now uses $transaction with tx.user.updateMany
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $queryRawUnsafe: vi.fn().mockResolvedValue([{ id: mockUser.id }]),
          user: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          refreshToken: { upsert: vi.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      // Act
      const result = await AuthService.login(
        { email: mockEmail, password: mockPassword },
        '127.0.0.1',
        'Test User Agent',
      );

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(mockPassword, mockUser.password);
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          role: UserRole.ATTENDEE,
        }),
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        expiresIn: mockTokens.expiresIn,
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow('Incorrect email or password');
    });

    it('should throw error for wrong password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordUtils.comparePassword as vi.Mock).mockResolvedValue(false);
      prisma.user.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act & Assert
      await expect(
        AuthService.login({ email: mockEmail, password: 'WrongPassword' }),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.login({ email: mockEmail, password: 'WrongPassword' }),
      ).rejects.toThrow('Incorrect email or password');

      // Should increment failed login attempts via updateMany
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          failedLoginAttempts: 1,
        }),
      });
    });

    it('should throw error for SUSPENDED user', async () => {
      // Arrange
      const suspendedUser = {
        ...mockUser,
        status: UserStatus.SUSPENDED,
      };
      prisma.user.findUnique.mockResolvedValue(suspendedUser as any);

      // Act & Assert
      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow('Your account has been suspended. Please contact support');
    });

    it('should throw error for locked account', async () => {
      // Arrange
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      };
      prisma.user.findUnique.mockResolvedValue(lockedUser as any);

      // Act & Assert
      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow(/Account is locked/);
    });

    it('should reset failed login attempts on successful login', async () => {
      // Arrange
      const userWithFailedAttempts = {
        ...mockUser,
        failedLoginAttempts: 3,
      };
      prisma.user.findUnique.mockResolvedValue(userWithFailedAttempts as any);
      // Login uses $transaction with tx.user.updateMany for reset
      let txUpdateManyCall: any = null;
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $queryRawUnsafe: vi.fn().mockResolvedValue([{ id: mockUser.id }]),
          user: {
            updateMany: vi.fn().mockImplementation((args: any) => {
              txUpdateManyCall = args;
              return Promise.resolve({ count: 1 });
            }),
          },
          refreshToken: { upsert: vi.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      // Act
      await AuthService.login({ email: mockEmail, password: mockPassword });

      // Assert - tx.user.updateMany was called with reset data
      expect(txUpdateManyCall).toEqual({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: expect.any(Date),
        },
      });
    });

    it('should throw error if user has no password', async () => {
      // Arrange
      const userWithoutPassword = {
        ...mockUser,
        password: null,
      };
      prisma.user.findUnique.mockResolvedValue(userWithoutPassword as any);

      // Act & Assert
      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.login({ email: mockEmail, password: mockPassword }),
      ).rejects.toThrow('Incorrect email or password');
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'mock-refresh-token';
    const mockUser = {
      id: 'user-123',
      email: 'user@test.com',
      role: UserRole.ATTENDEE,
      status: UserStatus.ACTIVE,
    };
    const mockTokenDoc = {
      id: 'token-doc-123',
      token: mockRefreshToken,
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      revoked: false,
      revokedAt: null,
      revokedReason: null,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockNewTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    };

    beforeEach(() => {
      (jwtUtils.verifyRefreshToken as vi.Mock).mockReturnValue(true);
      (jwtUtils.generateAccessToken as vi.Mock).mockReturnValue(mockNewTokens.accessToken);
      (jwtUtils.generateRefreshToken as vi.Mock).mockReturnValue(mockNewTokens.refreshToken);
      (jwtUtils.parseExpiresIn as vi.Mock).mockReturnValue(mockNewTokens.expiresIn);
    });

    it('should refresh valid token', async () => {
      // Arrange
      prisma.refreshToken.findUnique.mockResolvedValue(mockTokenDoc as any);
      prisma.refreshToken.update.mockResolvedValue({} as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      const result = await AuthService.refreshToken(mockRefreshToken, '127.0.0.1', 'Test Agent');

      // Assert
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashToken(mockRefreshToken) },
        include: { user: true },
      });
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockTokenDoc.id },
        data: {
          revoked: true,
          revokedAt: expect.any(Date),
          revokedReason: 'token_rotation',
        },
      });
      expect(result).toEqual({
        accessToken: mockNewTokens.accessToken,
        refreshToken: mockNewTokens.refreshToken,
        expiresIn: mockNewTokens.expiresIn,
      });
    });

    it('should throw error for non-existent token', async () => {
      // Arrange
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.refreshToken(mockRefreshToken),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.refreshToken(mockRefreshToken),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should revoke all user tokens on replay of revoked token (replay detection)', async () => {
      // Arrange
      const revokedToken = {
        ...mockTokenDoc,
        revoked: true,
        revokedAt: new Date(),
      };
      prisma.refreshToken.findUnique.mockResolvedValue(revokedToken as any);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      // Act & Assert — replay detection should revoke all tokens and throw
      await expect(
        AuthService.refreshToken(mockRefreshToken),
      ).rejects.toThrow(AuthenticationError);

      // Verify all user tokens were revoked (replay detection)
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: revokedToken.userId, revoked: false },
        data: expect.objectContaining({
          revoked: true,
          revokedReason: 'replay_detection',
        }),
      });
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const expiredToken = {
        ...mockTokenDoc,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };
      prisma.refreshToken.findUnique.mockResolvedValue(expiredToken as any);

      // Act & Assert
      await expect(
        AuthService.refreshToken(mockRefreshToken),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.refreshToken(mockRefreshToken),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error for SUSPENDED user', async () => {
      // Arrange
      const suspendedUserToken = {
        ...mockTokenDoc,
        user: {
          ...mockUser,
          status: UserStatus.SUSPENDED,
        },
      };
      prisma.refreshToken.findUnique.mockResolvedValue(suspendedUserToken as any);

      // Act & Assert
      await expect(
        AuthService.refreshToken(mockRefreshToken),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AuthService.refreshToken(mockRefreshToken),
      ).rejects.toThrow('Your account has been suspended. Please contact support');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      // Arrange
      const mockRefreshToken = 'mock-refresh-token';
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await AuthService.logout(mockRefreshToken);

      // Assert
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          token: hashToken(mockRefreshToken),
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: expect.any(Date),
          revokedReason: 'user_logout',
        },
      });
    });

    it('should handle logout with non-existent token gracefully', async () => {
      // Arrange
      const mockRefreshToken = 'non-existent-token';
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      // Act
      await AuthService.logout(mockRefreshToken);

      // Assert
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    const mockEmail = 'user@test.com';
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
    };

    it('should create password reset token and send email', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.passwordReset.create.mockResolvedValue({
        id: 'reset-123',
        userId: mockUser.id,
        token: expect.any(String),
        expiresAt: expect.any(Date),
        used: false,
        usedAt: null,
        createdAt: new Date(),
      } as any);
      (emailService.sendPasswordResetEmail as vi.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.forgotPassword(mockEmail);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(prisma.passwordReset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockEmail,
        expect.any(String),
      );
    });

    it('should store IP address when provided', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.passwordReset.create.mockResolvedValue({} as any);
      (emailService.sendPasswordResetEmail as vi.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.forgotPassword(mockEmail, '192.168.1.100');

      // Assert
      expect(prisma.passwordReset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          ipAddress: '192.168.1.100',
        }),
      });
    });

    it('should not reveal if user does not exist', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      await AuthService.forgotPassword('nonexistent@test.com');

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(prisma.passwordReset.create).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should not throw error if email service fails', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.passwordReset.create.mockResolvedValue({} as any);
      (emailService.sendPasswordResetEmail as vi.Mock).mockRejectedValue(
        new Error('Email service down'),
      );

      // Act & Assert - should not throw
      await expect(AuthService.forgotPassword(mockEmail)).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    const mockToken = 'reset-token-abc123';
    const mockNewPassword = 'NewSecurePassword123!';
    const mockReset = {
      id: 'reset-123',
      userId: 'user-123',
      token: hashToken(mockToken), // Tokens are stored hashed
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      used: false,
      usedAt: null,
      createdAt: new Date(),
      user: {
        id: 'user-123',
        email: 'user@test.com',
      },
    };

    beforeEach(() => {
      (passwordUtils.hashPassword as vi.Mock).mockResolvedValue('new-hashed-password');
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(0);
    });

    it('should reset password with valid token', async () => {
      // Arrange
      prisma.passwordReset.findUnique.mockResolvedValue(mockReset as any);
      (prisma.$transaction as vi.Mock).mockResolvedValue([{}, {}]);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.passwordReset.update.mockResolvedValue({} as any);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      // Act
      await AuthService.resetPassword(mockToken, mockNewPassword);

      // Assert
      expect(prisma.passwordReset.findUnique).toHaveBeenCalledWith({
        where: { token: hashToken(mockToken) },
        include: { user: true },
      });
      expect(passwordUtils.checkPasswordBreach).toHaveBeenCalledWith(mockNewPassword);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(mockNewPassword);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should revoke all user tokens after password reset', async () => {
      // Arrange
      prisma.passwordReset.findUnique.mockResolvedValue(mockReset as any);
      (prisma.$transaction as vi.Mock).mockResolvedValue([{}, {}]);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      // Act
      await AuthService.resetPassword(mockToken, mockNewPassword);

      // Assert
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockReset.userId,
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        data: {
          revoked: true,
          revokedAt: expect.any(Date),
          revokedReason: 'password_change',
        },
      });
    });

    it('should reject breached password during password reset', async () => {
      // Arrange
      prisma.passwordReset.findUnique.mockResolvedValue(mockReset as any);
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(50000);

      // Act & Assert
      await expect(
        AuthService.resetPassword(mockToken, 'breached-password'),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.resetPassword(mockToken, 'breached-password'),
      ).rejects.toThrow(/data breaches/);

      // Should not execute transaction
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should accept ipAddress parameter for audit logging', async () => {
      // Arrange
      prisma.passwordReset.findUnique.mockResolvedValue(mockReset as any);
      (prisma.$transaction as vi.Mock).mockResolvedValue([{}, {}]);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      // Act - should not throw when ipAddress is provided
      await AuthService.resetPassword(mockToken, mockNewPassword, '10.0.0.1');

      // Assert
      expect(prisma.passwordReset.findUnique).toHaveBeenCalledWith({
        where: { token: hashToken(mockToken) },
        include: { user: true },
      });
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      prisma.passwordReset.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.resetPassword('invalid-token', mockNewPassword),
      ).rejects.toThrow(NotFoundError);

      await expect(
        AuthService.resetPassword('invalid-token', mockNewPassword),
      ).rejects.toThrow('Invalid reset token');
    });

    it('should throw error for already used token', async () => {
      // Arrange
      const usedReset = {
        ...mockReset,
        used: true,
        usedAt: new Date(),
      };
      prisma.passwordReset.findUnique.mockResolvedValue(usedReset as any);

      // Act & Assert
      await expect(
        AuthService.resetPassword(mockToken, mockNewPassword),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.resetPassword(mockToken, mockNewPassword),
      ).rejects.toThrow('password reset link has already been used');
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const expiredReset = {
        ...mockReset,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };
      prisma.passwordReset.findUnique.mockResolvedValue(expiredReset as any);

      // Act & Assert
      await expect(
        AuthService.resetPassword(mockToken, mockNewPassword),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.resetPassword(mockToken, mockNewPassword),
      ).rejects.toThrow('password reset link has expired');
    });
  });

  describe('changePassword', () => {
    const mockUserId = 'user-123';
    const mockCurrentPassword = 'OldPassword123!';
    const mockNewPassword = 'NewPassword123!';
    const mockUser = {
      id: mockUserId,
      email: 'user@test.com',
      password: 'hashed-old-password',
    };

    beforeEach(() => {
      (passwordUtils.hashPassword as vi.Mock).mockResolvedValue('new-hashed-password');
      (passwordUtils.comparePassword as vi.Mock).mockResolvedValue(true);
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(0);
    });

    it('should change password with valid current password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      // Act
      await AuthService.changePassword(mockUserId, mockCurrentPassword, mockNewPassword);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        mockCurrentPassword,
        mockUser.password,
      );
      expect(passwordUtils.checkPasswordBreach).toHaveBeenCalledWith(mockNewPassword);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(mockNewPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          password: 'new-hashed-password',
        },
      });
    });

    it('should revoke all user tokens after password change', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      // Act
      await AuthService.changePassword(mockUserId, mockCurrentPassword, mockNewPassword);

      // Assert - should revoke all active refresh tokens
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        data: {
          revoked: true,
          revokedAt: expect.any(Date),
          revokedReason: 'password_change',
        },
      });
    });

    it('should reject breached password during password change', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(12000);

      // Act & Assert
      await expect(
        AuthService.changePassword(mockUserId, mockCurrentPassword, 'breached-password'),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.changePassword(mockUserId, mockCurrentPassword, 'breached-password'),
      ).rejects.toThrow(/data breaches/);

      // Should not update password
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error for wrong current password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordUtils.comparePassword as vi.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthService.changePassword(mockUserId, 'WrongPassword', mockNewPassword),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.changePassword(mockUserId, 'WrongPassword', mockNewPassword),
      ).rejects.toThrow('current password you entered is incorrect');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.changePassword(mockUserId, mockCurrentPassword, mockNewPassword),
      ).rejects.toThrow(NotFoundError);

      await expect(
        AuthService.changePassword(mockUserId, mockCurrentPassword, mockNewPassword),
      ).rejects.toThrow('User not found');
    });

    it('should allow setting initial password when user has no password', async () => {
      // Arrange
      const userWithoutPassword = {
        ...mockUser,
        password: null,
      };
      prisma.user.findUnique.mockResolvedValue(userWithoutPassword as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      // Act
      await AuthService.changePassword(mockUserId, '', mockNewPassword);

      // Assert
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(mockNewPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          password: 'new-hashed-password',
        },
      });
      // Should not compare password when user has none
      expect(passwordUtils.comparePassword).not.toHaveBeenCalled();
      // Should still revoke tokens
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        data: expect.objectContaining({
          revoked: true,
          revokedReason: 'password_change',
        }),
      });
    });
  });

  describe('setPassword', () => {
    const mockUserId = 'user-123';
    const mockNewPassword = 'NewPassword123!';
    const mockUser = {
      id: mockUserId,
      email: 'user@test.com',
      password: null,
    };

    beforeEach(() => {
      (passwordUtils.hashPassword as vi.Mock).mockResolvedValue('new-hashed-password');
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(0);
    });

    it('should set initial password for user without password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      // Act
      await AuthService.setPassword(mockUserId, mockNewPassword);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(passwordUtils.checkPasswordBreach).toHaveBeenCalledWith(mockNewPassword);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(mockNewPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          password: 'new-hashed-password',
        },
      });
    });

    it('should revoke all user tokens after setting password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await AuthService.setPassword(mockUserId, mockNewPassword);

      // Assert
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        data: {
          revoked: true,
          revokedAt: expect.any(Date),
          revokedReason: 'password_change',
        },
      });
    });

    it('should reject breached password during password setup', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordUtils.checkPasswordBreach as vi.Mock).mockResolvedValue(8000);

      // Act & Assert
      await expect(
        AuthService.setPassword(mockUserId, 'breached-password'),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.setPassword(mockUserId, 'breached-password'),
      ).rejects.toThrow(/data breaches/);

      // Should not update password
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.setPassword(mockUserId, mockNewPassword),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user already has password', async () => {
      // Arrange
      const userWithPassword = {
        ...mockUser,
        password: 'existing-hashed-password',
      };
      prisma.user.findUnique.mockResolvedValue(userWithPassword as any);

      // Act & Assert
      await expect(
        AuthService.setPassword(mockUserId, mockNewPassword),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('requestEmailVerificationCode', () => {
    const mockEmail = 'user@test.com';
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      isEmailVerified: false,
    };

    it('should send verification code to unverified user', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.emailVerification.deleteMany.mockResolvedValue({ count: 0 });
      prisma.emailVerification.create.mockResolvedValue({
        id: 'verification-123',
        userId: mockUser.id,
        email: mockEmail,
        code: '123456',
        token: null,
        role: null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
        verifiedAt: null,
        createdAt: new Date(),
      } as any);
      (emailService.sendVerificationCode as vi.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.requestEmailVerificationCode(mockEmail);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: {
          email: mockUser.email,
          verified: false,
        },
      });
      expect(prisma.emailVerification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          code: expect.stringMatching(/^\d{6}$/),
          expiresAt: expect.any(Date),
        }),
      });
      expect(emailService.sendVerificationCode).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.requestEmailVerificationCode(mockEmail),
      ).rejects.toThrow(NotFoundError);

      await expect(
        AuthService.requestEmailVerificationCode(mockEmail),
      ).rejects.toThrow('User not found');
    });

    it('should throw error if email already verified', async () => {
      // Arrange
      const verifiedUser = {
        ...mockUser,
        isEmailVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(verifiedUser as any);

      // Act & Assert
      await expect(
        AuthService.requestEmailVerificationCode(mockEmail),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.requestEmailVerificationCode(mockEmail),
      ).rejects.toThrow('Email is already verified');
    });
  });

  describe('verifyEmailWithCode', () => {
    const mockEmail = 'user@test.com';
    const mockCode = '123456';
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      isEmailVerified: false,
    };
    const mockVerification = {
      id: 'verification-123',
      userId: mockUser.id,
      email: mockEmail,
      code: mockCode,
      token: null,
      role: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      verified: false,
      verifiedAt: null,
      createdAt: new Date(),
    };

    it('should verify email with valid code', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.emailVerification.findFirst.mockResolvedValue(mockVerification as any);
      (prisma.$transaction as vi.Mock).mockResolvedValue([{}, {}]);
      prisma.emailVerification.update.mockResolvedValue({} as any);
      prisma.user.update.mockResolvedValue({} as any);

      // Act
      await AuthService.verifyEmailWithCode(mockEmail, mockCode);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(prisma.emailVerification.findFirst).toHaveBeenCalledWith({
        where: {
          email: mockEmail,
          code: mockCode,
          verified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error for invalid code', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.emailVerification.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.verifyEmailWithCode(mockEmail, 'wrong-code'),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.verifyEmailWithCode(mockEmail, 'wrong-code'),
      ).rejects.toThrow('verification code you entered is incorrect');
    });

    it('should throw error for expired code', async () => {
      // Arrange
      const expiredVerification = {
        ...mockVerification,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.emailVerification.findFirst.mockResolvedValue(expiredVerification as any);

      // Act & Assert
      await expect(
        AuthService.verifyEmailWithCode(mockEmail, mockCode),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.verifyEmailWithCode(mockEmail, mockCode),
      ).rejects.toThrow('verification code has expired');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.verifyEmailWithCode(mockEmail, mockCode),
      ).rejects.toThrow(NotFoundError);

      await expect(
        AuthService.verifyEmailWithCode(mockEmail, mockCode),
      ).rejects.toThrow('User not found');
    });

    it('should throw error if email already verified', async () => {
      // Arrange
      const verifiedUser = {
        ...mockUser,
        isEmailVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(verifiedUser as any);

      // Act & Assert
      await expect(
        AuthService.verifyEmailWithCode(mockEmail, mockCode),
      ).rejects.toThrow(ValidationError);

      await expect(
        AuthService.verifyEmailWithCode(mockEmail, mockCode),
      ).rejects.toThrow('Email is already verified');
    });
  });
});
